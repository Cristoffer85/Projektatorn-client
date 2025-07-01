import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.component.html'
})
export class UserComponent implements OnInit {
  username: string | null = null;
  user: any = {};
  editUser: any = {};
  successMessage = '';
  errorMessage = '';

  constructor(
    private userService: UserService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.username = this.auth.getUsername?.();
    if (this.username) {
      this.userService.getOneUser(this.username).subscribe({
        next: user => {
          this.user = user;
          // Format birthday for input[type="date"]
          this.editUser = { ...user };
          if (this.editUser.birthday) {
            this.editUser.birthday = this.editUser.birthday.substring(0, 10);
          }
        },
        error: () => {
          this.errorMessage = 'Could not load user info.';
        }
      });
    }
  }

  updateUser() {
    if (!this.username) return;
    this.userService.updateUser(this.username, this.editUser).subscribe({
      next: updated => {
        this.user = updated;
        this.successMessage = 'Profile updated!';
        this.errorMessage = '';
      },
      error: () => {
        this.errorMessage = 'Update failed.';
        this.successMessage = '';
      }
    });
  }
}