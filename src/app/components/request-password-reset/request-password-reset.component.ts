import { Component } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-request-password-reset',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './request-password-reset.component.html',
})
export class RequestPasswordResetComponent {
  identifier = '';
  message = '';
  error = '';

  constructor(private userService: UserService, private router: Router) {}

  onSubmit() {
    this.userService.requestPasswordReset(this.identifier).subscribe({
      next: () => {
        this.message = 'If an account exists, a reset link has been sent to your email.';
        this.error = '';
      },
      error: () => {
        this.error = 'Failed to request password reset.';
        this.message = '';
      }
    });
  }
}