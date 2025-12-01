import { Pool } from 'pg';
import { getEncryptionService } from '../utils/encryption';
import {
  Secret,
  SecretMetadata,
  CreateSecretInput,
  UpdateSecretInput,
} from '../types/secrets.types';
import {
  SecretNotFoundError,
  SecretAlreadyExistsError,
  SecretValidationError,
} from '../errors/secrets.errors';

export interface ISecretsService {
  create(userId: string, input: CreateSecretInput): Promise<SecretMetadata>;
  get(secretId: string, userId: string): Promise<SecretMetadata | null>;
  list(userId: string): Promise<SecretMetadata[]>;
  update(secretId: string, userId: string, input: UpdateSecretInput): Promise<SecretMetadata>;
  delete(secretId: string, userId: string): Promise<void>;
  decrypt(secretId: string, userId: string): Promise<string>;
  validate(secretId: string, userId: string): Promise<boolean>;
}

export class SecretsService implements ISecretsService {
  private encryptionService = getEncryptionService();

  constructor(private db: Pool) {}

  /**
   * Create a new secret (encrypts value before storing)
   */
  async create(userId: string, input: CreateSecretInput): Promise<SecretMetadata> {
    // 1. Validate input
    if (!input.name || input.name.trim().length === 0) {
      throw new SecretValidationError('Secret name is required');
    }

    if (!input.value || input.value.trim().length === 0) {
      throw new SecretValidationError('Secret value is required');
    }

    // 2. Check if secret name already exists for this user
    const existingSecret = await this.db.query(
      'SELECT id FROM secrets WHERE user_id = $1 AND name = $2',
      [userId, input.name.trim()]
    );

    if (existingSecret.rows.length > 0) {
      throw new SecretAlreadyExistsError(input.name);
    }

    // 3. Encrypt the secret value
    const encryptedValue = this.encryptionService.encrypt(input.value);

    // 4. Insert into database
    const result = await this.db.query(
      `INSERT INTO secrets (user_id, name, description, encrypted_value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, created_at, updated_at`,
      [userId, input.name.trim(), input.description || null, encryptedValue]
    );

    const secret: SecretMetadata = result.rows[0];

    return secret;
  }

  /**
   * Get secret metadata (without decrypted value)
   */
  async get(secretId: string, userId: string): Promise<SecretMetadata | null> {
    const result = await this.db.query(
      `SELECT id, name, description, created_at, updated_at
       FROM secrets
       WHERE id = $1 AND user_id = $2`,
      [secretId, userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * List user's secrets (metadata only, no encrypted values)
   */
  async list(userId: string): Promise<SecretMetadata[]> {
    const result = await this.db.query(
      `SELECT id, name, description, created_at, updated_at
       FROM secrets
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Update secret (re-encrypts if value changed)
   */
  async update(
    secretId: string,
    userId: string,
    input: UpdateSecretInput
  ): Promise<SecretMetadata> {
    // 1. Check if secret exists and belongs to user
    const existingSecret = await this.db.query(
      'SELECT * FROM secrets WHERE id = $1 AND user_id = $2',
      [secretId, userId]
    );

    if (existingSecret.rows.length === 0) {
      throw new SecretNotFoundError(secretId);
    }

    // 2. Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        throw new SecretValidationError('Secret name cannot be empty');
      }

      // Check if new name conflicts with another secret
      if (input.name !== existingSecret.rows[0].name) {
        const nameCheck = await this.db.query(
          'SELECT id FROM secrets WHERE user_id = $1 AND name = $2 AND id != $3',
          [userId, input.name.trim(), secretId]
        );

        if (nameCheck.rows.length > 0) {
          throw new SecretAlreadyExistsError(input.name);
        }
      }

      updates.push(`name = $${paramCount}`);
      values.push(input.name.trim());
      paramCount++;
    }

    if (input.description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(input.description || null);
      paramCount++;
    }

    if (input.value !== undefined) {
      if (input.value.trim().length === 0) {
        throw new SecretValidationError('Secret value cannot be empty');
      }

      // Re-encrypt the new value
      const encryptedValue = this.encryptionService.encrypt(input.value);
      updates.push(`encrypted_value = $${paramCount}`);
      values.push(encryptedValue);
      paramCount++;
    }

    if (updates.length === 0) {
      // No updates, return existing secret metadata
      return this.get(secretId, userId) as Promise<SecretMetadata>;
    }

    // 3. Add updated_at
    updates.push(`updated_at = NOW()`);

    // 4. Add secretId and userId to values
    values.push(secretId, userId);

    // 5. Execute update
    const result = await this.db.query(
      `UPDATE secrets
       SET ${updates.join(', ')}
       WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
       RETURNING id, name, description, created_at, updated_at`,
      values
    );

    const secret: SecretMetadata = result.rows[0];

    return secret;
  }

  /**
   * Delete secret
   */
  async delete(secretId: string, userId: string): Promise<void> {
    // 1. Check if secret exists and belongs to user
    const existingSecret = await this.db.query(
      'SELECT name FROM secrets WHERE id = $1 AND user_id = $2',
      [secretId, userId]
    );

    if (existingSecret.rows.length === 0) {
      throw new SecretNotFoundError(secretId);
    }

    // 2. Delete the secret
    await this.db.query(
      'DELETE FROM secrets WHERE id = $1 AND user_id = $2',
      [secretId, userId]
    );

  }

  /**
   * Decrypt secret for execution (internal use only)
   * NEVER return this value in API responses
   */
  async decrypt(secretId: string, userId: string): Promise<string> {
    // 1. Get encrypted value
    const result = await this.db.query(
      'SELECT encrypted_value, name FROM secrets WHERE id = $1 AND user_id = $2',
      [secretId, userId]
    );

    if (result.rows.length === 0) {
      throw new SecretNotFoundError(secretId);
    }

    const secret: Secret = result.rows[0];

    // 2. Decrypt the value
    const decryptedValue = this.encryptionService.decrypt(secret.encrypted_value);

    return decryptedValue;
  }

  /**
   * Validate secret exists and belongs to user (for pre-execution checks)
   */
  async validate(secretId: string, userId: string): Promise<boolean> {
    const result = await this.db.query(
      'SELECT id FROM secrets WHERE id = $1 AND user_id = $2',
      [secretId, userId]
    );

    return result.rows.length > 0;
  }
}
