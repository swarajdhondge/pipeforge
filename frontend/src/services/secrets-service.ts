import api from './api.js';
import type { SecretMetadata, CreateSecretInput, UpdateSecretInput, SecretsListResponse } from '../types/secrets.types.js';

/**
 * Secrets Service - API client for secrets management
 * 
 * Features:
 * - Create, list, get, update, delete secrets
 * - Error handling
 * - Type-safe API calls
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

/**
 * Create a new secret
 * @param input - Secret creation data
 * @returns Created secret metadata
 */
export const createSecret = async (input: CreateSecretInput): Promise<SecretMetadata> => {
  const response = await api.post<SecretMetadata>('/secrets', input);
  return response.data;
};

/**
 * List all secrets for the authenticated user
 * @returns Array of secret metadata
 */
export const listSecrets = async (): Promise<SecretMetadata[]> => {
  const response = await api.get<SecretsListResponse>('/secrets');
  return response.data.secrets;
};

/**
 * Get a specific secret by ID
 * @param secretId - Secret ID
 * @returns Secret metadata
 */
export const getSecret = async (secretId: string): Promise<SecretMetadata> => {
  const response = await api.get<SecretMetadata>(`/secrets/${secretId}`);
  return response.data;
};

/**
 * Update a secret
 * @param secretId - Secret ID
 * @param input - Update data
 * @returns Updated secret metadata
 */
export const updateSecret = async (
  secretId: string,
  input: UpdateSecretInput
): Promise<SecretMetadata> => {
  const response = await api.put<SecretMetadata>(`/secrets/${secretId}`, input);
  return response.data;
};

/**
 * Delete a secret
 * @param secretId - Secret ID
 */
export const deleteSecret = async (secretId: string): Promise<void> => {
  await api.delete(`/secrets/${secretId}`);
};
