import { BaseOperator } from '../base-operator';
import { TextInputConfig, ValidationResult, ExecutionContext, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * TextInputOperator - Text input parameter for pipes
 * 
 * Features:
 * - Simple pass-through of configured value
 * - Validates required field if set
 * - Value can be provided at execution time via userInputs
 * 
 * Requirements: 4.1
 */
export class TextInputOperator extends BaseOperator {
  type = 'text-input';
  category: OperatorCategory = 'user-inputs';
  description = 'Text input parameter for the pipe';

  /**
   * Execute text input operator
   * Returns the configured value or the value provided at execution time
   * @param _input - Input data (ignored for user input operators)
   * @param config - Text input configuration
   * @param context - Execution context with userInputs
   * @returns The text value
   */
  async execute(_input: any, config: TextInputConfig, context?: ExecutionContext): Promise<string> {
    // Get value from execution context (userInputs) or fall back to defaultValue
    let value: string | undefined;
    
    // Check if value was provided at execution time via userInputs
    // userInputs is keyed by node ID, but we receive config here
    // The pipe executor should inject the value into config or context
    if (context?.userInputs && config.label && context.userInputs[config.label] !== undefined) {
      value = String(context.userInputs[config.label]);
    } else {
      value = config.defaultValue;
    }

    // Validate required field
    if (config.required && (value === undefined || value === null || value.trim() === '')) {
      throw new Error(`Text input "${config.label}" is required`);
    }

    // Return the value (or empty string if not required and not provided)
    return value ?? '';
  }

  /**
   * Validate text input configuration
   * @param config - Text input configuration
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

    if (config.defaultValue !== undefined && typeof config.defaultValue !== 'string') {
      return { valid: false, error: 'Default value must be a string' };
    }

    if (config.placeholder !== undefined && typeof config.placeholder !== 'string') {
      return { valid: false, error: 'Placeholder must be a string' };
    }

    if (config.required !== undefined && typeof config.required !== 'boolean') {
      return { valid: false, error: 'Required must be a boolean' };
    }

    return { valid: true };
  }

  /**
   * Get output schema for text input
   * @returns Schema indicating string output
   */
  getOutputSchema(): ExtractedSchema {
    return {
      fields: [{
        name: 'value',
        path: 'value',
        type: 'string',
        sample: '',
      }],
      rootType: 'object',
    };
  }
}
