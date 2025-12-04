import { Router, Request, Response } from 'express';
import { ExecutionService } from '../services/execution.service';
import { PipeExecutor } from '../services/pipe-executor';
import { SecretsService } from '../services/secrets.service';
import { operatorRegistry } from '../operators/operator-registry';
import { authenticateToken, optionalAuthenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { executionRateLimiter } from '../middleware/rate-limit.middleware';
import { checkAnonymousExecutionLimit } from '../middleware/validation.middleware';
import { PipeDefinition } from '../types/operator.types';
import pool from '../config/database';
import logger from '../utils/logger';

const router = Router();
const executionService = new ExecutionService(pool);
const pipeExecutor = new PipeExecutor(operatorRegistry);
const secretsService = new SecretsService(pool);

/**
 * POST /api/v1/executions/run - Execute a pipe definition directly (canvas state)
 * Auth: Optional (anonymous limited to 5 executions)
 * 
 * This endpoint executes the current canvas state without requiring a saved pipe.
 * Used for:
 * - Running unsaved pipes
 * - Running modified pipes before saving
 * - Running forked pipes before saving
 */
router.post('/run', optionalAuthenticateToken, executionRateLimiter, checkAnonymousExecutionLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { definition, mode, userInputs } = req.body;
    const userId = req.user?.userId || null;

    // Validate definition is provided
    if (!definition) {
      return res.status(400).json({ error: 'definition is required' });
    }

    // Validate definition structure
    if (!definition.nodes || !Array.isArray(definition.nodes)) {
      return res.status(400).json({ error: 'definition.nodes must be an array' });
    }

    if (!definition.edges || !Array.isArray(definition.edges)) {
      return res.status(400).json({ error: 'definition.edges must be an array' });
    }

    if (definition.nodes.length === 0) {
      return res.status(400).json({ error: 'Pipe has no operators' });
    }

    // Validate max operators limit
    if (definition.nodes.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 operators per pipe' });
    }

    const pipeDefinition: PipeDefinition = {
      nodes: definition.nodes,
      edges: definition.edges,
    };

    // For sync mode, execute directly with 30s timeout
    if (mode !== 'async') {
      const startTime = Date.now();

      try {
        // Execute with timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Execution timeout after 30000ms')), 30000)
        );

        const result = await Promise.race([
          pipeExecutor.executeWithDetails(pipeDefinition, {
            secretsService,
            userId,
            userInputs: userInputs || undefined,
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
            executionTime,
          });
        }

        throw error;
      }
    }

    // For async mode, we would queue the execution
    // For now, return error as async execution of canvas state is not yet implemented
    return res.status(400).json({ 
      error: 'Async execution of canvas state is not yet supported. Please use sync mode.' 
    });

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
    logger.error('Execute canvas state error', { error: error.message });
    return res.status(500).json({ error: 'Execution failed', details: error.message });
  }
});

/**
 * POST /api/v1/executions/run-selected - Execute canvas state from a specific node
 * Auth: Optional (anonymous limited to 5 executions)
 * 
 * This endpoint executes from a specific target node, tracing back through upstream.
 * Used for the "Run Selected" feature when working with unsaved pipes.
 * 
 * Requirements: 8.2, 8.3 - Run from specific operator
 */
router.post('/run-selected', optionalAuthenticateToken, executionRateLimiter, checkAnonymousExecutionLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { definition, targetNodeId, userInputs } = req.body;
    const userId = req.user?.userId || null;

    // Validate definition is provided
    if (!definition) {
      return res.status(400).json({ error: 'definition is required' });
    }

    // Validate targetNodeId is provided
    if (!targetNodeId) {
      return res.status(400).json({ error: 'targetNodeId is required' });
    }

    // Validate definition structure
    if (!definition.nodes || !Array.isArray(definition.nodes)) {
      return res.status(400).json({ error: 'definition.nodes must be an array' });
    }

    if (!definition.edges || !Array.isArray(definition.edges)) {
      return res.status(400).json({ error: 'definition.edges must be an array' });
    }

    if (definition.nodes.length === 0) {
      return res.status(400).json({ error: 'Pipe has no operators' });
    }

    // Validate target node exists
    const targetNode = definition.nodes.find((n: any) => n.id === targetNodeId);
    if (!targetNode) {
      return res.status(400).json({ error: `Target node ${targetNodeId} not found in pipe` });
    }

    const pipeDefinition: PipeDefinition = {
      nodes: definition.nodes,
      edges: definition.edges,
    };

    const startTime = Date.now();

    try {
      // Execute with timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout after 30000ms')), 30000)
      );

      const result = await Promise.race([
        pipeExecutor.executeSelected(pipeDefinition, targetNodeId, {
          secretsService,
          userId,
          userInputs: userInputs || undefined,
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
    logger.error('Execute selected canvas state error', { error: error.message });
    return res.status(500).json({ error: 'Execution failed', details: error.message });
  }
});

/**
 * POST /api/v1/executions - Execute a pipe
 * Auth: Optional (anonymous limited to 5 executions)
 */
router.post('/', optionalAuthenticateToken, executionRateLimiter, checkAnonymousExecutionLimit, async (req: AuthRequest, res: Response) => {
  try {
    const { pipe_id, mode } = req.body;
    const userId = req.user?.userId || null;

    if (!pipe_id) {
      return res.status(400).json({ error: 'pipe_id is required' });
    }

    const result = await executionService.execute({
      pipe_id,
      user_id: userId,
      mode: mode || 'sync',
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes('timeout')) {
      return res.status(408).json({ error: error.message });
    }
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }
    logger.error('Execute pipe error', { error });
    return res.status(500).json({ error: 'Execution failed', details: error.message });
  }
});

/**
 * GET /api/v1/executions/:id - Get execution status/result
 * Auth: Optional (if pipe is public)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const execution = await executionService.get(id);

    return res.status(200).json(execution);
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    logger.error('Get execution error', { error });
    return res.status(500).json({ error: 'Failed to get execution' });
  }
});

/**
 * GET /api/v1/executions - List user's executions
 * Auth: Required
 */
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { pipe_id, page, limit } = req.query;

    const result = await executionService.list({
      userId: req.user!.userId,
      pipeId: pipe_id as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    return res.status(200).json(result);
  } catch (error) {
    logger.error('List executions error', { error });
    return res.status(500).json({ error: 'Failed to list executions' });
  }
});

export default router;
