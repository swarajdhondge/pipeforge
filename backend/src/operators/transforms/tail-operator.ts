import { BaseOperator } from '../base-operator';
import { TailConfig, ValidationResult, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * TailOperator - Keep last N items or skip first N items
 * 
 * Features:
 * - Keep last N items from input array (default mode)
 * - Skip first N items (when skip=true)
 * - Handle count > array length gracefully
 * 
 * Requirements: 7.3
 */
export class TailOperator extends BaseOperator {
  type = 'tail';
  category: OperatorCategory = 'operators';
  description = 'Keep only the last N items';

  /**
   * Execute tail operation
   * @param input - Input array
   * @param config - Tail configuration with count and optional skip flag
   * @returns Tail of array (last N items or items after skipping first N)
   */
  async execute(input: any, config: TailConfig, _context?: any): Promise<any> {
    // Handle null/undefined input
    if (input === null || input === undefined) {
      return [];
    }

    // Validate input is an array
    if (!this.isArray(input)) {
      throw new Error('Tail operator requires an array as input');
    }

    // If count is 0 or negative
    if (config.count <= 0) {
      // In skip mode, count 0 means skip nothing (return all)
      // In tail mode, count 0 means keep nothing (return empty)
      return config.skip ? input.slice(0) : [];
    }

    if (config.skip) {
      // Skip first N items
      return input.slice(config.count);
    } else {
      // Keep last N items
      return input.slice(-config.count);
    }
  }

  /**
   * Validate tail configuration
   * @param config - Tail configuration
   * @returns Validation result
   */
  validate(config: any): ValidationResult {
    if (!config) {
      return { valid: false, error: 'Configuration is required' };
    }

    if (config.count === undefined || config.count === null) {
      return { valid: false, error: 'Count is required' };
    }

    if (typeof config.count !== 'number') {
      return { valid: false, error: 'Count must be a number' };
    }

    if (!Number.isInteger(config.count)) {
      return { valid: false, error: 'Count must be an integer' };
    }

    if (config.count < 0) {
      return { valid: false, error: 'Count must be non-negative' };
    }

    // skip is optional, defaults to false
    if (config.skip !== undefined && typeof config.skip !== 'boolean') {
      return { valid: false, error: 'Skip must be a boolean' };
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * Tail preserves the input schema (same fields, fewer items)
   * @param inputSchema - Schema from upstream operator
   * @param _config - Tail configuration
   * @returns Same as input schema (tail doesn't change field structure)
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: TailConfig): ExtractedSchema | null {
    // Tail preserves the schema structure, just reduces items
    return inputSchema || null;
  }
}
