import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { 
  UserAlreadyExistsError, 
  InvalidCredentialsError, 
  InvalidTokenError,
  ExecutionLimitReachedError,
  ValidationError,
  NotFoundError
} from '../errors/auth.errors';
import {
  SecretNotFoundError,
  SecretAlreadyExistsError,
  SecretValidationError,
  DomainNotWhitelistedError,
  AuthenticationRequiredError,
  SecretOwnershipError,
  InvalidSecretReferenceError,
  EncryptionError
} from '../errors/secrets.errors';

/**
 * Enhanced error handler with support for security-related errors
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): Response | void {
  // Log error with context (but never log sensitive data)
  logger.error('Error occurred', {
    errorName: err.name,
    errorMessage: err.message,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.userId || 'anonymous',
    // Note: stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });

  // Map error types to HTTP status codes and user-friendly messages
  // Requirement 5.5: Error messages don't expose system internals
  
  // 400 Bad Request - Client errors
  if (
    err instanceof ValidationError ||
    err instanceof SecretValidationError ||
    err instanceof InvalidSecretReferenceError ||
    err instanceof DomainNotWhitelistedError ||
    err instanceof SecretNotFoundError
  ) {
    return res.status(400).json({
      error: err.message
    });
  }

  // 401 Unauthorized - Authentication required
  if (
    err instanceof InvalidTokenError ||
    err instanceof AuthenticationRequiredError ||
    err instanceof InvalidCredentialsError
  ) {
    return res.status(401).json({
      error: err.message
    });
  }

  // 403 Forbidden - Authorization failed
  if (
    err instanceof SecretOwnershipError ||
    err instanceof ExecutionLimitReachedError
  ) {
    return res.status(403).json({
      error: err.message
    });
  }

  // 404 Not Found - Resource not found
  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: err.message
    });
  }

  // 409 Conflict - Resource already exists
  if (
    err instanceof UserAlreadyExistsError ||
    err instanceof SecretAlreadyExistsError
  ) {
    return res.status(409).json({
      error: err.message
    });
  }

  // 500 Internal Server Error - Unexpected errors
  // Requirement 5.5: Don't expose internal details
  if (err instanceof EncryptionError) {
    return res.status(500).json({
      error: err.message
    });
  }

  // Default: Generic internal server error
  // Never expose stack traces or internal details to clients
  res.status(500).json({
    error: 'Internal server error. Please try again or contact support if the issue persists.'
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'Route not found',
  });
}
