import axios, { AxiosError } from 'axios';
import { BaseOperator } from './base-operator';
import { FetchConfig, ValidationResult, ExecutionContext, OperatorCategory } from '../types/operator.types';
import { ExtractedSchema } from '../types/schema.types';
import { getDomainWhitelist } from '../utils/domain-whitelist';
import logger from '../utils/logger';

/**
 * FetchOperator - HTTP GET requests to fetch data
 * 
 * Features:
 * - HTTP GET with 30s timeout
 * - URL validation (no localhost/private IPs)
 * - Domain whitelist validation
 * - Secret-based authentication (optional)
 * - JSON parsing
 * - Error handling
 * 
 * Requirements: 3.1, 3.2, 3.3, 4.2, 4.3, 6
 */
export class FetchOperator extends BaseOperator {
  type = 'fetch';
  category: OperatorCategory = 'sources';
  description = 'Fetch and parse JSON data from a URL';
  private domainWhitelist = getDomainWhitelist();

  /**
   * Execute HTTP GET request
   * @param _input - Input data (ignored for fetch)
   * @param config - Fetch configuration with URL and optional secret
   * @param context - Execution context with secrets service (optional)
   * @returns Parsed JSON response
   */
  async execute(_input: any, config: FetchConfig, context?: ExecutionContext): Promise<any> {
    // 1. Validate URL format and security (localhost/private IPs)
    if (!this.isValidUrl(config.url)) {
      throw new Error('Invalid URL: localhost and private IPs are not allowed');
    }

    // 2. Validate domain whitelist
    if (!this.domainWhitelist.isAllowed(config.url)) {
      const errorMessage = this.domainWhitelist.getErrorMessage(config.url);
      logger.warn('Domain whitelist violation', {
        url: config.url,
        userId: context?.userId,
        action: 'domain_rejected',
      });
      throw new Error(errorMessage);
    }

    // 3. Build headers (including secret if provided)
    const headers: Record<string, string> = {
      'User-Agent': 'YahooPipes/1.0',
      'Accept': 'application/json',
      ...config.headers,  // Custom headers from config
    };

    // 4. Resolve secret if provided
    if (config.secretRef) {
      const secretHeaders = await this.resolveSecret(config.secretRef, context);
      Object.assign(headers, secretHeaders);
    }

    try {
      // 5. Make HTTP request with timeout
      const response = await axios.get(config.url, {
        timeout: 30000, // 30 seconds
        headers,
        validateStatus: (status) => status >= 200 && status < 300,
      });

      // Check if response is JSON (Requirement 16.2)
      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Invalid response: Expected JSON but received ${contentType || 'unknown'}`);
      }

      // Response is automatically parsed as JSON by axios
      return response.data;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Timeout error (Requirement 16.3)
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timeout: The request took longer than 30 seconds');
        }
        
        if (axiosError.response) {
          const status = axiosError.response.status;
          const statusText = axiosError.response.statusText;
          const contentType = axiosError.response.headers['content-type'] || 'unknown';
          
          // Check if response is not JSON (Requirement 16.2)
          if (!contentType.includes('application/json')) {
            throw new Error(`Invalid response: Expected JSON but received ${contentType}`);
          }
          
          // Provide more helpful error messages for common HTTP errors
          if (status === 401) {
            throw new Error(
              `The URL returned HTTP 401 (Unauthorized). The API at "${config.url}" requires authentication. ` +
              `You may need to add an API key or authentication header.`
            );
          }
          if (status === 403) {
            throw new Error(
              `The URL returned HTTP 403 (Forbidden). Access to "${config.url}" is denied. ` +
              `Check your API credentials or permissions.`
            );
          }
          if (status === 404) {
            throw new Error(
              `The URL returned HTTP 404 (Not Found). The resource at "${config.url}" does not exist.`
            );
          }
          if (status === 429) {
            throw new Error(
              `The URL returned HTTP 429 (Too Many Requests). The API at "${config.url}" is rate limiting requests.`
            );
          }
          if (status >= 500) {
            throw new Error(
              `The URL returned HTTP ${status} (${statusText}). The server at "${config.url}" encountered an error.`
            );
          }
          
          throw new Error(
            `The URL returned HTTP ${status}: ${statusText}`
          );
        }
        
        // Network error (Requirement 16.1)
        if (axiosError.request) {
          try {
            const domain = new URL(config.url).hostname;
            throw new Error(`Network error: Unable to reach ${domain}`);
          } catch (urlError) {
            throw new Error('Network error: Unable to reach the server');
          }
        }
      }

      throw new Error(`Fetch failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate fetch configuration
   * @param config - Fetch configuration
   * @returns Validation result
   */
  validate(config: any): ValidationResult {
    if (!config) {
      return { valid: false, error: 'Configuration is required' };
    }

    if (!config.url) {
      return { valid: false, error: 'URL is required' };
    }

    if (typeof config.url !== 'string') {
      return { valid: false, error: 'URL must be a string' };
    }

    if (!this.isValidUrl(config.url)) {
      return { 
        valid: false, 
        error: 'Invalid URL format or localhost/private IPs are not allowed' 
      };
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * For fetch operators, schema is determined at runtime via preview
   * @param _inputSchema - Not used for source operators
   * @param _config - Fetch configuration
   * @returns null (schema determined at runtime)
   */
  getOutputSchema(_inputSchema?: ExtractedSchema, _config?: FetchConfig): ExtractedSchema | null {
    // Source operators determine schema at runtime via preview
    // Schema is extracted from actual fetched data
    return null;
  }

  /**
   * Validate URL format and security
   * @param url - URL to validate
   * @returns True if valid, false otherwise
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Only allow HTTP and HTTPS
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return false;
      }

      // Block localhost
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return false;
      }

      // Block private IP ranges
      // 10.0.0.0/8
      if (parsed.hostname.startsWith('10.')) {
        return false;
      }

      // 172.16.0.0/12
      if (parsed.hostname.startsWith('172.')) {
        const secondOctet = parseInt(parsed.hostname.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) {
          return false;
        }
      }

      // 192.168.0.0/16
      if (parsed.hostname.startsWith('192.168.')) {
        return false;
      }

      // Block link-local addresses (169.254.0.0/16)
      if (parsed.hostname.startsWith('169.254.')) {
        return false;
      }

      // Block IPv6 localhost
      if (parsed.hostname === '::1' || parsed.hostname === '[::1]') {
        return false;
      }

      return true;

    } catch {
      return false;
    }
  }

  /**
   * Resolve secret and build authentication headers
   * @param secretRef - Secret reference configuration
   * @param context - Execution context with secrets service
   * @returns Headers object with authentication
   */
  private async resolveSecret(
    secretRef: NonNullable<FetchConfig['secretRef']>,
    context?: ExecutionContext
  ): Promise<Record<string, string>> {
    // Validate context is provided
    if (!context || !context.secretsService || !context.userId) {
      throw new Error('Authentication required to use secrets');
    }

    // Decrypt the secret
    const secretValue = await context.secretsService.decrypt(secretRef.secretId, context.userId);

    // Format the header value
    let headerValue: string;
    if (secretRef.headerFormat) {
      // Replace {value} placeholder with actual secret
      headerValue = secretRef.headerFormat.replace('{value}', secretValue);
    } else {
      // Default: use secret value directly
      headerValue = secretValue;
    }

    // Return headers object
    return {
      [secretRef.headerName]: headerValue,
    };
  }
}
