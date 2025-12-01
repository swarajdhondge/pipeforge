import { describe, it, expect } from 'vitest';
import { RegexOperator } from '../regex-operator';

describe('RegexOperator', () => {
  const operator = new RegexOperator();

  describe('execute() - Extract Mode', () => {
    it('should extract matching content', async () => {
      const items = [
        { text: 'Price: $100.00' },
        { text: 'Price: $250.50' },
      ];
      
      const result = await operator.execute(items, {
        field: 'text',
        pattern: '\\$([\\d.]+)',
        mode: 'extract',
        group: 1,
      });
      
      expect(result[0].text).toBe('100.00');
      expect(result[1].text).toBe('250.50');
    });

    it('should return full match when group is 0', async () => {
      const items = [{ text: 'Hello World' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        pattern: 'Hello (\\w+)',
        mode: 'extract',
        group: 0,
      });
      
      expect(result[0].text).toBe('Hello World');
    });

    it('should return null when no match', async () => {
      const items = [{ text: 'No numbers here' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        pattern: '\\d+',
        mode: 'extract',
      });
      
      expect(result[0].text).toBeNull();
    });

    it('should handle single object input', async () => {
      const item = { text: 'Email: test@example.com' };
      
      const result = await operator.execute(item, {
        field: 'text',
        pattern: '[\\w.]+@[\\w.]+',
        mode: 'extract',
      });
      
      expect(result.text).toBe('test@example.com');
    });
  });

  describe('execute() - Replace Mode', () => {
    it('should replace matching content', async () => {
      const items = [{ text: 'Hello World' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        pattern: 'World',
        mode: 'replace',
        replacement: 'Universe',
      });
      
      expect(result[0].text).toBe('Hello Universe');
    });

    it('should replace all with g flag', async () => {
      const items = [{ text: 'a1b2c3' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        pattern: '\\d',
        mode: 'replace',
        replacement: 'X',
        flags: 'g',
      });
      
      expect(result[0].text).toBe('aXbXcX');
    });

    it('should support capture groups in replacement', async () => {
      const items = [{ text: 'John Smith' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        pattern: '(\\w+) (\\w+)',
        mode: 'replace',
        replacement: '$2, $1',
      });
      
      expect(result[0].text).toBe('Smith, John');
    });

    it('should handle case-insensitive flag', async () => {
      const items = [{ text: 'HELLO world' }];
      
      const result = await operator.execute(items, {
        field: 'text',
        pattern: 'hello',
        mode: 'replace',
        replacement: 'Hi',
        flags: 'i',
      });
      
      expect(result[0].text).toBe('Hi world');
    });
  });

  describe('execute() - Non-existent Fields', () => {
    it('should skip if target field does not exist', async () => {
      const items = [{ name: 'Alice' }];
      
      const result = await operator.execute(items, {
        field: 'nonExistent',
        pattern: '\\d+',
        mode: 'extract',
      });
      
      expect(result[0]).toEqual({ name: 'Alice' });
    });

    it('should skip if field value is not a string', async () => {
      const items = [{ count: 42 }];
      
      const result = await operator.execute(items, {
        field: 'count',
        pattern: '\\d+',
        mode: 'extract',
      });
      
      expect(result[0]).toEqual({ count: 42 });
    });
  });

  describe('execute() - Nested Fields', () => {
    it('should handle nested fields with dot notation', async () => {
      const items = [{ user: { bio: 'Age: 25 years' } }];
      
      const result = await operator.execute(items, {
        field: 'user.bio',
        pattern: '\\d+',
        mode: 'extract',
      });
      
      expect(result[0].user.bio).toBe('25');
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should handle empty array', async () => {
      const result = await operator.execute([], {
        field: 'text',
        pattern: '\\d+',
        mode: 'extract',
      });
      expect(result).toEqual([]);
    });

    it('should handle null input', async () => {
      const result = await operator.execute(null, {
        field: 'text',
        pattern: '\\d+',
        mode: 'extract',
      });
      expect(result).toBeNull();
    });

    it('should throw error for invalid pattern', async () => {
      const items = [{ text: 'test' }];
      
      await expect(
        operator.execute(items, {
          field: 'text',
          pattern: 'a++',
          mode: 'extract',
        })
      ).rejects.toThrow('Pattern may cause performance issues');
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Configuration is required');
    });

    it('should reject missing field', () => {
      const result = operator.validate({ pattern: '\\d+', mode: 'extract' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Field is required');
    });

    it('should reject missing pattern', () => {
      const result = operator.validate({ field: 'text', mode: 'extract' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Pattern is required');
    });

    it('should reject missing mode', () => {
      const result = operator.validate({ field: 'text', pattern: '\\d+' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Mode is required');
    });

    it('should reject invalid mode', () => {
      const result = operator.validate({ field: 'text', pattern: '\\d+', mode: 'invalid' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Mode must be "extract" or "replace"');
    });

    it('should reject replace mode without replacement', () => {
      const result = operator.validate({ field: 'text', pattern: '\\d+', mode: 'replace' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Replacement is required');
    });

    it('should reject dangerous patterns', () => {
      const result = operator.validate({ field: 'text', pattern: 'a++', mode: 'extract' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Pattern may cause performance issues');
    });

    it('should reject invalid regex syntax', () => {
      const result = operator.validate({ field: 'text', pattern: '[unclosed', mode: 'extract' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid regex');
    });

    it('should accept valid extract config', () => {
      const result = operator.validate({ field: 'text', pattern: '\\d+', mode: 'extract' });
      expect(result.valid).toBe(true);
    });

    it('should accept valid replace config', () => {
      const result = operator.validate({ 
        field: 'text', 
        pattern: '\\d+', 
        mode: 'replace',
        replacement: 'X',
      });
      expect(result.valid).toBe(true);
    });

    it('should accept config with flags', () => {
      const result = operator.validate({ 
        field: 'text', 
        pattern: '\\d+', 
        mode: 'extract',
        flags: 'gi',
      });
      expect(result.valid).toBe(true);
    });

    it('should accept config with group', () => {
      const result = operator.validate({ 
        field: 'text', 
        pattern: '(\\d+)', 
        mode: 'extract',
        group: 1,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('getOutputSchema()', () => {
    it('should return null when no input schema', () => {
      const result = operator.getOutputSchema(undefined, {
        field: 'text',
        pattern: '\\d+',
        mode: 'extract',
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
        pattern: '\\d+',
        mode: 'extract',
      });
      
      expect(result).toEqual(inputSchema);
    });
  });
});
