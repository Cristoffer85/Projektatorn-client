import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-friend-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './friend-profile.component.html'
})
export class FriendProfileComponent {
  @Input() friend: any;
  @Output() close = new EventEmitter<void>();
}