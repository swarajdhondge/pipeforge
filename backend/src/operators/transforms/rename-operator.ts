import { BaseOperator } from '../base-operator';
import { RenameConfig, ValidationResult, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema, SchemaField } from '../../types/schema.types';

/**
 * RenameOperator - Rename fields in items
 * 
 * Features:
 * - Rename fields based on source -> target mappings
 * - Skip non-existent source fields without error
 * - Handle nested fields with dot notation
 * - Preserve other fields not in mappings
 * 
 * Requirements: 7.4, 7.5
 */
export class RenameOperator extends BaseOperator {
  type = 'rename';
  category: OperatorCategory = 'operators';
  description = 'Rename fields in items';

  /**
   * Execute rename operation
   * @param input - Input data to rename fields in
   * @param config - Rename configuration with mappings
   * @returns Data with renamed fields
   */
  async execute(input: any, config: RenameConfig, _context?: any): Promise<any> {
    // Handle null/undefined input
    if (input === null || input === undefined) {
      return null;
    }

    // If no mappings, return input unchanged
    if (!config.mappings || config.mappings.length === 0) {
      return input;
    }

    // Handle array input
    if (this.isArray(input)) {
      return input.map((item: any) => this.renameFields(item, config.mappings));
    }

    // Handle single object
    return this.renameFields(input, config.mappings);
  }

  /**
   * Validate rename configuration
   * @param config - Rename configuration
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
   * Rename changes field names based on mappings
   * @param inputSchema - Schema from upstream operator
   * @param config - Rename configuration with mappings
   * @returns Schema with renamed fields
   */
  getOutputSchema(inputSchema?: ExtractedSchema, config?: RenameConfig): ExtractedSchema | null {
    if (!inputSchema) {
      return null;
    }

    if (!config?.mappings || config.mappings.length === 0) {
      return inputSchema;
    }

    // Create a map of source -> target for quick lookup
    const renameMap = new Map<string, string>();
    for (const mapping of config.mappings) {
      renameMap.set(mapping.source, mapping.target);
    }

    // Clone and rename fields
    const renamedFields = this.renameSchemaFields(inputSchema.fields, renameMap);

    return {
      fields: renamedFields,
      rootType: inputSchema.rootType,
      itemCount: inputSchema.itemCount,
    };
  }

  /**
   * Rename fields in a single item
   * @param item - Item to rename fields in
   * @param mappings - Array of source -> target mappings
   * @returns Item with renamed fields
   */
  private renameFields(item: any, mappings: RenameConfig['mappings']): any {
    if (!item || typeof item !== 'object') {
      return item;
    }

    // Start with a shallow copy of the item
    const result = { ...item };

    for (const mapping of mappings) {
      // Get source value (supports dot notation)
      const sourceValue = this.getNestedProperty(item, mapping.source);

      // Skip if source field doesn't exist (Requirements 7.5)
      if (sourceValue === undefined) {
        continue;
      }

      // Delete the source field (handle dot notation)
      this.deleteNestedProperty(result, mapping.source);

      // Set the target field with the source value
      this.setNestedProperty(result, mapping.target, sourceValue);
    }

    return result;
  }

  /**
   * Rename fields in schema
   * @param fields - Schema fields to rename
   * @param renameMap - Map of source path -> target path
   * @returns Renamed schema fields
   */
  private renameSchemaFields(fields: SchemaField[], renameMap: Map<string, string>): SchemaField[] {
    return fields.map((field) => {
      const newName = renameMap.get(field.path);
      if (newName) {
        // Get the last part of the new name for the field name
        const nameParts = newName.split('.');
        return {
          ...field,
          name: nameParts[nameParts.length - 1],
          path: newName,
          children: field.children 
            ? this.renameSchemaFields(field.children, renameMap) 
            : undefined,
        };
      }
      return {
        ...field,
        children: field.children 
          ? this.renameSchemaFields(field.children, renameMap) 
          : undefined,
      };
    });
  }

  /**
   * Delete a nested property using dot notation
   * @param obj - Object to delete property from
   * @param path - Dot notation path (e.g., "user.name")
   */
  private deleteNestedProperty(obj: any, path: string): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return; // Path doesn't exist, nothing to delete
      }
      current = current[key];
    }

    if (current && typeof current === 'object') {
      delete current[lastKey];
    }
  }
}
