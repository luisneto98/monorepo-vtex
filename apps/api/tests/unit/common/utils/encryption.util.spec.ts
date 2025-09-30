import { EncryptionUtil } from '../../../../src/common/utils/encryption.util';

describe('Encryption Utilities', () => {
  const testKey = 'test-encryption-key-32-bytes!!';
  const originalEnv = process.env['ENCRYPTION_KEY'];

  beforeAll(() => {
    process.env['ENCRYPTION_KEY'] = testKey;
  });

  afterAll(() => {
    process.env['ENCRYPTION_KEY'] = originalEnv;
  });

  describe('encrypt', () => {
    it('should encrypt a string successfully', () => {
      const plaintext = 'my-device-token-12345';
      const encrypted = EncryptionUtil.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(':'); // Should have IV separator
    });

    it('should produce different ciphertext for same input (due to random IV)', () => {
      const plaintext = 'same-token';
      const encrypted1 = EncryptionUtil.encrypt(plaintext);
      const encrypted2 = EncryptionUtil.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty string', () => {
      const encrypted = EncryptionUtil.encrypt('');
      expect(encrypted).toBe('');
    });

    it('should handle long strings', () => {
      const longString = 'a'.repeat(1000);
      const encrypted = EncryptionUtil.encrypt(longString);
      expect(encrypted).toBeDefined();
      expect(EncryptionUtil.decrypt(encrypted)).toBe(longString);
    });

    it('should handle unicode characters', () => {
      const unicode = 'Olá mundo! 你好世界 🔐';
      const encrypted = EncryptionUtil.encrypt(unicode);
      expect(EncryptionUtil.decrypt(encrypted)).toBe(unicode);
    });

    it('should handle special characters', () => {
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = EncryptionUtil.encrypt(special);
      expect(EncryptionUtil.decrypt(encrypted)).toBe(special);
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text successfully', () => {
      const plaintext = 'FCM-token-abc123xyz';
      const encrypted = EncryptionUtil.encrypt(plaintext);
      const decrypted = EncryptionUtil.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle multiple encrypt/decrypt cycles', () => {
      const original = 'device-token-value';

      const encrypted1 = EncryptionUtil.encrypt(original);
      const decrypted1 = EncryptionUtil.decrypt(encrypted1);
      expect(decrypted1).toBe(original);

      const encrypted2 = EncryptionUtil.encrypt(decrypted1);
      const decrypted2 = EncryptionUtil.decrypt(encrypted2);
      expect(decrypted2).toBe(original);
    });

    it('should throw error for invalid ciphertext format', () => {
      expect(() => EncryptionUtil.decrypt('invalid-format')).toThrow();
    });

    it('should throw error for malformed encrypted data', () => {
      expect(() => EncryptionUtil.decrypt('abc:def')).toThrow();
    });

    it('should return empty string for empty input', () => {
      expect(EncryptionUtil.decrypt('')).toBe('');
    });

    it('should handle base64 encoded data correctly', () => {
      const token = 'ey123.abc456.xyz789'; // JWT-like token
      const encrypted = EncryptionUtil.encrypt(token);
      const decrypted = EncryptionUtil.decrypt(encrypted);
      expect(decrypted).toBe(token);
    });
  });

  describe('encryption security', () => {
    it('should use different IV for each encryption', () => {
      const plaintext = 'test-token';
      const encrypted1 = EncryptionUtil.encrypt(plaintext);
      const encrypted2 = EncryptionUtil.encrypt(plaintext);

      const iv1 = encrypted1.split(':')[0];
      const iv2 = encrypted2.split(':')[0];

      expect(iv1).not.toBe(iv2);
    });

    it('should produce ciphertext that looks random', () => {
      const plaintext = 'aaaaaaaaaa';
      const encrypted = EncryptionUtil.encrypt(plaintext);
      const ciphertext = encrypted.split(':')[1];

      // Base64 ciphertext should not contain the plaintext
      expect(Buffer.from(ciphertext, 'base64').toString()).not.toContain('aaaaaaaaaa');
    });

    it('should require correct key for decryption', () => {
      const plaintext = 'secret-token';
      const encrypted = EncryptionUtil.encrypt(plaintext);

      // Change the encryption key
      process.env['ENCRYPTION_KEY'] = 'wrong-key-32-bytes-length!!!';

      expect(() => EncryptionUtil.decrypt(encrypted)).toThrow();

      // Restore correct key
      process.env['ENCRYPTION_KEY'] = testKey;
    });

    it('should handle tampering with ciphertext', () => {
      const plaintext = 'original-token';
      const encrypted = EncryptionUtil.encrypt(plaintext);

      // Tamper with the ciphertext
      const parts = encrypted.split(':');
      const tamperedCiphertext = parts[0] + ':' + parts[1] + ':' + parts[2].slice(0, -4) + 'XXXX';

      expect(() => EncryptionUtil.decrypt(tamperedCiphertext)).toThrow();
    });

    it('should handle tampering with IV', () => {
      const plaintext = 'original-token';
      const encrypted = EncryptionUtil.encrypt(plaintext);

      // Tamper with the IV
      const parts = encrypted.split(':');
      const tamperedIv = parts[0].slice(0, -4) + 'YYYY';
      const tampered = tamperedIv + ':' + parts[1] + ':' + parts[2];

      expect(() => EncryptionUtil.decrypt(tampered)).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle very short strings', () => {
      const short = 'a';
      const encrypted = EncryptionUtil.encrypt(short);
      expect(EncryptionUtil.decrypt(encrypted)).toBe(short);
    });

    it('should handle strings with newlines', () => {
      const multiline = 'line1\nline2\nline3';
      const encrypted = EncryptionUtil.encrypt(multiline);
      expect(EncryptionUtil.decrypt(encrypted)).toBe(multiline);
    });

    it('should handle strings with tabs', () => {
      const tabbed = 'col1\tcol2\tcol3';
      const encrypted = EncryptionUtil.encrypt(tabbed);
      expect(EncryptionUtil.decrypt(encrypted)).toBe(tabbed);
    });

    it('should handle JSON strings', () => {
      const json = JSON.stringify({ token: 'abc123', platform: 'ios' });
      const encrypted = EncryptionUtil.encrypt(json);
      expect(EncryptionUtil.decrypt(encrypted)).toBe(json);
    });
  });
});