import { BaseOperator } from '../base-operator';
import { URLBuilderConfig, ValidationResult, OperatorCategory, ExecutionContext } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * URLBuilderOperator - Build URLs with query parameters
 * 
 * Features:
 * - Build URL from base URL and query parameters
 * - Properly encode query parameters (Requirements 8.3)
 * - Support wiring from user input operators (Requirements 8.2)
 * - Pass-through input data with constructed URL
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
export class URLBuilderOperator extends BaseOperator {
  type = 'url-builder';
  category: OperatorCategory = 'url';
  description = 'Build URLs with query parameters';

  /**
   * Execute URL builder operation
   * @param input - Input data (passed through)
   * @param config - URL builder configuration
   * @param context - Execution context (for user input values)
   * @returns Object containing the constructed URL and original input
   */
  async execute(input: any, config: URLBuilderConfig, context?: ExecutionContext): Promise<any> {
    // Build the URL with parameters
    const url = this.buildUrl(config, context);

    // Return the constructed URL along with any input data
    return {
      url,
      input: input ?? null,
    };
  }

  /**
   * Validate URL builder configuration
   * @param config - URL builder configuration
   * @returns Validation result
   */
  validate(config: any): ValidationResult {
    if (!config) {
      return { valid: false, error: 'Configuration is required' };
    }

    if (!config.baseUrl) {
      return { valid: false, error: 'Base URL is required' };
    }

    if (typeof config.baseUrl !== 'string') {
      return { valid: false, error: 'Base URL must be a string' };
    }

    // Validate base URL format
    try {
      new URL(config.baseUrl);
    } catch {
      return { valid: false, error: 'Base URL must be a valid URL' };
    }

    // Validate params if provided
    if (config.params !== undefined) {
      if (!Array.isArray(config.params)) {
        return { valid: false, error: 'Params must be an array' };
      }

      for (let i = 0; i < config.params.length; i++) {
        const param = config.params[i];
        
        if (!param || typeof param !== 'object') {
          return { valid: false, error: `Param at index ${i} must be an object` };
        }

        if (!param.key) {
          return { valid: false, error: `Param at index ${i} is missing key` };
        }

        if (typeof param.key !== 'string') {
          return { valid: false, error: `Param key at index ${i} must be a string` };
        }

        // Value can be empty string, but must be defined unless fromInput is specified
        if (param.value === undefined && !param.fromInput) {
          return { valid: false, error: `Param at index ${i} must have either value or fromInput` };
        }

        if (param.value !== undefined && typeof param.value !== 'string') {
          return { valid: false, error: `Param value at index ${i} must be a string` };
        }

        if (param.fromInput !== undefined && typeof param.fromInput !== 'string') {
          return { valid: false, error: `Param fromInput at index ${i} must be a string` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * @param inputSchema - Schema from upstream operator
   * @returns Schema with url field added
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: URLBuilderConfig): ExtractedSchema | null {
    // URL builder outputs an object with url and input fields
    return {
      fields: [
        { name: 'url', path: 'url', type: 'string' },
        { name: 'input', path: 'input', type: inputSchema?.rootType === 'array' ? 'array' : 'object' },
      ],
      rootType: 'object',
    };
  }

  /**
   * Build URL from base URL and parameters
   * @param config - URL builder configuration
   * @param context - Execution context for user input values
   * @returns Constructed URL string
   */
  private buildUrl(config: URLBuilderConfig, context?: ExecutionContext): string {
    const url = new URL(config.baseUrl);

    if (config.params && config.params.length > 0) {
      for (const param of config.params) {
        let value: string;

        if (param.fromInput && context?.userInputs) {
          // Get value from user input operator
          const inputValue = context.userInputs[param.fromInput];
          value = inputValue !== undefined ? String(inputValue) : (param.value ?? '');
        } else {
          value = param.value ?? '';
        }

        // URLSearchParams automatically encodes the key and value
        url.searchParams.append(param.key, value);
      }
    }

    return url.toString();
  }
}
