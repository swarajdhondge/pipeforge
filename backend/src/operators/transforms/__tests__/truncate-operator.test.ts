import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TruncateOperator } from '../truncate-operator';

describe('TruncateOperator', () => {
  const operator = new TruncateOperator();

  describe('execute() - Property Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 11: Truncate Count Correctness**
     * **Validates: Requirements 7.2**
     * 
     * For any array and count N:
     * 1. Result length = min(N, input.length)
     * 2. Result items are the first N items from input (in order)
     * 3. When count >= input.length, result equals input
     */
    it('Property 11: Truncate Count Correctness - result length is min(count, input.length)', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(fc.anything(), { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 0, max: 100 }),
          async (items, count) => {
            const result = await operator.execute(items, { count });
            const expectedLength = Math.min(count, items.length);
            return result.length === expectedLength;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 11: Truncate Count Correctness - result items are first N items in order', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer(),
              value: fc.string(),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          fc.integer({ min: 1, max: 50 }),
          async (items, count) => {
            const result = await operator.execute(items, { count });
            
            // Each result item should match the corresponding input item
            for (let i = 0; i < result.length; i++) {
              if (result[i].id !== items[i].id || result[i].value !== items[i].value) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 11: Truncate Count Correctness - count >= length returns all items', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer(),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (items) => {
            // Use count larger than array length
            const count = items.length + 10;
            const result = await operator.execute(items, { count });
            
            // Result should equal input
            return result.length === items.length &&
              result.every((item: any, idx: number) => item.id === items[idx].id);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 11: Truncate Count Correctness - count 0 returns empty array', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(fc.anything(), { minLength: 0, maxLength: 20 }),
          async (items) => {
            const result = await operator.execute(items, { count: 0 });
            return result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty array', async () => {
      const result = await operator.execute([], { count: 5 });
      expect(result).toEqual([]);
    });

    it('should handle null input', async () => {
      const result = await operator.execute(null, { count: 5 });
      expect(result).toEqual([]);
    });

    it('should handle undefined input', async () => {
      const result = await operator.execute(undefined, { count: 5 });
      expect(result).toEqual([]);
    });

    it('should throw error for non-array input', async () => {
      await expect(operator.execute({ id: 1 }, { count: 5 })).rejects.toThrow(
        'Truncate operator requires an array as input'
      );
    });

    it('should keep first N items', async () => {
      const items = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Dave' },
        { id: 5, name: 'Eve' },
      ];
      
      const result = await operator.execute(items, { count: 3 });
      
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should return all items when count > length', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = await operator.execute(items, { count: 10 });
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(items);
    });

    it('should return empty array when count is 0', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = await operator.execute(items, { count: 0 });
      
      expect(result).toEqual([]);
    });

    it('should handle count of 1', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = await operator.execute(items, { count: 1 });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should reject missing count', () => {
      const result = operator.validate({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Count is required');
    });

    it('should reject non-number count', () => {
      const result = operator.validate({ count: '5' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Count must be a number');
    });

    it('should reject non-integer count', () => {
      const result = operator.validate({ count: 5.5 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Count must be an integer');
    });

    it('should reject negative count', () => {
      const result = operator.validate({ count: -1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Count must be non-negative');
    });

    it('should accept valid config with count 0', () => {
      const result = operator.validate({ count: 0 });
      expect(result.valid).toBe(true);
    });

    it('should accept valid config with positive count', () => {
      const result = operator.validate({ count: 10 });
      expect(result.valid).toBe(true);
    });
  });

  describe('getOutputSchema()', () => {
    it('should return input schema unchanged', () => {
      const inputSchema = {
        fields: [
          { name: 'id', path: 'id', type: 'number' as const },
          { name: 'name', path: 'name', type: 'string' as const },
        ],
        rootType: 'array' as const,
        itemCount: 10,
      };
      
      const result = operator.getOutputSchema(inputSchema, { count: 5 });
      
      expect(result).toEqual(inputSchema);
    });

    it('should return null when no input schema', () => {
      const result = operator.getOutputSchema(undefined, { count: 5 });
      expect(result).toBeNull();
    });
  });
});
