import { BaseOperator } from '../base-operator';
import { RegexConfig, ValidationResult, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';
import { validateRegexPatternWithFlags, createSafeRegex } from '../../utils/regex-validator';

/**
 * RegexOperator - Apply regex pattern to extract or replace content
 * 
 * Features:
 * - Support extract and replace modes
 * - Validate pattern before execution (ReDoS prevention)
 * - Display clear error for invalid patterns
 * - Handle nested fields with dot notation
 * - Works on arrays of items or single items
 * 
 * Requirements: 9.2, 9.4
 */
export class RegexOperator extends BaseOperator {
  type = 'regex';
  category: OperatorCategory = 'string';
  description = 'Apply regex pattern to extract or replace content';

  /**
   * Execute regex operation
   * @param input - Input data to perform regex on
   * @param config - Regex configuration
   * @returns Data with regex applied
   */
  async execute(input: any, config: RegexConfig, _context?: any): Promise<any> {
    // Handle null/undefined input
    if (input === null || input === undefined) {
      return null;
    }

    // Validate pattern before execution
    const validation = validateRegexPatternWithFlags(config.pattern, config.flags);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid regex pattern');
    }

    // Create the regex
    const regex = createSafeRegex(config.pattern, config.flags);
    if (!regex) {
      throw new Error('Failed to create regex from pattern');
    }

    // Handle array input
    if (this.isArray(input)) {
      return input.map((item: any) => this.applyRegex(item, config, regex));
    }

    // Handle single object
    return this.applyRegex(input, config, regex);
  }

  /**
   * Validate regex configuration
   * @param config - Regex configuration
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

    if (!config.pattern) {
      return { valid: false, error: 'Pattern is required' };
    }

    if (typeof config.pattern !== 'string') {
      return { valid: false, error: 'Pattern must be a string' };
    }

    if (!config.mode) {
      return { valid: false, error: 'Mode is required' };
    }

    if (config.mode !== 'extract' && config.mode !== 'replace') {
      return { valid: false, error: 'Mode must be "extract" or "replace"' };
    }

    if (config.mode === 'replace' && config.replacement === undefined) {
      return { valid: false, error: 'Replacement is required for replace mode' };
    }

    if (config.mode === 'replace' && typeof config.replacement !== 'string') {
      return { valid: false, error: 'Replacement must be a string' };
    }

    if (config.flags !== undefined && typeof config.flags !== 'string') {
      return { valid: false, error: 'Flags must be a string' };
    }

    if (config.group !== undefined && typeof config.group !== 'number') {
      return { valid: false, error: 'Group must be a number' };
    }

    if (config.group !== undefined && config.group < 0) {
      return { valid: false, error: 'Group must be non-negative' };
    }

    // Validate the regex pattern itself
    const patternValidation = validateRegexPatternWithFlags(config.pattern, config.flags);
    if (!patternValidation.valid) {
      return patternValidation;
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * @param inputSchema - Schema from upstream operator
   * @returns Schema (unchanged for replace, potentially modified for extract)
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: RegexConfig): ExtractedSchema | null {
    // Regex operations don't fundamentally change the schema structure
    return inputSchema || null;
  }

  /**
   * Apply regex to a single item
   * @param item - Item to apply regex to
   * @param config - Regex configuration
   * @param regex - Compiled regex
   * @returns Item with regex applied
   */
  private applyRegex(item: any, config: RegexConfig, regex: RegExp): any {
    if (!item || typeof item !== 'object') {
      return item;
    }

    // Get the field value (supports dot notation)
    const fieldValue = this.getNestedProperty(item, config.field);

    // Skip if field doesn't exist (Requirements 9.5 - skip without error)
    if (fieldValue === undefined) {
      return item;
    }

    // Skip if field value is not a string
    if (typeof fieldValue !== 'string') {
      return item;
    }

    let newValue: string | null;

    if (config.mode === 'extract') {
      newValue = this.extractWithRegex(fieldValue, regex, config.group);
    } else {
      newValue = this.replaceWithRegex(fieldValue, regex, config.replacement || '');
    }

    // Create a copy of the item and set the new value
    const result = { ...item };
    this.setNestedProperty(result, config.field, newValue);

    return result;
  }

  /**
   * Extract content using regex
   * @param value - String to extract from
   * @param regex - Compiled regex
   * @param group - Capture group to extract (default: 0 = full match)
   * @returns Extracted string or null if no match
   */
  private extractWithRegex(value: string, regex: RegExp, group?: number): string | null {
    const match = value.match(regex);
    
    if (!match) {
      return null;
    }

    const groupIndex = group ?? 0;
    
    // Return the specified capture group or full match
    if (groupIndex >= match.length) {
      return null;
    }

    return match[groupIndex] ?? null;
  }

  /**
   * Replace content using regex
   * @param value - String to replace in
   * @param regex - Compiled regex
   * @param replacement - Replacement string
   * @returns String with replacements made
   */
  private replaceWithRegex(value: string, regex: RegExp, replacement: string): string {
    return value.replace(regex, replacement);
  }
}
