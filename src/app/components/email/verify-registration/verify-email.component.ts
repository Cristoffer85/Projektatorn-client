import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent implements OnInit {
  success = false;
  error = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      let username = params['username'] || '';
      if (token) {
        this.loading = true;
        this.auth.verifyEmail(token).subscribe({
          next: () => {
            this.success = true;
            this.error = '';
            this.loading = false;
            setTimeout(() => this.router.navigate(['/signin']), 3000);
          },
          error: (err) => {
            if (!username) {
              try {
                const decoded: any = this.auth.decodeToken(token);
                username = decoded?.username || '';
              } catch {}
            }
            if (username) {
              this.auth.isVerified(username).subscribe({
                next: (isVerified: boolean) => {
                  this.loading = false;
                  if (isVerified) {
                    this.error = '';
                    this.success = true;
                    setTimeout(() => this.router.navigate(['/signin']), 2000);
                  } else {
                    this.error = 'Verification failed or token expired.';
                    this.success = false;
                  }
                },
                error: () => {
                  this.loading = false;
                  this.error = 'Verification failed or token expired.';
                  this.success = false;
                }
              });
            } else {
              this.loading = false;
              this.error = 'Verification failed or token expired.';
              this.success = false;
            }
          }
        });
      } else {
        this.error = 'No token provided.';
      }
    });
  }
}