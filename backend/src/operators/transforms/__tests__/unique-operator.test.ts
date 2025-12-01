import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { UniqueOperator } from '../unique-operator';

describe('UniqueOperator', () => {
  const operator = new UniqueOperator();

  describe('execute() - Property Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 10: Unique Deduplication**
     * **Validates: Requirements 7.1**
     * 
     * For any array of items with a specified field, after deduplication:
     * 1. All remaining items have unique values for the specified field
     * 2. The first occurrence of each duplicate is preserved
     * 3. The result length is <= input length
     */
    it('Property 10: Unique Deduplication - all result items have unique field values', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10 }), // Limited range to ensure duplicates
              name: fc.string({ minLength: 1, maxLength: 20 }),
              value: fc.integer(),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (items) => {
            const result = await operator.execute(items, { field: 'id' });
            
            // All field values in result should be unique
            const fieldValues = result.map((item: any) => item.id);
            const uniqueValues = new Set(fieldValues);
            
            return fieldValues.length === uniqueValues.size;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 10: Unique Deduplication - first occurrence is preserved', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 5 }), // Very limited range to ensure duplicates
              order: fc.integer({ min: 0, max: 1000 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            // Add index to track original order
            const indexedItems = items.map((item, idx) => ({ ...item, originalIndex: idx }));
            
            const result = await operator.execute(indexedItems, { field: 'id' });
            
            // For each unique id in result, verify it's the first occurrence from input
            for (const resultItem of result) {
              const firstOccurrenceIndex = indexedItems.findIndex(
                (item) => item.id === resultItem.id
              );
              if (resultItem.originalIndex !== firstOccurrenceIndex) {
                return false;
              }
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 10: Unique Deduplication - result length <= input length', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10 }),
              data: fc.string(),
            }),
            { minLength: 0, maxLength: 30 }
          ),
          async (items) => {
            const result = await operator.execute(items, { field: 'id' });
            return result.length <= items.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 10: Unique Deduplication - result length equals unique value count', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10 }),
              name: fc.string(),
            }),
            { minLength: 0, maxLength: 30 }
          ),
          async (items) => {
            const result = await operator.execute(items, { field: 'id' });
            
            // Count unique ids in input
            const uniqueIds = new Set(items.map((item) => item.id));
            
            return result.length === uniqueIds.size;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty array', async () => {
      const result = await operator.execute([], { field: 'id' });
      expect(result).toEqual([]);
    });

    it('should handle null input', async () => {
      const result = await operator.execute(null, { field: 'id' });
      expect(result).toEqual([]);
    });

    it('should handle undefined input', async () => {
      const result = await operator.execute(undefined, { field: 'id' });
      expect(result).toEqual([]);
    });

    it('should throw error for non-array input', async () => {
      await expect(operator.execute({ id: 1 }, { field: 'id' })).rejects.toThrow(
        'Unique operator requires an array as input'
      );
    });

    it('should handle nested field with dot notation', async () => {
      const items = [
        { user: { id: 1 }, name: 'Alice' },
        { user: { id: 2 }, name: 'Bob' },
        { user: { id: 1 }, name: 'Charlie' },
      ];
      
      const result = await operator.execute(items, { field: 'user.id' });
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
    });

    it('should handle missing field values (treats as same)', async () => {
      const items = [
        { id: 1, name: 'Alice' },
        { name: 'Bob' }, // missing id
        { name: 'Charlie' }, // missing id
        { id: 2, name: 'Dave' },
      ];
      
      const result = await operator.execute(items, { field: 'id' });
      
      // Should keep first occurrence of undefined
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob'); // First with missing id
      expect(result[2].name).toBe('Dave');
    });

    it('should handle null field values', async () => {
      const items = [
        { id: null, name: 'Alice' },
        { id: null, name: 'Bob' },
        { id: 1, name: 'Charlie' },
      ];
      
      const result = await operator.execute(items, { field: 'id' });
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Charlie');
    });

    it('should handle object field values', async () => {
      const items = [
        { id: { a: 1, b: 2 }, name: 'Alice' },
        { id: { a: 1, b: 2 }, name: 'Bob' },
        { id: { a: 1, b: 3 }, name: 'Charlie' },
      ];
      
      const result = await operator.execute(items, { field: 'id' });
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Charlie');
    });

    it('should handle array field values', async () => {
      const items = [
        { tags: ['a', 'b'], name: 'Alice' },
        { tags: ['a', 'b'], name: 'Bob' },
        { tags: ['a', 'c'], name: 'Charlie' },
      ];
      
      const result = await operator.execute(items, { field: 'tags' });
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Charlie');
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should reject missing field', () => {
      const result = operator.validate({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field is required');
    });

    it('should reject non-string field', () => {
      const result = operator.validate({ field: 123 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field must be a string');
    });

    it('should accept valid config', () => {
      const result = operator.validate({ field: 'id' });
      expect(result.valid).toBe(true);
    });

    it('should accept dot notation field', () => {
      const result = operator.validate({ field: 'user.profile.id' });
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
      
      const result = operator.getOutputSchema(inputSchema, { field: 'id' });
      
      expect(result).toEqual(inputSchema);
    });

    it('should return null when no input schema', () => {
      const result = operator.getOutputSchema(undefined, { field: 'id' });
      expect(result).toBeNull();
    });
  });
});
