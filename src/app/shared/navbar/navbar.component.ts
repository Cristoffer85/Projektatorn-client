import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { UnreadService } from '../../services/unread.service';
import { environment } from '../../../environments/environment';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  avatarBaseUrl = environment.apiUrl + '/avatars/';
  userAvatar: string = this.avatarBaseUrl + 'accountlogo.png'; // default
  username: string | null = null;
  hasUnread = false;

  constructor(
    private router: Router,
    public auth: AuthService,
    private unreadService: UnreadService,
    private userService: UserService
  ) {
    this.unreadService.unread$.subscribe(unread => {
      this.hasUnread = unread;
    });
  }

  ngOnInit() {
    this.username = this.auth.getUsername();
    if (this.username) {
      // Initial fetch
      this.userService.getOneUser(this.username).subscribe({
        next: user => {
          this.setAvatar(user);
        },
        error: () => {
          this.userAvatar = this.avatarBaseUrl + 'accountlogo.png';
        }
      });
      // Listen for updates
      this.userService.getUserProfileObservable().subscribe(profile => {
        if (profile) {
          this.setAvatar(profile);
        }
      });
    }
  }

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  get userRole(): string | null {
    return this.auth.getUserRole();
  }

  setAvatar(user: any) {
    this.userAvatar = user?.avatar
      ? this.avatarBaseUrl + user.avatar
      : this.avatarBaseUrl + 'accountlogo.png';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/signin']);
  }
}