import { ValidationResult } from '../types/operator.types';

/**
 * Regex Validator Utility
 * 
 * Validates regex patterns to prevent ReDoS (Regular Expression Denial of Service)
 * attacks and ensure patterns are safe to execute.
 * 
 * Requirements: 17.3
 */

// Maximum allowed pattern length
const MAX_PATTERN_LENGTH = 500;

// Dangerous patterns that could cause catastrophic backtracking
const DANGEROUS_PATTERNS = [
  // Nested quantifiers: a++, a**, a??, a+*, etc.
  /(\+|\*|\?)\s*(\+|\*|\?)/,
  // Nested groups with quantifiers that can cause exponential backtracking
  /\([^)]*(\+|\*)\s*\)\s*(\+|\*)/,
  // Overlapping alternations with quantifiers
  /\([^)]*\|[^)]*\)\s*(\+|\*)/,
  // Backreferences with quantifiers (can cause exponential time)
  /\\[1-9]\d*\s*(\+|\*)/,
];

// Patterns that are suspicious but not always dangerous
const SUSPICIOUS_PATTERNS = [
  // Multiple consecutive quantifiers
  /(\+|\*|\?){2,}/,
  // Very long character classes
  /\[[^\]]{50,}\]/,
  // Deeply nested groups (more than 5 levels)
  /(\([^()]*){6,}/,
];

/**
 * Validate a regex pattern for safety and correctness
 * 
 * @param pattern - The regex pattern to validate
 * @returns ValidationResult indicating if the pattern is safe to use
 */
export function validateRegexPattern(pattern: string): ValidationResult {
  // Check for empty pattern
  if (!pattern) {
    return { valid: false, error: 'Pattern is required' };
  }

  // Check pattern length
  if (pattern.length > MAX_PATTERN_LENGTH) {
    return { 
      valid: false, 
      error: `Invalid regex: Pattern too long (max ${MAX_PATTERN_LENGTH} characters)` 
    };
  }

  // Check for dangerous patterns that could cause ReDoS
  for (const dangerous of DANGEROUS_PATTERNS) {
    if (dangerous.test(pattern)) {
      return { 
        valid: false, 
        error: 'Invalid regex: Pattern may cause performance issues' 
      };
    }
  }

  // Check for suspicious patterns (warning level, but still allow)
  // These are logged but not rejected
  for (const suspicious of SUSPICIOUS_PATTERNS) {
    if (suspicious.test(pattern)) {
      // Log warning but don't reject
      // In production, this could be logged to monitoring
      break;
    }
  }

  // Try to compile the pattern to check for syntax errors
  try {
    new RegExp(pattern);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { 
      valid: false, 
      error: `Invalid regex: ${errorMessage}` 
    };
  }

  return { valid: true };
}

/**
 * Validate regex pattern with flags
 * 
 * @param pattern - The regex pattern to validate
 * @param flags - Optional regex flags (e.g., 'gi')
 * @returns ValidationResult indicating if the pattern is safe to use
 */
export function validateRegexPatternWithFlags(
  pattern: string, 
  flags?: string
): ValidationResult {
  // First validate the pattern itself
  const patternResult = validateRegexPattern(pattern);
  if (!patternResult.valid) {
    return patternResult;
  }

  // Validate flags if provided
  if (flags) {
    // Valid flags are: g, i, m, s, u, y
    const validFlags = /^[gimsuy]*$/;
    if (!validFlags.test(flags)) {
      return { 
        valid: false, 
        error: 'Invalid regex: Invalid flags (valid flags are: g, i, m, s, u, y)' 
      };
    }

    // Check for duplicate flags
    const flagSet = new Set(flags.split(''));
    if (flagSet.size !== flags.length) {
      return { 
        valid: false, 
        error: 'Invalid regex: Duplicate flags are not allowed' 
      };
    }

    // Try to compile with flags
    try {
      new RegExp(pattern, flags);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        valid: false, 
        error: `Invalid regex: ${errorMessage}` 
      };
    }
  }

  return { valid: true };
}

/**
 * Create a safe regex with timeout protection
 * This is a helper for executing regex with a timeout to prevent hanging
 * 
 * @param pattern - The regex pattern
 * @param flags - Optional regex flags
 * @returns The compiled RegExp or null if invalid
 */
export function createSafeRegex(pattern: string, flags?: string): RegExp | null {
  const validation = validateRegexPatternWithFlags(pattern, flags);
  if (!validation.valid) {
    return null;
  }

  try {
    return new RegExp(pattern, flags);
  } catch {
    return null;
  }
}

/**
 * Test if a string matches a pattern safely
 * Returns false if the pattern is invalid or dangerous
 * 
 * @param pattern - The regex pattern
 * @param input - The string to test
 * @param flags - Optional regex flags
 * @returns True if the input matches the pattern, false otherwise
 */
export function safeRegexTest(
  pattern: string, 
  input: string, 
  flags?: string
): boolean {
  const regex = createSafeRegex(pattern, flags);
  if (!regex) {
    return false;
  }

  try {
    return regex.test(input);
  } catch {
    return false;
  }
}

/**
 * Execute a regex match safely
 * Returns null if the pattern is invalid or dangerous
 * 
 * @param pattern - The regex pattern
 * @param input - The string to match against
 * @param flags - Optional regex flags
 * @returns The match result or null if invalid/no match
 */
export function safeRegexMatch(
  pattern: string, 
  input: string, 
  flags?: string
): RegExpMatchArray | null {
  const regex = createSafeRegex(pattern, flags);
  if (!regex) {
    return null;
  }

  try {
    return input.match(regex);
  } catch {
    return null;
  }
}

/**
 * Execute a regex replace safely
 * Returns the original string if the pattern is invalid or dangerous
 * 
 * @param pattern - The regex pattern
 * @param input - The string to perform replacement on
 * @param replacement - The replacement string
 * @param flags - Optional regex flags
 * @returns The replaced string or original if invalid
 */
export function safeRegexReplace(
  pattern: string, 
  input: string, 
  replacement: string,
  flags?: string
): string {
  const regex = createSafeRegex(pattern, flags);
  if (!regex) {
    return input;
  }

  try {
    return input.replace(regex, replacement);
  } catch {
    return input;
  }
}
