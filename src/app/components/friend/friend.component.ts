import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendProfileComponent } from '../../pages/friendprofile/friend-profile.component';
import { FriendshipService } from '../../services/friendship.service';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../auth/auth.service';
import { UnreadService } from '../../services/unread.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-friend',
  standalone: true,
  imports: [CommonModule, FriendProfileComponent],
  templateUrl: './friend.component.html'
})
export class FriendComponent implements OnInit {
  @Output() friendSelected = new EventEmitter<any>();
  @Output() viewProfile = new EventEmitter<any>();
  @Input() selectedFriend: string | null = null;

  friends: any[] = [];
  allUsers: any[] = [];
  outgoingRequests: string[] = [];
  friendRequests: any[] = [];
  unreadSenders: string[] = [];
  username: string | null = null;
  isLoadingFriends = true;
  selectedProfile: any = null;

  constructor(
    private friendshipService: FriendshipService,
    private userService: UserService,
    private chatService: ChatService,
    private auth: AuthService,
    private unreadService: UnreadService
  ) {}

  viewProfileClicked(friend: any) {
    this.viewProfile.emit(friend);
  }

  ngOnInit() {
    this.username = this.auth.getUsername();
    if (this.username) {
        this.isLoadingFriends = true;
        // Use forkJoin to fetch friends and users in parallel == so already added friends are not also shown under "All users"
        forkJoin({
            friends: this.friendshipService.getFriends(this.username),
            users: this.userService.getAllUsers()
            }).subscribe(({ friends, users }) => {
            this.friends = friends;
            this.allUsers = users.filter(u => u.username !== this.username);
            this.isLoadingFriends = false;
        });

        this.friendshipService.getOutgoingRequests(this.username).subscribe(reqs => {
        this.outgoingRequests = reqs.map(r => r.username || r);
        });
        this.friendshipService.getFriendRequests(this.username).subscribe(reqs => this.friendRequests = reqs);
        this.chatService.getUnreadMessagesSenders(this.username).subscribe(senders => {
        this.unreadSenders = senders;
        this.unreadService.setUnread(this.unreadSenders.length > 0);
        });
    }
  }

  isFriend(username: string): boolean {
    return this.friends.some(f => f.username === username);
  }

  get filteredAllUsers() {
    const pending = this.pendingRequestUsernames;
    return this.allUsers.filter(u =>
      !this.isFriend(u.username) &&
      !pending.includes(u.username)
    );
  }

  showProfile(friend: any) {
    this.userService.getOneUser(friend.username).subscribe(profile => {
      this.selectedProfile = profile;
    });
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

  get pendingRequestUsernames(): string[] {
    // Incoming requests: users who sent you a request
    const incoming = this.friendRequests.map(r => r.username);
    // Outgoing requests: users you sent a request to
    const outgoing = this.outgoingRequests;
    return [...incoming, ...outgoing];
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
    this.unreadSenders = this.unreadSenders.filter(u => u !== friend.username);
    this.unreadService.setUnread(this.unreadSenders.length > 0); // <-- update unread state
    this.friendSelected.emit(friend);
  }
}