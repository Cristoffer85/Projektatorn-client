import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectIdeaService {
  constructor(private http: HttpClient) {}

  getIdeas(params: { type: string, languages: string, length: string }): Observable<string[]> {
    return this.http.post<string[]>(`${environment.apiUrl}/api/project-ideas`, params);
  }
}