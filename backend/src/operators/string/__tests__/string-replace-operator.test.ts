import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { StringReplaceOperator } from '../string-replace-operator';

describe('StringReplaceOperator', () => {
  const operator = new StringReplaceOperator();

  describe('execute() - Basic Functionality', () => {
    it('should replace all occurrences by default', async () => {
      const items = [
        { text: 'hello world, hello universe' },
      ];
      
      const result = await operator.execute(items, {
        field: 'text',
        search: 'hello',
        replace: 'hi',
      });
      
      expect(result[0].text).toBe('hi world, hi universe');
    });

    it('should replace only first occurrence when all is false', async () => {
      const items = [
        { text: 'hello world, hello universe' },
      ];
      
      const result = await operator.execute(items, {
        field: 'text',
        search: 'hello',
        replace: 'hi',
        all: false,
      });
      
      expect(result[0].text).toBe('hi world, hello universe');
    });

    it('should handle single object input', async () => {
      const item = { text: 'hello world' };
      
      const result = await operator.execute(item, {
        field: 'text',
        search: 'world',
        replace: 'universe',
      });
      
      expect(result.text).toBe('hello universe');
    });

    it('should preserve other fields', async () => {
      const items = [{ text: 'hello', count: 5, active: true }];
      
      const result = await operator.execute(items, {
        field: 'text',
        search: 'hello',
        replace: 'hi',
      });
      
      expect(result[0]).toEqual({ text: 'hi', count: 5, active: true });
    });
  });

  describe('execute() - Non-existent Fields (Requirement 9.5)', () => {
    it('should skip if target field does not exist', async () => {
      const items = [
        { name: 'Alice', age: 30 },
      ];
      
      const result = await operator.execute(items, {
        field: 'nonExistent',
        search: 'test',
        replace: 'replaced',
      });
      
      // Item should be unchanged
      expect(result[0]).toEqual({ name: 'Alice', age: 30 });
    });

    it('should skip if field value is not a string', async () => {
      const items = [
        { count: 42 },
      ];
      
      const result = await operator.execute(items, {
        field: 'count',
        search: '4',
        replace: '5',
      });
      
      // Item should be unchanged (count is a number)
      expect(result[0]).toEqual({ count: 42 });
    });
  });

  describe('execute() - Nested Fields', () => {
    it('should handle nested fields with dot notation', async () => {
      const items = [
        { user: { bio: 'Hello from Alice' } },
      ];
      
      const result = await operator.execute(items, {
        field: 'user.bio',
        search: 'Hello',
        replace: 'Greetings',
      });
      
      expect(result[0].user.bio).toBe('Greetings from Alice');
    });

    it('should skip non-existent nested fields', async () => {
      const items = [
        { user: { name: 'Alice' } },
      ];
      
      const result = await operator.execute(items, {
        field: 'user.nonExistent',
        search: 'test',
        replace: 'replaced',
      });
      
      expect(result[0]).toEqual({ user: { name: 'Alice' } });
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty array', async () => {
      const result = await operator.execute([], {
        field: 'text',
        search: 'a',
        replace: 'b',
      });
      expect(result).toEqual([]);
    });

    it('should handle null input', async () => {
      const result = await operator.execute(null, {
        field: 'text',
        search: 'a',
        replace: 'b',
      });
      expect(result).toBeNull();
    });

    it('should handle undefined input', async () => {
      const result = await operator.execute(undefined, {
        field: 'text',
        search: 'a',
        replace: 'b',
      });
      expect(result).toBeNull();
    });

    it('should handle empty search string', async () => {
      const items = [{ text: 'hello' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        search: '',
        replace: '-',
      });
      
      // Empty string split creates array of characters, join inserts between them
      expect(result[0].text).toBe('h-e-l-l-o');
    });

    it('should handle empty replace string', async () => {
      const items = [{ text: 'hello world' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        search: ' ',
        replace: '',
      });
      
      expect(result[0].text).toBe('helloworld');
    });

    it('should handle special regex characters in search string', async () => {
      const items = [{ text: 'price: $100.00' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        search: '$100.00',
        replace: '$200.00',
      });
      
      expect(result[0].text).toBe('price: $200.00');
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should reject missing field', () => {
      const result = operator.validate({ search: 'a', replace: 'b' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field is required');
    });

    it('should reject non-string field', () => {
      const result = operator.validate({ field: 123, search: 'a', replace: 'b' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field must be a string');
    });

    it('should reject missing search', () => {
      const result = operator.validate({ field: 'text', replace: 'b' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Search string is required');
    });

    it('should reject non-string search', () => {
      const result = operator.validate({ field: 'text', search: 123, replace: 'b' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Search must be a string');
    });

    it('should reject missing replace', () => {
      const result = operator.validate({ field: 'text', search: 'a' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Replace string is required');
    });

    it('should reject non-string replace', () => {
      const result = operator.validate({ field: 'text', search: 'a', replace: 123 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Replace must be a string');
    });

    it('should reject non-boolean all', () => {
      const result = operator.validate({ field: 'text', search: 'a', replace: 'b', all: 'yes' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('All must be a boolean');
    });

    it('should accept valid config', () => {
      const result = operator.validate({ field: 'text', search: 'a', replace: 'b' });
      expect(result.valid).toBe(true);
    });

    it('should accept valid config with all option', () => {
      const result = operator.validate({ field: 'text', search: 'a', replace: 'b', all: false });
      expect(result.valid).toBe(true);
    });

    it('should accept empty search string', () => {
      const result = operator.validate({ field: 'text', search: '', replace: 'b' });
      expect(result.valid).toBe(true);
    });

    it('should accept empty replace string', () => {
      const result = operator.validate({ field: 'text', search: 'a', replace: '' });
      expect(result.valid).toBe(true);
    });
  });

  describe('getOutputSchema()', () => {
    it('should return null when no input schema', () => {
      const result = operator.getOutputSchema(undefined, {
        field: 'text',
        search: 'a',
        replace: 'b',
      });
      expect(result).toBeNull();
    });

    it('should return input schema unchanged', () => {
      const inputSchema = {
        fields: [
          { name: 'text', path: 'text', type: 'string' as const },
          { name: 'count', path: 'count', type: 'number' as const },
        ],
        rootType: 'array' as const,
      };
      
      const result = operator.getOutputSchema(inputSchema, {
        field: 'text',
        search: 'a',
        replace: 'b',
      });
      
      expect(result).toEqual(inputSchema);
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 14: String Replace Completeness**
     * **Validates: Requirements 9.1**
     * 
     * For any string field and non-empty search string, after replacement,
     * the result SHALL NOT contain any occurrences of the search string
     * (when replacing with a string that doesn't contain the search string).
     */
    it('Property 14: String Replace Completeness - all occurrences are replaced', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a unique search string (using special marker to avoid collisions)
          fc.constantFrom('[[X]]', '[[Y]]', '[[Z]]', '[[W]]', '[[V]]'),
          // Generate a replacement string that doesn't contain the search markers
          fc.string({ minLength: 0, maxLength: 10 }).filter(s => !s.includes('[[')),
          // Generate a base text without the markers
          fc.string({ minLength: 0, maxLength: 50 }).filter(s => !s.includes('[[')),
          // Generate number of times to insert search string (0-5)
          fc.integer({ min: 0, max: 5 }),
          async (search, replace, baseText, insertCount) => {
            // Create text with known occurrences of search string
            let text = baseText;
            for (let i = 0; i < insertCount; i++) {
              text = text + search;
            }

            const items = [{ text }];
            
            const result = await new StringReplaceOperator().execute(items, {
              field: 'text',
              search,
              replace,
              all: true,
            });

            // After replacement, the search string should not appear in the result
            return !result[0].text.includes(search);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: yahoo-pipes-canvas, Property 14: String Replace Completeness**
     * **Validates: Requirements 9.1**
     * 
     * For any item with a string field, the number of occurrences of the replacement
     * string in the output should equal the number of occurrences of the search string
     * in the input (when replacement doesn't contain search and search doesn't overlap).
     */
    it('Property 14: String Replace Completeness - replacement count matches search count', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a unique search string (using special marker)
          fc.constantFrom('[[A]]', '[[B]]', '[[C]]', '[[D]]', '[[E]]'),
          // Generate a unique replacement string
          fc.constantFrom('{{1}}', '{{2}}', '{{3}}', '{{4}}', '{{5}}'),
          // Generate base text without markers
          fc.string({ minLength: 0, maxLength: 30 }).filter(s => !s.includes('[[') && !s.includes('{{')),
          // Generate number of insertions
          fc.integer({ min: 0, max: 5 }),
          async (search, replace, baseText, insertCount) => {
            // Create text with known occurrences
            let text = baseText;
            for (let i = 0; i < insertCount; i++) {
              text = text + search;
            }

            const items = [{ text }];
            const result = await new StringReplaceOperator().execute(items, {
              field: 'text',
              search,
              replace,
              all: true,
            });

            // Count occurrences of replacement in result
            const countOccurrences = (str: string, substr: string) => {
              if (substr.length === 0) return 0;
              return (str.split(substr).length - 1);
            };

            const replaceCount = countOccurrences(result[0].text, replace);
            
            // The number of replacements should equal the number of search strings
            return replaceCount === insertCount;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
