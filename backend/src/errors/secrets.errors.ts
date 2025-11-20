/**
 * Custom error classes for secrets management and security
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

export class SecretNotFoundError extends Error {
  constructor(secretId: string) {
    super(`Secret ${secretId} not found`);
    this.name = 'SecretNotFoundError';
  }
}

export class SecretAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Secret with name "${name}" already exists`);
    this.name = 'SecretAlreadyExistsError';
  }
}

export class SecretValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecretValidationError';
  }
}

/**
 * Error thrown when a domain is not on the whitelist
 * Requirement 5.2: Clear error message with rejected domain and actionable guidance
 */
export class DomainNotWhitelistedError extends Error {
  constructor(domain: string) {
    super(
      `Domain not whitelisted: ${domain}. Please contact support to request whitelist addition or use an approved domain.`
    );
    this.name = 'DomainNotWhitelistedError';
  }
}

/**
 * Error thrown when authentication is required but not provided
 * Requirement 5.3: Clear error message for authentication requirement
 */
export class AuthenticationRequiredError extends Error {
  constructor(reason: string = 'to use secrets') {
    super(`Authentication required ${reason}. Please sign in to continue.`);
    this.name = 'AuthenticationRequiredError';
  }
}

/**
 * Error thrown when a user tries to access a secret they don't own
 * Requirement 5.4: Clear error message without exposing system internals
 */
export class SecretOwnershipError extends Error {
  constructor() {
    super('Unauthorized: You do not have permission to access this secret.');
    this.name = 'SecretOwnershipError';
  }
}

/**
 * Error thrown when a secret reference is invalid or malformed
 * Requirement 5.3: Clear error message with actionable guidance
 */
export class InvalidSecretReferenceError extends Error {
  constructor(message: string) {
    super(`Invalid secret reference: ${message}. Please check your operator configuration.`);
    this.name = 'InvalidSecretReferenceError';
  }
}

/**
 * Error thrown when encryption/decryption fails
 * Requirement 5.5: User-friendly message without exposing system internals
 */
export class EncryptionError extends Error {
  constructor() {
    super('Failed to process secret. Please try again or contact support if the issue persists.');
    this.name = 'EncryptionError';
  }
}
