import { Router, Request, Response } from 'express';
import { PipeService } from '../services/pipe.service';
import { PipeExecutor } from '../services/pipe-executor';
import { SecretsService } from '../services/secrets.service';
import { operatorRegistry } from '../operators/operator-registry';
import { authenticateToken, optionalAuthenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { validatePipeDefinition, checkAnonymousExecutionLimit } from '../middleware/validation.middleware';
import { executionRateLimiter } from '../middleware/rate-limit.middleware';
import pool from '../config/database';
import logger from '../utils/logger';

const router = Router();

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate if a string is a valid UUID
 */
function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}
const pipeService = new PipeService(pool);
const pipeExecutor = new PipeExecutor(operatorRegistry);
const secretsService = new SecretsService(pool);

/**
 * POST /api/v1/pipes/migrate-drafts - Migrate draft pipes from localStorage
 * Auth: Required
 */
router.post('/migrate-drafts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { drafts } = req.body;

    if (!Array.isArray(drafts)) {
      return res.status(400).json({ error: 'Drafts must be an array' });
    }

    const userId = req.user!.userId;
    let migratedCount = 0;
    const errors: string[] = [];

    for (const draft of drafts) {
      try {
        // Validate draft structure
        if (!draft.definition || !draft.definition.nodes || !draft.definition.edges) {
          errors.push(`Invalid draft structure for draft ${draft.id || 'unknown'}`);
          continue;
        }

        // Generate name if not provided
        const name = draft.name && draft.name.trim() 
          ? draft.name 
          : `Draft - ${new Date(draft.timestamp || Date.now()).toLocaleString()}`;

        // Create pipe as private
        await pipeService.create({
          user_id: userId,
          name,
          description: draft.description || '',
          definition: draft.definition,
          is_public: false,
          tags: draft.tags || [],
        });

        migratedCount++;
      } catch (error: any) {
        logger.error('Error migrating draft', { error, draftId: draft.id });
        errors.push(`Failed to migrate draft ${draft.id || 'unknown'}: ${error.message}`);
      }
    }

    return res.status(200).json({
      migratedCount,
      totalDrafts: drafts.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error('Migrate drafts error', { error });
    return res.status(500).json({ error: 'Failed to migrate drafts' });
  }
});

/**
 * POST /api/v1/pipes - Create new pipe
 * Auth: Required
 */
router.post('/', authenticateToken, validatePipeDefinition, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, definition, is_public, is_draft, tags } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!definition) {
      return res.status(400).json({ error: 'Definition is required' });
    }

    const pipe = await pipeService.create({
      user_id: req.user!.userId,
      name,
      description,
      definition,
      is_public,
      is_draft,
      tags,
    });

    return res.status(201).json(pipe);
  } catch (error) {
    logger.error('Create pipe error', { error });
    return res.status(500).json({ error: 'Failed to create pipe' });
  }
});

/**
 * GET /api/v1/pipes/trending - Get trending pipes
 * Auth: Optional
 * NOTE: Must be before /:id route
 */
router.get('/trending', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const pipes = await pipeService.getTrending(limit);

    return res.status(200).json({ items: pipes });
  } catch (error) {
    logger.error('Get trending pipes error', { error });
    return res.status(500).json({ error: 'Failed to get trending pipes' });
  }
});

/**
 * GET /api/v1/pipes/featured - Get featured pipes
 * Auth: Optional
 * NOTE: Must be before /:id route
 */
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    const pipes = await pipeService.getFeatured(limit);

    return res.status(200).json({ items: pipes });
  } catch (error) {
    logger.error('Get featured pipes error', { error });
    return res.status(500).json({ error: 'Failed to get featured pipes' });
  }
});

/**
 * GET /api/v1/pipes - List pipes with filters
 * Auth: Optional
 */
router.get('/', optionalAuthenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      user_id,
      is_public,
      search,
      tags,
      sort,
      page,
      limit,
    } = req.query;

    const result = await pipeService.list({
      userId: req.user?.userId || (user_id as string),
      isPublic: is_public !== undefined ? is_public === 'true' : undefined,
      search: search as string,
      tags: tags ? (tags as string).split(',') : undefined,
      sort: sort as 'popular' | 'recent' | 'most_used',
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('List pipes error', { error });
    return res.status(500).json({ error: 'Failed to list pipes' });
  }
});

/**
 * GET /api/v1/pipes/:id - Get pipe by ID
 * Auth: Optional (public pipes only for anonymous)
 */
router.get('/:id', optionalAuthenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid pipe ID format' });
    }

    const pipe = await pipeService.get(id, userId);

    if (!pipe) {
      return res.status(404).json({ error: 'Pipe not found' });
    }

    return res.status(200).json(pipe);
  } catch (error: any) {
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('Get pipe error', { error });
    return res.status(500).json({ error: 'Failed to get pipe' });
  }
});

/**
 * PUT /api/v1/pipes/:id - Update pipe
 * Auth: Required (must own pipe)
 */
router.put('/:id', authenticateToken, validatePipeDefinition, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid pipe ID format' });
    }

    const { name, description, definition, is_public, is_draft, tags } = req.body;

    const pipe = await pipeService.update(id, req.user!.userId, {
      name,
      description,
      definition,
      is_public,
      is_draft,
      tags,
    });

    return res.status(200).json(pipe);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('Update pipe error', { error });
    return res.status(500).json({ error: 'Failed to update pipe' });
  }
});

