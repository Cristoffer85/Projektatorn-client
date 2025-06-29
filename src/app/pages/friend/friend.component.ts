import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendshipService } from '../../services/friendship.service';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-friend',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend.component.html'
})
export class FriendComponent implements OnInit {
  @Output() friendSelected = new EventEmitter<any>();
  @Input() selectedFriend: string | null = null;

  friends: any[] = [];
  allUsers: any[] = [];
  outgoingRequests: string[] = [];
  friendRequests: any[] = [];
  unreadSenders: string[] = [];
  username: string | null = null;

  constructor(
    private friendshipService: FriendshipService,
    private userService: UserService,
    private chatService: ChatService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.username = this.auth.getUsername();
    if (this.username) {
      this.friendshipService.getFriends(this.username).subscribe(friends => this.friends = friends);
      this.userService.getAllUsers().subscribe(users => {
        this.allUsers = users.filter(u => u.username !== this.username);
      });
      this.friendshipService.getOutgoingRequests(this.username).subscribe(reqs => {
        this.outgoingRequests = reqs.map(r => r.username || r);
      });
      this.friendshipService.getFriendRequests(this.username).subscribe(reqs => this.friendRequests = reqs);
      this.chatService.getUnreadMessagesSenders(this.username).subscribe(senders => {
        this.unreadSenders = senders;
      });
    }
  }

  isFriend(username: string): boolean {
    return this.friends.some(f => f.username === username);
  }

  get filteredAllUsers() {
    return this.allUsers.filter(u => !this.isFriend(u.username));
  }

  hasUnreadFrom(username: string): boolean {
    return this.unreadSenders.includes(username);
  }

  hasOutgoingRequest(username: string): boolean {
    return this.outgoingRequests.includes(username);
  }

  sendFriendRequest(toUser: string) {
    if (!this.username) return;
    this.friendshipService.sendFriendRequest(this.username, toUser).subscribe(() => {
      this.outgoingRequests.push(toUser);
    });
  }

  respondToRequest(requestId: string, accept: boolean) {
    this.friendshipService.respondToFriendRequest(requestId, accept).subscribe(() => {
      this.friendRequests = this.friendRequests.filter(r => r.requestId !== requestId);
      if (accept && this.username) {
        this.friendshipService.getFriends(this.username).subscribe(friends => this.friends = friends);
      }
    });
  }

  removeFriend(friendUsername: string, event: Event) {
    event.stopPropagation();
    if (!this.username) return;
    this.friendshipService.removeFriend(this.username, friendUsername).subscribe(() => {
      this.friends = this.friends.filter(f => f.username !== friendUsername);
      if (this.selectedFriend === friendUsername) {
        this.friendSelected.emit(null);
      }
    });
  }

  selectFriend(friend: any) {
    this.friendSelected.emit(friend);
  }
}