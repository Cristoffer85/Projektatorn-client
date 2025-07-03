import { Component } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent {
  token = '';
  newPassword = '';
  confirmPassword = '';
  message = '';
  error = '';

  constructor(
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Get token from query param if present
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.token = params['token'];
      }
    });
  }

  onSubmit() {
    this.userService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.message = 'Password reset successful! You may now sign in.';
        this.error = '';
      },
      error: () => {
        this.error = 'Failed to reset password. The token may be invalid or expired.';
        this.message = '';
      }
    });
  }
}