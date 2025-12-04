/**
 * Real-time inline validation utilities for operator configurations
 * 
 * Provides field-level validation for inline config components
 * with support for red borders and inline error messages.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4 - Real-time validation feedback
 */

export interface FieldValidationError {
  field: string;
  message: string;
}

export interface ValidationState {
  isValid: boolean;
  errors: FieldValidationError[];
  fieldErrors: Record<string, string>;
}

/**
 * Create an empty validation state
 */
export function createEmptyValidationState(): ValidationState {
  return {
    isValid: true,
    errors: [],
    fieldErrors: {},
  };
}

/**
 * Convert errors array to field errors map
 */
function toFieldErrors(errors: FieldValidationError[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const error of errors) {
    if (!fieldErrors[error.field]) {
      fieldErrors[error.field] = error.message;
    }
  }
  return fieldErrors;
}

/**
 * Create validation state from errors
 */
function createValidationState(errors: FieldValidationError[]): ValidationState {
  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors: toFieldErrors(errors),
  };
}

// ============================================
// URL Validation
// ============================================

/**
 * Validate URL format and security constraints
 */
export function validateUrl(url: string | undefined, fieldName: string = 'url'): FieldValidationError[] {
  const errors: FieldValidationError[] = [];

  if (!url || url.trim() === '') {
    errors.push({ field: fieldName, message: 'URL is required' });
    return errors;
  }

  try {
    const parsed = new URL(url);
    
    // Check protocol
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      errors.push({ field: fieldName, message: 'URL must use http or https' });
    }

    // Check for private IPs
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      errors.push({ field: fieldName, message: 'Private networks not allowed' });
    }
  } catch {
    errors.push({ field: fieldName, message: 'Invalid URL format' });
  }

  return errors;
}

// ============================================
// Fetch JSON Validation
// ============================================

export interface FetchJSONConfig {
  url?: string;
  secretRef?: { secretId: string; headerName: string; headerFormat?: string };
}

export function validateFetchJSON(config: FetchJSONConfig): ValidationState {
  const errors = validateUrl(config.url);
  return createValidationState(errors);
}

// ============================================
// Fetch CSV Validation
// ============================================

export interface FetchCSVConfig {
  url?: string;
  delimiter?: string;
  hasHeader?: boolean;
}

export function validateFetchCSV(config: FetchCSVConfig): ValidationState {
  const errors = validateUrl(config.url);
  return createValidationState(errors);
}

// ============================================
// Fetch RSS Validation
// ============================================

export interface FetchRSSConfig {
  url?: string;
  maxItems?: number;
}

export function validateFetchRSS(config: FetchRSSConfig): ValidationState {
  const errors = validateUrl(config.url);
  
  if (config.maxItems !== undefined) {
    if (config.maxItems < 1) {
      errors.push({ field: 'maxItems', message: 'Must be at least 1' });
    } else if (config.maxItems > 100) {
      errors.push({ field: 'maxItems', message: 'Maximum is 100' });
    }
  }
  
  return createValidationState(errors);
}

// ============================================
// Fetch Page Validation
// ============================================

export interface FetchPageConfig {
  url?: string;
  selector?: string;
  attribute?: string;
  multiple?: boolean;
}

export function validateFetchPage(config: FetchPageConfig): ValidationState {
  const errors = validateUrl(config.url);
  
  if (!config.selector || config.selector.trim() === '') {
    errors.push({ field: 'selector', message: 'CSS selector is required' });
  }
  
  return createValidationState(errors);
}

// ============================================
// User Input Validation
// ============================================

export interface TextInputConfig {
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

export function validateTextInput(config: TextInputConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.label || config.label.trim() === '') {
    errors.push({ field: 'label', message: 'Label is required' });
  }
  
  return createValidationState(errors);
}

export interface NumberInputConfig {
  label?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

export function validateNumberInput(config: NumberInputConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.label || config.label.trim() === '') {
    errors.push({ field: 'label', message: 'Label is required' });
  }
  
  if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
    errors.push({ field: 'min', message: 'Min cannot be greater than max' });
  }
  
  if (config.defaultValue !== undefined) {
    if (config.min !== undefined && config.defaultValue < config.min) {
      errors.push({ field: 'defaultValue', message: `Must be at least ${config.min}` });
    }
    if (config.max !== undefined && config.defaultValue > config.max) {
      errors.push({ field: 'defaultValue', message: `Must be at most ${config.max}` });
    }
  }
  
  return createValidationState(errors);
}

export interface URLInputConfig {
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

export function validateURLInput(config: URLInputConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.label || config.label.trim() === '') {
    errors.push({ field: 'label', message: 'Label is required' });
  }
  
  if (config.defaultValue && config.defaultValue.trim() !== '') {
    const urlErrors = validateUrl(config.defaultValue, 'defaultValue');
    errors.push(...urlErrors);
  }
  
