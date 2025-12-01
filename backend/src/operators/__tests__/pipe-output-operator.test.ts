import { describe, it, expect } from 'vitest';
import { PipeOutputOperator } from '../pipe-output-operator';

describe('PipeOutputOperator', () => {
  const operator = new PipeOutputOperator();

  describe('type and metadata', () => {
    it('should have correct type', () => {
      expect(operator.type).toBe('pipe-output');
    });

    it('should have correct category', () => {
      expect(operator.category).toBe('operators');
    });

    it('should have a description', () => {
      expect(operator.description).toBe('Final output of the pipe');
    });
  });

  describe('execute', () => {
    it('should pass through array input unchanged', async () => {
      const input = [{ id: 1, name: 'test' }, { id: 2, name: 'test2' }];
      const result = await operator.execute(input);
      expect(result).toEqual(input);
      expect(result).toBe(input); // Same reference
    });

    it('should pass through object input unchanged', async () => {
      const input = { id: 1, name: 'test', nested: { value: 42 } };
      const result = await operator.execute(input);
      expect(result).toEqual(input);
      expect(result).toBe(input); // Same reference
    });

    it('should pass through string input unchanged', async () => {
      const input = 'hello world';
      const result = await operator.execute(input);
      expect(result).toBe(input);
    });

    it('should pass through number input unchanged', async () => {
      const input = 42;
      const result = await operator.execute(input);
      expect(result).toBe(input);
    });

    it('should pass through null input unchanged', async () => {
      const result = await operator.execute(null);
      expect(result).toBeNull();
    });

    it('should pass through undefined input unchanged', async () => {
      const result = await operator.execute(undefined);
      expect(result).toBeUndefined();
    });

    it('should pass through empty array unchanged', async () => {
      const input: any[] = [];
      const result = await operator.execute(input);
      expect(result).toEqual([]);
      expect(result).toBe(input);
    });

    it('should ignore config parameter', async () => {
      const input = [1, 2, 3];
      const result = await operator.execute(input, { someConfig: 'value' } as any);
      expect(result).toEqual(input);
    });
  });

  describe('validate', () => {
    it('should always return valid with no config', () => {
      const result = operator.validate(undefined);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should always return valid with empty config', () => {
      const result = operator.validate({});
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should always return valid with any config', () => {
      const result = operator.validate({ random: 'config', value: 123 });
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('getOutputSchema', () => {
    it('should return input schema unchanged', () => {
      const inputSchema = {
        fields: [
          { name: 'id', path: 'id', type: 'number' as const },
          { name: 'name', path: 'name', type: 'string' as const }
        ],
        rootType: 'array' as const,
        itemCount: 10
      };
      const result = operator.getOutputSchema(inputSchema);
      expect(result).toEqual(inputSchema);
      expect(result).toBe(inputSchema); // Same reference
    });

    it('should return null when no input schema', () => {
      const result = operator.getOutputSchema(undefined);
      expect(result).toBeNull();
    });
  });
});
