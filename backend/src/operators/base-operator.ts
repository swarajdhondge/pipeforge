import { IOperator, ValidationResult, ExecutionContext, OperatorCategory } from '../types/operator.types';
import { ExtractedSchema } from '../types/schema.types';

/**
 * BaseOperator - Abstract base class for operators
 * 
 * Provides common functionality that all operators can use.
 * Specific operators should extend this class and implement:
 * - type property
 * - category property
 * - description property
 * - execute method
 * - validate method
 * - getOutputSchema method
 */
export abstract class BaseOperator implements IOperator {
  abstract type: string;
  abstract category: OperatorCategory;
  abstract description: string;

  /**
   * Execute the operator
   * @param input - Input data from previous operator
   * @param config - Operator configuration
   * @param context - Execution context (optional, for secrets support)
   * @returns Processed output
   */
  abstract execute(input: any, config: any, context?: ExecutionContext): Promise<any>;

  /**
   * Validate operator configuration
   * @param config - Operator configuration
   * @returns Validation result
   */
  abstract validate(config: any): ValidationResult;

  /**
   * Get the output schema for this operator
   * Used for schema propagation to downstream operators
   * @param inputSchema - Schema from upstream operator (optional)
   * @param config - Operator configuration (optional)
   * @returns Output schema or null if cannot be determined
   */
  abstract getOutputSchema(inputSchema?: ExtractedSchema, config?: any): ExtractedSchema | null;

  /**
   * Helper method to check if input is an array
   * @param input - Input to check
   * @returns True if input is an array
   */
  protected isArray(input: any): boolean {
    return Array.isArray(input);
  }

  /**
   * Helper method to get nested property value using dot notation
   * @param obj - Object to get property from
   * @param path - Dot notation path (e.g., "user.name")
   * @returns Property value or undefined
   */
  protected getNestedProperty(obj: any, path: string): any {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined) {
        return undefined;
      }
      result = result[key];
    }

    return result;
  }

  /**
   * Helper method to set nested property value using dot notation
   * @param obj - Object to set property on
   * @param path - Dot notation path (e.g., "user.name")
   * @param value - Value to set
   */
  protected setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }
}
