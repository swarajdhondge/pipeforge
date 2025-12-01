import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { NumberInputOperator } from '../number-input-operator';

describe('NumberInputOperator', () => {
  const operator = new NumberInputOperator();

  describe('execute() - Property Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property: Number Input Constraint Validation**
     * **Validates: Requirements 4.2**
     * 
     * For any number input with min/max constraints, the operator should:
     * - Accept values within the range [min, max]
     * - Reject values below min with appropriate error
     * - Reject values above max with appropriate error
     */
    it('Property: Number Input Constraint Validation - values within range are accepted', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -1000, max: 1000 }), // min constraint
          fc.integer({ min: 0, max: 500 }),      // range size
          fc.integer({ min: 0, max: 500 }),      // offset within range
          async (min, rangeSize, offset) => {
            const max = min + rangeSize;
            // Generate a value within the range
            const value = min + (offset % (rangeSize + 1));
            
            const config = {
              label: 'testNumber',
              min,
              max,
            };
            
            const context = {
              userInputs: { testNumber: value },
            };
            
            const result = await operator.execute(null, config, context);
            
            // Value should be returned as-is when within range
            return result === value;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Number Input Constraint Validation - values below min are rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -500, max: 500 }), // min constraint
          fc.integer({ min: 1, max: 100 }),    // how much below min
          async (min, belowBy) => {
            const value = min - belowBy;
            
            const config = {
              label: 'testNumber',
              min,
            };
            
            const context = {
              userInputs: { testNumber: value },
            };
            
            try {
              await operator.execute(null, config, context);
              return false; // Should have thrown
            } catch (error) {
              // Should throw error about min constraint
              return (error as Error).message.includes('at least');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Number Input Constraint Validation - values above max are rejected', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -500, max: 500 }), // max constraint
          fc.integer({ min: 1, max: 100 }),    // how much above max
          async (max, aboveBy) => {
            const value = max + aboveBy;
            
            const config = {
              label: 'testNumber',
              max,
            };
            
            const context = {
              userInputs: { testNumber: value },
            };
            
            try {
              await operator.execute(null, config, context);
              return false; // Should have thrown
            } catch (error) {
              // Should throw error about max constraint
              return (error as Error).message.includes('at most');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Number Input Constraint Validation - string inputs are parsed to numbers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: -1000, max: 1000 }),
          async (value) => {
            const config = {
              label: 'testNumber',
            };
            
            const context = {
              userInputs: { testNumber: String(value) },
            };
            
            const result = await operator.execute(null, config, context);
            
            // String should be parsed to number
            return result === value;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property: Number Input Constraint Validation - float values are handled correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: -1000, max: 1000, noNaN: true, noDefaultInfinity: true }),
          async (value) => {
            const config = {
              label: 'testNumber',
            };
            
            const context = {
              userInputs: { testNumber: value },
            };
            
            const result = await operator.execute(null, config, context);
            
            // Float should be returned as-is
            return result === value;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('execute() - Edge Cases', () => {
    it('should return default value when no input provided', async () => {
      const config = {
        label: 'testNumber',
        defaultValue: 42,
      };
      
      const result = await operator.execute(null, config, {});
      expect(result).toBe(42);
    });

    it('should return 0 when no value and no default', async () => {
      const config = {
        label: 'testNumber',
      };
      
      const result = await operator.execute(null, config, {});
      expect(result).toBe(0);
    });

    it('should throw error for required field with no value', async () => {
      const config = {
        label: 'testNumber',
        required: true,
      };
      
      await expect(operator.execute(null, config, {})).rejects.toThrow('required');
    });

    it('should throw error for invalid number string', async () => {
      const config = {
        label: 'testNumber',
      };
      
      const context = {
        userInputs: { testNumber: 'not-a-number' },
      };
      
      await expect(operator.execute(null, config, context)).rejects.toThrow('valid number');
    });

    it('should handle NaN input', async () => {
      const config = {
        label: 'testNumber',
      };
      
      const context = {
        userInputs: { testNumber: NaN },
      };
      
      await expect(operator.execute(null, config, context)).rejects.toThrow('valid number');
    });

    it('should accept value at exact min boundary', async () => {
      const config = {
        label: 'testNumber',
        min: 10,
      };
      
      const context = {
        userInputs: { testNumber: 10 },
      };
      
      const result = await operator.execute(null, config, context);
      expect(result).toBe(10);
    });

    it('should accept value at exact max boundary', async () => {
      const config = {
        label: 'testNumber',
        max: 100,
      };
      
      const context = {
        userInputs: { testNumber: 100 },
      };
      
      const result = await operator.execute(null, config, context);
      expect(result).toBe(100);
    });
  });

  describe('validate()', () => {
    it('should reject missing config', () => {
      const result = operator.validate(null);
      expect(result.valid).toBe(false);
    });

    it('should reject missing label', () => {
      const result = operator.validate({});
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Label is required');
    });

    it('should reject non-string label', () => {
      const result = operator.validate({ label: 123 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Label must be a string');
    });

    it('should reject invalid default value', () => {
      const result = operator.validate({ label: 'test', defaultValue: 'not-a-number' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Default value must be a valid number');
    });

    it('should reject invalid min', () => {
      const result = operator.validate({ label: 'test', min: 'not-a-number' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Min must be a valid number');
    });

    it('should reject invalid max', () => {
      const result = operator.validate({ label: 'test', max: 'not-a-number' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Max must be a valid number');
    });

    it('should reject min greater than max', () => {
      const result = operator.validate({ label: 'test', min: 100, max: 10 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Min cannot be greater than max');
    });

    it('should reject invalid step', () => {
      const result = operator.validate({ label: 'test', step: -1 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Step must be a positive number');
    });

    it('should accept valid config', () => {
      const result = operator.validate({
        label: 'test',
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        required: true,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('getOutputSchema()', () => {
    it('should return number schema', () => {
      const schema = operator.getOutputSchema();
      expect(schema.rootType).toBe('object');
      expect(schema.fields).toHaveLength(1);
      expect(schema.fields[0].type).toBe('number');
    });
  });
});
