import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  error = '';
  loading = false;
  success = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  isPasswordStrong(password: string): boolean {
    const minLength = /.{8,}/;
    const upper = /[A-Z]/;
    const lower = /[a-z]/;
    const digit = /[0-9]/;
    const special = /[!@#$%^&*(),.?":{}|<>]/;
    return (
      minLength.test(password) &&
      upper.test(password) &&
      lower.test(password) &&
      digit.test(password) &&
      special.test(password)
    );
  }

  async onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      this.success = '';
      return;
    }
    if (!this.isPasswordStrong(this.password)) {
      this.error = 'Password is not strong enough';
      this.success = '';
      return;
    }
    this.loading = true;
    this.error = '';
    this.success = '';
    this.auth.register(this.username, this.email, this.password).subscribe({
      next: async () => {
        this.loading = false;
        this.success = 'Registration successful! Please check your email to verify your account before signing in.';
        // Optionally, you can redirect after a short delay:
        setTimeout(() => this.router.navigate(['/signin']), 2500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error || 'Registration failed';
        this.success = '';
      }
    });
  }
}