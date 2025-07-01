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
  confirmPassword = ''; // <-- Add this
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    this.loading = true;
    this.error = '';
    this.auth.register(this.username, this.email, this.password).subscribe({
      next: async () => {
        this.loading = false;
        alert('Registration successful! Please sign in.');
        this.router.navigate(['/signin']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error || 'Registration failed';
      }
    });
  }
}