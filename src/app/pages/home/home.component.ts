import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectIdeaWizardComponent } from '../project-generator/project-generator.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ProjectIdeaWizardComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent {}