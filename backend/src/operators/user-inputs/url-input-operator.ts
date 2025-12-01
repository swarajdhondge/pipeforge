import { BaseOperator } from '../base-operator';
import { URLInputConfig, ValidationResult, ExecutionContext, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * URLInputOperator - URL input parameter for pipes
 * 
 * Features:
 * - Validates URL format
 * - Applies security checks (no localhost/private IPs)
 * - Value can be provided at execution time via userInputs
 * 
 * Requirements: 4.3
 */
export class URLInputOperator extends BaseOperator {
  type = 'url-input';
  category: OperatorCategory = 'user-inputs';
  description = 'URL input with validation';

  /**
   * Execute URL input operator
   * Returns the configured URL or the URL provided at execution time
   * @param _input - Input data (ignored for user input operators)
   * @param config - URL input configuration
   * @param context - Execution context with userInputs
   * @returns The validated URL
   */
  async execute(_input: any, config: URLInputConfig, context?: ExecutionContext): Promise<string> {
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
      throw new Error(`URL input "${config.label}" is required`);
    }

    // If no value provided and not required, return empty string
    if (value === undefined || value === null || value.trim() === '') {
      return '';
    }

    // Validate URL format
    if (!this.isValidUrlFormat(value)) {
      throw new Error(`URL input "${config.label}" has invalid URL format`);
    }

    // Apply security checks
    if (!this.isSecureUrl(value)) {
      throw new Error(`URL input "${config.label}": localhost and private IPs are not allowed`);
    }

    return value;
  }

  /**
   * Validate URL input configuration
   * @param config - URL input configuration
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
      
      // Validate default URL format if provided
      if (config.defaultValue.trim() !== '' && !this.isValidUrlFormat(config.defaultValue)) {
        return { valid: false, error: 'Default value must be a valid URL' };
      }
      
      // Validate default URL security if provided
      if (config.defaultValue.trim() !== '' && !this.isSecureUrl(config.defaultValue)) {
        return { valid: false, error: 'Default value cannot be localhost or private IP' };
      }
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
   * Get output schema for URL input
   * @returns Schema indicating string output
   */
  getOutputSchema(): ExtractedSchema {
    return {
      fields: [{
        name: 'value',
        path: 'value',
        type: 'string',
        sample: 'https://example.com',
      }],
      rootType: 'object',
    };
  }

  /**
   * Validate URL format
   * @param url - URL to validate
   * @returns True if valid URL format
   */
  private isValidUrlFormat(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Only allow HTTP and HTTPS protocols
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Check if URL is secure (not localhost or private IP)
   * @param url - URL to check
   * @returns True if URL is secure
   */
  private isSecureUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return false;
      }

      // Block private IP ranges
      // 10.0.0.0/8
      if (hostname.startsWith('10.')) {
        return false;
      }

      // 172.16.0.0/12
      if (hostname.startsWith('172.')) {
        const secondOctet = parseInt(hostname.split('.')[1], 10);
        if (!isNaN(secondOctet) && secondOctet >= 16 && secondOctet <= 31) {
          return false;
        }
      }

      // 192.168.0.0/16
      if (hostname.startsWith('192.168.')) {
        return false;
      }

      // Block link-local addresses (169.254.0.0/16)
      if (hostname.startsWith('169.254.')) {
        return false;
      }

      // Block IPv6 localhost
      if (hostname === '::1' || hostname === '[::1]') {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
