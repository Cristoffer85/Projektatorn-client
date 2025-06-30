import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { UnreadService } from '../../services/unread.service';
import { AuthService } from '../../auth/auth.service';
import { FriendComponent } from '../../components/friend/friend.component';

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
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.username = this.auth.getUsername();
  }

  fetchHistory() {
    if (this.username && this.selectedFriend) {
      this.chatService.getChatHistory(this.username, this.selectedFriend.username).subscribe(history => {
        this.messages = history.map(msg => `${msg.sender}: ${msg.content}`);
      });
    }
  }

  onFriendSelected(friend: any) {
    this.selectedFriend = friend;
    if (this.username && this.selectedFriend) {
      this.chatService.getChatHistory(this.username, this.selectedFriend.username).subscribe(history => {
        this.messages = history.map(msg => `${msg.sender}: ${msg.content}`);
      });
      this.unreadSenders = this.unreadSenders.filter(u => u !== this.selectedFriend.username);
      this.unreadService.setUnread(this.unreadSenders.length > 0);
    }
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.username || !this.selectedFriend) return;
    const msgDTO = {
      sender: this.username,
      receiver: this.selectedFriend.username,
      message: this.newMessage
    };
    this.chatService.sendMessage(msgDTO).subscribe(() => {
      // After sending, fetch from the database for consistency
      this.chatService.getChatHistory(this.username!, this.selectedFriend!.username).subscribe(history => {
        this.messages = history.map(msg => `${msg.sender}: ${msg.message}`);
      });
      this.newMessage = '';
    });
  }
}