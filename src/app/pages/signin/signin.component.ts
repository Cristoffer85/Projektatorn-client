import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signin.component.html'
})
export class SigninComponent {
  username = '';
  password = '';
  error = '';

  constructor(private auth: AuthService) {}

  onSubmit() {
    this.auth.login(this.username, this.password).subscribe({
      next: (res) => {
        // Handle successful login (e.g., store token, redirect)
        this.error = '';
        alert('Login successful!');
      },
      error: (err) => {
        this.error = err.error || 'Login failed';
      }
    });
  }
}