import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SigninComponent } from './pages/signin/signin.component';
import { SignupComponent } from './pages/signup/signup.component';
import { AdminComponent } from './pages/adminaccount/adminaccount.component';
import { UserComponent } from './pages/useraccount/user-account.component';
import { AuthGuard } from './auth/auth.guard';
import { ChatComponent } from './pages/chat/chat.component';
import { RequestPasswordResetComponent } from './components/password/request-reset/request-password-reset.component';
import { ResetPasswordComponent } from './components/password/reset/reset-password.component';
import { VerifyEmailComponent } from './components/email/verify-registration/verify-email.component';
import { VerifyEmailUpdateComponent } from './components/email/verify-update/verify-email-update.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'signin', component: SigninComponent },

  { path: 'signup', component: SignupComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'verify-email-update', component: VerifyEmailUpdateComponent },

  { path: 'request-password-reset', component: RequestPasswordResetComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard], data: { role: 'ADMIN' } },
  { path: 'user', component: UserComponent, canActivate: [AuthGuard], data: { role: 'USER' } },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard], data: { role: 'USER' } }
];