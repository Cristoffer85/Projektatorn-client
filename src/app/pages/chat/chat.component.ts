import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { UnreadService } from '../../services/unread.service';
import { AuthService } from '../../auth/auth.service';
import { FriendComponent } from '../friend/friend.component';

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

  onFriendSelected(friend: any) {
    this.selectedFriend = friend;
    if (this.username && this.selectedFriend) {
      this.chatService.getMessagesBetweenUsers(this.username, this.selectedFriend.username, this.username).subscribe(msgs => {
        this.messages = msgs;
        this.unreadSenders = this.unreadSenders.filter(u => u !== this.selectedFriend.username);
        this.unreadService.setUnread(this.unreadSenders.length > 0);
      });
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
      this.chatService.getMessagesBetweenUsers(this.username!, this.selectedFriend!.username, this.username!).subscribe(msgs => {
        this.messages = msgs;
      });
      this.newMessage = '';
    });
  }
}