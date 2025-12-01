import { Router, Response } from 'express';
import { ISecretsService } from '../services/secrets.service';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import {
  SecretNotFoundError,
  SecretAlreadyExistsError,
  SecretValidationError,
} from '../errors/secrets.errors';
import logger from '../utils/logger';

/**
 * Validate create secret input
 */
function validateCreateSecretInput(body: any): { name: string; description?: string; value: string } {
  if (!body || typeof body !== 'object') {
    throw new SecretValidationError('Invalid input');
  }

  const { name, description, value } = body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new SecretValidationError('Secret name is required');
  }

  if (name.length > 255) {
    throw new SecretValidationError('Secret name must be less than 255 characters');
  }

  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new SecretValidationError('Secret value is required');
  }

  if (description !== undefined && typeof description !== 'string') {
    throw new SecretValidationError('Description must be a string');
  }

  return {
    name: name.trim(),
    description: description?.trim(),
    value: value.trim(),
  };
}

/**
 * Validate update secret input
 */
function validateUpdateSecretInput(body: any): { name?: string; description?: string; value?: string } {
  if (!body || typeof body !== 'object') {
    throw new SecretValidationError('Invalid input');
  }

  const { name, description, value } = body;
  const result: { name?: string; description?: string; value?: string } = {};

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new SecretValidationError('Secret name cannot be empty');
    }
    if (name.length > 255) {
      throw new SecretValidationError('Secret name must be less than 255 characters');
    }
    result.name = name.trim();
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      throw new SecretValidationError('Description must be a string');
    }
    result.description = description.trim();
  }

  if (value !== undefined) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new SecretValidationError('Secret value cannot be empty');
    }
    result.value = value.trim();
  }

  // At least one field must be provided
  if (Object.keys(result).length === 0) {
    throw new SecretValidationError('At least one field must be provided for update');
  }

  return result;
}

export function createSecretsRoutes(secretsService: ISecretsService): Router {
  const router = Router();

  // All routes require authentication
  router.use(authenticateToken);

  // POST /secrets - Create a new secret
  router.post('/', async (req: AuthRequest, res: Response) => {
    try {
      // 1. Validate input
      const input = validateCreateSecretInput(req.body);

      // 2. Get user ID from token
      const userId = req.user!.userId;

      // 3. Create secret
      const secret = await secretsService.create(userId, input);

      // 4. Return secret metadata (without encrypted value)
      return res.status(201).json(secret);
    } catch (error) {
      if (error instanceof SecretAlreadyExistsError) {
        return res.status(409).json({ error: error.message });
      }
      if (error instanceof SecretValidationError) {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Create secret error', { error, userId: req.user?.userId });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /secrets - List user's secrets
  router.get('/', async (req: AuthRequest, res: Response) => {
    try {
      // 1. Get user ID from token
      const userId = req.user!.userId;

      // 2. List secrets
      const secrets = await secretsService.list(userId);

      // 3. Return secrets (metadata only)
      return res.status(200).json({ secrets });
    } catch (error) {
      logger.error('List secrets error', { error, userId: req.user?.userId });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /secrets/:id - Get a specific secret
  router.get('/:id', async (req: AuthRequest, res: Response) => {
    try {
      // 1. Get user ID from token
      const userId = req.user!.userId;

      // 2. Get secret ID from params
      const secretId = req.params.id;

      // 3. Get secret
      const secret = await secretsService.get(secretId, userId);

      if (!secret) {
        return res.status(404).json({ error: 'Secret not found' });
      }

      // 4. Return secret metadata
      return res.status(200).json(secret);
    } catch (error) {
      logger.error('Get secret error', { error, userId: req.user?.userId, secretId: req.params.id });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /secrets/:id - Update a secret
  router.put('/:id', async (req: AuthRequest, res: Response) => {
    try {
      // 1. Validate input
      const input = validateUpdateSecretInput(req.body);

      // 2. Get user ID from token
      const userId = req.user!.userId;

      // 3. Get secret ID from params
      const secretId = req.params.id;

      // 4. Update secret
      const secret = await secretsService.update(secretId, userId, input);

      // 5. Return updated secret metadata
      return res.status(200).json(secret);
    } catch (error) {
      if (error instanceof SecretNotFoundError) {
        return res.status(404).json({ error: 'Secret not found' });
      }
      if (error instanceof SecretAlreadyExistsError) {
        return res.status(409).json({ error: error.message });
      }
      if (error instanceof SecretValidationError) {
        return res.status(400).json({ error: error.message });
      }
      logger.error('Update secret error', { error, userId: req.user?.userId, secretId: req.params.id });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /secrets/:id - Delete a secret
  router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
      // 1. Get user ID from token
      const userId = req.user!.userId;

      // 2. Get secret ID from params
      const secretId = req.params.id;

      // 3. Delete secret
      await secretsService.delete(secretId, userId);

      // 4. Return 204 No Content
      return res.status(204).send();
    } catch (error) {
      if (error instanceof SecretNotFoundError) {
        return res.status(404).json({ error: 'Secret not found' });
      }
      logger.error('Delete secret error', { error, userId: req.user?.userId, secretId: req.params.id });
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
