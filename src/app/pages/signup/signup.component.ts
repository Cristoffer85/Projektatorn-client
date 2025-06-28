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
  password = '';
  error = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit() {
    this.loading = true;
    this.error = '';
    this.auth.register(this.username, this.password).subscribe({
      next: () => {
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
