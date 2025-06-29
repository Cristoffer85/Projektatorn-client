import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="bg-light text-center text-muted py-3 mt-5 border-top">
      <small>
        &copy; {{ year }} Projektatorn &mdash; Built for collaborative learning and fun!<br>
        Uses Google Gemini Flash 2.0 API (< total 100.000 free requests/day) for prompting AI features.
      </small>
    </footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}