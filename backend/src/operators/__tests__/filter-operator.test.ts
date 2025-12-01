import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FilterOperator } from '../filter-operator';
import { EnhancedFilterConfig, FilterRule } from '../../types/operator.types';

describe('FilterOperator', () => {
  const operator = new FilterOperator();

  describe('execute() - Property Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 5: Filter Mode Correctness (Permit/Block)**
     * **Validates: Requirements 5.1**
     * 
     * For any array of items and filter rules:
     * - Permit mode: result contains only items that match the rules
     * - Block mode: result contains only items that do NOT match the rules
     * - Permit and Block results are complementary (union = original, intersection = empty)
     */
    it('Property 5: Filter Mode Correctness - Permit and Block are complementary', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              name: fc.string({ minLength: 1, maxLength: 20 }),
              value: fc.integer({ min: 0, max: 50 }),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          fc.integer({ min: 0, max: 50 }),
          async (items, threshold) => {
            const rules: FilterRule[] = [
              { field: 'value', operator: 'gte', value: threshold }
            ];

            const permitConfig: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'all',
              rules
            };

            const blockConfig: EnhancedFilterConfig = {
              mode: 'block',
              matchMode: 'all',
              rules
            };

            const permitResult = await operator.execute(items, permitConfig);
            const blockResult = await operator.execute(items, blockConfig);

            // Permit + Block should equal original length
            return permitResult.length + blockResult.length === items.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 5: Filter Mode Correctness - Permit includes only matching items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              status: fc.constantFrom('active', 'inactive', 'pending'),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (items) => {
            const config: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'all',
              rules: [{ field: 'status', operator: 'equals', value: 'active' }]
            };

            const result = await operator.execute(items, config);

            // All items in result should have status === 'active'
            return result.every((item: any) => item.status === 'active');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 5: Filter Mode Correctness - Block excludes matching items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              status: fc.constantFrom('active', 'inactive', 'pending'),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (items) => {
            const config: EnhancedFilterConfig = {
              mode: 'block',
              matchMode: 'all',
              rules: [{ field: 'status', operator: 'equals', value: 'active' }]
            };

            const result = await operator.execute(items, config);

            // No items in result should have status === 'active'
            return result.every((item: any) => item.status !== 'active');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: yahoo-pipes-canvas, Property 6: Filter Match Mode Correctness (Any/All)**
     * **Validates: Requirements 5.2, 5.5, 5.6**
     * 
     * For any array of items with multiple filter rules:
     * - 'all' mode: item must match ALL rules (AND logic)
     * - 'any' mode: item must match AT LEAST ONE rule (OR logic)
     * - 'any' result is always >= 'all' result (superset)
     */
    it('Property 6: Filter Match Mode Correctness - any result is superset of all result', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              value: fc.integer({ min: 0, max: 100 }),
              score: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          fc.integer({ min: 20, max: 80 }),
          fc.integer({ min: 20, max: 80 }),
          async (items, valueThreshold, scoreThreshold) => {
            const rules: FilterRule[] = [
              { field: 'value', operator: 'gte', value: valueThreshold },
              { field: 'score', operator: 'gte', value: scoreThreshold }
            ];

            const allConfig: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'all',
              rules
            };

            const anyConfig: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'any',
              rules
            };

            const allResult = await operator.execute(items, allConfig);
            const anyResult = await operator.execute(items, anyConfig);

            // 'any' result should be >= 'all' result (superset)
            return anyResult.length >= allResult.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 6: Filter Match Mode Correctness - all mode requires all rules to match', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              a: fc.integer({ min: 0, max: 10 }),
              b: fc.integer({ min: 0, max: 10 }),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (items) => {
            const config: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'all',
              rules: [
                { field: 'a', operator: 'gte', value: 5 },
                { field: 'b', operator: 'gte', value: 5 }
              ]
            };

            const result = await operator.execute(items, config);

            // All items in result should satisfy BOTH conditions
            return result.every((item: any) => item.a >= 5 && item.b >= 5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 6: Filter Match Mode Correctness - any mode requires at least one rule to match', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              a: fc.integer({ min: 0, max: 10 }),
              b: fc.integer({ min: 0, max: 10 }),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (items) => {
            const config: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'any',
              rules: [
                { field: 'a', operator: 'gte', value: 5 },
                { field: 'b', operator: 'gte', value: 5 }
              ]
            };

            const result = await operator.execute(items, config);

            // All items in result should satisfy AT LEAST ONE condition
            return result.every((item: any) => item.a >= 5 || item.b >= 5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('execute() - Operator Tests', () => {
    it('should handle equals operator', async () => {
      const items = [
        { id: 1, status: 'active' },
        { id: 2, status: 'inactive' },
        { id: 3, status: 'active' },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'status', operator: 'equals', value: 'active' }]
      });

      expect(result).toHaveLength(2);
      expect(result.every((item: any) => item.status === 'active')).toBe(true);
    });

    it('should handle not_equals operator', async () => {
      const items = [
        { id: 1, status: 'active' },
        { id: 2, status: 'inactive' },
        { id: 3, status: 'active' },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'status', operator: 'not_equals', value: 'active' }]
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('inactive');
    });

    it('should handle contains operator', async () => {
      const items = [
        { id: 1, name: 'Hello World' },
        { id: 2, name: 'Goodbye' },
        { id: 3, name: 'World Peace' },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'name', operator: 'contains', value: 'World' }]
      });

      expect(result).toHaveLength(2);
      expect(result.every((item: any) => item.name.includes('World'))).toBe(true);
    });

    it('should handle not_contains operator', async () => {
      const items = [
        { id: 1, name: 'Hello World' },
        { id: 2, name: 'Goodbye' },
        { id: 3, name: 'World Peace' },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'name', operator: 'not_contains', value: 'World' }]
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Goodbye');
    });

    it('should handle matches_regex operator', async () => {
      const items = [
        { id: 1, email: 'test@example.com' },
        { id: 2, email: 'invalid-email' },
        { id: 3, email: 'user@domain.org' },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'email', operator: 'matches_regex', value: '^[^@]+@[^@]+\\.[^@]+$' }]
      });

      expect(result).toHaveLength(2);
      expect(result.every((item: any) => item.email.includes('@'))).toBe(true);
    });

    it('should handle gt operator', async () => {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'value', operator: 'gt', value: 15 }]
      });

      expect(result).toHaveLength(2);
      expect(result.every((item: any) => item.value > 15)).toBe(true);
    });

    it('should handle lt operator', async () => {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'value', operator: 'lt', value: 25 }]
      });

      expect(result).toHaveLength(2);
      expect(result.every((item: any) => item.value < 25)).toBe(true);
    });

    it('should handle gte operator', async () => {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'value', operator: 'gte', value: 20 }]
      });

      expect(result).toHaveLength(2);
      expect(result.every((item: any) => item.value >= 20)).toBe(true);
    });

    it('should handle lte operator', async () => {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'value', operator: 'lte', value: 20 }]
      });

      expect(result).toHaveLength(2);
      expect(result.every((item: any) => item.value <= 20)).toBe(true);
    });
  });

  describe('execute() - Missing Fields', () => {
    it('should skip items with missing fields gracefully', async () => {
      const items = [
        { id: 1, status: 'active' },
        { id: 2 }, // missing status
        { id: 3, status: 'inactive' },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'status', operator: 'equals', value: 'active' }]
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('should handle nested missing fields', async () => {
      const items = [
        { id: 1, user: { name: 'Alice' } },
        { id: 2 }, // missing user
        { id: 3, user: { name: 'Bob' } },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'user.name', operator: 'equals', value: 'Alice' }]
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty array', async () => {
      const result = await operator.execute([], {
        rules: [{ field: 'status', operator: 'equals', value: 'active' }]
      });
      expect(result).toEqual([]);
    });

    it('should return input unchanged when no rules', async () => {
      const items = [{ id: 1 }, { id: 2 }];
      const result = await operator.execute(items, { rules: [] });
      expect(result).toEqual(items);
    });

    it('should throw error for non-array input', async () => {
      await expect(
        operator.execute({ id: 1 }, { rules: [] })
      ).rejects.toThrow(/Filter operator requires array input/);
    });

    it('should handle nested field with dot notation', async () => {
      const items = [
        { user: { profile: { status: 'active' } } },
        { user: { profile: { status: 'inactive' } } },
      ];

      const result = await operator.execute(items, {
        rules: [{ field: 'user.profile.status', operator: 'equals', value: 'active' }]
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('execute() - Backward Compatibility', () => {
    it('should work with legacy FilterConfig (no mode/matchMode)', async () => {
      const items = [
        { id: 1, value: 10 },
        { id: 2, value: 20 },
        { id: 3, value: 30 },
      ];

      // Legacy config without mode and matchMode
      const result = await operator.execute(items, {
        rules: [{ field: 'value', operator: 'gte', value: 20 }]
      });

      // Should default to permit mode with all matchMode
      expect(result).toHaveLength(2);
      expect(result.every((item: any) => item.value >= 20)).toBe(true);
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should reject missing rules', () => {
      const result = operator.validate({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Rules array is required');
    });

    it('should reject non-array rules', () => {
      const result = operator.validate({ rules: 'not-an-array' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Rules must be an array');
    });

    it('should reject invalid mode', () => {
      const result = operator.validate({ mode: 'invalid', rules: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Mode must be either "permit" or "block"');
    });

    it('should reject invalid matchMode', () => {
      const result = operator.validate({ matchMode: 'invalid', rules: [] });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Match mode must be either "any" or "all"');
    });

    it('should reject rule without field', () => {
      const result = operator.validate({
        rules: [{ operator: 'equals', value: 'test' }]
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('field is required');
    });

    it('should reject rule without operator', () => {
      const result = operator.validate({
        rules: [{ field: 'status', value: 'test' }]
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('operator is required');
    });

    it('should reject invalid operator', () => {
      const result = operator.validate({
        rules: [{ field: 'status', operator: 'invalid', value: 'test' }]
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('operator must be one of');
    });

    it('should reject rule without value', () => {
      const result = operator.validate({
        rules: [{ field: 'status', operator: 'equals' }]
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('value is required');
    });

    it('should reject invalid regex pattern', () => {
      const result = operator.validate({
        rules: [{ field: 'email', operator: 'matches_regex', value: '[invalid' }]
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid regex');
    });

    it('should accept valid enhanced config', () => {
      const result = operator.validate({
        mode: 'permit',
        matchMode: 'any',
        rules: [
          { field: 'status', operator: 'equals', value: 'active' },
          { field: 'value', operator: 'gte', value: 10 }
        ]
      });
      expect(result.valid).toBe(true);
    });

    it('should accept all new operators', () => {
      const operators = ['equals', 'not_equals', 'contains', 'not_contains', 'gt', 'lt', 'gte', 'lte', 'matches_regex'];
      
      for (const op of operators) {
        const result = operator.validate({
          rules: [{ field: 'test', operator: op, value: 'test' }]
        });
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('getOutputSchema()', () => {
    it('should return input schema unchanged', () => {
      const inputSchema = {
        fields: [
          { name: 'id', path: 'id', type: 'number' as const },
          { name: 'status', path: 'status', type: 'string' as const },
        ],
        rootType: 'array' as const,
        itemCount: 10,
      };

      const result = operator.getOutputSchema(inputSchema, { rules: [] });

      expect(result).toEqual(inputSchema);
    });

    it('should return null when no input schema', () => {
      const result = operator.getOutputSchema(undefined, { rules: [] });
      expect(result).toBeNull();
    });
  });
});
