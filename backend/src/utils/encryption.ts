import crypto from 'crypto';
import logger from './logger';

/**
 * EncryptionService provides AES-256-GCM encryption/decryption for secrets.
 * 
 * Format: iv:authTag:encryptedText (all hex encoded)
 * - IV: 16 bytes (random per encryption)
 * - Auth Tag: 16 bytes (for authentication)
 * - Encrypted Text: variable length
 */
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key: Buffer;

  constructor() {
    const keyHex = process.env.SECRETS_ENCRYPTION_KEY;

    if (!keyHex) {
      throw new Error('SECRETS_ENCRYPTION_KEY environment variable is required');
    }

    if (keyHex.length !== 64) {
      throw new Error('SECRETS_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    // Validate hex format
    if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
      throw new Error('SECRETS_ENCRYPTION_KEY must contain only hexadecimal characters');
    }

    this.key = Buffer.from(keyHex, 'hex');


  }

  /**
   * Encrypt a plaintext secret value
   * @param plaintext - The secret value to encrypt
   * @returns Encrypted string in format: iv:authTag:encryptedText (hex)
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random IV (initialization vector)
      const iv = crypto.randomBytes(16);

      // Create cipher (CipherGCM type for GCM mode)
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv) as crypto.CipherGCM;

      // Encrypt
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Return format: iv:authTag:encrypted (all hex)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      logger.error('Encryption failed', { error });
      throw new Error('Failed to encrypt secret');
    }
  }

  /**
   * Decrypt an encrypted secret value
   * @param encrypted - Encrypted string in format: iv:authTag:encryptedText (hex)
   * @returns Decrypted plaintext
   */
  decrypt(encrypted: string): string {
    try {
      // Parse encrypted format
      const parts = encrypted.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const [ivHex, authTagHex, encryptedText] = parts;

      // Convert from hex
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Validate lengths
      if (iv.length !== 16) {
        throw new Error('Invalid IV length');
      }

      if (authTag.length !== 16) {
        throw new Error('Invalid auth tag length');
      }

      // Create decipher (DecipherGCM type for GCM mode)
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);

      // Decrypt
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      logger.error('Decryption failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Failed to decrypt secret');
    }
  }
}

// Singleton instance
let encryptionServiceInstance: EncryptionService | null = null;

/**
 * Get the singleton EncryptionService instance
 */
export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    encryptionServiceInstance = new EncryptionService();
  }
  return encryptionServiceInstance;
}
