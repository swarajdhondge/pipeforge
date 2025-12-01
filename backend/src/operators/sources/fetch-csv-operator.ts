import axios, { AxiosError } from 'axios';
import { parse } from 'csv-parse/sync';
import { BaseOperator } from '../base-operator';
import { FetchCSVConfig, ValidationResult, ExecutionContext, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';
import { getDomainWhitelist } from '../../utils/domain-whitelist';
import { getSchemaExtractor } from '../../services/schema-extractor';
import logger from '../../utils/logger';

/**
 * FetchCSVOperator - HTTP GET requests to fetch and parse CSV data
 * 
 * Features:
 * - HTTP GET with 30s timeout
 * - URL validation (no localhost/private IPs)
 * - Domain whitelist validation
 * - Secret-based authentication (optional)
 * - CSV parsing with configurable delimiter
 * - Header row handling
 * - Missing value handling (fills with null)
 * - Schema extraction for downstream operators
 * 
 * Requirements: 3.2, 22.5
 */
export class FetchCSVOperator extends BaseOperator {
  type = 'fetch-csv';
  category: OperatorCategory = 'sources';
  description = 'Fetch and parse CSV data into JSON array';
  private domainWhitelist = getDomainWhitelist();

  /**
   * Execute HTTP GET request and parse CSV response
   * @param _input - Input data (ignored for source operators)
   * @param config - Fetch CSV configuration
   * @param context - Execution context with secrets service (optional)
   * @returns Parsed CSV as JSON array
   */
  async execute(_input: any, config: FetchCSVConfig, context?: ExecutionContext): Promise<any[]> {
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
      'Accept': 'text/csv, text/plain, */*',
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

      // 6. Parse CSV to JSON array
      const csvText = response.data;
      return this.parseCSV(csvText, config);

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
            throw new Error(`The URL returned HTTP 404 (Not Found). Resource does not exist.`);
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

      throw new Error(`Fetch CSV failed: ${(error as Error).message}`);
    }
  }

  /**
   * Parse CSV text to JSON array
   * @param csvText - Raw CSV text
   * @param config - CSV configuration
   * @returns Array of objects
   */
  parseCSV(csvText: string, config: FetchCSVConfig): any[] {
    const delimiter = config.delimiter || ',';
    const hasHeader = config.hasHeader !== false; // Default: true

    try {
      const records = parse(csvText, {
        delimiter,
        columns: hasHeader,
        skip_empty_lines: true,
        relax_column_count: true, // Handle inconsistent columns
        cast: (value) => {
          // Handle empty values
          if (value === '' || value === undefined) {
            return null;
          }
          // Try to cast numbers
          if (!isNaN(Number(value)) && value.trim() !== '') {
            return Number(value);
          }
          // Try to cast booleans
          if (value.toLowerCase() === 'true') return true;
          if (value.toLowerCase() === 'false') return false;
          return value;
        },
      });

      // If no header, convert arrays to objects with column indices as keys
      if (!hasHeader && Array.isArray(records) && records.length > 0) {
        const firstRow = records[0];
        if (Array.isArray(firstRow)) {
          return records.map((row: any[]) => {
            const obj: Record<string, any> = {};
            row.forEach((value, index) => {
              obj[`column_${index}`] = value;
            });
            return obj;
          });
        }
      }

      return records;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Validate fetch CSV configuration
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

    if (config.delimiter && typeof config.delimiter !== 'string') {
      return { valid: false, error: 'Delimiter must be a string' };
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   */
  getOutputSchema(_inputSchema?: ExtractedSchema, _config?: FetchCSVConfig): ExtractedSchema | null {
    return null;
  }

  /**
   * Extract schema from parsed CSV data
   */
  extractSchema(data: any[]): ExtractedSchema {
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
    secretRef: NonNullable<FetchCSVConfig['secretRef']>,
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