/**
 * DELETE /api/v1/pipes/:id - Delete pipe
 * Auth: Required (must own pipe)
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid pipe ID format' });
    }

    await pipeService.delete(id, req.user!.userId);

    return res.status(204).send();
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('Delete pipe error', { error });
    return res.status(500).json({ error: 'Failed to delete pipe' });
  }
});

/**
 * POST /api/v1/pipes/:id/fork - Fork a pipe
 * Auth: Required
 */
router.post('/:id/fork', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid pipe ID format' });
    }

    const forked = await pipeService.fork(id, req.user!.userId);

    return res.status(201).json(forked);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Cannot fork')) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('Fork pipe error', { error });
    return res.status(500).json({ error: 'Failed to fork pipe' });
  }
});

/**
 * POST /api/v1/pipes/:id/execute-selected - Execute pipe from a specific node
 * Auth: Optional (anonymous limited to 5 executions)
 * 
 * Executes from a specific target node, tracing back through all upstream sources.
 * This implements the "Run Selected" feature from Yahoo Pipes.
 * 
 * Requirements: 10.1, 10.4
 */
router.post('/:id/execute-selected', optionalAuthenticateToken, executionRateLimiter, checkAnonymousExecutionLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid pipe ID format' });
    }

    const { targetNodeId, userInputs } = req.body;
    const userId = req.user?.userId || null;

    // Validate targetNodeId is provided
    if (!targetNodeId) {
      return res.status(400).json({ error: 'targetNodeId is required' });
    }

    // Get the pipe
    const pipe = await pipeService.get(id, userId || undefined);
    if (!pipe) {
      return res.status(404).json({ error: 'Pipe not found' });
    }

    // Validate pipe has nodes
    if (!pipe.definition.nodes || pipe.definition.nodes.length === 0) {
      return res.status(400).json({ error: 'Pipe has no operators' });
    }

    // Validate target node exists
    const targetNode = pipe.definition.nodes.find((n: any) => n.id === targetNodeId);
    if (!targetNode) {
      return res.status(400).json({ error: `Target node ${targetNodeId} not found in pipe` });
    }

    const startTime = Date.now();

    try {
      // Execute with timeout (30 seconds for sync execution)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout after 30000ms')), 30000)
      );

      const result = await Promise.race([
        pipeExecutor.executeSelected(pipe.definition, targetNodeId, {
          secretsService,
          userId,
          userInputs,
        }),
        timeoutPromise,
      ]);

      const executionTime = Date.now() - startTime;

      return res.status(200).json({
        status: 'completed',
        finalResult: result.finalResult,
        intermediateResults: result.intermediateResults,
        executionOrder: result.executionOrder,
        totalExecutionTime: result.totalExecutionTime,
        executionTime,
      });
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      // Check if error has intermediate results (partial execution)
      if (error.intermediateResults) {
        return res.status(200).json({
          status: 'failed',
          error: error.message,
          nodeId: error.nodeId,
          operatorType: error.operatorType,
          intermediateResults: error.intermediateResults,
          executionOrder: error.executionOrder,
          totalExecutionTime: error.totalExecutionTime,
          executionTime,
        });
      }

      throw error;
    }

  } catch (error: any) {
    if (error.message.includes('timeout')) {
      return res.status(408).json({ error: error.message });
    }
    if (error.message.includes('Cycle detected')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('Unknown operator')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    if (error.message.includes('no input connection')) {
      return res.status(400).json({ error: error.message });
    }
    logger.error('Execute selected error', { error: error.message });
    return res.status(500).json({ error: 'Execution failed', details: error.message });
  }
});

/**
 * GET /api/v1/pipes/:id/versions - Get version history
 * Auth: Required (must own pipe)
 */
router.get('/:id/versions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid pipe ID format' });
    }

    const versions = await pipeService.getVersions(id, req.user!.userId);

    return res.status(200).json({ versions });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('Get versions error', { error });
    return res.status(500).json({ error: 'Failed to get versions' });
  }
});

/**
 * POST /api/v1/pipes/:id/versions/:version/restore - Restore version
 * Auth: Required (must own pipe)
 */
router.post('/:id/versions/:version/restore', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id, version } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid pipe ID format' });
    }

    const versionNumber = parseInt(version, 10);

    if (isNaN(versionNumber)) {
      return res.status(400).json({ error: 'Invalid version number' });
    }

    const pipe = await pipeService.restoreVersion(id, versionNumber, req.user!.userId);

    return res.status(200).json(pipe);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('Restore version error', { error });
    return res.status(500).json({ error: 'Failed to restore version' });
  }
});

/**
 * POST /api/v1/pipes/:id/like - Like a pipe
 * Auth: Required
 */
router.post('/:id/like', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid pipe ID format' });
    }

    const result = await pipeService.like(id, req.user!.userId);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('already liked')) {
      return res.status(409).json({ error: error.message });
    }
    if (error.message.includes('Cannot like')) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('Like pipe error', { error });
    return res.status(500).json({ error: 'Failed to like pipe' });
  }
});

/**
 * DELETE /api/v1/pipes/:id/like - Unlike a pipe
 * Auth: Required
 */
router.delete('/:id/like', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'Invalid pipe ID format' });
    }

    const result = await pipeService.unlike(id, req.user!.userId);

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('not liked')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Unlike pipe error', { error });
    return res.status(500).json({ error: 'Failed to unlike pipe' });
  }
});

export default router;
