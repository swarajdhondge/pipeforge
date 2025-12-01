import { BaseOperator } from '../base-operator';
import { StringReplaceConfig, ValidationResult, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * StringReplaceOperator - Replace text in a field
 * 
 * Features:
 * - Replace all occurrences of search string with replacement
 * - Skip if target field doesn't exist (Requirements 9.5)
 * - Handle nested fields with dot notation
 * - Works on arrays of items or single items
 * 
 * Requirements: 9.1, 9.5
 */
export class StringReplaceOperator extends BaseOperator {
  type = 'string-replace';
  category: OperatorCategory = 'string';
  description = 'Replace text in a field';

  /**
   * Execute string replace operation
   * @param input - Input data to perform replacement on
   * @param config - String replace configuration
   * @returns Data with replaced strings
   */
  async execute(input: any, config: StringReplaceConfig, _context?: any): Promise<any> {
    // Handle null/undefined input
    if (input === null || input === undefined) {
      return null;
    }

    // Handle array input
    if (this.isArray(input)) {
      return input.map((item: any) => this.replaceInItem(item, config));
    }

    // Handle single object
    return this.replaceInItem(input, config);
  }

  /**
   * Validate string replace configuration
   * @param config - String replace configuration
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

    if (config.search === undefined || config.search === null) {
      return { valid: false, error: 'Search string is required' };
    }

    if (typeof config.search !== 'string') {
      return { valid: false, error: 'Search must be a string' };
    }

    if (config.replace === undefined || config.replace === null) {
      return { valid: false, error: 'Replace string is required' };
    }

    if (typeof config.replace !== 'string') {
      return { valid: false, error: 'Replace must be a string' };
    }

    if (config.all !== undefined && typeof config.all !== 'boolean') {
      return { valid: false, error: 'All must be a boolean' };
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * String replace doesn't change the schema structure
   * @param inputSchema - Schema from upstream operator
   * @returns Same schema (field types unchanged)
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: StringReplaceConfig): ExtractedSchema | null {
    // String replace doesn't change the schema structure
    return inputSchema || null;
  }

  /**
   * Replace string in a single item
   * @param item - Item to perform replacement on
   * @param config - String replace configuration
   * @returns Item with replaced string
   */
  private replaceInItem(item: any, config: StringReplaceConfig): any {
    if (!item || typeof item !== 'object') {
      return item;
    }

    // Get the field value (supports dot notation)
    const fieldValue = this.getNestedProperty(item, config.field);

    // Skip if field doesn't exist (Requirements 9.5)
    if (fieldValue === undefined) {
      return item;
    }

    // Skip if field value is not a string
    if (typeof fieldValue !== 'string') {
      return item;
    }

    // Perform replacement
    const replaceAll = config.all !== false; // Default to true
    let newValue: string;

    if (replaceAll) {
      // Replace all occurrences
      newValue = fieldValue.split(config.search).join(config.replace);
    } else {
      // Replace only first occurrence
      newValue = fieldValue.replace(config.search, config.replace);
    }

    // Create a copy of the item and set the new value
    const result = { ...item };
    this.setNestedProperty(result, config.field, newValue);

    return result;
  }
}
