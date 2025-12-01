import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import { BaseOperator } from '../base-operator';
import { FetchPageConfig, ValidationResult, ExecutionContext, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';
import { getDomainWhitelist } from '../../utils/domain-whitelist';
import { getSchemaExtractor } from '../../services/schema-extractor';
import logger from '../../utils/logger';

/**
 * FetchPageOperator - HTTP GET requests to fetch HTML and extract data with CSS selectors
 * 
 * Features:
 * - HTTP GET with 30s timeout
 * - URL validation (no localhost/private IPs)
 * - Domain whitelist validation
 * - Secret-based authentication (optional)
 * - HTML parsing with cheerio (no JS execution)
 * - Script and noscript tag stripping for security
 * - CSS selector extraction
 * - Attribute extraction option
 * - Multiple matches support
 * 
 * Requirements: 3.4, 17.4
 */
export class FetchPageOperator extends BaseOperator {
  type = 'fetch-page';
  category: OperatorCategory = 'sources';
  description = 'Fetch HTML and extract data with CSS selectors';
  private domainWhitelist = getDomainWhitelist();

  /**
   * Execute HTTP GET request and extract data using CSS selector
   * @param _input - Input data (ignored for source operators)
   * @param config - Fetch page configuration
   * @param context - Execution context with secrets service (optional)
   * @returns Extracted data (string or array of strings)
   */
  async execute(_input: any, config: FetchPageConfig, context?: ExecutionContext): Promise<string | string[]> {
    // 1. Validate URL format and security
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


    // 3. Build headers
    const headers: Record<string, string> = {
      'User-Agent': 'YahooPipes/1.0',
      'Accept': 'text/html, application/xhtml+xml, */*',
      ...config.headers,
    };

    // 4. Resolve secret if provided
    if (config.secretRef) {
      const secretHeaders = await this.resolveSecret(config.secretRef, context);
      Object.assign(headers, secretHeaders);
    }

    try {
      // 5. Make HTTP request with timeout
      const response = await axios.get(config.url, {
        timeout: 30000,
        headers,
        responseType: 'text',
        validateStatus: (status) => status >= 200 && status < 300,
      });

      // 6. Parse HTML and extract data
      const html = response.data;
      return this.extractFromHTML(html, config);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.code === 'ECONNABORTED') {
          throw new Error('Request timeout: The request took longer than 30 seconds');
        }
        
        if (axiosError.response) {
          const status = axiosError.response.status;
          const statusText = axiosError.response.statusText;
          
          if (status === 401) {
            throw new Error(`The URL returned HTTP 401 (Unauthorized). Authentication required.`);
          }
          if (status === 403) {
            throw new Error(`The URL returned HTTP 403 (Forbidden). Access denied.`);
          }
          if (status === 404) {
            throw new Error(`The URL returned HTTP 404 (Not Found). Page does not exist.`);
          }
          if (status >= 500) {
            throw new Error(`The URL returned HTTP ${status} (${statusText}). Server error.`);
          }
          
          throw new Error(`The URL returned HTTP ${status}: ${statusText}`);
        }
        
        if (axiosError.request) {
          try {
            const domain = new URL(config.url).hostname;
            throw new Error(`Network error: Unable to reach ${domain}`);
          } catch {
            throw new Error('Network error: Unable to reach the server');
          }
        }
      }

      throw new Error(`Fetch page failed: ${(error as Error).message}`);
    }
  }

  /**
   * Extract data from HTML using CSS selector
   * @param html - Raw HTML text
   * @param config - Page configuration
   * @returns Extracted data
   */
  extractFromHTML(html: string, config: FetchPageConfig): string | string[] {
    // Load HTML with cheerio (no JS execution - Requirement 17.4)
    const $ = cheerio.load(html);

    // Remove all script and noscript tags for security (Requirement 17.4)
    $('script').remove();
    $('noscript').remove();

    // Extract elements using CSS selector
    const elements = $(config.selector);
    const multiple = config.multiple !== false; // Default: true

    if (multiple) {
      // Return array of extracted values
      const results: string[] = [];
      elements.each((_, el) => {
        const value = this.extractValue($, el, config.attribute);
        if (value !== null) {
          results.push(value);
        }
      });
      return results;
    } else {
      // Return single value
      const firstElement = elements.first();
      if (firstElement.length === 0) {
        return '';
      }
      return this.extractValue($, firstElement[0], config.attribute) || '';
    }
  }

  /**
   * Extract value from an element
   * @param $ - Cheerio instance
   * @param el - Element to extract from
   * @param attribute - Optional attribute to extract (default: text content)
   * @returns Extracted value
   */
  private extractValue($: cheerio.Root, el: cheerio.Element, attribute?: string): string | null {
    const $el = $(el);
    
    if (attribute) {
      // Extract specific attribute
      const attrValue = $el.attr(attribute);
      return attrValue !== undefined ? attrValue : null;
    } else {
      // Extract text content
      return $el.text().trim();
    }
  }

  /**
   * Validate fetch page configuration
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

    if (!config.selector) {
      return { valid: false, error: 'CSS selector is required' };
    }

    if (typeof config.selector !== 'string') {
      return { valid: false, error: 'CSS selector must be a string' };
    }

    if (config.attribute !== undefined && typeof config.attribute !== 'string') {
      return { valid: false, error: 'Attribute must be a string' };
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   */
  getOutputSchema(_inputSchema?: ExtractedSchema, config?: FetchPageConfig): ExtractedSchema | null {
    // Output depends on multiple flag
    const multiple = config?.multiple !== false;
    
    if (multiple) {
      return {
        fields: [],
        rootType: 'array',
      };
    } else {
      return {
        fields: [],
        rootType: 'object',
      };
    }
  }

  /**
   * Extract schema from extracted data
   */
  extractSchema(data: string | string[]): ExtractedSchema {
    const schemaExtractor = getSchemaExtractor();
    return schemaExtractor.extract(data);
  }

  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') return false;
      if (parsed.hostname.startsWith('10.')) return false;
      if (parsed.hostname.startsWith('172.')) {
        const secondOctet = parseInt(parsed.hostname.split('.')[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return false;
      }
      if (parsed.hostname.startsWith('192.168.')) return false;
      if (parsed.hostname.startsWith('169.254.')) return false;
      if (parsed.hostname === '::1' || parsed.hostname === '[::1]') return false;
      return true;
    } catch {
      return false;
    }
  }

  private async resolveSecret(
    secretRef: NonNullable<FetchPageConfig['secretRef']>,
    context?: ExecutionContext
  ): Promise<Record<string, string>> {
    if (!context || !context.secretsService || !context.userId) {
      throw new Error('Authentication required to use secrets');
    }
    const secretValue = await context.secretsService.decrypt(secretRef.secretId, context.userId);
    let headerValue: string;
    if (secretRef.headerFormat) {
      headerValue = secretRef.headerFormat.replace('{value}', secretValue);
    } else {
      headerValue = secretValue;
    }
    return { [secretRef.headerName]: headerValue };
  }
}
