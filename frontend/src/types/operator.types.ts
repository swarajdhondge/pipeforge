// Operator type definitions for frontend
// Mirrors backend/src/types/operator.types.ts for frontend use

import type { ExtractedSchema } from './schema.types';

// Operator categories for palette organization
export type OperatorCategory = 'sources' | 'user-inputs' | 'operators' | 'string' | 'url';

// All operator types including new ones
export type OperatorType =
  // Sources
  | 'fetch'        // Legacy (backward compatibility, alias to fetch-json)
  | 'fetch-json'
  | 'fetch-csv'
  | 'fetch-rss'
  | 'fetch-page'
  // User Inputs
  | 'text-input'
  | 'number-input'
  | 'url-input'
  | 'date-input'
  // Operators (transformations)
  | 'filter'
  | 'sort'
  | 'transform'
  | 'unique'
  | 'truncate'
  | 'tail'
  | 'rename'
  // String operators
  | 'string-replace'
  | 'regex'
  | 'substring'
  // URL operators
  | 'url-builder'
  // Special
  | 'pipe-output';

/**
 * Set of all known operator types for validation (Requirement 19.5)
 * Used to detect unknown operator types when loading pipes
 */
export const KNOWN_OPERATOR_TYPES = new Set<string>([
  // Legacy operators
  'fetch', 'filter', 'sort', 'transform',
  // Source operators
  'fetch-json', 'fetch-csv', 'fetch-rss', 'fetch-page',
  // User input operators
  'text-input', 'number-input', 'url-input', 'date-input',
  // Transform operators
  'unique', 'truncate', 'tail', 'rename',
  // String operators
  'string-replace', 'regex', 'substring',
  // URL operators
  'url-builder',
  // Special operators
  'pipe-output',
]);

// Secret reference for authenticated API calls
export interface SecretRef {
  secretId: string;
  headerName: string;
  headerFormat?: string;
}

// ============================================
// Source Operator Configurations
// ============================================

export interface FetchConfig {
  url: string;
  headers?: Record<string, string>;
  secretRef?: SecretRef;
}

export type FetchJSONConfig = FetchConfig;

export interface FetchCSVConfig {
  url: string;
  delimiter?: string;
  hasHeader?: boolean;
  headers?: Record<string, string>;
  secretRef?: SecretRef;
}


export interface FetchRSSConfig {
  url: string;
  maxItems?: number;
  headers?: Record<string, string>;
  secretRef?: SecretRef;
}

export interface FetchPageConfig {
  url: string;
  selector: string;
  attribute?: string;
  multiple?: boolean;
  headers?: Record<string, string>;
  secretRef?: SecretRef;
}

// ============================================
// User Input Operator Configurations
// ============================================

export interface TextInputConfig {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

export interface NumberInputConfig {
  label: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}

export interface URLInputConfig {
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

export interface DateInputConfig {
  label: string;
  defaultValue?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

// ============================================
// Filter Operator Configuration
// ============================================

export type FilterOperatorType = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'gt' 
  | 'lt' 
  | 'gte' 
  | 'lte' 
  | 'matches_regex';

export interface FilterRule {
  field: string;
  operator: FilterOperatorType;
  value: unknown;
}

export interface FilterConfig {
  rules: FilterRule[];
}

export interface EnhancedFilterConfig {
  mode: 'permit' | 'block';
  matchMode: 'any' | 'all';
  rules: FilterRule[];
}

// ============================================
// Sort Operator Configuration
// ============================================

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// ============================================
// Transform Operator Configuration
// ============================================

export interface TransformMapping {
  source: string;
  target: string;
}

export interface TransformConfig {
  mappings: TransformMapping[];
}

// ============================================
// New Transformation Operator Configurations
// ============================================

export interface UniqueConfig {
  field: string;
}

export interface TruncateConfig {
  count: number;
}

export interface TailConfig {
  count: number;
  skip?: boolean;
}

export interface RenameConfig {
  mappings: Array<{
    source: string;
    target: string;
  }>;
}

// ============================================
// String Operator Configurations
// ============================================

export interface StringReplaceConfig {
  field: string;
  search: string;
  replace: string;
  all?: boolean;
}

export interface RegexConfig {
  field: string;
  pattern: string;
  flags?: string;
  mode: 'extract' | 'replace';
  replacement?: string;
  group?: number;
}

export interface SubstringConfig {
  field: string;
  start: number;
  end?: number;
}

// ============================================
// URL Operator Configurations
// ============================================

export interface URLBuilderConfig {
  baseUrl: string;
  params: Array<{
    key: string;
    value: string;
    fromInput?: string;
  }>;
}

// ============================================
// Pipe Output Configuration
// ============================================

export interface PipeOutputConfig {
  // No config needed - pass-through operator
}

// ============================================
// Union Types
// ============================================

export type OperatorConfig = 
  | FetchConfig 
  | FetchJSONConfig
  | FetchCSVConfig
  | FetchRSSConfig
  | FetchPageConfig
  | TextInputConfig
  | NumberInputConfig
  | URLInputConfig
  | DateInputConfig
  | FilterConfig
  | EnhancedFilterConfig
  | SortConfig
  | TransformConfig
  | UniqueConfig
  | TruncateConfig
  | TailConfig
  | RenameConfig
  | StringReplaceConfig
  | RegexConfig
  | SubstringConfig
  | URLBuilderConfig
  | PipeOutputConfig;

// ============================================
// Operator Node Definition
// ============================================

export interface OperatorNode {
  id: string;
  type: OperatorType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: OperatorConfig;
    outputSchema?: ExtractedSchema;
    validationErrors?: string[];
    result?: unknown;
  };
}
