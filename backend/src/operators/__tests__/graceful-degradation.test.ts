import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { FilterOperator } from '../filter-operator';
import { SortOperator } from '../sort-operator';
import { TransformOperator } from '../transform-operator';
import { UniqueOperator } from '../transforms/unique-operator';
import { TruncateOperator } from '../transforms/truncate-operator';
import { TailOperator } from '../transforms/tail-operator';
import { RenameOperator } from '../transforms/rename-operator';
import { StringReplaceOperator } from '../string/string-replace-operator';
import { SubstringOperator } from '../string/substring-operator';
import type { EnhancedFilterConfig, FilterRule, SortConfig, TransformConfig, UniqueConfig, TruncateConfig, TailConfig, RenameConfig, StringReplaceConfig, SubstringConfig } from '../../types/operator.types';

describe('Graceful Degradation - Property Tests', () => {
  /**
   * **Feature: yahoo-pipes-canvas, Property 26: Graceful Empty Array Handling**
   * **Validates: Requirements 22.1, 22.2**
   * 
   * For any operator receiving an empty array as input, the operator SHALL 
   * pass an empty array downstream (not fail).
   */
  describe('Property 26: Graceful Empty Array Handling', () => {
    const filterOperator = new FilterOperator();
    const sortOperator = new SortOperator();
    const transformOperator = new TransformOperator();
    const uniqueOperator = new UniqueOperator();
    const truncateOperator = new TruncateOperator();
    const tailOperator = new TailOperator();
    const renameOperator = new RenameOperator();
    const stringReplaceOperator = new StringReplaceOperator();
    const substringOperator = new SubstringOperator();

    it('FilterOperator should pass empty array downstream without failing', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random filter configurations
          fc.record({
            mode: fc.constantFrom('permit', 'block') as fc.Arbitrary<'permit' | 'block'>,
            matchMode: fc.constantFrom('any', 'all') as fc.Arbitrary<'any' | 'all'>,
            rules: fc.array(
              fc.record({
                field: fc.string({ minLength: 1, maxLength: 10 }),
                operator: fc.constantFrom('equals', 'not_equals', 'contains', 'gt', 'lt') as fc.Arbitrary<FilterRule['operator']>,
                value: fc.oneof(fc.string(), fc.integer()),
              }),
              { minLength: 0, maxLength: 3 }
            ),
          }),
          async (config: EnhancedFilterConfig) => {
            const result = await filterOperator.execute([], config);
            // Should return empty array, not throw
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('SortOperator should pass empty array downstream without failing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            field: fc.string({ minLength: 1, maxLength: 10 }),
            direction: fc.constantFrom('asc', 'desc') as fc.Arbitrary<'asc' | 'desc'>,
          }),
          async (config: SortConfig) => {
            const result = await sortOperator.execute([], config);
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('TransformOperator should pass empty array downstream without failing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mappings: fc.array(
              fc.record({
                source: fc.string({ minLength: 1, maxLength: 10 }),
                target: fc.string({ minLength: 1, maxLength: 10 }),
              }),
              { minLength: 0, maxLength: 3 }
            ),
          }),
          async (config: TransformConfig) => {
            const result = await transformOperator.execute([], config);
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('UniqueOperator should pass empty array downstream without failing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            field: fc.string({ minLength: 1, maxLength: 10 }),
          }),
          async (config: UniqueConfig) => {
            const result = await uniqueOperator.execute([], config);
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('TruncateOperator should pass empty array downstream without failing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            count: fc.integer({ min: 1, max: 100 }),
          }),
          async (config: TruncateConfig) => {
            const result = await truncateOperator.execute([], config);
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('TailOperator should pass empty array downstream without failing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            count: fc.integer({ min: 1, max: 100 }),
            skip: fc.boolean(),
          }),
          async (config: TailConfig) => {
            const result = await tailOperator.execute([], config);
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('RenameOperator should pass empty array downstream without failing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            mappings: fc.array(
              fc.record({
                source: fc.string({ minLength: 1, maxLength: 10 }),
                target: fc.string({ minLength: 1, maxLength: 10 }),
              }),
              { minLength: 0, maxLength: 3 }
            ),
          }),
          async (config: RenameConfig) => {
            const result = await renameOperator.execute([], config);
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('StringReplaceOperator should pass empty array downstream without failing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            field: fc.string({ minLength: 1, maxLength: 10 }),
            search: fc.string({ minLength: 1, maxLength: 10 }),
            replace: fc.string({ minLength: 0, maxLength: 10 }),
            all: fc.boolean(),
          }),
          async (config: StringReplaceConfig) => {
            const result = await stringReplaceOperator.execute([], config);
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('SubstringOperator should pass empty array downstream without failing', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            field: fc.string({ minLength: 1, maxLength: 10 }),
            start: fc.integer({ min: 0, max: 100 }),
            end: fc.option(fc.integer({ min: 0, max: 100 }), { nil: undefined }),
          }),
          async (config: SubstringConfig) => {
            const result = await substringOperator.execute([], config);
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Filter with zero matches should return empty array (not fail)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 100 }),
              value: fc.integer({ min: 0, max: 50 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            // Filter that matches nothing (value > 1000 when max is 50)
            const config: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'all',
              rules: [{ field: 'value', operator: 'gt', value: 1000 }],
            };
            const result = await filterOperator.execute(items, config);
            // Should return empty array, not throw
            return Array.isArray(result) && result.length === 0;
          }
        ),
        { numRuns: 100 }
      );
    });
  });


  /**
   * **Feature: yahoo-pipes-canvas, Property 27: Graceful Missing Field Handling**
   * **Validates: Requirements 22.3, 22.4**
   * 
   * For any transform or filter operation on items missing the target field, 
   * the operation SHALL skip gracefully without failing.
   */
  describe('Property 27: Graceful Missing Field Handling', () => {
    const filterOperator = new FilterOperator();
    const sortOperator = new SortOperator();
    const transformOperator = new TransformOperator();
    const uniqueOperator = new UniqueOperator();
    const renameOperator = new RenameOperator();
    const stringReplaceOperator = new StringReplaceOperator();
    const substringOperator = new SubstringOperator();

    it('FilterOperator should skip items with missing fields gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate items where some have the field and some don't
          fc.array(
            fc.oneof(
              fc.record({ id: fc.integer(), status: fc.string() }),
              fc.record({ id: fc.integer() }) // Missing 'status' field
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            const config: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'all',
              rules: [{ field: 'status', operator: 'equals', value: 'active' }],
            };
            
            // Should not throw, should return array
            const result = await filterOperator.execute(items, config);
            return Array.isArray(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('FilterOperator should treat missing fields as non-matching in permit mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.record({ id: fc.integer(), value: fc.integer({ min: 0, max: 100 }) }),
              fc.record({ id: fc.integer() }) // Missing 'value' field
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            const config: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'all',
              rules: [{ field: 'value', operator: 'gte', value: 50 }],
            };
            
            const result = await filterOperator.execute(items, config);
            
            // Items with missing 'value' field should NOT be in result
            // All items in result should have 'value' field with value >= 50
            return result.every((item: any) => 
              item.value !== undefined && item.value >= 50
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('SortOperator should place items with missing sort field at end', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.record({ id: fc.integer(), score: fc.integer({ min: 0, max: 100 }) }),
              fc.record({ id: fc.integer() }) // Missing 'score' field
            ),
            { minLength: 2, maxLength: 20 }
          ),
          async (items) => {
            const config: SortConfig = { field: 'score', direction: 'asc' };
            const result = await sortOperator.execute(items, config);
            
            // Find the first item without 'score' field
            const firstMissingIndex = result.findIndex((item: any) => item.score === undefined);
            
            // If there are items with missing field, they should all be at the end
            if (firstMissingIndex !== -1) {
              // All items after firstMissingIndex should also be missing the field
              for (let i = firstMissingIndex; i < result.length; i++) {
                if (result[i].score !== undefined) {
                  return false;
                }
              }
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('TransformOperator should set null for missing source fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.record({ id: fc.integer(), name: fc.string() }),
              fc.record({ id: fc.integer() }) // Missing 'name' field
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            const config: TransformConfig = {
              mappings: [
                { source: 'id', target: 'userId' },
                { source: 'name', target: 'userName' },
              ],
            };
            
            const result = await transformOperator.execute(items, config);
            
            // Should not throw, all items should have both target fields
            return result.every((item: any) => 
              'userId' in item && 'userName' in item
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('UniqueOperator should handle items with missing dedupe field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.record({ id: fc.integer(), category: fc.string() }),
              fc.record({ id: fc.integer() }) // Missing 'category' field
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            const config: UniqueConfig = { field: 'category' };
            
            // Should not throw
            const result = await uniqueOperator.execute(items, config);
            return Array.isArray(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('RenameOperator should skip non-existent source fields without error', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.record({ id: fc.integer(), oldName: fc.string() }),
              fc.record({ id: fc.integer() }) // Missing 'oldName' field
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            const config: RenameConfig = {
              mappings: [{ source: 'oldName', target: 'newName' }],
            };
            
            const result = await renameOperator.execute(items, config);
            
            // Should not throw
            // Items that had 'oldName' should now have 'newName'
            // Items that didn't have 'oldName' should remain unchanged
            return Array.isArray(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('StringReplaceOperator should skip items with missing target field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.record({ id: fc.integer(), text: fc.string() }),
              fc.record({ id: fc.integer() }) // Missing 'text' field
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            const config: StringReplaceConfig = {
              field: 'text',
              search: 'old',
              replace: 'new',
              all: true,
            };
            
            const result = await stringReplaceOperator.execute(items, config);
            
            // Should not throw, items without 'text' should be unchanged
            return Array.isArray(result) && result.length === items.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('SubstringOperator should skip items with missing target field', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.record({ id: fc.integer(), content: fc.string({ minLength: 5 }) }),
              fc.record({ id: fc.integer() }) // Missing 'content' field
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            const config: SubstringConfig = {
              field: 'content',
              start: 0,
              end: 3,
            };
            
            const result = await substringOperator.execute(items, config);
            
            // Should not throw, items without 'content' should be unchanged
            return Array.isArray(result) && result.length === items.length;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Nested missing fields should be handled gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.oneof(
              fc.record({ 
                id: fc.integer(), 
                user: fc.record({ name: fc.string() }) 
              }),
              fc.record({ id: fc.integer() }), // Missing 'user' entirely
              fc.record({ id: fc.integer(), user: fc.record({}) }) // Missing 'user.name'
            ),
            { minLength: 1, maxLength: 20 }
          ),
          async (items) => {
            const config: EnhancedFilterConfig = {
              mode: 'permit',
              matchMode: 'all',
              rules: [{ field: 'user.name', operator: 'contains', value: 'test' }],
            };
            
            // Should not throw
            const result = await filterOperator.execute(items, config);
            return Array.isArray(result);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
