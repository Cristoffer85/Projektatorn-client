import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-friend-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-profile.component.html'
})
export class FriendProfileComponent {
  @Input() friend: any;
  @Input() isFriend: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() remove = new EventEmitter<any>();
  @Output() addFriend = new EventEmitter<any>();

  showConfirm = false;
  avatarBaseUrl = environment.apiUrl + '/avatars/';

  confirmRemove() {
    this.showConfirm = true;
  }

  cancelRemove() {
    this.showConfirm = false;
  }

  doRemove() {
    this.remove.emit(this.friend);
    this.showConfirm = false;
  }
}