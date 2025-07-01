import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/user`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all-users`);
  }

  getOneUser(username: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/getOneUser/${username}`);
  }

  updateUser(username: string, userUpdateDto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/updateUser/${username}`, userUpdateDto);
  }

  requestPasswordReset(identifier: string) {
    return this.http.post(`${this.apiUrl}/request-password-reset`, { identifier });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword });
  }
}