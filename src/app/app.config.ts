import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig = [
  provideZoneChangeDetection({ eventCoalescing: true }),
  provideRouter(routes)
];