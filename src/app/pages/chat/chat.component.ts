import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { UnreadService } from '../../services/unread.service';
import { AuthService } from '../../auth/auth.service';
import { FriendComponent } from '../master-dashboard/master-dashboard.component';
import { E2eeKeyService } from '../../encryption/e2e-key.service';
import { E2eeCryptoService } from '../../encryption/e2e-encryption.service';
import { firstValueFrom } from 'rxjs';
import { FriendProfileComponent } from '../friendprofile/friend-profile.component';
import { removeBullet } from '../../utils/text-utils';
import { ProjectProgressService } from '../../services/project.service';
import { FriendshipService } from '../../services/friendship.service';
import { MessageListComponent } from './message-list/message-list.component';

interface ChatMessage {
  sender: any;
  isProjectIdeas: boolean;
  text?: string;
  ideas?: string[];
  params?: { type: string; languages: string; length: string } | null; 
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, FriendComponent, FriendProfileComponent, MessageListComponent],
  templateUrl: './chat.component.html'
})

export class ChatComponent {
  @Output() projectAccepted = new EventEmitter<{ friend: string, idea: string }>();
  friends: any[] = [];
  messages: ChatMessage[] = [];
  newMessage: string = '';
  selectedFriend: any = null;
  username: string | null = null;
  unreadSenders: string[] = [];
  selectedProfile: any = null;
  responses: { [messageIndex: number]: { [ideaIndex: number]: boolean|null } } = {};
  removeBullet = removeBullet;
  constructor(
    private chatService: ChatService,
    private unreadService: UnreadService,
    private auth: AuthService,
    private e2eeKeyService: E2eeKeyService,
    private e2eeCryptoService: E2eeCryptoService,
    private projectProgress: ProjectProgressService,
    private friendShipService: FriendshipService
  ) {}

  ngOnInit() {
    this.username = this.auth.getUsername();
    if (this.username) {
      this.friendShipService.getFriends(this.username).subscribe(friends => {
        this.friends = friends;
      });
    }
  }

  async fetchHistory() {
    if (this.username && this.selectedFriend) {
      this.chatService.getChatHistory(this.username, this.selectedFriend.username).subscribe(async history => {
        const privateKey = await this.e2eeKeyService.getPrivateKey(this.username!);

        this.messages = await Promise.all(history.map(async msg => {
          try {
            let decrypted: string;
            if (msg.receiver === this.username && msg.contentForReceiver && msg.contentForReceiver.startsWith('{')) {
              decrypted = await this.e2eeCryptoService.hybridDecrypt(msg.contentForReceiver, privateKey);
            } else if (msg.sender === this.username && msg.contentForSender && msg.contentForSender.startsWith('{')) {
              decrypted = await this.e2eeCryptoService.hybridDecrypt(msg.contentForSender, privateKey);
            } else if (msg.receiver === this.username) {
              decrypted = await this.e2eeCryptoService.decryptMessage(msg.contentForReceiver, privateKey);
            } else if (msg.sender === this.username) {
              decrypted = await this.e2eeCryptoService.decryptMessage(msg.contentForSender, privateKey);
            } else {
              return { sender: msg.sender, text: '[Unable to decrypt]', isProjectIdeas: false };
            }

            // Detect project idea message (simple check: multiple lines separated by double newlines)
            const isProjectIdeas = decrypted.includes('\n\n');
            if (isProjectIdeas) {
              // Extract params if present at the top
              const paramMatch = decrypted.match(/^Type:.*\nLanguages:.*\nLength:.*\n/);
              let params = null;
              let ideasText = decrypted;
              if (paramMatch) {
                const [typeLine, langLine, lengthLine] = paramMatch[0].trim().split('\n');
                params = {
                  type: typeLine.replace('Type:', '').trim(),
                  languages: langLine.replace('Languages:', '').trim(),
                  length: lengthLine.replace('Length:', '').replace('weeks', '').trim()
                };
                ideasText = decrypted.slice(paramMatch[0].length).trim();
              }
              return {
                id: msg.id, 
                sender: msg.sender,
                ideas: ideasText.split('\n\n'),
                isProjectIdeas: true,
                params
              };
            } else {
            return {
              id: msg.id,
              sender: msg.sender,
              text: decrypted,
              isProjectIdeas: false
              };
            }
          } catch (e) {
            return { sender: msg.sender, text: '[Unable to decrypt]', isProjectIdeas: false };
          }
        }));
      });
    }
  }

