import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class E2eeCryptoService {
  // --- Key import ---
  async importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
  }

  async importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return window.crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt']
    );
  }

  // --- Simple RSA encryption ---
  async encryptMessage(message: string, publicKey: CryptoKey): Promise<string> {
    const enc = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      enc.encode(message)
    );
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  async decryptMessage(base64Cipher: string, privateKey: CryptoKey): Promise<string> {
    const binary = Uint8Array.from(atob(base64Cipher), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      binary
    );
    return new TextDecoder().decode(decrypted);
  }

  // --- Hybrid encryption (AES-GCM + RSA-OAEP) ---
  async hybridEncrypt(plainText: string, rsaPublicKey: CryptoKey): Promise<string> {
    // 1. Generate AES key
    const aesKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    // 2. Encrypt message with AES
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encoded
    );
    // 3. Export AES key as raw
    const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
    // 4. Encrypt AES key with RSA
    const encryptedAesKey = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      rsaPublicKey,
      rawAesKey
    );
    // 5. Prepare payload (base64 everything)
    return JSON.stringify({
      encryptedAesKey: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey))),
      iv: btoa(String.fromCharCode(...iv)),
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
      hybrid: true
    });
  }

async hybridDecrypt(payloadString: string, rsaPrivateKey: CryptoKey): Promise<string> {
  try {
    console.log('hybridDecrypt: payloadString:', payloadString);

    const payload = JSON.parse(payloadString);
    if (!payload.hybrid) throw new Error('Not a hybrid-encrypted message');

    // 1. Decode base64
    const encryptedAesKey = Uint8Array.from(atob(payload.encryptedAesKey), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(payload.ciphertext), c => c.charCodeAt(0));
    console.log('hybridDecrypt: Decoded encryptedAesKey:', encryptedAesKey);
    console.log('hybridDecrypt: Decoded iv:', iv);
    console.log('hybridDecrypt: Decoded ciphertext:', ciphertext);

    // 2. Decrypt AES key with RSA
    let rawAesKey;
    try {
      rawAesKey = await window.crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        rsaPrivateKey,
        encryptedAesKey
      );
      console.log('hybridDecrypt: Decrypted rawAesKey:', new Uint8Array(rawAesKey));
    } catch (e) {
      console.error('hybridDecrypt: Failed to decrypt AES key with RSA:', e);
      throw e;
    }

    // 3. Import AES key
    let aesKey;
    try {
      aesKey = await window.crypto.subtle.importKey(
        'raw',
        rawAesKey,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      console.log('hybridDecrypt: Imported AES key:', aesKey);
    } catch (e) {
      console.error('hybridDecrypt: Failed to import AES key:', e);
      throw e;
    }

    // 4. Decrypt message
    let decrypted;
    try {
      decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        ciphertext
      );
      console.log('hybridDecrypt: Decrypted message bytes:', new Uint8Array(decrypted));
    } catch (e) {
      console.error('hybridDecrypt: Failed to decrypt message with AES:', e);
      throw e;
    }

    const result = new TextDecoder().decode(decrypted);
    console.log('hybridDecrypt: Final decoded message:', result);
    return result;
  } catch (err) {
    console.error('hybridDecrypt: General error:', err);
    throw err;
  }
}

  // --- Password-based encryption for private key backup ---
  private async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100_000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  async encryptPrivateKeyJwk(jwk: JsonWebKey, password: string): Promise<{ciphertext: string, salt: string, iv: string}> {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await this.deriveKeyFromPassword(password, salt);
    const data = enc.encode(JSON.stringify(jwk));
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    return {
      ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  async decryptPrivateKeyJwk(ciphertext: string, password: string, saltB64: string, ivB64: string): Promise<JsonWebKey> {
    const enc = new TextEncoder();
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const key = await this.deriveKeyFromPassword(password, salt);
    const cipherBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
  }
}