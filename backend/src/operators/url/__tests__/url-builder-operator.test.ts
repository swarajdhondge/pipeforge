import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { URLBuilderOperator } from '../url-builder-operator';

describe('URLBuilderOperator', () => {
  const operator = new URLBuilderOperator();

  describe('execute() - Basic Functionality', () => {
    it('should build URL with no parameters', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/data',
        params: [],
      });

      expect(result.url).toBe('https://api.example.com/data');
      expect(result.input).toBeNull();
    });

    it('should build URL with single parameter', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'q', value: 'test' }],
      });

      expect(result.url).toBe('https://api.example.com/search?q=test');
    });

    it('should build URL with multiple parameters', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [
          { key: 'q', value: 'test' },
          { key: 'page', value: '1' },
          { key: 'limit', value: '10' },
        ],
      });

      const url = new URL(result.url);
      expect(url.searchParams.get('q')).toBe('test');
      expect(url.searchParams.get('page')).toBe('1');
      expect(url.searchParams.get('limit')).toBe('10');
    });

    it('should pass through input data', async () => {
      const input = [{ id: 1, name: 'Test' }];
      const result = await operator.execute(input, {
        baseUrl: 'https://api.example.com/data',
        params: [],
      });

      expect(result.input).toEqual(input);
    });

    it('should handle undefined params', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/data',
      } as any);

      expect(result.url).toBe('https://api.example.com/data');
    });
  });

  describe('execute() - URL Encoding (Requirement 8.3)', () => {
    it('should encode spaces in parameter values', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'q', value: 'hello world' }],
      });

      expect(result.url).toBe('https://api.example.com/search?q=hello+world');
    });

    it('should encode special characters in parameter values', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'q', value: 'a&b=c' }],
      });

      const url = new URL(result.url);
      expect(url.searchParams.get('q')).toBe('a&b=c');
    });

    it('should encode unicode characters', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'q', value: '日本語' }],
      });

      const url = new URL(result.url);
      expect(url.searchParams.get('q')).toBe('日本語');
    });

    it('should encode special URL characters', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'filter', value: 'price>100' }],
      });

      const url = new URL(result.url);
      expect(url.searchParams.get('filter')).toBe('price>100');
    });

    it('should encode parameter keys with special characters', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'filter[name]', value: 'test' }],
      });

      const url = new URL(result.url);
      expect(url.searchParams.get('filter[name]')).toBe('test');
    });
  });

  describe('execute() - User Input Wiring (Requirement 8.2)', () => {
    it('should use value from user input when fromInput is specified', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'q', value: 'default', fromInput: 'searchInput' }],
      }, {
        userInputs: { searchInput: 'user query' },
      });

      expect(result.url).toBe('https://api.example.com/search?q=user+query');
    });

    it('should fall back to value when user input is not provided', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'q', value: 'default', fromInput: 'searchInput' }],
      }, {
        userInputs: {},
      });

      expect(result.url).toBe('https://api.example.com/search?q=default');
    });

    it('should fall back to value when context has no userInputs', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'q', value: 'default', fromInput: 'searchInput' }],
      }, {});

      expect(result.url).toBe('https://api.example.com/search?q=default');
    });

    it('should convert numeric user input to string', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/items',
        params: [{ key: 'page', value: '1', fromInput: 'pageInput' }],
      }, {
        userInputs: { pageInput: 5 },
      });

      expect(result.url).toBe('https://api.example.com/items?page=5');
    });

    it('should mix static and dynamic parameters', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [
          { key: 'q', value: '', fromInput: 'searchInput' },
          { key: 'limit', value: '10' },
        ],
      }, {
        userInputs: { searchInput: 'test' },
      });

      const url = new URL(result.url);
      expect(url.searchParams.get('q')).toBe('test');
      expect(url.searchParams.get('limit')).toBe('10');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty parameter value', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search',
        params: [{ key: 'q', value: '' }],
      });

      expect(result.url).toBe('https://api.example.com/search?q=');
    });

    it('should handle base URL with existing query parameters', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/search?existing=value',
        params: [{ key: 'q', value: 'test' }],
      });

      const url = new URL(result.url);
      expect(url.searchParams.get('existing')).toBe('value');
      expect(url.searchParams.get('q')).toBe('test');
    });

    it('should handle base URL with port', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com:8080/data',
        params: [{ key: 'id', value: '123' }],
      });

      expect(result.url).toBe('https://api.example.com:8080/data?id=123');
    });

    it('should handle base URL with path', async () => {
      const result = await operator.execute(null, {
        baseUrl: 'https://api.example.com/v1/users/search',
        params: [{ key: 'name', value: 'john' }],
      });

      expect(result.url).toBe('https://api.example.com/v1/users/search?name=john');
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should reject missing baseUrl', () => {
      const result = operator.validate({ params: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Base URL is required');
    });

    it('should reject non-string baseUrl', () => {
      const result = operator.validate({ baseUrl: 123, params: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Base URL must be a string');
    });

    it('should reject invalid baseUrl format', () => {
      const result = operator.validate({ baseUrl: 'not-a-url', params: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Base URL must be a valid URL');
    });

    it('should reject non-array params', () => {
      const result = operator.validate({ baseUrl: 'https://example.com', params: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Params must be an array');
    });

    it('should reject param without key', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [{ value: 'test' }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing key');
    });

    it('should reject param with non-string key', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [{ key: 123, value: 'test' }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('key at index 0 must be a string');
    });

    it('should reject param without value or fromInput', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [{ key: 'q' }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must have either value or fromInput');
    });

    it('should reject param with non-string value', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [{ key: 'q', value: 123 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('value at index 0 must be a string');
    });

    it('should reject param with non-string fromInput', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [{ key: 'q', fromInput: 123 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('fromInput at index 0 must be a string');
    });

    it('should accept valid config with no params', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [],
      });
      expect(result.valid).toBe(true);
    });

    it('should accept valid config with params', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [{ key: 'q', value: 'test' }],
      });
      expect(result.valid).toBe(true);
    });

    it('should accept param with only fromInput', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [{ key: 'q', fromInput: 'searchInput' }],
      });
      expect(result.valid).toBe(true);
    });

    it('should accept param with both value and fromInput', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [{ key: 'q', value: 'default', fromInput: 'searchInput' }],
      });
      expect(result.valid).toBe(true);
    });

    it('should accept empty string value', () => {
      const result = operator.validate({
        baseUrl: 'https://example.com',
        params: [{ key: 'q', value: '' }],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('getOutputSchema()', () => {
    it('should return schema with url and input fields', () => {
      const result = operator.getOutputSchema(undefined, {
        baseUrl: 'https://example.com',
        params: [],
      });

      expect(result).toEqual({
        fields: [
          { name: 'url', path: 'url', type: 'string' },
          { name: 'input', path: 'input', type: 'object' },
        ],
        rootType: 'object',
      });
    });

    it('should reflect array input type in schema', () => {
      const inputSchema = {
        fields: [{ name: 'id', path: 'id', type: 'number' as const }],
        rootType: 'array' as const,
      };

      const result = operator.getOutputSchema(inputSchema, {
        baseUrl: 'https://example.com',
        params: [],
      });

      expect(result?.fields[1].type).toBe('array');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 13: URL Encoding Correctness**
     * **Validates: Requirements 8.3**
     * 
     * For any URL Builder parameters, the output URL SHALL have properly encoded
     * query parameters that can be decoded back to the original values.
     */
    it('Property 13: URL Encoding Correctness - parameters are properly encoded and decodable', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid base URL
          fc.constantFrom(
            'https://api.example.com/search',
            'https://api.example.com/data',
            'https://api.example.com/v1/items'
          ),
          // Generate parameter key (alphanumeric)
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s)),
          // Generate parameter value (any printable string)
          fc.string({ minLength: 0, maxLength: 100 }),
          async (baseUrl, key, value) => {
            const result = await new URLBuilderOperator().execute(null, {
              baseUrl,
              params: [{ key, value }],
            });

            // Parse the resulting URL
            const url = new URL(result.url);
            
            // The decoded parameter value should match the original
            const decodedValue = url.searchParams.get(key);
            return decodedValue === value;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: yahoo-pipes-canvas, Property 13: URL Encoding Correctness**
     * **Validates: Requirements 8.3**
     * 
     * For any set of parameters, all parameters should be present in the output URL.
     */
    it('Property 13: URL Encoding Correctness - all parameters are included', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate 1-5 parameters
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z][a-z0-9]*$/.test(s)),
              value: fc.string({ minLength: 0, maxLength: 50 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (params: Array<{ key: string; value: string }>) => {
            // Ensure unique keys
            const uniqueParams = params.filter((p, i, arr) => 
              arr.findIndex(x => x.key === p.key) === i
            );

            const result = await new URLBuilderOperator().execute(null, {
              baseUrl: 'https://api.example.com/search',
              params: uniqueParams,
            });

            const url = new URL(result.url);
            
            // All parameters should be present
            return uniqueParams.every(p => url.searchParams.has(p.key));
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: yahoo-pipes-canvas, Property 13: URL Encoding Correctness**
     * **Validates: Requirements 8.3**
     * 
     * The output URL should always be a valid URL that can be parsed.
     */
    it('Property 13: URL Encoding Correctness - output is always a valid URL', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various parameter values including special characters
          fc.array(
            fc.record({
              key: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z][a-z0-9]*$/.test(s)),
              value: fc.oneof(
                fc.string({ minLength: 0, maxLength: 50 }),
                fc.constantFrom('a&b', 'x=y', 'hello world', '日本語', '<script>', 'a/b/c')
              ),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          async (params: Array<{ key: string; value: string }>) => {
            const result = await new URLBuilderOperator().execute(null, {
              baseUrl: 'https://api.example.com/search',
              params,
            });

            // Should not throw when parsing
            try {
              new URL(result.url);
              return true;
            } catch {
              return false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
