import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthInterceptor } from './app/auth/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    ...appConfig,
    provideHttpClient(
      withInterceptors([AuthInterceptor])
    ),
    importProvidersFrom(FormsModule)
  ]
}).catch((err) => console.error(err));