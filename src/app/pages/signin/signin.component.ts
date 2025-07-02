import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { E2eeKeyService } from '../../services/e2ee/e2eekey.service';
import { E2eeCryptoService } from '../../services/e2ee/e2eecrypto.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { NgZone } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { UnreadService } from '../../services/unread.service';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './signin.component.html'
})
export class SigninComponent {
  username = '';
  password = '';
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private e2eeKeyService: E2eeKeyService,
    private e2eeCryptoService: E2eeCryptoService,
    private http: HttpClient,
    private ngZone: NgZone,
    private chatService: ChatService,
    private unreadService: UnreadService
  ) {}

  async onSubmit() {
    this.auth.login(this.username, this.password).subscribe({
      next: async (res: any) => {
        localStorage.setItem('token', res.token);

        let keyPair: CryptoKeyPair | undefined;

        // 1. Ensure public key exists on server
        try {
          await firstValueFrom(this.e2eeKeyService.getPublicKey(this.username));
        } catch {
          keyPair = await this.e2eeKeyService.getOrCreateKeyPair(this.username);
        }

        // 2. Ensure encrypted private key exists on server
        let encryptedPrivateKeyExists = false;
        try {
          await this.http.get<any>(`${environment.apiUrl}/private-key/${this.username}/encrypted-private-key`).toPromise();
          encryptedPrivateKeyExists = true;
        } catch {
          encryptedPrivateKeyExists = false;
        }

        // 3. If encrypted private key is missing, upload it
        if (!encryptedPrivateKeyExists) {
          if (!keyPair) {
            keyPair = await this.e2eeKeyService.getOrCreateKeyPair(this.username);
          }
          const exported = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
          const encrypted = await this.e2eeCryptoService.encryptPrivateKeyJwk(exported, this.password);
          await this.http.post(`${environment.apiUrl}/private-key/${this.username}/encrypted-private-key`, encrypted).toPromise();
        }

        // 4. Ensure private key exists locally
        const keyName = `e2ee-private-key-${this.username}`;
        if (!localStorage.getItem(keyName)) {
          try {
            const encrypted = await this.http.get<any>(`${environment.apiUrl}/private-key/${this.username}/encrypted-private-key`).toPromise();
            const jwk = await this.e2eeCryptoService.decryptPrivateKeyJwk(
              encrypted.ciphertext, this.password, encrypted.salt, encrypted.iv
            );
            localStorage.setItem(keyName, JSON.stringify(jwk));
          } catch (e) {
            alert('No encrypted private key found. You may need to register again.');
            return; // Stop here if key is missing
          }
        }

        // 5. Navigate as before (ensure this is inside ngZone)
        const role = this.auth.getUserRole();
        this.ngZone.run(() => {
          if (role === 'ADMIN') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/user']);
          }
        });
        // Immediately update unread badge after navigation
        const username = this.auth.getUsername();
        if (username) {
          this.chatService.getUnreadMessagesSenders(username).subscribe(senders => {
            this.unreadService.setUnread(senders.length > 0);
          });
        }
      },
      error: (err) => {
        if (err.error && typeof err.error === 'string' && err.error.toLowerCase().includes('not verified')) {
          this.error = 'Please verify your email before signing in. Check your inbox for the verification link.';
        } else {
          this.error = err.error || 'Login failed';
        }
      }
    });
  }
}