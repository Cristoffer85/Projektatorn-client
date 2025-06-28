import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <h2>User Page</h2>
      <p>Welcome, user! Here you can view your personal dashboard.</p>
    </div>
  `
})
export class UserComponent {}