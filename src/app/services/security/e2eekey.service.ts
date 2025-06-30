import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

  @Injectable({ providedIn: 'root' })
  export class E2eeKeyService {
    constructor(private http: HttpClient) {}

    private getPrivateKeyName(username: string) {
      return `e2ee-private-key-${username}`;
    }

    async generateKeyPair(): Promise<CryptoKeyPair> {
      return window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['encrypt', 'decrypt']
      );
    }

    async getOrCreateKeyPair(username: string): Promise<CryptoKeyPair> {
      const keyName = this.getPrivateKeyName(username);
      const stored = localStorage.getItem(keyName);
      if (stored) {
        const jwk = JSON.parse(stored);
        const privateKey = await window.crypto.subtle.importKey(
          'jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']
        );
        // Try to fetch public key from backend
        try {
          await this.getPublicKey(username).toPromise();
        } catch {
          // If not found, export and upload public key
          const keyPair = await this.generateKeyPair();
          const exported = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
          localStorage.setItem(keyName, JSON.stringify(exported));
          const publicJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
          await this.http.post(`${environment.apiUrl}/public-key/${username}/public-key`, publicJwk).toPromise();
          return keyPair;
        }
        return { privateKey, publicKey: null as any };
      }
      // If no private key, generate and upload as before
      const keyPair = await this.generateKeyPair();
      const exported = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
      localStorage.setItem(keyName, JSON.stringify(exported));
      const publicJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      await this.http.post(`${environment.apiUrl}/public-key/${username}/public-key`, publicJwk).toPromise();
      return keyPair;
    }

    async getPrivateKey(username: string): Promise<CryptoKey> {
      const keyName = this.getPrivateKeyName(username);
      const jwk = JSON.parse(localStorage.getItem(keyName)!);
      return window.crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['decrypt']
      );
    }

  getPublicKey(username: string) {
    return this.http.get<JsonWebKey>(`${environment.apiUrl}/public-key/${username}/public-key`);
  }
}