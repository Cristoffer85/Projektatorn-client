import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <h2>Admin Page</h2>
      <p>Welcome, admin! Here you can manage the application.</p>
    </div>
  `
})
export class AdminComponent {}