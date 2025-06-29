import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectIdeaService } from '../services/project.idea.service';

@Component({
  selector: 'app-project-idea-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-idea-wizard.component.html'
})
export class ProjectIdeaWizardComponent {
  step = 1;
  type: string = '';
  languages: string = '';
  length: string = '';
  ideas: string[] = [];
  loading = false;
  errorMessage = '';

  constructor(private projectIdeaService: ProjectIdeaService) {}

  nextStep() { this.step++; }
  prevStep() { this.step--; }

  submit() {
    this.loading = true;
    this.errorMessage = '';
    this.ideas = [];
    this.projectIdeaService.getIdeas({
      type: this.type,
      languages: this.languages,
      length: this.length
    }).subscribe({
      next: ideas => {
        this.ideas = ideas;
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        if (err.status === 429) {
          this.errorMessage = err.error?.message || 'API quota exceeded. Please try again later.';
        } else {
          this.errorMessage = 'Failed to generate ideas. Please try again.';
        }
      }
    });
  }
}