import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email-update',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <div *ngIf="success" class="alert alert-success">Email address updated successfully!</div>
      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
    </div>
  `
})
export class VerifyEmailUpdateComponent implements OnInit {
  success = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      if (token) {
        this.auth.verifyEmailChange(token).subscribe({
          next: () => {
            this.success = true;
            this.error = '';
            setTimeout(() => this.router.navigate(['/user']), 3000);
          },
          error: () => {
            this.error = 'Verification failed or token expired.';
            this.success = false;
          }
        });
      } else {
        this.error = 'No token provided.';
      }
    });
  }
}