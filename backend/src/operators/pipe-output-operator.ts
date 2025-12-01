import { BaseOperator } from './base-operator';
import { PipeOutputConfig, ValidationResult, OperatorCategory } from '../types/operator.types';
import { ExtractedSchema } from '../types/schema.types';

/**
 * PipeOutputOperator - Final output marker for a pipe
 * 
 * This is a pass-through operator that marks the end of a pipe.
 * It simply passes input data through unchanged, serving as the
 * designated output point for pipe execution.
 * 
 * Features:
 * - Pass-through operator (no transformation)
 * - No configuration needed
 * - Marks the final output of the pipe
 * 
 * Requirements: 13.1, 13.2
 */
export class PipeOutputOperator extends BaseOperator {
  type = 'pipe-output';
  category: OperatorCategory = 'operators';
  description = 'Final output of the pipe';

  /**
   * Execute pipe output operation
   * Simply passes input through unchanged
   * @param input - Input data from previous operator
   * @param _config - Configuration (not used, pass-through operator)
   * @param _context - Execution context (not used)
   * @returns Input data unchanged
   */
  async execute(input: any, _config?: PipeOutputConfig, _context?: any): Promise<any> {
    // Pass-through: return input unchanged
    return input;
  }

  /**
   * Validate pipe output configuration
   * Always valid since no configuration is needed
   * @param _config - Configuration (not used)
   * @returns Always valid
   */
  validate(_config?: any): ValidationResult {
    // No configuration needed, always valid
    return { valid: true };
  }

  /**
   * Get output schema for this operator
   * Pass-through: output schema is same as input schema
   * @param inputSchema - Schema from upstream operator
   * @param _config - Configuration (not used)
   * @returns Same as input schema
   */
  getOutputSchema(inputSchema?: ExtractedSchema, _config?: PipeOutputConfig): ExtractedSchema | null {
    // Pass-through: output schema is same as input schema
    return inputSchema || null;
  }
}
