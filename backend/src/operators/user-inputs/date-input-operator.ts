import { BaseOperator } from '../base-operator';
import { DateInputConfig, ValidationResult, ExecutionContext, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * DateInputOperator - Date input parameter for pipes
 * 
 * Features:
 * - Parses and validates date strings
 * - Supports minDate/maxDate constraints
 * - Value can be provided at execution time via userInputs
 * 
 * Requirements: 4.4
 */
export class DateInputOperator extends BaseOperator {
  type = 'date-input';
  category: OperatorCategory = 'user-inputs';
  description = 'Date input parameter';

  /**
   * Execute date input operator
   * Returns the configured date or the date provided at execution time
   * @param _input - Input data (ignored for user input operators)
   * @param config - Date input configuration
   * @param context - Execution context with userInputs
   * @returns The validated date as ISO string
   */
  async execute(_input: any, config: DateInputConfig, context?: ExecutionContext): Promise<string> {
    // Get value from execution context (userInputs) or fall back to defaultValue
    let value: string | undefined;
    
    // Check if value was provided at execution time via userInputs
    if (context?.userInputs && config.label && context.userInputs[config.label] !== undefined) {
      value = String(context.userInputs[config.label]);
    } else {
      value = config.defaultValue;
    }

    // Validate required field
    if (config.required && (value === undefined || value === null || value.trim() === '')) {
      throw new Error(`Date input "${config.label}" is required`);
    }

    // If no value provided and not required, return empty string
    if (value === undefined || value === null || value.trim() === '') {
      return '';
    }

    // Parse and validate date
    const parsedDate = this.parseDate(value);
    if (!parsedDate) {
      throw new Error(`Date input "${config.label}" has invalid date format`);
    }

    // Validate minDate constraint
    if (config.minDate) {
      const minDate = this.parseDate(config.minDate);
      if (minDate && parsedDate < minDate) {
        throw new Error(`Date input "${config.label}" must be on or after ${config.minDate}`);
      }
    }

    // Validate maxDate constraint
    if (config.maxDate) {
      const maxDate = this.parseDate(config.maxDate);
      if (maxDate && parsedDate > maxDate) {
        throw new Error(`Date input "${config.label}" must be on or before ${config.maxDate}`);
      }
    }

    // Return as ISO string
    return parsedDate.toISOString();
  }

  /**
   * Validate date input configuration
   * @param config - Date input configuration
   * @returns Validation result
   */
  validate(config: any): ValidationResult {
    if (!config) {
      return { valid: false, error: 'Configuration is required' };
    }

    if (!config.label) {
      return { valid: false, error: 'Label is required' };
    }

    if (typeof config.label !== 'string') {
      return { valid: false, error: 'Label must be a string' };
    }

    if (config.defaultValue !== undefined) {
      if (typeof config.defaultValue !== 'string') {
        return { valid: false, error: 'Default value must be a string' };
      }
      
      // Validate default date format if provided
      if (config.defaultValue.trim() !== '' && !this.parseDate(config.defaultValue)) {
        return { valid: false, error: 'Default value must be a valid date' };
      }
    }

    if (config.minDate !== undefined) {
      if (typeof config.minDate !== 'string') {
        return { valid: false, error: 'Min date must be a string' };
      }
      
      if (!this.parseDate(config.minDate)) {
        return { valid: false, error: 'Min date must be a valid date' };
      }
    }

    if (config.maxDate !== undefined) {
      if (typeof config.maxDate !== 'string') {
        return { valid: false, error: 'Max date must be a string' };
      }
      
      if (!this.parseDate(config.maxDate)) {
        return { valid: false, error: 'Max date must be a valid date' };
      }
    }

    // Validate minDate is before maxDate
    if (config.minDate && config.maxDate) {
      const minDate = this.parseDate(config.minDate);
      const maxDate = this.parseDate(config.maxDate);
      if (minDate && maxDate && minDate > maxDate) {
        return { valid: false, error: 'Min date cannot be after max date' };
      }
    }

    if (config.required !== undefined && typeof config.required !== 'boolean') {
      return { valid: false, error: 'Required must be a boolean' };
    }

    return { valid: true };
  }

  /**
   * Get output schema for date input
   * @returns Schema indicating date string output
   */
  getOutputSchema(): ExtractedSchema {
    return {
      fields: [{
        name: 'value',
        path: 'value',
        type: 'date',
        sample: new Date().toISOString(),
      }],
      rootType: 'object',
    };
  }

  /**
   * Parse date string to Date object
   * Supports ISO 8601 format and common date formats
   * @param dateStr - Date string to parse
   * @returns Date object or null if invalid
   */
  private parseDate(dateStr: string): Date | null {
    try {
      // Try parsing as ISO 8601 first
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
      
      return date;
    } catch {
      return null;
    }
  }
}
