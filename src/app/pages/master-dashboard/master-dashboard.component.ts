import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendProfileComponent } from '../friendprofile/friend-profile.component';
import { FriendshipService } from '../../services/friendship.service';
import { UserService } from '../../services/user.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../auth/auth.service';
import { UnreadService } from '../../services/unread.service';
import { forkJoin } from 'rxjs';
import { ProjectInProgress, ProjectProgressService } from '../../services/project.service';
import { removeBullet } from '../../utils/text-utils';

@Component({
  selector: 'app-friend',
  standalone: true,
  imports: [CommonModule, FriendProfileComponent],
  templateUrl: './master-dashboard.component.html'
})
export class FriendComponent implements OnInit {
  @Output() friendsChanged = new EventEmitter<any[]>();
  @Output() friendSelected = new EventEmitter<any>();
  @Output() viewProfile = new EventEmitter<any>();
  @Output() friendRemoved = new EventEmitter<string>();
  @Input() selectedFriend: string | null = null;

  friends: any[] = [];
  allUsers: any[] = [];
  outgoingRequests: string[] = [];
  friendRequests: any[] = [];
  unreadSenders: string[] = [];
  username: string | null = null;
  isLoadingFriends = true;
  selectedProfile: any = null;
  profileLoading = false;
  projectsInProgress: ProjectInProgress[] = [];
  expandedProjectIndex: number | null = null;
  removeBullet = removeBullet;
  encodeURIComponent = encodeURIComponent;

  constructor(
    private friendshipService: FriendshipService,
    private userService: UserService,
    private chatService: ChatService,
    private auth: AuthService,
    private unreadService: UnreadService,
    private projectProgress: ProjectProgressService
  ) {}

    ngOnInit() {
      this.username = this.auth.getUsername();
      if (this.username) {
        this.isLoadingFriends = true;
        // Fetch friends and users in parallel
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

        // Subscribe to projects in progress ONCE
        this.projectProgress.loadProjects(this.username);
        this.projectProgress.projects$.subscribe(projects => {
          this.projectsInProgress = projects;
        });
      }
    }

  isFriend(username: string): boolean {
    return this.friends.some(f => f.username === username);
  }

  get filteredAllUsers() {
    // Exclude self and friends
    return this.allUsers.filter(u =>
      u.username !== this.username &&
      !this.isFriend(u.username) &&
      // If I have sent a request, still show them (so I can withdraw)
      // If I have received a request from them, hide them
      !this.friendRequests.some(r => r.username === u.username)
    );
  }

  showProfile(user: any) {
    this.profileLoading = true;
    this.userService.getOneUser(user.username).subscribe(profile => {
      this.selectedProfile = {
        ...profile,
        isFriend: this.isFriend(user.username)
      };
      this.profileLoading = false;
      this.friendSelected.emit(user);
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
        this.friendshipService.getFriends(this.username).subscribe(friends => {
          this.friends = friends;
              this.friendsChanged.emit(this.friends);
          // Update profile if open and matches
          if (this.selectedProfile) {
            this.selectedProfile.isFriend = this.isFriend(this.selectedProfile.username);
          }
        });
      }
    });
  }

  withdrawFriendRequest(username: string) {
    if (!this.username) return;
    this.friendshipService.withdrawFriendRequest(this.username, username).subscribe(() => {
      this.outgoingRequests = this.outgoingRequests.filter(u => u !== username);
    });
  }

  get pendingRequestUsernames(): string[] {
    // Incoming requests: users who sent you a request
    const incoming = this.friendRequests.map(r => r.username);
    // Outgoing requests: users you sent a request to
    const outgoing = this.outgoingRequests;
    return [...incoming, ...outgoing];
  }

  removeFriend(friend: any, event?: Event) {
    if (!this.username) return;
    this.friendshipService.removeFriend(this.username, friend.username).subscribe(() => {
      this.friends = this.friends.filter(f => f.username !== friend.username);
      this.selectedProfile = null;
      this.friendSelected.emit(null);
      this.friendRemoved.emit(friend.username); // <-- Add this line
    });
  }

  selectFriend(friend: any) {
    this.unreadSenders = this.unreadSenders.filter(u => u !== friend.username);
    this.unreadService.setUnread(this.unreadSenders.length > 0); // <-- update unread state
    this.friendSelected.emit(friend);
  }

  onProjectAccepted(event: { friend: string, idea: string, params?: { type: string, languages: string, length: string } }) {
    if (!this.username) return;
    let ideaWithParams = event.idea;
    if (event.params) {
      ideaWithParams =
        `Type: ${event.params.type}\nLanguages: ${event.params.languages}\nLength: ${event.params.length} weeks\n\n` +
        event.idea;
    }
    this.projectProgress.addProject({
      friend: event.friend,
      idea: ideaWithParams,
      owner: this.username
    });
  }

  removeProject(id: string) {
    this.projectProgress.removeProject(id);
  }

  // ################ Card idea extraction methods ################
  extractParams(idea: string): { type?: string, languages?: string, length?: string } {
    const match = idea.match(/^Type:\s*(.*?)\s*[\r\n]+Languages:\s*(.*?)\s*[\r\n]+Length:\s*(.*?)\s*weeks?/i);
    if (match) {
      return {
        type: match[1],
        languages: match[2],
        length: match[3]
      };
    }
    return {};
  }

  extractIdeaBody(idea: string): string {
    // Remove params header if present
    const paramsHeader = idea.match(/^Type:.*\nLanguages:.*\nLength:.*\n\n/i);
    if (paramsHeader) {
      return idea.slice(paramsHeader[0].length);
    }
    return idea;
  }

  extractTitle(idea: string): string {
    const body = this.extractIdeaBody(idea).trim();
    if (body.startsWith('**')) {
      // Markdown bold title
      const endIdx = body.indexOf('**:', 2);
      if (endIdx !== -1) {
        return body.slice(2, endIdx).trim();
      }
      const colonIdx = body.indexOf(':');
      if (colonIdx !== -1) {
        return body.slice(2, colonIdx).trim();
      }
    }
    // Fallback: take text before colon
    const colonIdx = body.indexOf(':');
    if (colonIdx !== -1) {
      return body.slice(0, colonIdx).trim();
    }
    return body.split('\n')[0].trim();
  }

  extractDescription(idea: string): string {
    const body = this.extractIdeaBody(idea).trim();
    // Remove title
    const colonIdx = body.indexOf(':');
    if (colonIdx !== -1) {
      return body.slice(colonIdx + 1).trim();
    }
    return body;
  }
}