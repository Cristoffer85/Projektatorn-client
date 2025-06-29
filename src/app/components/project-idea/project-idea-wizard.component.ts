import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectIdeaService } from '../../services/project.idea.service';

@Component({
  selector: 'app-project-idea-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-idea-wizard.component.html'
})
export class ProjectIdeaWizardComponent implements OnInit {
  step = 1;
  type: string = '';
  languages: string = '';
  length: string = '';
  ideas: string[] = [];
  loading = false;
  errorMessage = '';
  selectedIdeas: number[] = [];

  constructor(private projectIdeaService: ProjectIdeaService) {}

  ngOnInit() {
    const saved = localStorage.getItem('projectIdeaWizardState');
    if (saved) {
      const state = JSON.parse(saved);
      this.ideas = state.ideas || [];
      this.selectedIdeas = state.selectedIdeas || [];
      this.type = state.type || '';
      this.languages = state.languages || '';
      this.length = state.length || '';
      // If there are ideas, skip to the ideas block
      if (this.ideas.length > 0) {
        this.step = 3;
      }
    }
  }

  nextStep() { this.step++; }
  prevStep() { this.step--; }

  removeBullet(text: string): string {
    // Remove all leading *, -, or numbers (with optional whitespace), repeatedly
    return text.replace(/^([\s\*\-\d\.]+)+/, '').trim();
  }

  toggleSelect(index: number) {
    if (this.selectedIdeas.includes(index)) {
      this.selectedIdeas = this.selectedIdeas.filter(i => i !== index);
    } else if (this.selectedIdeas.length < 2) {
      this.selectedIdeas.push(index);
    }
    this.saveWizardState();
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
        this.saveWizardState();
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

  saveWizardState() {
    const state = {
      ideas: this.ideas,
      selectedIdeas: this.selectedIdeas,
      type: this.type,
      languages: this.languages,
      length: this.length
    };
    localStorage.setItem('projectIdeaWizardState', JSON.stringify(state));
  }

  resetWizard() {
    this.ideas = [];
    this.selectedIdeas = [];
    this.type = '';
    this.languages = '';
    this.length = '';
    localStorage.removeItem('projectIdeaWizardState');
    this.step = 1;
  }
}