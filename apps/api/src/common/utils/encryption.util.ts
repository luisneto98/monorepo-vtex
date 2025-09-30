import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * Encryption utility for sensitive data like device tokens
 * Uses AES-256-GCM encryption
 */
export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16;
  private static readonly KEY_LENGTH = 32;

  /**
   * Get encryption key from environment variable or generate a default one
   * In production, this MUST be set via environment variable
   */
  private static getEncryptionKey(): Buffer {
    const key = process.env['ENCRYPTION_KEY'] || 'default-key-change-in-production';

    // Derive a proper 32-byte key using scrypt
    const salt = Buffer.from('vtexday26-salt'); // Fixed salt for consistency
    return scryptSync(key, salt, this.KEY_LENGTH);
  }

  /**
   * Encrypts a string value
   * @param plaintext - The text to encrypt
   * @returns Encrypted value in format: iv:authTag:encryptedData (all base64 encoded)
   */
  static encrypt(plaintext: string): string {
    if (!plaintext) {
      return '';
    }

    const key = this.getEncryptionKey();
    const iv = randomBytes(this.IV_LENGTH);

    const cipher = createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  /**
   * Decrypts an encrypted string value
   * @param encryptedData - The encrypted value in format: iv:authTag:encryptedData
   * @returns Decrypted plaintext
   */
  static decrypt(encryptedData: string): string {
    if (!encryptedData) {
      return '';
    }

    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const [ivBase64, authTagBase64, encrypted] = parts;

      const key = this.getEncryptionKey();
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');

      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error: any) {
      throw new Error(`Decryption failed: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Encrypts device token for storage
   * @param token - Device token to encrypt
   * @returns Encrypted token
   */
  static encryptDeviceToken(token: string): string {
    return this.encrypt(token);
  }

  /**
   * Decrypts device token for use
   * @param encryptedToken - Encrypted device token
   * @returns Decrypted token
   */
  static decryptDeviceToken(encryptedToken: string): string {
    return this.decrypt(encryptedToken);
  }
}