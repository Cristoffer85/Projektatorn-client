import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectIdeaWizardComponent } from '../../components/project-idea/project-idea-wizard.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProjectIdeaWizardComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {}