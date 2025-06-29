import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectIdeaService } from '../../services/project.idea.service';

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
  selectedIdeas: number[] = [];

  constructor(private projectIdeaService: ProjectIdeaService) {}

  nextStep() { this.step++; }
  prevStep() { this.step--; }

  toggleSelect(index: number) {
    if (this.selectedIdeas.includes(index)) {
      this.selectedIdeas = this.selectedIdeas.filter(i => i !== index);
    } else if (this.selectedIdeas.length < 2) {
      this.selectedIdeas.push(index);
    }
  }

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
        // Filter out lines that are not list items (start with -, *, or a number + dot)
        this.ideas = ideas.filter(line =>
          /^(\s*[-*]\s+|\s*\d+\.\s+)/.test(line)
        ).map(line =>
          // Remove the bullet/number for a cleaner look
          line.replace(/^(\s*[-*]\s+|\s*\d+\.\s+)/, '')
        );
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

  resetWizard() {
    this.step = 1;
    this.type = '';
    this.languages = '';
    this.length = '';
    this.ideas = [];
    this.selectedIdeas = [];
    this.errorMessage = '';
    this.loading = false;
  }
}