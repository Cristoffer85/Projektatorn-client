import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendshipService } from '../../services/friendship.service';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit {
  friends: any[] = [];
  selectedFriend: string | null = null;
  messages: string[] = [];
  username: string | null = null;
  newMessage: string = '';

  constructor(
    private friendshipService: FriendshipService,
    private chatService: ChatService,
    private auth: AuthService,
    private userService: UserService
  ) {}

  allUsers: any[] = [];
  outgoingRequests: string[] = [];
  friendRequests: any[] = [];

  ngOnInit() {
    this.username = this.auth.getUsername();
    if (this.username) {
      this.friendshipService.getFriends(this.username).subscribe(friends => {
        this.friends = friends;
      });
      this.userService.getAllUsers().subscribe(users => {
        this.allUsers = users.filter(u => u.username !== this.username);
      });
      this.friendshipService.getOutgoingRequests(this.username).subscribe(reqs => {
        this.outgoingRequests = reqs.map(r => r.username || r); // adjust as per DTO
      });
      this.friendshipService.getFriendRequests(this.username).subscribe(reqs => {
        this.friendRequests = reqs;
      });
    }
  }

  isFriend(username: string): boolean {
    return this.friends.some(f => f.username === username);
  }

  hasOutgoingRequest(username: string): boolean {
    return this.outgoingRequests.includes(username);
  }

  sendFriendRequest(toUser: string) {
    if (!this.username) return;
    this.friendshipService.sendFriendRequest(this.username, toUser).subscribe(() => {
      this.outgoingRequests.push(toUser);
      // Optionally refresh allUsers or outgoingRequests from backend
    });
  }

  respondToRequest(requestId: string, accept: boolean) {
    this.friendshipService.respondToFriendRequest(requestId, accept).subscribe(() => {
      // Remove the handled request from the list immediately
      this.friendRequests = this.friendRequests.filter(r => r.requestId !== requestId);
      // Optionally, refresh friends list if accepted
      if (accept && this.username) {
        this.friendshipService.getFriends(this.username).subscribe(friends => {
          this.friends = friends;
        });
      }
    });
  }

  selectFriend(friend: any) {
    this.selectedFriend = friend.username;
    if (this.username && this.selectedFriend) {
      this.chatService.getMessagesBetweenUsers(this.username, this.selectedFriend, this.username).subscribe(msgs => {
        this.messages = msgs;
      });
    }
  }

  removeFriend(friendUsername: string, event: Event) {
    event.stopPropagation(); // Prevent selecting the friend when clicking remove
    if (!this.username) return;
    this.friendshipService.removeFriend(this.username, friendUsername).subscribe(() => {
      this.friends = this.friends.filter(f => f.username !== friendUsername);
      if (this.selectedFriend === friendUsername) {
        this.selectedFriend = null;
        this.messages = [];
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.username || !this.selectedFriend) return;
    const msgDTO = {
      sender: this.username,
      receiver: this.selectedFriend,
      message: this.newMessage
    };
    this.chatService.sendMessage(msgDTO).subscribe(() => {
      // Optionally fetch messages again for up-to-date chat
      this.chatService.getMessagesBetweenUsers(this.username!, this.selectedFriend!, this.username!).subscribe(msgs => {
        this.messages = msgs;
      });
      this.newMessage = '';
    });
  }
}