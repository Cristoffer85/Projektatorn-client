import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = `${environment.apiUrl}/rabbitmq`;

  constructor(private http: HttpClient) {}

  sendMessage(msgDTO: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/publish`, msgDTO, { responseType: 'text' });
  }

  getMessagesBetweenUsers(user1: string, user2: string, loggedInUsername: string, markAsRead = true): Observable<string[]> {
    const headers = new HttpHeaders({ 'X-Username': loggedInUsername });
    let params = new HttpParams().set('markAsRead', markAsRead.toString());
    return this.http.get<string[]>(`${this.apiUrl}/subscribe/${user1}/${user2}`, { headers, params });
  }

  getChatHistory(user1: string, user2: string): Observable<any[]> {
    let params = new HttpParams().set('user1', user1).set('user2', user2);
    return this.http.get<any[]>(`${this.apiUrl}/history`, { params });
  }

  getUnreadMessagesCount(username: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread/${username}`);
  }

  getUnreadMessagesSenders(username: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/unread/senders/${username}`);
  }

  markMessagesAsRead(user1: string, user2: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-read`, { user1, user2 });
  }
}