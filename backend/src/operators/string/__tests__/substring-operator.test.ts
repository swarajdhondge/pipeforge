import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SubstringOperator } from '../substring-operator';

describe('SubstringOperator', () => {
  const operator = new SubstringOperator();

  describe('execute() - Basic Functionality', () => {
    it('should extract substring with start and end', async () => {
      const items = [
        { text: 'Hello World' },
      ];
      
      const result = await operator.execute(items, {
        field: 'text',
        start: 0,
        end: 5,
      });
      
      expect(result[0].text).toBe('Hello');
    });

    it('should extract substring from start to end of string', async () => {
      const items = [
        { text: 'Hello World' },
      ];
      
      const result = await operator.execute(items, {
        field: 'text',
        start: 6,
      });
      
      expect(result[0].text).toBe('World');
    });

    it('should handle single object input', async () => {
      const item = { text: 'Hello World' };
      
      const result = await operator.execute(item, {
        field: 'text',
        start: 0,
        end: 5,
      });
      
      expect(result.text).toBe('Hello');
    });

    it('should preserve other fields', async () => {
      const items = [{ text: 'Hello', count: 5, active: true }];
      
      const result = await operator.execute(items, {
        field: 'text',
        start: 0,
        end: 2,
      });
      
      expect(result[0]).toEqual({ text: 'He', count: 5, active: true });
    });
  });

  describe('execute() - Out-of-Bounds Handling (Requirement 9.3)', () => {
    it('should handle start beyond string length', async () => {
      const items = [{ text: 'Hello' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        start: 100,
      });
      
      // Should return empty string
      expect(result[0].text).toBe('');
    });

    it('should handle end beyond string length', async () => {
      const items = [{ text: 'Hello' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        start: 0,
        end: 100,
      });
      
      // Should return entire string
      expect(result[0].text).toBe('Hello');
    });

    it('should handle start at string length', async () => {
      const items = [{ text: 'Hello' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        start: 5,
      });
      
      expect(result[0].text).toBe('');
    });

    it('should handle empty string', async () => {
      const items = [{ text: '' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        start: 0,
        end: 5,
      });
      
      expect(result[0].text).toBe('');
    });
  });

  describe('execute() - Non-existent Fields', () => {
    it('should skip if target field does not exist', async () => {
      const items = [{ name: 'Alice' }];
      
      const result = await operator.execute(items, {
        field: 'nonExistent',
        start: 0,
        end: 5,
      });
      
      expect(result[0]).toEqual({ name: 'Alice' });
    });

    it('should skip if field value is not a string', async () => {
      const items = [{ count: 42 }];
      
      const result = await operator.execute(items, {
        field: 'count',
        start: 0,
        end: 2,
      });
      
      expect(result[0]).toEqual({ count: 42 });
    });
  });

  describe('execute() - Nested Fields', () => {
    it('should handle nested fields with dot notation', async () => {
      const items = [{ user: { bio: 'Hello World' } }];
      
      const result = await operator.execute(items, {
        field: 'user.bio',
        start: 0,
        end: 5,
      });
      
      expect(result[0].user.bio).toBe('Hello');
    });

    it('should skip non-existent nested fields', async () => {
      const items = [{ user: { name: 'Alice' } }];
      
      const result = await operator.execute(items, {
        field: 'user.nonExistent',
        start: 0,
        end: 5,
      });
      
      expect(result[0]).toEqual({ user: { name: 'Alice' } });
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty array', async () => {
      const result = await operator.execute([], {
        field: 'text',
        start: 0,
        end: 5,
      });
      expect(result).toEqual([]);
    });

    it('should handle null input', async () => {
      const result = await operator.execute(null, {
        field: 'text',
        start: 0,
        end: 5,
      });
      expect(result).toBeNull();
    });

    it('should handle undefined input', async () => {
      const result = await operator.execute(undefined, {
        field: 'text',
        start: 0,
        end: 5,
      });
      expect(result).toBeNull();
    });

    it('should handle start equals end', async () => {
      const items = [{ text: 'Hello' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        start: 2,
        end: 2,
      });
      
      expect(result[0].text).toBe('');
    });

    it('should handle start at 0', async () => {
      const items = [{ text: 'Hello' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        start: 0,
        end: 1,
      });
      
      expect(result[0].text).toBe('H');
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should reject missing field', () => {
      const result = operator.validate({ start: 0 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field is required');
    });

    it('should reject non-string field', () => {
      const result = operator.validate({ field: 123, start: 0 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field must be a string');
    });

    it('should reject missing start', () => {
      const result = operator.validate({ field: 'text' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Start index is required');
    });

    it('should reject non-number start', () => {
      const result = operator.validate({ field: 'text', start: 'abc' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Start must be a number');
    });

    it('should reject non-integer start', () => {
      const result = operator.validate({ field: 'text', start: 1.5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Start must be an integer');
    });

    it('should reject negative start', () => {
      const result = operator.validate({ field: 'text', start: -1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Start must be non-negative');
    });

    it('should reject non-number end', () => {
      const result = operator.validate({ field: 'text', start: 0, end: 'abc' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('End must be a number');
    });

    it('should reject non-integer end', () => {
      const result = operator.validate({ field: 'text', start: 0, end: 5.5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('End must be an integer');
    });

    it('should reject negative end', () => {
      const result = operator.validate({ field: 'text', start: 0, end: -1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('End must be non-negative');
    });

    it('should reject end less than start', () => {
      const result = operator.validate({ field: 'text', start: 5, end: 2 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('End must be greater than or equal to start');
    });

    it('should accept valid config without end', () => {
      const result = operator.validate({ field: 'text', start: 0 });
      expect(result.valid).toBe(true);
    });

    it('should accept valid config with end', () => {
      const result = operator.validate({ field: 'text', start: 0, end: 5 });
      expect(result.valid).toBe(true);
    });

    it('should accept start equals end', () => {
      const result = operator.validate({ field: 'text', start: 5, end: 5 });
      expect(result.valid).toBe(true);
    });
  });

  describe('getOutputSchema()', () => {
    it('should return null when no input schema', () => {
      const result = operator.getOutputSchema(undefined, {
        field: 'text',
        start: 0,
        end: 5,
      });
      expect(result).toBeNull();
    });

    it('should return input schema unchanged', () => {
      const inputSchema = {
        fields: [
          { name: 'text', path: 'text', type: 'string' as const },
        ],
        rootType: 'array' as const,
      };
      
      const result = operator.getOutputSchema(inputSchema, {
        field: 'text',
        start: 0,
        end: 5,
      });
      
      expect(result).toEqual(inputSchema);
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 15: Substring Bounds**
     * **Validates: Requirements 9.3**
     * 
     * For any string and valid start/end indices, the substring length
     * SHALL be at most (end - start) and SHALL never exceed the original string length.
     */
    it('Property 15: Substring Bounds - result length is bounded correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a string
          fc.string({ minLength: 0, maxLength: 100 }),
          // Generate start index
          fc.integer({ min: 0, max: 150 }),
          // Generate end index offset (to ensure end >= start)
          fc.integer({ min: 0, max: 100 }),
          async (text, start, endOffset) => {
            const end = start + endOffset;
            const items = [{ text }];
            
            const result = await new SubstringOperator().execute(items, {
              field: 'text',
              start,
              end,
            });

            const resultText = result[0].text;
            
            // Result length should be at most (end - start)
            const maxExpectedLength = end - start;
            
            // Result length should never exceed original string length
            const lengthBound1 = resultText.length <= maxExpectedLength;
            const lengthBound2 = resultText.length <= text.length;
            
            return lengthBound1 && lengthBound2;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: yahoo-pipes-canvas, Property 15: Substring Bounds**
     * **Validates: Requirements 9.3**
     * 
     * For any string and valid start index (within bounds), the substring
     * SHALL be a contiguous portion of the original string starting at the given index.
     */
    it('Property 15: Substring Bounds - result is a valid substring of original', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a non-empty string
          fc.string({ minLength: 1, maxLength: 100 }),
          async (text) => {
            // Generate valid start within string bounds
            const start = Math.floor(Math.random() * text.length);
            const end = start + Math.floor(Math.random() * (text.length - start + 1));
            
            const items = [{ text }];
            
            const result = await new SubstringOperator().execute(items, {
              field: 'text',
              start,
              end,
            });

            const resultText = result[0].text;
            
            // The result should be found in the original string at the start position
            return text.indexOf(resultText, start) === start || resultText === '';
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: yahoo-pipes-canvas, Property 15: Substring Bounds**
     * **Validates: Requirements 9.3**
     * 
     * For any string, when start is beyond the string length,
     * the result SHALL be an empty string (graceful out-of-bounds handling).
     */
    it('Property 15: Substring Bounds - out-of-bounds start returns empty string', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a string
          fc.string({ minLength: 0, maxLength: 50 }),
          // Generate start index beyond string length
          fc.integer({ min: 51, max: 200 }),
          async (text, start) => {
            const items = [{ text }];
            
            const result = await new SubstringOperator().execute(items, {
              field: 'text',
              start,
            });

            // When start is beyond string length, result should be empty
            return result[0].text === '';
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: yahoo-pipes-canvas, Property 15: Substring Bounds**
     * **Validates: Requirements 9.3**
     * 
     * For any string, when start is 0 and end is at or beyond string length,
     * the result SHALL be the entire original string.
     */
    it('Property 15: Substring Bounds - full string extraction works correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate a string
          fc.string({ minLength: 0, maxLength: 100 }),
          // Generate end index at or beyond string length
          fc.integer({ min: 100, max: 200 }),
          async (text, end) => {
            const items = [{ text }];
            
            const result = await new SubstringOperator().execute(items, {
              field: 'text',
              start: 0,
              end,
            });

            // When extracting from 0 to beyond length, should get entire string
            return result[0].text === text;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
