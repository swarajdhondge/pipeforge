import { BaseOperator } from './base-operator';
import { 
  FilterConfig, 
  EnhancedFilterConfig, 
  FilterRule, 
  ValidationResult, 
  OperatorCategory,
  FilterOperatorType
} from '../types/operator.types';
import { ExtractedSchema } from '../types/schema.types';
import { validateRegexPattern, safeRegexTest } from '../utils/regex-validator';

/**
 * FilterOperator - Array filtering with rules
 * 
 * Features:
 * - Permit/Block mode (Permit = include matching, Block = exclude matching)
 * - Any/All match mode (any = OR logic, all = AND logic)
 * - Support multiple operators (equals, not_equals, contains, not_contains, gt, lt, gte, lte, matches_regex)
 * - Graceful handling of missing fields (skip items instead of failing)
 * - Backward compatible with legacy FilterConfig
 * 
 * Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 16.4, 22.4
 */
export class FilterOperator extends BaseOperator {
  type = 'filter';
  category: OperatorCategory = 'operators';
  description = 'Filter items by rules (Permit/Block mode with any/all matching)';

  /**
   * Execute filter operation
   * @param input - Input array to filter
   * @param config - Filter configuration with rules (supports both legacy and enhanced config)
   * @returns Filtered array
   */
  async execute(input: any, config: FilterConfig | EnhancedFilterConfig, _context?: any): Promise<any> {
    // Validate input is an array (Requirement 9.1)
    if (!this.isArray(input)) {
      const inputType = input === null ? 'null' : 
                        input === undefined ? 'undefined' : 
                        Array.isArray(input) ? 'array' :
                        typeof input;
      throw new Error(
        `Filter operator requires array input, received ${inputType}. ` +
        `Make sure the upstream operator outputs an array of items.`
      );
    }

    // If no rules, return input unchanged
    if (!config.rules || config.rules.length === 0) {
      return input;
    }

    // Normalize config to enhanced format with defaults for backward compatibility
    const normalizedConfig = this.normalizeConfig(config);

    // Filter array based on mode and matchMode
    return input.filter((item: any) => {
      const matches = this.evaluateRules(item, normalizedConfig.rules, normalizedConfig.matchMode);
      
      // Permit mode: include matching items
      // Block mode: exclude matching items
      return normalizedConfig.mode === 'permit' ? matches : !matches;
    });
  }

  /**
   * Normalize config to enhanced format with defaults
   * Provides backward compatibility with legacy FilterConfig
   */
  private normalizeConfig(config: FilterConfig | EnhancedFilterConfig): EnhancedFilterConfig {
    // Check if it's already an enhanced config
    const enhancedConfig = config as EnhancedFilterConfig;
    
    return {
      mode: enhancedConfig.mode || 'permit',      // Default to 'permit' for backward compatibility
      matchMode: enhancedConfig.matchMode || 'all', // Default to 'all' for backward compatibility
      rules: config.rules || []
    };
  }

  /**
   * Evaluate all rules against an item based on matchMode
   * @param item - Item to evaluate
   * @param rules - Filter rules
   * @param matchMode - 'any' (OR) or 'all' (AND)
   * @returns True if item matches according to matchMode
   */
  private evaluateRules(item: any, rules: FilterRule[], matchMode: 'any' | 'all'): boolean {
    if (rules.length === 0) {
      return true;
    }

    if (matchMode === 'any') {
      // OR logic: at least one rule must match
      return rules.some((rule) => this.evaluateRule(item, rule));
    } else {
      // AND logic: all rules must match
      return rules.every((rule) => this.evaluateRule(item, rule));
    }
  }

