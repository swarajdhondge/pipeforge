import { describe, it, expect } from 'vitest';
import { RenameOperator } from '../rename-operator';

describe('RenameOperator', () => {
  const operator = new RenameOperator();

  describe('execute() - Basic Functionality', () => {
    it('should rename a single field', async () => {
      const items = [
        { oldName: 'Alice', age: 30 },
        { oldName: 'Bob', age: 25 },
      ];
      
      const result = await operator.execute(items, {
        mappings: [{ source: 'oldName', target: 'name' }],
      });
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ name: 'Alice', age: 30 });
      expect(result[1]).toEqual({ name: 'Bob', age: 25 });
    });

    it('should rename multiple fields', async () => {
      const items = [
        { firstName: 'Alice', lastName: 'Smith', years: 30 },
      ];
      
      const result = await operator.execute(items, {
        mappings: [
          { source: 'firstName', target: 'first' },
          { source: 'lastName', target: 'last' },
          { source: 'years', target: 'age' },
        ],
      });
      
      expect(result[0]).toEqual({ first: 'Alice', last: 'Smith', age: 30 });
    });

    it('should handle single object input', async () => {
      const item = { oldName: 'Alice', age: 30 };
      
      const result = await operator.execute(item, {
        mappings: [{ source: 'oldName', target: 'name' }],
      });
      
      expect(result).toEqual({ name: 'Alice', age: 30 });
    });

    it('should preserve fields not in mappings', async () => {
      const items = [{ a: 1, b: 2, c: 3 }];
      
      const result = await operator.execute(items, {
        mappings: [{ source: 'a', target: 'x' }],
      });
      
      expect(result[0]).toEqual({ x: 1, b: 2, c: 3 });
    });
  });

  describe('execute() - Non-existent Source Fields (Requirement 7.5)', () => {
    it('should skip non-existent source fields without error', async () => {
      const items = [
        { name: 'Alice', age: 30 },
      ];
      
      const result = await operator.execute(items, {
        mappings: [
          { source: 'nonExistent', target: 'newField' },
          { source: 'name', target: 'fullName' },
        ],
      });
      
      // Should not have newField, should have renamed name to fullName
      expect(result[0]).toEqual({ fullName: 'Alice', age: 30 });
      expect(result[0]).not.toHaveProperty('nonExistent');
      expect(result[0]).not.toHaveProperty('newField');
    });

    it('should handle all non-existent source fields', async () => {
      const items = [{ name: 'Alice' }];
      
      const result = await operator.execute(items, {
        mappings: [
          { source: 'field1', target: 'newField1' },
          { source: 'field2', target: 'newField2' },
        ],
      });
      
      // Original item should be unchanged
      expect(result[0]).toEqual({ name: 'Alice' });
    });
  });

  describe('execute() - Nested Fields', () => {
    it('should rename nested source fields', async () => {
      const items = [
        { user: { firstName: 'Alice', lastName: 'Smith' }, age: 30 },
      ];
      
      const result = await operator.execute(items, {
        mappings: [{ source: 'user.firstName', target: 'name' }],
      });
      
      expect(result[0].name).toBe('Alice');
      expect(result[0].user.lastName).toBe('Smith');
      expect(result[0].user).not.toHaveProperty('firstName');
    });

    it('should rename to nested target fields', async () => {
      const items = [
        { name: 'Alice', age: 30 },
      ];
      
      const result = await operator.execute(items, {
        mappings: [{ source: 'name', target: 'user.name' }],
      });
      
      expect(result[0].user.name).toBe('Alice');
      expect(result[0]).not.toHaveProperty('name');
    });

    it('should skip non-existent nested source fields', async () => {
      const items = [
        { user: { name: 'Alice' } },
      ];
      
      const result = await operator.execute(items, {
        mappings: [{ source: 'user.nonExistent', target: 'newField' }],
      });
      
      expect(result[0]).toEqual({ user: { name: 'Alice' } });
      expect(result[0]).not.toHaveProperty('newField');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty array', async () => {
      const result = await operator.execute([], {
        mappings: [{ source: 'a', target: 'b' }],
      });
      expect(result).toEqual([]);
    });

    it('should handle null input', async () => {
      const result = await operator.execute(null, {
        mappings: [{ source: 'a', target: 'b' }],
      });
      expect(result).toBeNull();
    });

    it('should handle undefined input', async () => {
      const result = await operator.execute(undefined, {
        mappings: [{ source: 'a', target: 'b' }],
      });
      expect(result).toBeNull();
    });

    it('should return input unchanged when no mappings', async () => {
      const items = [{ a: 1, b: 2 }];
      const result = await operator.execute(items, { mappings: [] });
      expect(result).toEqual(items);
    });

    it('should handle renaming to same name (no-op)', async () => {
      const items = [{ name: 'Alice' }];
      const result = await operator.execute(items, {
        mappings: [{ source: 'name', target: 'name' }],
      });
      expect(result[0]).toEqual({ name: 'Alice' });
    });

    it('should handle null field values', async () => {
      const items = [{ name: null, age: 30 }];
      const result = await operator.execute(items, {
        mappings: [{ source: 'name', target: 'fullName' }],
      });
      expect(result[0]).toEqual({ fullName: null, age: 30 });
    });

    it('should handle object field values', async () => {
      const items = [{ data: { nested: 'value' } }];
      const result = await operator.execute(items, {
        mappings: [{ source: 'data', target: 'info' }],
      });
      expect(result[0]).toEqual({ info: { nested: 'value' } });
    });

    it('should handle array field values', async () => {
      const items = [{ tags: ['a', 'b', 'c'] }];
      const result = await operator.execute(items, {
        mappings: [{ source: 'tags', target: 'labels' }],
      });
      expect(result[0]).toEqual({ labels: ['a', 'b', 'c'] });
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should reject missing mappings', () => {
      const result = operator.validate({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Mappings array is required');
    });

    it('should reject non-array mappings', () => {
      const result = operator.validate({ mappings: 'not-array' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Mappings must be an array');
    });

    it('should reject mapping without source', () => {
      const result = operator.validate({
        mappings: [{ target: 'newName' }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('source is required');
    });

    it('should reject mapping with non-string source', () => {
      const result = operator.validate({
        mappings: [{ source: 123, target: 'newName' }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('source must be a string');
    });

    it('should reject mapping without target', () => {
      const result = operator.validate({
        mappings: [{ source: 'oldName' }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('target is required');
    });

    it('should reject mapping with non-string target', () => {
      const result = operator.validate({
        mappings: [{ source: 'oldName', target: 123 }],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('target must be a string');
    });

    it('should accept valid config with empty mappings', () => {
      const result = operator.validate({ mappings: [] });
      expect(result.valid).toBe(true);
    });

    it('should accept valid config with mappings', () => {
      const result = operator.validate({
        mappings: [
          { source: 'oldName', target: 'newName' },
          { source: 'user.firstName', target: 'name' },
        ],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('getOutputSchema()', () => {
    it('should return null when no input schema', () => {
      const result = operator.getOutputSchema(undefined, {
        mappings: [{ source: 'a', target: 'b' }],
      });
      expect(result).toBeNull();
    });

    it('should return input schema when no mappings', () => {
      const inputSchema = {
        fields: [
          { name: 'id', path: 'id', type: 'number' as const },
        ],
        rootType: 'array' as const,
      };
      
      const result = operator.getOutputSchema(inputSchema, { mappings: [] });
      expect(result).toEqual(inputSchema);
    });

    it('should rename fields in schema', () => {
      const inputSchema = {
        fields: [
          { name: 'oldName', path: 'oldName', type: 'string' as const },
          { name: 'age', path: 'age', type: 'number' as const },
        ],
        rootType: 'array' as const,
      };
      
      const result = operator.getOutputSchema(inputSchema, {
        mappings: [{ source: 'oldName', target: 'name' }],
      });
      
      expect(result?.fields[0].name).toBe('name');
      expect(result?.fields[0].path).toBe('name');
      expect(result?.fields[1].name).toBe('age');
    });
  });
});
