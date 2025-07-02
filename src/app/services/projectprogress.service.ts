import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectProgressService {
  private projectsSubject = new BehaviorSubject<{ friend: string, idea: string }[]>([]);
  projects$ = this.projectsSubject.asObservable();

  addProject(project: { friend: string, idea: string }) {
    const current = this.projectsSubject.value;
    this.projectsSubject.next([...current, project]);
  }
}