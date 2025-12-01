import { BaseOperator } from '../base-operator';
import { UniqueConfig, ValidationResult, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * UniqueOperator - Deduplicate items based on a field
 * 
 * Features:
 * - Deduplicate array items by specified field
 * - Keep first occurrence of duplicates
 * - Handle nested fields with dot notation
 * - Graceful handling of missing fields
 * 
 * Requirements: 7.1
 */
export class UniqueOperator extends BaseOperator {
  type = 'unique';
  category: OperatorCategory = 'operators';
  description = 'Remove duplicate items based on a field';

  /**
   * Execute unique operation
   * @param input - Input array to deduplicate
   * @param config - Unique configuration with field to deduplicate by
   * @returns Deduplicated array
   */
  async execute(input: any, config: UniqueConfig, _context?: any): Promise<any> {
    // Handle null/undefined input
    if (input === null || input === undefined) {
      return [];
    }

    // Validate input is an array
    if (!this.isArray(input)) {
      throw new Error('Unique operator requires an array as input');
    }

    // If empty array, return empty array
    if (input.length === 0) {
      return [];
    }

    // Track seen values to keep first occurrence
    const seen = new Set<string>();
    const result: any[] = [];

    for (const item of input) {
      // Get field value (supports dot notation)
      const fieldValue = this.getNestedProperty(item, config.field);
      
      // Convert to string for Set comparison (handles objects, arrays, primitives)
      const key = this.valueToKey(fieldValue);
      
      // Keep first occurrence only
      if (!seen.has(key)) {
        seen.add(key);
        result.push(item);
      }
    }

    return result;
  }

  /**
   * Validate unique configuration
   * @param config - Unique configuration
   * @returns Validation result
   */
  validate(config: any): ValidationResult {
    if (!config) {
      return { valid: false, error: 'Configuration is required' };
    }

    if (!config.field) {
      return { valid: false, error: 'Field is required' };
    }

    if (typeof config.field !== 'string') {
      return { valid: false, error: 'Field must be a string' };
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * Unique preserves the input schema (same fields, fewer items)
   * @param inputSchema - Schema from upstream operator
   * @param _config - Unique configuration
   * @returns Same as input schema (unique doesn't change field structure)
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: UniqueConfig): ExtractedSchema | null {
    // Unique preserves the schema structure, just reduces items
    return inputSchema || null;
  }

  /**
   * Convert a value to a string key for Set comparison
   * Handles primitives, objects, arrays, null, undefined
   * @param value - Value to convert
   * @returns String key
   */
  private valueToKey(value: any): string {
    if (value === null) return '__null__';
    if (value === undefined) return '__undefined__';
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }
}
