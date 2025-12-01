import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SortOperator } from '../sort-operator';
import { SortConfig } from '../../types/operator.types';

describe('SortOperator', () => {
  const operator = new SortOperator();

  describe('execute() - Property Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 8: Date Sort Correctness**
     * **Validates: Requirements 6.3**
     * 
     * For any array of items with date fields:
     * - Sorting by date field in ascending order should place earlier dates first
     * - Sorting by date field in descending order should place later dates first
     * - Date strings should be parsed and compared by date value, not string value
     */
    it('Property 8: Date Sort Correctness - dates are sorted by date value, not string value', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') })
              .filter(d => !isNaN(d.getTime())), // Filter out invalid dates
            { minLength: 2, maxLength: 20 }
          ),
          fc.constantFrom('asc', 'desc'),
          async (dates, direction) => {
            // Create items with ISO date strings
            const items = dates.map((date, index) => ({
              id: index,
              createdAt: date.toISOString(),
            }));

            const config: SortConfig = {
              field: 'createdAt',
              direction: direction as 'asc' | 'desc',
            };

            const result = await operator.execute(items, config);

            // Verify the result is sorted correctly by date value
            for (let i = 0; i < result.length - 1; i++) {
              const dateA = new Date(result[i].createdAt);
              const dateB = new Date(result[i + 1].createdAt);
              
              if (direction === 'asc') {
                expect(dateA.getTime()).toBeLessThanOrEqual(dateB.getTime());
              } else {
                expect(dateA.getTime()).toBeGreaterThanOrEqual(dateB.getTime());
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });


    it('Property 8: Date Sort Correctness - various date formats are handled', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.date({ min: new Date('2000-01-01'), max: new Date('2030-12-31') })
              .filter(d => !isNaN(d.getTime())), // Filter out invalid dates
            { minLength: 2, maxLength: 10 }
          ),
          async (dates) => {
            // Create items with YYYY-MM-DD format
            const items = dates.map((date, index) => ({
              id: index,
              date: date.toISOString().split('T')[0], // YYYY-MM-DD format
            }));

            const config: SortConfig = {
              field: 'date',
              direction: 'asc',
            };

            const result = await operator.execute(items, config);

            // Verify the result is sorted correctly
            for (let i = 0; i < result.length - 1; i++) {
              const dateA = new Date(result[i].date);
              const dateB = new Date(result[i + 1].date);
              expect(dateA.getTime()).toBeLessThanOrEqual(dateB.getTime());
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: yahoo-pipes-canvas, Property 7: Numeric Sort Correctness**
     * **Validates: Requirements 6.4**
     * 
     * For any array of items with numeric fields:
     * - Sorting should compare values numerically, not as strings
     * - "10" should come after "9", not before "2"
     */
    it('Property 7: Numeric Sort Correctness - numbers are sorted numerically, not as strings', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.integer({ min: 0, max: 1000 }),
            { minLength: 2, maxLength: 20 }
          ),
          fc.constantFrom('asc', 'desc'),
          async (numbers, direction) => {
            const items = numbers.map((num, index) => ({
              id: index,
              value: num,
            }));

            const config: SortConfig = {
              field: 'value',
              direction: direction as 'asc' | 'desc',
            };

            const result = await operator.execute(items, config);

            // Verify the result is sorted correctly numerically
            for (let i = 0; i < result.length - 1; i++) {
              if (direction === 'asc') {
                expect(result[i].value).toBeLessThanOrEqual(result[i + 1].value);
              } else {
                expect(result[i].value).toBeGreaterThanOrEqual(result[i + 1].value);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 7: Numeric Sort Correctness - string numbers are sorted numerically', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.integer({ min: 0, max: 1000 }),
            { minLength: 2, maxLength: 20 }
          ),
          fc.constantFrom('asc', 'desc'),
          async (numbers, direction) => {
            // Create items with string numbers
            const items = numbers.map((num, index) => ({
              id: index,
              value: String(num),
            }));

            const config: SortConfig = {
              field: 'value',
              direction: direction as 'asc' | 'desc',
            };

            const result = await operator.execute(items, config);

            // Verify the result is sorted correctly numerically (not as strings)
            for (let i = 0; i < result.length - 1; i++) {
              const numA = Number(result[i].value);
              const numB = Number(result[i + 1].value);
              
              if (direction === 'asc') {
                expect(numA).toBeLessThanOrEqual(numB);
              } else {
                expect(numA).toBeGreaterThanOrEqual(numB);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: yahoo-pipes-canvas, Property 9: Missing Sort Field Handling**
     * **Validates: Requirements 6.5**
     * 
     * For any array of items where some items are missing the sort field:
     * - Items with the field should be sorted normally
     * - Items without the field should be placed at the end
     */
    it('Property 9: Missing Sort Field Handling - items without field are placed at end', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              value: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
            }),
            { minLength: 2, maxLength: 20 }
          ),
          fc.constantFrom('asc', 'desc'),
          async (items, direction) => {
            const config: SortConfig = {
              field: 'value',
              direction: direction as 'asc' | 'desc',
            };

            const result = await operator.execute(items, config);

            // Find the first item without the field
            const firstMissingIndex = result.findIndex(
              (item: any) => item.value === undefined || item.value === null
            );

            // If there are items without the field, they should all be at the end
            if (firstMissingIndex !== -1) {
              // All items after firstMissingIndex should also be missing the field
              for (let i = firstMissingIndex; i < result.length; i++) {
                expect(result[i].value === undefined || result[i].value === null).toBe(true);
              }

              // All items before firstMissingIndex should have the field
              for (let i = 0; i < firstMissingIndex; i++) {
                expect(result[i].value !== undefined && result[i].value !== null).toBe(true);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 9: Missing Sort Field Handling - items with field are sorted correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              value: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
            }),
            { minLength: 2, maxLength: 20 }
          ),
          fc.constantFrom('asc', 'desc'),
          async (items, direction) => {
            const config: SortConfig = {
              field: 'value',
              direction: direction as 'asc' | 'desc',
            };

            const result = await operator.execute(items, config);

            // Get items that have the field
            const itemsWithField = result.filter(
              (item: any) => item.value !== undefined && item.value !== null
            );

            // Verify items with field are sorted correctly
            for (let i = 0; i < itemsWithField.length - 1; i++) {
              if (direction === 'asc') {
                expect(itemsWithField[i].value).toBeLessThanOrEqual(itemsWithField[i + 1].value);
              } else {
                expect(itemsWithField[i].value).toBeGreaterThanOrEqual(itemsWithField[i + 1].value);
              }
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  describe('execute() - Unit Tests', () => {
    it('should sort numbers in ascending order', async () => {
      const items = [
        { id: 1, value: 30 },
        { id: 2, value: 10 },
        { id: 3, value: 20 },
      ];

      const result = await operator.execute(items, {
        field: 'value',
        direction: 'asc',
      });

      expect(result[0].value).toBe(10);
      expect(result[1].value).toBe(20);
      expect(result[2].value).toBe(30);
    });

    it('should sort numbers in descending order', async () => {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 30 },
        { id: 3, value: 20 },
      ];

      const result = await operator.execute(items, {
        field: 'value',
        direction: 'desc',
      });

      expect(result[0].value).toBe(30);
      expect(result[1].value).toBe(20);
      expect(result[2].value).toBe(10);
    });

    it('should sort strings alphabetically', async () => {
      const items = [
        { id: 1, name: 'Charlie' },
        { id: 2, name: 'Alice' },
        { id: 3, name: 'Bob' },
      ];

      const result = await operator.execute(items, {
        field: 'name',
        direction: 'asc',
      });

      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should sort ISO date strings by date value', async () => {
      const items = [
        { id: 1, date: '2023-12-01T00:00:00Z' },
        { id: 2, date: '2023-01-15T00:00:00Z' },
        { id: 3, date: '2023-06-20T00:00:00Z' },
      ];

      const result = await operator.execute(items, {
        field: 'date',
        direction: 'asc',
      });

      expect(result[0].date).toBe('2023-01-15T00:00:00Z');
      expect(result[1].date).toBe('2023-06-20T00:00:00Z');
      expect(result[2].date).toBe('2023-12-01T00:00:00Z');
    });

    it('should sort YYYY-MM-DD date strings by date value', async () => {
      const items = [
        { id: 1, date: '2023-12-01' },
        { id: 2, date: '2023-01-15' },
        { id: 3, date: '2023-06-20' },
      ];

      const result = await operator.execute(items, {
        field: 'date',
        direction: 'asc',
      });

      expect(result[0].date).toBe('2023-01-15');
      expect(result[1].date).toBe('2023-06-20');
      expect(result[2].date).toBe('2023-12-01');
    });

    it('should sort string numbers numerically', async () => {
      const items = [
        { id: 1, value: '100' },
        { id: 2, value: '9' },
        { id: 3, value: '20' },
      ];

      const result = await operator.execute(items, {
        field: 'value',
        direction: 'asc',
      });

      // Should be 9, 20, 100 (numeric order), not 100, 20, 9 (string order)
      expect(result[0].value).toBe('9');
      expect(result[1].value).toBe('20');
      expect(result[2].value).toBe('100');
    });

    it('should place items with missing field at end (ascending)', async () => {
      const items = [
        { id: 1, value: 20 },
        { id: 2 }, // missing value
        { id: 3, value: 10 },
        { id: 4, value: null }, // null value
      ];

      const result = await operator.execute(items, {
        field: 'value',
        direction: 'asc',
      });

      expect(result[0].value).toBe(10);
      expect(result[1].value).toBe(20);
      // Items without field should be at end
      expect(result[2].value === undefined || result[2].value === null).toBe(true);
      expect(result[3].value === undefined || result[3].value === null).toBe(true);
    });

    it('should place items with missing field at end (descending)', async () => {
      const items = [
        { id: 1, value: 20 },
        { id: 2 }, // missing value
        { id: 3, value: 10 },
      ];

      const result = await operator.execute(items, {
        field: 'value',
        direction: 'desc',
      });

      expect(result[0].value).toBe(20);
      expect(result[1].value).toBe(10);
      expect(result[2].value).toBe(undefined);
    });

    it('should handle nested fields', async () => {
      const items = [
        { id: 1, user: { score: 30 } },
        { id: 2, user: { score: 10 } },
        { id: 3, user: { score: 20 } },
      ];

      const result = await operator.execute(items, {
        field: 'user.score',
        direction: 'asc',
      });

      expect(result[0].user.score).toBe(10);
      expect(result[1].user.score).toBe(20);
      expect(result[2].user.score).toBe(30);
    });

    it('should handle empty array', async () => {
      const result = await operator.execute([], {
        field: 'value',
        direction: 'asc',
      });

      expect(result).toEqual([]);
    });

    it('should throw error for non-array input', async () => {
      await expect(
        operator.execute({ id: 1 }, { field: 'value', direction: 'asc' })
      ).rejects.toThrow(/Sort operator requires array input/);
    });

    it('should not mutate original array', async () => {
      const items = [
        { id: 1, value: 30 },
        { id: 2, value: 10 },
        { id: 3, value: 20 },
      ];
      const originalOrder = items.map(i => i.value);

      await operator.execute(items, {
        field: 'value',
        direction: 'asc',
      });

      // Original array should be unchanged
      expect(items.map(i => i.value)).toEqual(originalOrder);
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should reject missing field', () => {
      const result = operator.validate({ direction: 'asc' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field is required');
    });

    it('should reject non-string field', () => {
      const result = operator.validate({ field: 123, direction: 'asc' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field must be a string');
    });

    it('should reject missing direction', () => {
      const result = operator.validate({ field: 'value' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Direction is required');
    });

    it('should reject invalid direction', () => {
      const result = operator.validate({ field: 'value', direction: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Direction must be "asc" or "desc"');
    });

    it('should accept valid config', () => {
      const result = operator.validate({ field: 'value', direction: 'asc' });
      expect(result.valid).toBe(true);
    });
  });

  describe('getOutputSchema()', () => {
    it('should return input schema unchanged', () => {
      const inputSchema = {
        fields: [
          { name: 'id', path: 'id', type: 'number' as const },
          { name: 'value', path: 'value', type: 'number' as const },
        ],
        rootType: 'array' as const,
        itemCount: 10,
      };

      const result = operator.getOutputSchema(inputSchema, { field: 'value', direction: 'asc' });

      expect(result).toEqual(inputSchema);
    });

    it('should return null when no input schema', () => {
      const result = operator.getOutputSchema(undefined, { field: 'value', direction: 'asc' });
      expect(result).toBeNull();
    });
  });
});
