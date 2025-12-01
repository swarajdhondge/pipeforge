import { BaseOperator } from '../base-operator';
import { NumberInputConfig, ValidationResult, ExecutionContext, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * NumberInputOperator - Numeric input parameter for pipes
 * 
 * Features:
 * - Validates min/max constraints
 * - Parses string input to number
 * - Value can be provided at execution time via userInputs
 * 
 * Requirements: 4.2
 */
export class NumberInputOperator extends BaseOperator {
  type = 'number-input';
  category: OperatorCategory = 'user-inputs';
  description = 'Numeric input with optional min/max constraints';

  /**
   * Execute number input operator
   * Returns the configured value or the value provided at execution time
   * @param _input - Input data (ignored for user input operators)
   * @param config - Number input configuration
   * @param context - Execution context with userInputs
   * @returns The numeric value
   */
  async execute(_input: any, config: NumberInputConfig, context?: ExecutionContext): Promise<number> {
    // Get value from execution context (userInputs) or fall back to defaultValue
    let rawValue: number | string | undefined;
    
    // Check if value was provided at execution time via userInputs
    if (context?.userInputs && config.label && context.userInputs[config.label] !== undefined) {
      rawValue = context.userInputs[config.label];
    } else {
      rawValue = config.defaultValue;
    }

    // Validate required field
    if (config.required && (rawValue === undefined || rawValue === null || rawValue === '')) {
      throw new Error(`Number input "${config.label}" is required`);
    }

    // If no value provided and not required, return 0 as default
    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return 0;
    }

    // Parse string input to number
    const value = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;

    // Validate it's a valid number
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Number input "${config.label}" must be a valid number`);
    }

    // Validate min constraint
    if (config.min !== undefined && value < config.min) {
      throw new Error(`Number input "${config.label}" must be at least ${config.min}`);
    }

    // Validate max constraint
    if (config.max !== undefined && value > config.max) {
      throw new Error(`Number input "${config.label}" must be at most ${config.max}`);
    }

    return value;
  }

  /**
   * Validate number input configuration
   * @param config - Number input configuration
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
      const defaultVal = typeof config.defaultValue === 'string' 
        ? parseFloat(config.defaultValue) 
        : config.defaultValue;
      if (typeof defaultVal !== 'number' || isNaN(defaultVal)) {
        return { valid: false, error: 'Default value must be a valid number' };
      }
    }

    if (config.min !== undefined && (typeof config.min !== 'number' || isNaN(config.min))) {
      return { valid: false, error: 'Min must be a valid number' };
    }

    if (config.max !== undefined && (typeof config.max !== 'number' || isNaN(config.max))) {
      return { valid: false, error: 'Max must be a valid number' };
    }

    if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
      return { valid: false, error: 'Min cannot be greater than max' };
    }

    if (config.step !== undefined && (typeof config.step !== 'number' || isNaN(config.step) || config.step <= 0)) {
      return { valid: false, error: 'Step must be a positive number' };
    }

    if (config.required !== undefined && typeof config.required !== 'boolean') {
      return { valid: false, error: 'Required must be a boolean' };
    }

    return { valid: true };
  }

  /**
   * Get output schema for number input
   * @returns Schema indicating number output
   */
  getOutputSchema(): ExtractedSchema {
    return {
      fields: [{
        name: 'value',
        path: 'value',
        type: 'number',
        sample: 0,
      }],
      rootType: 'object',
    };
  }
}