  onIdeaResponse(message: any, ideaIndex: number, accepted: boolean) {
    const msgIdx = this.messages.indexOf(message);
    if (!this.responses[msgIdx]) {
      this.responses[msgIdx] = {};
    }
    this.responses[msgIdx][ideaIndex] = accepted;
  }

  onFriendsChanged(friends: any[]) {
    this.friends = friends;
  }

  onFriendSelected(friend: any) {
    this.selectedFriend = friend;
    this.fetchHistory();
    this.unreadSenders = this.unreadSenders.filter(u => u !== this.selectedFriend.username);
    this.unreadService.setUnread(this.unreadSenders.length > 0);

    // Mark messages as read in backend
    this.chatService.markMessagesAsRead(this.username!, this.selectedFriend.username).subscribe(() => {
      this.chatService.getUnreadMessagesSenders(this.username!).subscribe(senders => {
        this.unreadSenders = senders;
        this.unreadService.setUnread(this.unreadSenders.length > 0);
      });
    });
  }

  isSelectedFriendAFriend(): boolean {
    return this.selectedFriend && this.friends?.some(f => f.username === this.selectedFriend.username);
  }

  onViewProfile(friend: any) {
    this.selectedProfile = friend;
  }

  onFriendRemoved(username: string) {
    if (this.selectedFriend && (
          this.selectedFriend.username === username ||
          this.selectedFriend === username
        )) {
      this.selectedFriend = null;
      this.selectedProfile = null;
      this.messages = [];
    }
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.username || !this.selectedFriend) return;

    // 1. Fetch recipient's public key
    const recipientJwk = await firstValueFrom(this.e2eeKeyService.getPublicKey(this.selectedFriend.username));
    if (!recipientJwk) {
      alert('Recipient has no public key set up.');
      return;
    }
    const recipientKey = await this.e2eeCryptoService.importPublicKey(recipientJwk);

    // 2. Fetch sender's own public key
    const senderJwk = await firstValueFrom(this.e2eeKeyService.getPublicKey(this.username));
    const senderKey = await this.e2eeCryptoService.importPublicKey(senderJwk);

    // 3. Encrypt message for both
    const encryptedForReceiver = await this.e2eeCryptoService.encryptMessage(this.newMessage, recipientKey);
    const encryptedForSender = await this.e2eeCryptoService.encryptMessage(this.newMessage, senderKey);

    const msgDTO = {
      sender: this.username,
      receiver: this.selectedFriend.username,
      contentForReceiver: encryptedForReceiver,
      contentForSender: encryptedForSender
    };

    this.chatService.sendMessage(msgDTO).subscribe(() => {
      this.newMessage = '';
      this.fetchHistory();
    });
  }

  acceptAndShareProject(message: any) {
    const msgIdx = this.messages.indexOf(message);
    const responses = this.responses[msgIdx];
    if (!responses) return;
    const yesIndex = Object.entries(responses).find(([idx, val]) => val === true)?.[0];
    if (yesIndex !== undefined) {
      const acceptedIdea = message.ideas[+yesIndex];
      // Prepend params if present
      let ideaWithParams = acceptedIdea;
      if (message.params) {
        ideaWithParams =
          `Type: ${message.params.type}\nLanguages: ${message.params.languages}\nLength: ${message.params.length} weeks\n\n` +
          acceptedIdea;
      }
      // 1. Add to in-progress
      this.projectProgress.addProject({
        friend: this.username!,
        idea: ideaWithParams,
        owner: message.sender
      });
      // 2. Remove from pending (if you have the pending project id)
      if (message.pendingId) {
        this.projectProgress.removePendingProject(message.pendingId).subscribe(() => {
          this.messages.splice(msgIdx, 1);
          delete this.responses[msgIdx];
        });
      } else if (message.id) {
        // fallback if id is present
        this.chatService.deleteMessage(message.id).subscribe(() => {
          this.messages.splice(msgIdx, 1);
          delete this.responses[msgIdx];
        });
      } else {
        this.messages.splice(msgIdx, 1);
        delete this.responses[msgIdx];
      }
    }
  }

  isProjectInProgress(message: any): boolean {
    if (!this.projectProgress.projectsSubject?.value) return false;
    return this.projectProgress.projectsSubject.value.some(proj =>
      (
        (proj.owner === message.sender && proj.friend === this.username) ||
        (proj.owner === this.username && proj.friend === message.sender)
      ) &&
      message.ideas?.some((idea: string) => removeBullet(idea) === removeBullet(proj.idea))
    );
  }
}