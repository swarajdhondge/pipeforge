import { BaseOperator } from '../base-operator';
import { TruncateConfig, ValidationResult, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * TruncateOperator - Keep first N items from array
 * 
 * Features:
 * - Keep first N items from input array
 * - Handle count > array length gracefully (returns all items)
 * - Handle count = 0 (returns empty array)
 * 
 * Requirements: 7.2
 */
export class TruncateOperator extends BaseOperator {
  type = 'truncate';
  category: OperatorCategory = 'operators';
  description = 'Keep only the first N items';

  /**
   * Execute truncate operation
   * @param input - Input array to truncate
   * @param config - Truncate configuration with count
   * @returns Truncated array
   */
  async execute(input: any, config: TruncateConfig, _context?: any): Promise<any> {
    // Handle null/undefined input
    if (input === null || input === undefined) {
      return [];
    }

    // Validate input is an array
    if (!this.isArray(input)) {
      throw new Error('Truncate operator requires an array as input');
    }

    // If count is 0 or negative, return empty array
    if (config.count <= 0) {
      return [];
    }

    // Return first N items (slice handles count > length gracefully)
    return input.slice(0, config.count);
  }

  /**
   * Validate truncate configuration
   * @param config - Truncate configuration
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

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * Truncate preserves the input schema (same fields, fewer items)
   * @param inputSchema - Schema from upstream operator
   * @param _config - Truncate configuration
   * @returns Same as input schema (truncate doesn't change field structure)
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: TruncateConfig): ExtractedSchema | null {
    // Truncate preserves the schema structure, just reduces items
    return inputSchema || null;
  }
}
