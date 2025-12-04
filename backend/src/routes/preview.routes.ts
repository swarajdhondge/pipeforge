import { Router, Response } from 'express';
import { operatorRegistry } from '../operators/operator-registry';
import { getSchemaExtractor } from '../services/schema-extractor';
import { SecretsService } from '../services/secrets.service';
import { optionalAuthenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { OperatorType, OperatorConfig } from '../types/operator.types';
import pool from '../config/database';
import logger from '../utils/logger';

const router = Router();
const secretsService = new SecretsService(pool);
const schemaExtractor = getSchemaExtractor();

/**
 * Source operator types that can be previewed
 */
const PREVIEWABLE_OPERATOR_TYPES: OperatorType[] = [
  'fetch',
  'fetch-json',
  'fetch-csv',
  'fetch-rss',
  'fetch-page',
];

/**
 * POST /api/v1/preview - Preview a source operator
 * Auth: Optional (for secret support)
 * 
 * Fetches sample data and extracts schema without full pipe execution.
 * Used for dynamic schema propagation in the pipe editor.
 * 
 * Requirements: 1.1
 */
router.post('/', optionalAuthenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { operatorType, config } = req.body;
    const userId = req.user?.userId || null;

    // Validate operatorType is provided
    if (!operatorType) {
      return res.status(400).json({ error: 'operatorType is required' });
    }

    // Validate config is provided
    if (!config) {
      return res.status(400).json({ error: 'config is required' });
    }

    // Check if operator type is previewable
    if (!PREVIEWABLE_OPERATOR_TYPES.includes(operatorType as OperatorType)) {
      return res.status(400).json({ 
        error: `Operator type '${operatorType}' is not previewable. Only source operators can be previewed.` 
      });
    }

    // Get operator from registry
    const operator = operatorRegistry.get(operatorType);
    if (!operator) {
      return res.status(400).json({ error: `Unknown operator type: ${operatorType}` });
    }

    // Validate operator config
    const validation = operator.validate(config as OperatorConfig);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || 'Invalid operator configuration' });
    }

    // Execute operator to get sample data with timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Preview timeout: Request took longer than 30 seconds')), 30000)
    );

    const executePromise = operator.execute(null, config, {
      secretsService,
      userId,
    });

    let sampleData: any;
    try {
      sampleData = await Promise.race([executePromise, timeoutPromise]);
    } catch (error: any) {
      // Handle specific error types
      if (error.message.includes('timeout')) {
        return res.status(408).json({ error: error.message });
      }
      if (error.message.includes('Domain not allowed') || error.message.includes('Security error')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('Network error') || error.message.includes('Unable to reach')) {
        return res.status(502).json({ error: error.message });
      }
      if (error.message.includes('Invalid response') || error.message.includes('parse')) {
        return res.status(422).json({ error: error.message });
      }
      throw error;
    }

    // Extract schema from sample data
    const schema = schemaExtractor.extract(sampleData);

    // Limit sample data for response (first 10 items for arrays)
    let truncatedSampleData = sampleData;
    let itemCount: number | undefined;

    if (Array.isArray(sampleData)) {
      itemCount = sampleData.length;
      truncatedSampleData = sampleData.slice(0, 10);
    }

    return res.status(200).json({
      schema,
      sampleData: truncatedSampleData,
      itemCount,
    });

  } catch (error: any) {
    logger.error('Preview error', { error: error.message });
    return res.status(500).json({ error: 'Preview failed', details: error.message });
  }
});

export default router;