  /**
   * Validate filter configuration
   * @param config - Filter configuration
   * @returns Validation result
   */
  validate(config: any): ValidationResult {
    if (!config) {
      return { valid: false, error: 'Configuration is required' };
    }

    if (!config.rules) {
      return { valid: false, error: 'Rules array is required' };
    }

    if (!Array.isArray(config.rules)) {
      return { valid: false, error: 'Rules must be an array' };
    }

    // Validate mode if provided
    if (config.mode !== undefined) {
      if (config.mode !== 'permit' && config.mode !== 'block') {
        return { valid: false, error: 'Mode must be either "permit" or "block"' };
      }
    }

    // Validate matchMode if provided
    if (config.matchMode !== undefined) {
      if (config.matchMode !== 'any' && config.matchMode !== 'all') {
        return { valid: false, error: 'Match mode must be either "any" or "all"' };
      }
    }

    // Validate each rule
    const validOperators: FilterOperatorType[] = [
      'equals', 'not_equals', 'contains', 'not_contains', 
      'gt', 'lt', 'gte', 'lte', 'matches_regex'
    ];

    for (let i = 0; i < config.rules.length; i++) {
      const rule = config.rules[i];

      if (!rule.field) {
        return { valid: false, error: `Rule ${i}: field is required` };
      }

      if (typeof rule.field !== 'string') {
        return { valid: false, error: `Rule ${i}: field must be a string` };
      }

      if (!rule.operator) {
        return { valid: false, error: `Rule ${i}: operator is required` };
      }

      if (!validOperators.includes(rule.operator)) {
        return { 
          valid: false, 
          error: `Rule ${i}: operator must be one of: ${validOperators.join(', ')}` 
        };
      }

      if (rule.value === undefined) {
        return { valid: false, error: `Rule ${i}: value is required` };
      }

      // Validate regex pattern if using matches_regex operator
      if (rule.operator === 'matches_regex') {
        if (typeof rule.value !== 'string') {
          return { valid: false, error: `Rule ${i}: regex pattern must be a string` };
        }
        const regexValidation = validateRegexPattern(rule.value);
        if (!regexValidation.valid) {
          return { valid: false, error: `Rule ${i}: ${regexValidation.error}` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * Filter preserves the input schema (same fields, fewer items)
   * @param inputSchema - Schema from upstream operator
   * @param _config - Filter configuration
   * @returns Same as input schema (filter doesn't change field structure)
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: FilterConfig | EnhancedFilterConfig): ExtractedSchema | null {
    // Filter preserves the schema structure, just reduces items
    return inputSchema || null;
  }

  /**
   * Evaluate a single filter rule against an item
   * Handles missing fields gracefully by returning false (item doesn't match)
   * @param item - Item to evaluate
   * @param rule - Filter rule
   * @returns True if item matches rule, false otherwise (including for missing fields)
   */
  private evaluateRule(item: any, rule: FilterRule): boolean {
    // Get field value (supports dot notation)
    const fieldValue = this.getNestedProperty(item, rule.field);

    // Handle missing fields gracefully - treat as non-matching
    // Requirements: 16.4, 22.4
    if (fieldValue === undefined) {
      return false;
    }

    switch (rule.operator) {
      case 'equals':
        // Use loose equality with type coercion for string/number comparison
        // This allows "1" to match 1, which is common when values come from form inputs
        return this.looseEquals(fieldValue, rule.value);

      case 'not_equals':
        return !this.looseEquals(fieldValue, rule.value);

      case 'contains':
        if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
          return fieldValue.includes(rule.value);
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(rule.value);
        }
        return false;

      case 'not_contains':
        if (typeof fieldValue === 'string' && typeof rule.value === 'string') {
          return !fieldValue.includes(rule.value);
        }
        if (Array.isArray(fieldValue)) {
          return !fieldValue.includes(rule.value);
        }
        // If not a string or array, it doesn't contain anything
        return true;

      case 'gt':
        return this.compareValues(fieldValue, rule.value) > 0;

      case 'lt':
        return this.compareValues(fieldValue, rule.value) < 0;

      case 'gte':
        return this.compareValues(fieldValue, rule.value) >= 0;

      case 'lte':
        return this.compareValues(fieldValue, rule.value) <= 0;

      case 'matches_regex':
        if (typeof fieldValue !== 'string' || typeof rule.value !== 'string') {
          return false;
        }
        // Use safe regex test to prevent ReDoS
        return safeRegexTest(rule.value, fieldValue);

      default:
        return false;
    }
  }

  /**
   * Loose equality comparison with type coercion
   * Handles string/number comparison (e.g., "1" equals 1)
   * @param a - First value
   * @param b - Second value
   * @returns True if values are loosely equal
   */
  private looseEquals(a: any, b: any): boolean {
    // Strict equality first
    if (a === b) return true;
    
    // Handle null/undefined
    if (a === null || a === undefined || b === null || b === undefined) {
      return a == b;
    }
    
    // String/number comparison - try to compare as numbers if possible
    if ((typeof a === 'string' || typeof a === 'number') && 
        (typeof b === 'string' || typeof b === 'number')) {
      // If both can be parsed as numbers, compare as numbers
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA === numB;
      }
      // Otherwise compare as strings
      return String(a) === String(b);
    }
    
    // Boolean comparison
    if (typeof a === 'boolean' || typeof b === 'boolean') {
      // Convert string "true"/"false" to boolean
      const boolA = typeof a === 'boolean' ? a : (a === 'true' ? true : a === 'false' ? false : a);
      const boolB = typeof b === 'boolean' ? b : (b === 'true' ? true : b === 'false' ? false : b);
      return boolA === boolB;
    }
    
    return false;
  }

  /**
   * Compare two values for numeric/string comparison
   * @param a - First value
   * @param b - Second value
   * @returns Comparison result (-1, 0, 1)
   */
  private compareValues(a: any, b: any): number {
    // Handle null/undefined
    if (a === null || a === undefined) return -1;
    if (b === null || b === undefined) return 1;

    // Numeric comparison
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    // String comparison
    if (typeof a === 'string' && typeof b === 'string') {
      return a.localeCompare(b);
    }

    // Try to convert to numbers
    const numA = Number(a);
    const numB = Number(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }

    // Fallback to string comparison
    return String(a).localeCompare(String(b));
  }
}
