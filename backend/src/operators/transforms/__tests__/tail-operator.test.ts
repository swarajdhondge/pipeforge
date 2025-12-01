import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TailOperator } from '../tail-operator';

describe('TailOperator', () => {
  const operator = new TailOperator();

  describe('execute() - Property Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 12: Tail Count Correctness**
     * **Validates: Requirements 7.3**
     * 
     * For any array and count N:
     * 1. In tail mode: result length = min(N, input.length), items are last N
     * 2. In skip mode: result length = max(0, input.length - N), items are after first N
     * 3. When count >= input.length: tail returns all, skip returns empty
     */
    it('Property 12: Tail Count Correctness - tail mode result length is min(count, input.length)', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(fc.anything(), { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 0, max: 100 }),
          async (items, count) => {
            const result = await operator.execute(items, { count, skip: false });
            const expectedLength = Math.min(count, items.length);
            return result.length === expectedLength;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 12: Tail Count Correctness - tail mode returns last N items in order', async () => {
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
            const result = await operator.execute(items, { count, skip: false });
            
            // Calculate expected start index
            const startIndex = Math.max(0, items.length - count);
            
            // Each result item should match the corresponding input item from the end
            for (let i = 0; i < result.length; i++) {
              const inputIndex = startIndex + i;
              if (result[i].id !== items[inputIndex].id || 
                  result[i].value !== items[inputIndex].value) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 12: Tail Count Correctness - skip mode result length is max(0, length - count)', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(fc.anything(), { minLength: 0, maxLength: 50 }),
          fc.integer({ min: 0, max: 100 }),
          async (items, count) => {
            const result = await operator.execute(items, { count, skip: true });
            const expectedLength = Math.max(0, items.length - count);
            return result.length === expectedLength;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 12: Tail Count Correctness - skip mode returns items after first N in order', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer(),
              value: fc.string(),
            }),
            { minLength: 1, maxLength: 30 }
          ),
          fc.integer({ min: 0, max: 20 }),
          async (items, count) => {
            const result = await operator.execute(items, { count, skip: true });
            
            // Each result item should match the corresponding input item after skipping
            for (let i = 0; i < result.length; i++) {
              const inputIndex = count + i;
              if (inputIndex >= items.length) return true; // No more items to check
              if (result[i].id !== items[inputIndex].id || 
                  result[i].value !== items[inputIndex].value) {
                return false;
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 12: Tail Count Correctness - count >= length: tail returns all, skip returns empty', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({ id: fc.integer() }),
            { minLength: 0, maxLength: 20 }
          ),
          async (items) => {
            const count = items.length + 10;
            
            const tailResult = await operator.execute(items, { count, skip: false });
            const skipResult = await operator.execute(items, { count, skip: true });
            
            // Tail should return all items
            const tailCorrect = tailResult.length === items.length;
            // Skip should return empty
            const skipCorrect = skipResult.length === 0;
            
            return tailCorrect && skipCorrect;
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
        'Tail operator requires an array as input'
      );
    });

    it('should keep last N items (tail mode)', async () => {
      const items = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Dave' },
        { id: 5, name: 'Eve' },
      ];
      
      const result = await operator.execute(items, { count: 3 });
      
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Dave');
      expect(result[2].name).toBe('Eve');
    });

    it('should skip first N items (skip mode)', async () => {
      const items = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'Dave' },
        { id: 5, name: 'Eve' },
      ];
      
      const result = await operator.execute(items, { count: 2, skip: true });
      
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Dave');
      expect(result[2].name).toBe('Eve');
    });

    it('should return all items when count > length (tail mode)', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = await operator.execute(items, { count: 10 });
      
      expect(result).toHaveLength(2);
      expect(result).toEqual(items);
    });

    it('should return empty array when count > length (skip mode)', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = await operator.execute(items, { count: 10, skip: true });
      
      expect(result).toEqual([]);
    });

    it('should return empty array when count is 0 (tail mode)', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = await operator.execute(items, { count: 0 });
      
      expect(result).toEqual([]);
    });

    it('should return all items when count is 0 (skip mode)', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = await operator.execute(items, { count: 0, skip: true });
      
      expect(result).toHaveLength(3);
      expect(result).toEqual(items);
    });

    it('should handle count of 1 (tail mode)', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = await operator.execute(items, { count: 1 });
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });

    it('should handle count of 1 (skip mode)', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = await operator.execute(items, { count: 1, skip: true });
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(3);
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

    it('should reject non-boolean skip', () => {
      const result = operator.validate({ count: 5, skip: 'true' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Skip must be a boolean');
    });

    it('should accept valid config with count 0', () => {
      const result = operator.validate({ count: 0 });
      expect(result.valid).toBe(true);
    });

    it('should accept valid config with positive count', () => {
      const result = operator.validate({ count: 10 });
      expect(result.valid).toBe(true);
    });

    it('should accept valid config with skip true', () => {
      const result = operator.validate({ count: 5, skip: true });
      expect(result.valid).toBe(true);
    });

    it('should accept valid config with skip false', () => {
      const result = operator.validate({ count: 5, skip: false });
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
