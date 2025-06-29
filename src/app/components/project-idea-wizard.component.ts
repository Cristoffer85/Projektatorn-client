import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  nextStep() { this.step++; }
  prevStep() { this.step--; }

  submit() {
    this.loading = true;
    // Call your backend API here with the parameters
    // Example: this.projectIdeaService.getIdeas({type, languages, length}).subscribe(...)
  }
}