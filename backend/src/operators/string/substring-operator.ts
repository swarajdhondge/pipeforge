import { BaseOperator } from '../base-operator';
import { SubstringConfig, ValidationResult, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * SubstringOperator - Extract portion of a string by indices
 * 
 * Features:
 * - Extract by start/end indices
 * - Handle out-of-bounds gracefully
 * - Handle nested fields with dot notation
 * - Works on arrays of items or single items
 * 
 * Requirements: 9.3
 */
export class SubstringOperator extends BaseOperator {
  type = 'substring';
  category: OperatorCategory = 'string';
  description = 'Extract portion of a string by indices';

  /**
   * Execute substring operation
   * @param input - Input data to extract substring from
   * @param config - Substring configuration
   * @returns Data with extracted substrings
   */
  async execute(input: any, config: SubstringConfig, _context?: any): Promise<any> {
    // Handle null/undefined input
    if (input === null || input === undefined) {
      return null;
    }

    // Handle array input
    if (this.isArray(input)) {
      return input.map((item: any) => this.extractSubstring(item, config));
    }

    // Handle single object
    return this.extractSubstring(input, config);
  }

  /**
   * Validate substring configuration
   * @param config - Substring configuration
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

    if (config.start === undefined || config.start === null) {
      return { valid: false, error: 'Start index is required' };
    }

    if (typeof config.start !== 'number') {
      return { valid: false, error: 'Start must be a number' };
    }

    if (!Number.isInteger(config.start)) {
      return { valid: false, error: 'Start must be an integer' };
    }

    if (config.start < 0) {
      return { valid: false, error: 'Start must be non-negative' };
    }

    if (config.end !== undefined && config.end !== null) {
      if (typeof config.end !== 'number') {
        return { valid: false, error: 'End must be a number' };
      }

      if (!Number.isInteger(config.end)) {
        return { valid: false, error: 'End must be an integer' };
      }

      if (config.end < 0) {
        return { valid: false, error: 'End must be non-negative' };
      }

      if (config.end < config.start) {
        return { valid: false, error: 'End must be greater than or equal to start' };
      }
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * Substring doesn't change the schema structure
   * @param inputSchema - Schema from upstream operator
   * @returns Same schema (field types unchanged)
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: SubstringConfig): ExtractedSchema | null {
    // Substring doesn't change the schema structure
    return inputSchema || null;
  }

  /**
   * Extract substring from a single item
   * @param item - Item to extract substring from
   * @param config - Substring configuration
   * @returns Item with extracted substring
   */
  private extractSubstring(item: any, config: SubstringConfig): any {
    if (!item || typeof item !== 'object') {
      return item;
    }

    // Get the field value (supports dot notation)
    const fieldValue = this.getNestedProperty(item, config.field);

    // Skip if field doesn't exist
    if (fieldValue === undefined) {
      return item;
    }

    // Skip if field value is not a string
    if (typeof fieldValue !== 'string') {
      return item;
    }

    // Extract substring with graceful out-of-bounds handling
    let newValue: string;
    
    if (config.end !== undefined && config.end !== null) {
      // Use slice which handles out-of-bounds gracefully
      newValue = fieldValue.slice(config.start, config.end);
    } else {
      // No end specified, extract from start to end of string
      newValue = fieldValue.slice(config.start);
    }

    // Create a copy of the item and set the new value
    const result = { ...item };
    this.setNestedProperty(result, config.field, newValue);

    return result;
  }
}
