/**
 * Types for secrets management
 */

export interface Secret {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  encrypted_value: string;
  created_at: Date;
  updated_at: Date;
}

export interface SecretMetadata {
  id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  // Note: encrypted_value is NOT included
}

export interface CreateSecretInput {
  name: string;
  description?: string;
  value: string; // Plain text, will be encrypted
}

export interface UpdateSecretInput {
  name?: string;
  description?: string;
  value?: string; // Plain text, will be re-encrypted if provided
}
