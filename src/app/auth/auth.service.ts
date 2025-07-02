import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ############## Token management ##############
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  decodeToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  }

  // ############## Auth actions ##############
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, { username, email, password });
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password });
  }

  verifyEmail(token: string): Observable<any> {
    console.log('Sending verifyEmail request:', {
      url: `${this.apiUrl}/auth/verify-email`,
      body: { token }
    });
    return this.http.post(`${this.apiUrl}/auth/verify-email`, { token });
  }

  verifyEmailChange(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-email-change`, { token });
  }

  isVerified(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/auth/is-verified?username=${encodeURIComponent(username)}`);
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  // ############## User info ##############
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUsername(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded: any = this.decodeToken(token);
      return decoded?.username || null;
    }
    return null;
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (token) {
      const decoded: any = this.decodeToken(token);
      return decoded?.roles || null;
    }
    return null;
  }
}