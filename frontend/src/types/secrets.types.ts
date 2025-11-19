/**
 * Types for secrets management
 */

export interface SecretMetadata {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSecretInput {
  name: string;
  description?: string;
  value: string;
}

export interface UpdateSecretInput {
  name?: string;
  description?: string;
  value?: string;
}

export interface SecretsListResponse {
  secrets: SecretMetadata[];
}
