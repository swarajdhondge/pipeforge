import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateRegexPattern,
  validateRegexPatternWithFlags,
  createSafeRegex,
  safeRegexTest,
  safeRegexMatch,
  safeRegexReplace,
} from '../regex-validator';

describe('Regex Validator', () => {
  describe('validateRegexPattern()', () => {
    it('should accept valid simple patterns', () => {
      expect(validateRegexPattern('hello')).toEqual({ valid: true });
      expect(validateRegexPattern('[a-z]+')).toEqual({ valid: true });
      expect(validateRegexPattern('\\d{3}-\\d{4}')).toEqual({ valid: true });
      expect(validateRegexPattern('^start.*end$')).toEqual({ valid: true });
    });

    it('should reject empty pattern', () => {
      const result = validateRegexPattern('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Pattern is required');
    });

    it('should reject patterns exceeding max length', () => {
      const longPattern = 'a'.repeat(501);
      const result = validateRegexPattern(longPattern);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Pattern too long');
    });

    it('should accept patterns at max length', () => {
      const maxPattern = 'a'.repeat(500);
      const result = validateRegexPattern(maxPattern);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid regex syntax', () => {
      const result = validateRegexPattern('[unclosed');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid regex');
    });

    it('should reject nested quantifiers (ReDoS prevention)', () => {
      // These patterns can cause catastrophic backtracking
      expect(validateRegexPattern('a++')).toEqual({
        valid: false,
        error: 'Invalid regex: Pattern may cause performance issues',
      });
      expect(validateRegexPattern('a**')).toEqual({
        valid: false,
        error: 'Invalid regex: Pattern may cause performance issues',
      });
      expect(validateRegexPattern('a+*')).toEqual({
        valid: false,
        error: 'Invalid regex: Pattern may cause performance issues',
      });
    });

    it('should reject nested groups with quantifiers', () => {
      expect(validateRegexPattern('(a+)+')).toEqual({
        valid: false,
        error: 'Invalid regex: Pattern may cause performance issues',
      });
      expect(validateRegexPattern('(a*)*')).toEqual({
        valid: false,
        error: 'Invalid regex: Pattern may cause performance issues',
      });
    });

    it('should accept safe patterns with quantifiers', () => {
      expect(validateRegexPattern('a+')).toEqual({ valid: true });
      expect(validateRegexPattern('a*')).toEqual({ valid: true });
      expect(validateRegexPattern('a?')).toEqual({ valid: true });
      expect(validateRegexPattern('a{1,5}')).toEqual({ valid: true });
      expect(validateRegexPattern('(abc)+')).toEqual({ valid: true });
    });
  });

  describe('validateRegexPatternWithFlags()', () => {
    it('should accept valid flags', () => {
      expect(validateRegexPatternWithFlags('test', 'g')).toEqual({ valid: true });
      expect(validateRegexPatternWithFlags('test', 'gi')).toEqual({ valid: true });
      expect(validateRegexPatternWithFlags('test', 'gim')).toEqual({ valid: true });
    });

    it('should reject invalid flags', () => {
      const result = validateRegexPatternWithFlags('test', 'x');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid flags');
    });

    it('should reject duplicate flags', () => {
      const result = validateRegexPatternWithFlags('test', 'gg');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Duplicate flags');
    });

    it('should validate pattern even with valid flags', () => {
      const result = validateRegexPatternWithFlags('a++', 'g');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Pattern may cause performance issues');
    });
  });

  describe('createSafeRegex()', () => {
    it('should create regex for valid patterns', () => {
      const regex = createSafeRegex('[a-z]+', 'gi');
      expect(regex).toBeInstanceOf(RegExp);
      expect(regex?.source).toBe('[a-z]+');
      expect(regex?.flags).toBe('gi');
    });

    it('should return null for invalid patterns', () => {
      expect(createSafeRegex('a++')).toBeNull();
      expect(createSafeRegex('[unclosed')).toBeNull();
      expect(createSafeRegex('test', 'invalid')).toBeNull();
    });
  });

  describe('safeRegexTest()', () => {
    it('should return true for matching patterns', () => {
      expect(safeRegexTest('[a-z]+', 'hello')).toBe(true);
      expect(safeRegexTest('\\d+', '123')).toBe(true);
    });

    it('should return false for non-matching patterns', () => {
      expect(safeRegexTest('[a-z]+', '123')).toBe(false);
      expect(safeRegexTest('\\d+', 'abc')).toBe(false);
    });

    it('should return false for invalid patterns', () => {
      expect(safeRegexTest('a++', 'aaa')).toBe(false);
      expect(safeRegexTest('[unclosed', 'test')).toBe(false);
    });
  });

  describe('safeRegexMatch()', () => {
    it('should return match for valid patterns', () => {
      const match = safeRegexMatch('\\d+', 'abc123def');
      expect(match).not.toBeNull();
      expect(match?.[0]).toBe('123');
    });

    it('should return null for no match', () => {
      const match = safeRegexMatch('\\d+', 'abcdef');
      expect(match).toBeNull();
    });

    it('should return null for invalid patterns', () => {
      expect(safeRegexMatch('a++', 'aaa')).toBeNull();
    });
  });

  describe('safeRegexReplace()', () => {
    it('should replace for valid patterns', () => {
      const result = safeRegexReplace('\\d+', 'abc123def', 'XXX');
      expect(result).toBe('abcXXXdef');
    });

    it('should replace all with g flag', () => {
      const result = safeRegexReplace('\\d+', 'a1b2c3', 'X', 'g');
      expect(result).toBe('aXbXcX');
    });

    it('should return original for invalid patterns', () => {
      const result = safeRegexReplace('a++', 'aaa', 'b');
      expect(result).toBe('aaa');
    });

    it('should return original for no match', () => {
      const result = safeRegexReplace('\\d+', 'abc', 'X');
      expect(result).toBe('abc');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * **Feature: pipe-forge-canvas, Property 24: Regex DoS Prevention**
     * **Validates: Requirements 17.3**
     * 
     * For any pattern that contains nested quantifiers (potential ReDoS),
     * the validator SHALL reject the pattern with an appropriate error message.
     */
    it('Property 24: Regex DoS Prevention - nested quantifiers are rejected', () => {
      fc.assert(
        fc.property(
          // Generate a base character or simple pattern
          fc.constantFrom('a', 'b', '[a-z]', '\\d', '\\w', '.'),
          // Generate first quantifier
          fc.constantFrom('+', '*', '?'),
          // Generate second quantifier (nested)
          fc.constantFrom('+', '*'),
          (base, quant1, quant2) => {
            // Create a pattern with nested quantifiers
            const dangerousPattern = `${base}${quant1}${quant2}`;
            
            const result = validateRegexPattern(dangerousPattern);
            
            // Should be rejected
            return !result.valid && 
                   result.error?.includes('Pattern may cause performance issues');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: pipe-forge-canvas, Property 24: Regex DoS Prevention**
     * **Validates: Requirements 17.3**
     * 
     * For any pattern that contains nested groups with quantifiers (potential ReDoS),
     * the validator SHALL reject the pattern with an appropriate error message.
     */
    it('Property 24: Regex DoS Prevention - nested groups with quantifiers are rejected', () => {
      fc.assert(
        fc.property(
          // Generate a base character
          fc.constantFrom('a', 'b', 'c', 'd'),
          // Generate inner quantifier
          fc.constantFrom('+', '*'),
          // Generate outer quantifier
          fc.constantFrom('+', '*'),
          (base, innerQuant, outerQuant) => {
            // Create a pattern with nested groups and quantifiers
            const dangerousPattern = `(${base}${innerQuant})${outerQuant}`;
            
            const result = validateRegexPattern(dangerousPattern);
            
            // Should be rejected
            return !result.valid && 
                   result.error?.includes('Pattern may cause performance issues');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: pipe-forge-canvas, Property 24: Regex DoS Prevention**
     * **Validates: Requirements 17.3**
     * 
     * For any pattern exceeding the maximum length,
     * the validator SHALL reject the pattern.
     */
    it('Property 24: Regex DoS Prevention - long patterns are rejected', () => {
      fc.assert(
        fc.property(
          // Generate a length greater than 500
          fc.integer({ min: 501, max: 1000 }),
          (length) => {
            // Create a pattern that exceeds max length
            const longPattern = 'a'.repeat(length);
            
            const result = validateRegexPattern(longPattern);
            
            // Should be rejected
            return !result.valid && 
                   result.error?.includes('Pattern too long');
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * **Feature: pipe-forge-canvas, Property 24: Regex DoS Prevention**
     * **Validates: Requirements 17.3**
     * 
     * For any valid simple pattern (no nested quantifiers, within length limit),
     * the validator SHALL accept the pattern.
     */
    it('Property 24: Regex DoS Prevention - safe patterns are accepted', () => {
      fc.assert(
        fc.property(
          // Generate safe pattern components
          fc.array(
            fc.oneof(
              // Literal characters
              fc.constantFrom('a', 'b', 'c', '1', '2', '3'),
              // Character classes
              fc.constantFrom('[a-z]', '[0-9]', '[A-Z]'),
              // Escape sequences
              fc.constantFrom('\\d', '\\w', '\\s'),
              // Simple quantified patterns (not nested)
              fc.constantFrom('a+', 'b*', 'c?', '\\d+', '\\w*')
            ),
            { minLength: 1, maxLength: 10 }
          ),
          (parts) => {
            // Join parts to create a safe pattern
            const safePattern = parts.join('');
            
            // Skip if pattern accidentally creates nested quantifiers
            if (/(\+|\*|\?)\s*(\+|\*|\?)/.test(safePattern)) {
              return true;
            }
            
            const result = validateRegexPattern(safePattern);
            
            // Should be accepted
            return result.valid;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
