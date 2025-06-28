import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = this.authService.getToken();
    if (token) {
      const decoded = this.authService.decodeToken(token);
      const allowedRole = route.data['role'];
      if (allowedRole && decoded?.roles === allowedRole) {
        return true;
      } else {
        this.router.navigate(['/signin']);
        return false;
      }
    } else {
      this.router.navigate(['/signin']);
      return false;
    }
  }
}