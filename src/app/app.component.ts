import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { UnreadService } from './services/unread.service';
import { ChatService } from './services/chat.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = 'projektatorn-client';

  constructor(
    private unreadService: UnreadService,
    private chatService: ChatService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    const username = this.auth.getUsername?.();
    if (username) {
      this.chatService.getUnreadMessagesSenders(username).subscribe(senders => {
        this.unreadService.setUnread(senders.length > 0);
      });
    }
  }
}