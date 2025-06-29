import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { UnreadService } from './services/unread.service';
import { ChatService } from './services/chat.service';
import { AuthService } from './auth/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'projektatorn-client';

  constructor(
    private unreadService: UnreadService,
    private chatService: ChatService,
    private auth: AuthService
  ) {}

  private unreadSub?: Subscription;

  ngOnInit() {
    const username = this.auth.getUsername?.();
    if (username) {
      // Initial fetch
      this.fetchUnread(username);

      // Poll every 30 seconds (adjust as needed)
      this.unreadSub = interval(30000).subscribe(() => {
        this.fetchUnread(username);
      });
    }
  }

  fetchUnread(username: string) {
    this.chatService.getUnreadMessagesSenders(username).subscribe(senders => {
      this.unreadService.setUnread(senders.length > 0);
    });
  }

  ngOnDestroy() {
    this.unreadSub?.unsubscribe();
  }
}