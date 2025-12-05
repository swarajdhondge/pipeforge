import { BaseOperator } from './base-operator';
import { TransformConfig, ValidationResult, OperatorCategory } from '../types/operator.types';
import { ExtractedSchema, SchemaField } from '../types/schema.types';

/**
 * TransformOperator - Field mapping and data transformation
 * 
 * Features:
 * - Field mapping with dot notation
 * - Handle arrays and single objects
 * - Set null for missing fields
 * 
 * Requirements: 9
 */
export class TransformOperator extends BaseOperator {
  type = 'transform';
  category: OperatorCategory = 'operators';
  description = 'Map and rename fields to create new data structure';

  /**
   * Execute transform operation
   * @param input - Input data to transform
   * @param config - Transform configuration with mappings
   * @returns Transformed data
   */
  async execute(input: any, config: TransformConfig, _context?: any): Promise<any> {
    // Handle null/undefined input
    if (input === null || input === undefined) {
      return null;
    }

    // If path is specified, extract that nested data first
    // This allows extracting arrays from nested API responses (e.g., data.children for Reddit)
    let data = input;
    if (config.path) {
      data = this.getNestedProperty(input, config.path);
      if (data === null || data === undefined) {
        return null;
      }
    }

    // If no mappings, return the extracted data (or original input)
    // This allows the operator to be used just for extraction
    if (!config.mappings || config.mappings.length === 0) {
      return data;
    }

    // Handle array input
    if (this.isArray(data)) {
      return data.map((item: any) => this.transformItem(item, config));
    }

    // Handle single object
    return this.transformItem(data, config);
  }

  /**
   * Validate transform configuration
   * @param config - Transform configuration
   * @returns Validation result
   */
  validate(config: any): ValidationResult {
    if (!config) {
      return { valid: false, error: 'Configuration is required' };
    }

    if (!config.mappings) {
      return { valid: false, error: 'Mappings array is required' };
    }

    if (!Array.isArray(config.mappings)) {
      return { valid: false, error: 'Mappings must be an array' };
    }

    // Validate each mapping
    for (let i = 0; i < config.mappings.length; i++) {
      const mapping = config.mappings[i];

      if (!mapping.source) {
        return { valid: false, error: `Mapping ${i}: source is required` };
      }

      if (typeof mapping.source !== 'string') {
        return { valid: false, error: `Mapping ${i}: source must be a string` };
      }

      if (!mapping.target) {
        return { valid: false, error: `Mapping ${i}: target is required` };
      }

      if (typeof mapping.target !== 'string') {
        return { valid: false, error: `Mapping ${i}: target must be a string` };
      }
    }

    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * Transform creates a new schema based on the mappings
   * @param inputSchema - Schema from upstream operator
   * @param config - Transform configuration with mappings
   * @returns New schema based on target field names
   */
  getOutputSchema(inputSchema?: ExtractedSchema, config?: TransformConfig): ExtractedSchema | null {
    if (!config?.mappings || config.mappings.length === 0) {
      return null;
    }

    // Build new schema from target field names
    const fields: SchemaField[] = config.mappings.map((mapping) => {
      // Try to find the source field type from input schema
      let fieldType: SchemaField['type'] = 'string';
      if (inputSchema) {
        const sourceField = this.findFieldByPath(inputSchema.fields, mapping.source);
        if (sourceField) {
          fieldType = sourceField.type;
        }
      }

      return {
        name: mapping.target.split('.').pop() || mapping.target,
        path: mapping.target,
        type: fieldType,
      };
    });

    return {
      fields,
      rootType: inputSchema?.rootType || 'array',
      itemCount: inputSchema?.itemCount,
    };
  }

  /**
   * Find a field by its path in the schema
   * @param fields - Schema fields to search
   * @param path - Dot-notation path to find
   * @returns Found field or undefined
   */
  private findFieldByPath(fields: SchemaField[], path: string): SchemaField | undefined {
    const parts = path.split('.');
    let currentFields = fields;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const field = currentFields.find((f) => f.name === part);
      
      if (!field) {
        return undefined;
      }

      if (i === parts.length - 1) {
        return field;
      }

      if (field.children) {
        currentFields = field.children;
      } else {
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Transform a single item using mappings
   * @param item - Item to transform
   * @param config - Transform configuration
   * @returns Transformed item
   */
  private transformItem(item: any, config: TransformConfig): any {
    const result: any = {};

    for (const mapping of config.mappings) {
      // Get source value (supports dot notation)
      const sourceValue = this.getNestedProperty(item, mapping.source);

      // Set target value (supports dot notation)
      // If source doesn't exist, set to null
      this.setNestedProperty(result, mapping.target, sourceValue ?? null);
    }

    return result;
  }
}
