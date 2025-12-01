import { BaseOperator } from './base-operator';
import { SortConfig, ValidationResult, OperatorCategory } from '../types/operator.types';
import { ExtractedSchema } from '../types/schema.types';

/**
 * Common date formats for parsing date strings
 */
const DATE_PATTERNS = [
  // ISO 8601 formats
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
  /^\d{4}-\d{2}-\d{2}$/,
  // RFC 2822 / RSS date format
  /^[A-Za-z]{3},?\s+\d{1,2}\s+[A-Za-z]{3}\s+\d{4}\s+\d{2}:\d{2}:\d{2}/,
  // Common formats
  /^\d{1,2}\/\d{1,2}\/\d{4}$/,
  /^\d{1,2}-\d{1,2}-\d{4}$/,
  /^[A-Za-z]+\s+\d{1,2},?\s+\d{4}$/,
];

/**
 * SortOperator - Array sorting by field
 * 
 * Features:
 * - Array sorting by field
 * - Support asc/desc direction
 * - Handle missing fields (placed at end)
 * - Date string detection and parsing
 * - Numeric sorting (not string-based)
 * - Error handling for non-array input
 * 
 * Requirements: 6.3, 6.4, 6.5
 */
export class SortOperator extends BaseOperator {
  type = 'sort';
  category: OperatorCategory = 'operators';
  description = 'Sort items by a field in ascending or descending order';

  /**
   * Execute sort operation
   * @param input - Input array to sort
   * @param config - Sort configuration with field and direction
   * @returns Sorted array
   */
  async execute(input: any, config: SortConfig, _context?: any): Promise<any> {
    // Validate input is an array (Requirement 9.2)
    if (!this.isArray(input)) {
      const inputType = input === null ? 'null' : 
                        input === undefined ? 'undefined' : 
                        Array.isArray(input) ? 'array' :
                        typeof input;
      throw new Error(
        `Sort operator requires array input, received ${inputType}. ` +
        `Make sure the upstream operator outputs an array of items.`
      );
    }

    // If empty array, return as is
    if (input.length === 0) {
      return input;
    }

    // Create a copy to avoid mutating input
    const sorted = [...input];

    // Sort the array
    sorted.sort((a, b) => {
      const aValue = this.getNestedProperty(a, config.field);
      const bValue = this.getNestedProperty(b, config.field);

      // Handle missing fields - place at end
      if (aValue === undefined || aValue === null) {
        return 1;
      }
      if (bValue === undefined || bValue === null) {
        return -1;
      }

      // Compare values
      let comparison = this.compareValues(aValue, bValue);

      // Apply direction
      if (config.direction === 'desc') {
        comparison = -comparison;
      }

      return comparison;
    });

    return sorted;
  }

  /**
   * Validate sort configuration
   * @param config - Sort configuration
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

    if (!config.direction) {
      return { valid: false, error: 'Direction is required' };
    }

    if (config.direction !== 'asc' && config.direction !== 'desc') {
      return { valid: false, error: 'Direction must be "asc" or "desc"' };
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * Sort preserves the input schema (same fields, different order)
   * @param inputSchema - Schema from upstream operator
   * @param _config - Sort configuration
   * @returns Same as input schema (sort doesn't change field structure)
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: SortConfig): ExtractedSchema | null {
    // Sort preserves the schema structure, just reorders items
    return inputSchema || null;
  }

  /**
   * Compare two values for sorting
   * @param a - First value
   * @param b - Second value
   * @returns Comparison result (-1, 0, 1)
   */
  private compareValues(a: any, b: any): number {
    // Same value
    if (a === b) {
      return 0;
    }

    // Date comparison (native Date objects)
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    // Numeric comparison (both are numbers)
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    // String handling - check for dates and numbers
    if (typeof a === 'string' && typeof b === 'string') {
      // Try date parsing first
      const dateA = this.tryParseDate(a);
      const dateB = this.tryParseDate(b);
      
      if (dateA !== null && dateB !== null) {
        return dateA.getTime() - dateB.getTime();
      }

      // Try numeric parsing (for string numbers like "123")
      const numA = this.tryParseNumber(a);
      const numB = this.tryParseNumber(b);
      
      if (numA !== null && numB !== null) {
        return numA - numB;
      }

      // Fallback to string comparison
      return a.localeCompare(b);
    }

    // Boolean comparison
    if (typeof a === 'boolean' && typeof b === 'boolean') {
      return a === b ? 0 : a ? 1 : -1;
    }

    // Try to convert to numbers (mixed types)
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    // Fallback to string comparison
    return String(a).localeCompare(String(b));
  }

  /**
   * Try to parse a string as a date
   * @param value - String value to parse
   * @returns Date object if valid, null otherwise
   */
  private tryParseDate(value: string): Date | null {
    // Check if the string matches any known date pattern
    const matchesDatePattern = DATE_PATTERNS.some(pattern => pattern.test(value));
    
    if (!matchesDatePattern) {
      return null;
    }

    const parsed = new Date(value);
    
    // Check if the date is valid
    if (isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  }

  /**
   * Try to parse a string as a number
   * @param value - String value to parse
   * @returns Number if valid, null otherwise
   */
  private tryParseNumber(value: string): number | null {
    // Skip empty strings
    if (value.trim() === '') {
      return null;
    }

    // Check if it looks like a number (including decimals and negative)
    if (!/^-?\d+(\.\d+)?$/.test(value.trim())) {
      return null;
    }

    const num = Number(value);
    return isNaN(num) ? null : num;
  }
}
