import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FriendshipService {
  private apiUrl = `${environment.apiUrl}/friendship`;

  constructor(private http: HttpClient) {}

  getFriendRequests(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/friend-requests/${username}`);
  }

  getFriends(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/friends/${username}`);
  }

  sendFriendRequest(senderUsername: string, receiverUsername: string): Observable<any> {
    let params = new HttpParams().set('senderUsername', senderUsername).set('receiverUsername', receiverUsername);
    return this.http.post<any>(`${this.apiUrl}/send-request`, null, { params });
  }

  getOutgoingRequests(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/outgoing-requests/${username}`);
  }

  respondToFriendRequest(requestId: string, accept: boolean): Observable<any> {
    let params = new HttpParams().set('accept', accept.toString());
    return this.http.put<any>(`${this.apiUrl}/respond-request/${requestId}`, null, { params });
  }

  withdrawFriendRequest(fromUsername: string, toUsername: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/withdraw-friend-request`, {
      params: { fromUsername, toUsername }
    });
  }

  removeFriend(username: string, friendUsername: string): Observable<void> {
    let params = new HttpParams().set('username', username).set('friendUsername', friendUsername);
    return this.http.delete<void>(`${this.apiUrl}/remove-friend`, { params });
  }
}