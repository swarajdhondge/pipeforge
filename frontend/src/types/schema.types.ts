// Schema type definitions for dynamic schema propagation
// Mirrors backend/src/types/schema.types.ts for frontend use

/**
 * Represents a single field in an extracted schema.
 * Supports nested objects via the children property.
 */
export interface SchemaField {
  /** Field name (e.g., "name", "user") */
  name: string;
  /** Full dot-notation path (e.g., "user.name", "items.0.title") */
  path: string;
  /** Detected data type */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'date';
  /** Nested fields for objects and arrays */
  children?: SchemaField[];
  /** Sample value for preview (first non-null value found) */
  sample?: unknown;
}

/**
 * Represents the complete extracted schema from a data source.
 * Used for schema propagation between operators.
 */
export interface ExtractedSchema {
  /** List of top-level fields */
  fields: SchemaField[];
  /** Type of the root data structure */
  rootType: 'array' | 'object';
  /** Number of items (for arrays) */
  itemCount?: number;
}
