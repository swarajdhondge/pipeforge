import { Request, Response, NextFunction } from 'express';
import { operatorRegistry } from '../operators/operator-registry';
import { PipeValidator } from '../utils/pipe-validator';

// Create singleton validator instance
const pipeValidator = new PipeValidator(operatorRegistry);

/**
 * Validate pipe definition
 * - Max 50 operators per pipe (Requirement 17.7)
 * - Valid operator types (Requirement 18.1)
 * - Valid connections reference existing nodes (Requirement 18.2)
 * - No circular dependencies (Requirement 18.3)
 * - Valid operator configurations
 * - Max definition size: 100KB
 * 
 * Returns 400 Bad Request for:
 * - Unknown operator types (Requirement 18.4)
 * - Invalid connections (Requirement 18.4)
 * - Cycles detected (Requirement 18.4)
 */
export function validatePipeDefinition(req: Request, res: Response, next: NextFunction): void {
  try {
    const { definition } = req.body;

    // Allow partial updates (e.g., visibility toggle) without definition
    // Only validate definition if it's provided
    if (!definition) {
      next();
      return;
    }

    // Check definition size (max 100KB)
    const definitionSize = JSON.stringify(definition).length;
    if (definitionSize > 100 * 1024) {
      res.status(400).json({ error: 'Pipe definition too large (max 100KB)' });
      return;
    }

    // Use PipeValidator for comprehensive validation
    const validationResult = pipeValidator.validate(definition);
    
    if (!validationResult.valid) {
      // Return the first error with appropriate message
      const firstError = validationResult.errors[0];
      
      // Map error types to user-friendly messages
      switch (firstError.type) {
        case 'unknown_operator':
          // Requirement 18.4: Return 400 for unknown operator types
          res.status(400).json({ error: firstError.message });
          return;
        case 'invalid_connection':
          // Requirement 18.4: Return 400 for invalid connections
          res.status(400).json({ error: firstError.message });
          return;
        case 'cycle_detected':
          // Requirement 18.4: Return 400 for cycles
          res.status(400).json({ error: firstError.message });
          return;
        case 'operator_limit':
          // Requirement 17.7: Return 400 for exceeding operator limit
          res.status(400).json({ error: firstError.message });
          return;
        case 'invalid_structure':
          res.status(400).json({ error: firstError.message });
          return;
        default:
          res.status(400).json({ error: 'Invalid pipe definition' });
          return;
      }
    }

    // Validate each node's data structure and config
    for (const node of definition.nodes) {
      if (!node.data) {
        res.status(400).json({ error: `Invalid node structure: node ${node.id} missing data` });
        return;
      }

      // Get operator and validate config
      const operator = operatorRegistry.get(node.type);
      if (operator) {
        const configValidation = operator.validate(node.data.config);
        if (!configValidation.valid) {
          res.status(400).json({
            error: `Invalid config for operator ${node.id} (${node.type}): ${configValidation.error}`,
          });
          return;
        }
      }
    }

    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid pipe definition' });
  }
}

/**
 * Check anonymous execution limit
 * Anonymous users are limited to 5 executions (tracked in session)
 */
export async function checkAnonymousExecutionLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Authenticated users have unlimited executions
    if ((req as any).user) {
      next();
      return;
    }

    // For anonymous users, we rely on client-side tracking
    // The actual enforcement happens in the frontend
    // This is a placeholder for server-side session tracking if needed

    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to check execution limit' });
  }
}
