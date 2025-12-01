import axios, { AxiosError } from 'axios';
import Parser from 'rss-parser';
import { BaseOperator } from '../base-operator';
import { FetchRSSConfig, ValidationResult, ExecutionContext, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';
import { getDomainWhitelist } from '../../utils/domain-whitelist';
import { getSchemaExtractor } from '../../services/schema-extractor';
import logger from '../../utils/logger';

/**
 * Normalized RSS item structure
 */
export interface NormalizedRSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

/**
 * FetchRSSOperator - HTTP GET requests to fetch and parse RSS/Atom feeds
 * 
 * Features:
 * - HTTP GET with 30s timeout
 * - URL validation (no localhost/private IPs)
 * - Domain whitelist validation
 * - Secret-based authentication (optional)
 * - RSS 2.0 and Atom feed parsing
 * - Normalization to standard fields: title, link, description, pubDate
 * - Missing optional fields filled with empty string
 * - Schema extraction for downstream operators
 * 
 * Requirements: 3.3, 22.6
 */
export class FetchRSSOperator extends BaseOperator {
  type = 'fetch-rss';
  category: OperatorCategory = 'sources';
  description = 'Fetch and parse RSS/Atom feeds';
  private domainWhitelist = getDomainWhitelist();
  private parser = new Parser();

  /**
   * Execute HTTP GET request and parse RSS/Atom response
   * @param _input - Input data (ignored for source operators)
   * @param config - Fetch RSS configuration
   * @param context - Execution context with secrets service (optional)
   * @returns Normalized RSS items as JSON array
   */
  async execute(_input: any, config: FetchRSSConfig, context?: ExecutionContext): Promise<NormalizedRSSItem[]> {
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
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
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

      // 6. Parse RSS/Atom feed
      const xmlText = response.data;
      return this.parseRSS(xmlText, config);

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
            throw new Error(`The URL returned HTTP 404 (Not Found). Feed does not exist.`);
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

      throw new Error(`Fetch RSS failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parse RSS/Atom XML to normalized JSON array
   * @param xmlText - Raw XML text
   * @param config - RSS configuration
   * @returns Array of normalized RSS items
   */
  async parseRSS(xmlText: string, config: FetchRSSConfig): Promise<NormalizedRSSItem[]> {
    try {
      const feed = await this.parser.parseString(xmlText);
      const maxItems = config.maxItems || 50;
      
      // Normalize items to standard structure
      const items = (feed.items || []).slice(0, maxItems).map(item => this.normalizeItem(item));
      
      return items;
    } catch (error) {
      throw new Error(`RSS parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Normalize an RSS/Atom item to standard structure
   * Uses empty string for missing optional fields (Requirement 22.6)
   */
  normalizeItem(item: any): NormalizedRSSItem {
    return {
      title: item.title || '',
      link: item.link || '',
      description: item.contentSnippet || item.content || item.summary || item.description || '',
      pubDate: item.pubDate || item.isoDate || item.published || item.updated || '',
    };
  }

  /**
   * Validate fetch RSS configuration
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

    if (config.maxItems !== undefined) {
      if (typeof config.maxItems !== 'number' || config.maxItems < 1) {
        return { valid: false, error: 'maxItems must be a positive number' };
      }
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   */
  getOutputSchema(_inputSchema?: ExtractedSchema, _config?: FetchRSSConfig): ExtractedSchema | null {
    // RSS feeds always have the same normalized structure
    return {
      fields: [
        { name: 'title', path: 'title', type: 'string' },
        { name: 'link', path: 'link', type: 'string' },
        { name: 'description', path: 'description', type: 'string' },
        { name: 'pubDate', path: 'pubDate', type: 'date' },
      ],
      rootType: 'array',
    };
  }

  /**
   * Extract schema from parsed RSS data
   */
  extractSchema(data: NormalizedRSSItem[]): ExtractedSchema {
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
    secretRef: NonNullable<FetchRSSConfig['secretRef']>,
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
