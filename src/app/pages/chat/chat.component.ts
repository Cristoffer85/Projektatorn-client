import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { UnreadService } from '../../services/unread.service';
import { AuthService } from '../../auth/auth.service';
import { FriendComponent } from '../../components/friend/friend.component';
import { E2eeKeyService } from '../../services/security/e2eekey.service';
import { E2eeCryptoService } from '../../services/security/e2eecrypto.service';
import { firstValueFrom } from 'rxjs';
import { FriendProfileComponent } from '../friendprofile/friend-profile.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, FriendComponent, FriendProfileComponent],
  templateUrl: './chat.component.html'
})
export class ChatComponent {
  messages: string[] = [];
  newMessage: string = '';
  selectedFriend: any = null;
  username: string | null = null;
  unreadSenders: string[] = [];
  selectedProfile: any = null;

  constructor(
    private chatService: ChatService,
    private unreadService: UnreadService,
    private auth: AuthService,
    private e2eeKeyService: E2eeKeyService,
    private e2eeCryptoService: E2eeCryptoService
  ) {}

  ngOnInit() {
    this.username = this.auth.getUsername();
  }

  async fetchHistory() {
    if (this.username && this.selectedFriend) {
      this.chatService.getChatHistory(this.username, this.selectedFriend.username).subscribe(async history => {
        const privateKey = await this.e2eeKeyService.getPrivateKey(this.username!);

        // Log the public key derived from your private key
        const ownPublicKey = await this.e2eeKeyService.getOwnPublicKey(this.username!);
        const exportedPub = await window.crypto.subtle.exportKey('jwk', ownPublicKey);

        this.messages = await Promise.all(history.map(async msg => {
          try {
            let decrypted: string;
            if (msg.receiver === this.username && msg.contentForReceiver && msg.contentForReceiver.startsWith('{')) {
              // You are the receiver, hybrid-encrypted
              decrypted = await this.e2eeCryptoService.hybridDecrypt(msg.contentForReceiver, privateKey);
            } else if (msg.sender === this.username && msg.contentForSender && msg.contentForSender.startsWith('{')) {
              // You are the sender, hybrid-encrypted
              decrypted = await this.e2eeCryptoService.hybridDecrypt(msg.contentForSender, privateKey);
            } else if (msg.receiver === this.username) {
              decrypted = await this.e2eeCryptoService.decryptMessage(msg.contentForReceiver, privateKey);
            } else if (msg.sender === this.username) {
              decrypted = await this.e2eeCryptoService.decryptMessage(msg.contentForSender, privateKey);
            } else {
              return `${msg.sender}: [Unable to decrypt]`;
            }
            return `${msg.sender}: ${decrypted}`;
          } catch (e) {
            console.error('Decryption error:', e);
            return `${msg.sender}: [Unable to decrypt]`;
          }
        }));
      });
    }
    /*          // Sort of works for clearing all old messages instantly when friend is removed (no manual page refresh needed) 
                // But, the unread notification bugs out and spontanenously show new messages sometimes even though no new messages have been received.
    else {      
      this.messages = [];
    }
    */
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
}