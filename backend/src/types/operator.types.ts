// Operator type definitions
import { ExtractedSchema } from './schema.types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface ExecutionContext {
  secretsService?: any;  // SecretsService (avoiding circular dependency)
  userId?: string | null;
  userInputs?: Record<string, any>;  // Values for user input operators
}

export interface IOperator {
  type: string;
  category: OperatorCategory;
  description: string;
  execute(input: any, config: any, context?: ExecutionContext): Promise<any>;
  validate(config: any): ValidationResult;
  getOutputSchema(inputSchema?: ExtractedSchema, config?: any): ExtractedSchema | null;
}

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

// Secret reference for authenticated API calls
export interface SecretRef {
  secretId: string;
  headerName: string;  // e.g., "Authorization", "X-API-Key"
  headerFormat?: string;  // e.g., "Bearer {value}", "ApiKey {value}", default: "{value}"
}


// ============================================
// Source Operator Configurations
// ============================================

export interface FetchConfig {
  url: string;
  headers?: Record<string, string>;
  secretRef?: SecretRef;
}

// Alias for backward compatibility
export type FetchJSONConfig = FetchConfig;

export interface FetchCSVConfig {
  url: string;
  delimiter?: string;  // Default: ','
  hasHeader?: boolean; // Default: true
  headers?: Record<string, string>;
  secretRef?: SecretRef;
}

export interface FetchRSSConfig {
  url: string;
  maxItems?: number;   // Default: 50
  headers?: Record<string, string>;
  secretRef?: SecretRef;
}

export interface FetchPageConfig {
  url: string;
  selector: string;    // CSS selector
  attribute?: string;  // Extract attribute value (default: text content)
  multiple?: boolean;  // Extract all matches (default: true)
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
  defaultValue?: string;  // ISO date string
  minDate?: string;
  maxDate?: string;
  required?: boolean;
}

// ============================================
// Filter Operator Configuration (Enhanced)
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
  value: any;
}

// Legacy filter config (backward compatibility)
export interface FilterConfig {
  rules: FilterRule[];
}

// Enhanced filter config with Permit/Block and any/all modes
export interface EnhancedFilterConfig {
  mode: 'permit' | 'block';  // Permit = include matching, Block = exclude matching
  matchMode: 'any' | 'all';  // any = OR, all = AND
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
  source: string;  // supports dot notation
  target: string;
}

export interface TransformConfig {
  path?: string;  // Optional path to extract data from (e.g., 'data.children' for Reddit API)
  mappings: TransformMapping[];
}

// ============================================
// New Transformation Operator Configurations
// ============================================

export interface UniqueConfig {
  field: string;  // Field to deduplicate by
}

export interface TruncateConfig {
  count: number;  // Number of items to keep from start
}

export interface TailConfig {
  count: number;  // Number of items from end
  skip?: boolean; // If true, skip first N instead of keeping last N
}

export interface RenameConfig {
  mappings: Array<{
    source: string;  // Source field path
    target: string;  // New field name
  }>;
}

// ============================================
// String Operator Configurations
// ============================================

export interface StringReplaceConfig {
  field: string;
  search: string;
  replace: string;
  all?: boolean;  // Replace all occurrences (default: true)
}

export interface RegexConfig {
  field: string;
  pattern: string;
  flags?: string;       // e.g., 'gi'
  mode: 'extract' | 'replace';
  replacement?: string; // For replace mode
  group?: number;       // Capture group to extract (default: 0)
}

export interface SubstringConfig {
  field: string;
  start: number;
  end?: number;  // If omitted, to end of string
}

// ============================================
// URL Operator Configurations
// ============================================

export interface URLBuilderConfig {
  baseUrl: string;
  params: Array<{
    key: string;
    value: string;
    fromInput?: string;  // Node ID of user input to wire from
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
  // Sources
  | FetchConfig 
  | FetchJSONConfig
  | FetchCSVConfig
  | FetchRSSConfig
  | FetchPageConfig
  // User Inputs
  | TextInputConfig
  | NumberInputConfig
  | URLInputConfig
  | DateInputConfig
  // Operators
  | FilterConfig
  | EnhancedFilterConfig
  | SortConfig
  | TransformConfig
  | UniqueConfig
  | TruncateConfig
  | TailConfig
  | RenameConfig
  // String
  | StringReplaceConfig
  | RegexConfig
  | SubstringConfig
  // URL
  | URLBuilderConfig
  // Special
  | PipeOutputConfig;

// ============================================
// Operator Node Definition (used in pipe definition)
// ============================================

export interface OperatorNode {
  id: string;
  type: OperatorType;
  position: { x: number; y: number };
  data: {
    label: string;
    config: OperatorConfig;
    outputSchema?: ExtractedSchema;  // Cached schema from preview/execution
    validationErrors?: string[];     // Real-time validation errors
    result?: any;                    // Execution result for display
  };
}

export interface Edge {
  id: string;
  source: string;  // node id
  target: string;  // node id
  sourceHandle?: string;
  targetHandle?: string;
}

export interface PipeDefinition {
  nodes: OperatorNode[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
}
