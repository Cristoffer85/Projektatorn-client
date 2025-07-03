import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

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

    const generateAndStore = async () => {
      const keyPair = await this.generateKeyPair();
      const exported = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
      localStorage.setItem(keyName, JSON.stringify(exported));
      const publicJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      await this.http.post(`${environment.apiUrl}/public-key/${username}/public-key`, publicJwk).toPromise();
      return keyPair;
    };

    if (stored) {
      const jwk = JSON.parse(stored);
      const privateKey = await window.crypto.subtle.importKey(
        'jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']
      );
      try {
        const publicJwk = await this.getPublicKey(username).toPromise();
        if (!publicJwk) throw new Error(`No public key found for ${username}`);
        const publicKey = await window.crypto.subtle.importKey(
          'jwk',
          publicJwk,
          { name: 'RSA-OAEP', hash: 'SHA-256' },
          true,
          ['encrypt']
        );
        return { privateKey, publicKey };
      } catch {
        // If not found, generate and upload new key pair
        return await generateAndStore();
      }
    }
    // If no private key, generate and upload as before
    return await generateAndStore();
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

  async getOwnPublicKey(username: string): Promise<CryptoKey> {
    const keyPair = await this.getOrCreateKeyPair(username);
    return keyPair.publicKey;
  }

  getPublicKey(username: string) {
    return this.http.get<JsonWebKey>(`${environment.apiUrl}/public-key/${username}/public-key`);
  }
}