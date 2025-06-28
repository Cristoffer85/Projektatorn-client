import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnreadService {
  private unreadSubject = new BehaviorSubject<boolean>(false);
  unread$ = this.unreadSubject.asObservable();

  setUnread(hasUnread: boolean) {
    this.unreadSubject.next(hasUnread);
  }
}