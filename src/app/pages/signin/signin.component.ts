import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
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

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  onSubmit() {
    this.auth.login(this.username, this.password).subscribe({
      next: (res: any) => {
        // Save token to localStorage
        localStorage.setItem('token', res.token);

        // Decode role from the new token
        const role = this.auth.getUserRole();
        console.log('Decoded role:', role);

        if (role === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else if (role === 'USER') {
          this.router.navigate(['/user']);
        } else {
          this.router.navigate(['/']);
        }
        this.error = '';
      },
      error: (err) => {
        this.error = err.error || 'Login failed';
      }
    });
  }
}