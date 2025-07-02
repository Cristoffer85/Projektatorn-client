import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProjectInProgress {
  id?: string;
  friend: string;
  idea: string;
  owner: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectProgressService {
  private projectsSubject = new BehaviorSubject<ProjectInProgress[]>([]);
  projects$ = this.projectsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadProjects(username: string) {
    this.http.get<ProjectInProgress[]>(`${environment.apiUrl}/projects-in-progress/load?username=${username}`)
      .subscribe(projects => this.projectsSubject.next(projects));
  }

  addProject(project: ProjectInProgress) {
    this.http.post<ProjectInProgress>(`${environment.apiUrl}/projects-in-progress/add`, project)
      .subscribe(saved => {
        const current = this.projectsSubject.value;
        this.projectsSubject.next([...current, saved]);
      });
  }

  removeProject(id: string) {
    this.http.delete(`${environment.apiUrl}/projects-in-progress/remove/${id}`)
      .subscribe(() => {
        const current = this.projectsSubject.value.filter(p => p.id !== id);
        this.projectsSubject.next(current);
      });
  }
}