  return createValidationState(errors);
}

export interface DateInputConfig {
  label?: string;
  defaultValue?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

export function validateDateInput(config: DateInputConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.label || config.label.trim() === '') {
    errors.push({ field: 'label', message: 'Label is required' });
  }
  
  if (config.minDate && config.maxDate) {
    const min = new Date(config.minDate);
    const max = new Date(config.maxDate);
    if (min > max) {
      errors.push({ field: 'minDate', message: 'Min date cannot be after max date' });
    }
  }
  
  return createValidationState(errors);
}

// ============================================
// Filter Validation
// ============================================

export interface FilterRule {
  field?: string;
  operator?: string;
  value?: unknown;
}

export interface FilterConfig {
  mode?: 'permit' | 'block';
  matchMode?: 'any' | 'all';
  rules?: FilterRule[];
}

export function validateFilter(config: FilterConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (config.rules && config.rules.length > 0) {
    config.rules.forEach((rule, index) => {
      if (!rule.field || rule.field.trim() === '') {
        errors.push({ field: `rules.${index}.field`, message: `Rule ${index + 1}: Field is required` });
      }
      if (!rule.operator) {
        errors.push({ field: `rules.${index}.operator`, message: `Rule ${index + 1}: Operator is required` });
      }
      // Validate regex pattern if using matches_regex
      if (rule.operator === 'matches_regex' && rule.value) {
        try {
          new RegExp(String(rule.value));
        } catch {
          errors.push({ field: `rules.${index}.value`, message: `Rule ${index + 1}: Invalid regex pattern` });
        }
      }
    });
  }
  
  return createValidationState(errors);
}

// ============================================
// Sort Validation
// ============================================

export interface SortConfig {
  field?: string;
  direction?: 'asc' | 'desc';
}

export function validateSort(config: SortConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.field || config.field.trim() === '') {
    errors.push({ field: 'field', message: 'Sort field is required' });
  }
  
  return createValidationState(errors);
}

// ============================================
// Transform Operators Validation
// ============================================

export interface UniqueConfig {
  field?: string;
}

export function validateUnique(config: UniqueConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.field || config.field.trim() === '') {
    errors.push({ field: 'field', message: 'Field is required' });
  }
  
  return createValidationState(errors);
}

export interface TruncateConfig {
  count?: number;
}

export function validateTruncate(config: TruncateConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (config.count === undefined || config.count === null) {
    errors.push({ field: 'count', message: 'Count is required' });
  } else if (config.count < 1) {
    errors.push({ field: 'count', message: 'Count must be at least 1' });
  }
  
  return createValidationState(errors);
}

export interface TailConfig {
  count?: number;
  skip?: boolean;
}

export function validateTail(config: TailConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (config.count === undefined || config.count === null) {
    errors.push({ field: 'count', message: 'Count is required' });
  } else if (config.count < 1) {
    errors.push({ field: 'count', message: 'Count must be at least 1' });
  }
  
  return createValidationState(errors);
}

export interface RenameMapping {
  source?: string;
  target?: string;
}

export interface RenameConfig {
  mappings?: RenameMapping[];
}

export function validateRename(config: RenameConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (config.mappings && config.mappings.length > 0) {
    config.mappings.forEach((mapping, index) => {
      if (!mapping.source || mapping.source.trim() === '') {
        errors.push({ field: `mappings.${index}.source`, message: `Mapping ${index + 1}: Source field is required` });
      }
      if (!mapping.target || mapping.target.trim() === '') {
        errors.push({ field: `mappings.${index}.target`, message: `Mapping ${index + 1}: Target field is required` });
      }
    });
  }
  
  return createValidationState(errors);
}

// ============================================
// String Operators Validation
// ============================================

export interface StringReplaceConfig {
  field?: string;
  search?: string;
  replace?: string;
  all?: boolean;
}

export function validateStringReplace(config: StringReplaceConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.field || config.field.trim() === '') {
    errors.push({ field: 'field', message: 'Field is required' });
  }
  
  if (!config.search || config.search === '') {
    errors.push({ field: 'search', message: 'Search text is required' });
  }
  
  return createValidationState(errors);
}

export interface RegexConfig {
  field?: string;
  pattern?: string;
  flags?: string;
  mode?: 'extract' | 'replace';
  replacement?: string;
  group?: number;
}

