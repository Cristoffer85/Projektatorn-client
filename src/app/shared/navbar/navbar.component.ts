import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { UnreadService } from '../../services/unread.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {

  hasUnread = false;

  constructor(
    private router: Router,
    public auth: AuthService,
    private unreadService: UnreadService
  ) {
    this.unreadService.unread$.subscribe(unread => {
      this.hasUnread = unread;
    });
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get userRole(): string | null {
    return this.auth.getUserRole();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}