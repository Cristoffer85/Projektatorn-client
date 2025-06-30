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

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, FriendComponent],
  templateUrl: './chat.component.html'
})
export class ChatComponent {
  messages: string[] = [];
  newMessage: string = '';
  selectedFriend: any = null;
  username: string | null = null;
  unreadSenders: string[] = [];

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
        this.messages = await Promise.all(history.map(async msg => {
          try {
            const decrypted = await this.e2eeCryptoService.decryptMessage(msg.content, privateKey);
            return `${msg.sender}: ${decrypted}`;
          } catch (e) {
            return `${msg.sender}: [Unable to decrypt]`;
          }
        }));
      });
    }
  }

  onFriendSelected(friend: any) {
    this.selectedFriend = friend;
    this.fetchHistory();
    this.unreadSenders = this.unreadSenders.filter(u => u !== this.selectedFriend.username);
    this.unreadService.setUnread(this.unreadSenders.length > 0);
  }

  async sendMessage() {
    if (!this.newMessage.trim() || !this.username || !this.selectedFriend) return;
    // 1. Fetch recipient's public key
    const recipientJwk = await firstValueFrom(this.e2eeKeyService.getPublicKey(this.selectedFriend.username));
    if (!recipientJwk) {
      // Handle error: recipient has no public key
      alert('Recipient has no public key set up.');
      return;
    }
    const recipientKey = await this.e2eeCryptoService.importPublicKey(recipientJwk);
    // 2. Encrypt message
    const encrypted = await this.e2eeCryptoService.encryptMessage(this.newMessage, recipientKey);
    console.log('Encrypted message:', encrypted);
    if (!encrypted) {
      alert('Encryption failed!');
      return;
    }
    const msgDTO = {
      sender: this.username,
      receiver: this.selectedFriend.username,
      content: encrypted
    };
    console.log('msgDTO:', msgDTO); // <-- Add here
    this.chatService.sendMessage(msgDTO).subscribe(() => {
      this.newMessage = '';
      this.fetchHistory();
    });
  }
}