export function validateRegex(config: RegexConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.field || config.field.trim() === '') {
    errors.push({ field: 'field', message: 'Field is required' });
  }
  
  if (!config.pattern || config.pattern.trim() === '') {
    errors.push({ field: 'pattern', message: 'Pattern is required' });
  } else {
    // Validate regex pattern
    try {
      new RegExp(config.pattern, config.flags || '');
    } catch (e) {
      errors.push({ field: 'pattern', message: 'Invalid regex pattern' });
    }
  }
  
  if (config.mode === 'replace' && (config.replacement === undefined || config.replacement === null)) {
    errors.push({ field: 'replacement', message: 'Replacement is required for replace mode' });
  }
  
  return createValidationState(errors);
}

export interface SubstringConfig {
  field?: string;
  start?: number;
  end?: number;
}

export function validateSubstring(config: SubstringConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.field || config.field.trim() === '') {
    errors.push({ field: 'field', message: 'Field is required' });
  }
  
  if (config.start === undefined || config.start === null) {
    errors.push({ field: 'start', message: 'Start index is required' });
  } else if (config.start < 0) {
    errors.push({ field: 'start', message: 'Start index cannot be negative' });
  }
  
  if (config.end !== undefined && config.end !== null) {
    if (config.end < 0) {
      errors.push({ field: 'end', message: 'End index cannot be negative' });
    } else if (config.start !== undefined && config.end <= config.start) {
      errors.push({ field: 'end', message: 'End must be greater than start' });
    }
  }
  
  return createValidationState(errors);
}

// ============================================
// URL Builder Validation
// ============================================

export interface URLBuilderParam {
  key?: string;
  value?: string;
  fromInput?: string;
}

export interface URLBuilderConfig {
  baseUrl?: string;
  params?: URLBuilderParam[];
}

export function validateURLBuilder(config: URLBuilderConfig): ValidationState {
  const errors: FieldValidationError[] = [];
  
  if (!config.baseUrl || config.baseUrl.trim() === '') {
    errors.push({ field: 'baseUrl', message: 'Base URL is required' });
  } else {
    const urlErrors = validateUrl(config.baseUrl, 'baseUrl');
    errors.push(...urlErrors);
  }
  
  if (config.params && config.params.length > 0) {
    config.params.forEach((param, index) => {
      if (!param.key || param.key.trim() === '') {
        errors.push({ field: `params.${index}.key`, message: `Param ${index + 1}: Key is required` });
      }
    });
  }
  
  return createValidationState(errors);
}

// ============================================
// Pipe Output Validation (always valid)
// ============================================

export function validatePipeOutput(): ValidationState {
  return createEmptyValidationState();
}

// ============================================
// Generic Validation Dispatcher
// ============================================

/**
 * Validate any operator config based on type
 */
export function validateOperatorConfig(type: string, config: unknown): ValidationState {
  switch (type) {
    case 'fetch':
    case 'fetch-json':
      return validateFetchJSON(config as FetchJSONConfig);
    case 'fetch-csv':
      return validateFetchCSV(config as FetchCSVConfig);
    case 'fetch-rss':
      return validateFetchRSS(config as FetchRSSConfig);
    case 'fetch-page':
      return validateFetchPage(config as FetchPageConfig);
    case 'text-input':
      return validateTextInput(config as TextInputConfig);
    case 'number-input':
      return validateNumberInput(config as NumberInputConfig);
    case 'url-input':
      return validateURLInput(config as URLInputConfig);
    case 'date-input':
      return validateDateInput(config as DateInputConfig);
    case 'filter':
      return validateFilter(config as FilterConfig);
    case 'sort':
      return validateSort(config as SortConfig);
    case 'unique':
      return validateUnique(config as UniqueConfig);
    case 'truncate':
      return validateTruncate(config as TruncateConfig);
    case 'tail':
      return validateTail(config as TailConfig);
    case 'rename':
      return validateRename(config as RenameConfig);
    case 'string-replace':
      return validateStringReplace(config as StringReplaceConfig);
    case 'regex':
      return validateRegex(config as RegexConfig);
    case 'substring':
      return validateSubstring(config as SubstringConfig);
    case 'url-builder':
      return validateURLBuilder(config as URLBuilderConfig);
    case 'pipe-output':
      return validatePipeOutput();
    default:
      return createEmptyValidationState();
  }
}

// ============================================
// CSS Class Helpers
// ============================================

/**
 * Get input CSS classes based on validation state
 */
export function getInputClassName(
  baseClass: string,
  fieldName: string,
  fieldErrors: Record<string, string>
): string {
  const hasError = !!fieldErrors[fieldName];
  if (hasError) {
    return `${baseClass} border-red-500 focus:ring-red-500 focus:border-red-500`;
  }
  return baseClass;
}

/**
 * Check if a field has an error
 */
export function hasFieldError(fieldName: string, fieldErrors: Record<string, string>): boolean {
  return !!fieldErrors[fieldName];
}

/**
 * Get error message for a field
 */
export function getFieldError(fieldName: string, fieldErrors: Record<string, string>): string | undefined {
  return fieldErrors[fieldName];
}
