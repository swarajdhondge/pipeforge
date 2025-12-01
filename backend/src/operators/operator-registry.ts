import { IOperator } from '../types/operator.types';

/**
 * OperatorRegistry - Plugin system for managing operators
 * 
 * Follows the plugin architecture pattern:
 * - Operators register themselves at startup
 * - New operators can be added without modifying core code
 * - Registry provides discovery and retrieval
 * - Supports aliases for backward compatibility (e.g., 'fetch' -> 'fetch-json')
 */
export class OperatorRegistry {
  private operators: Map<string, IOperator> = new Map();
  private aliases: Map<string, string> = new Map();

  /**
   * Register an operator
   * @param operator - The operator to register
   * @throws Error if operator type is already registered
   */
  register(operator: IOperator): void {
    if (this.operators.has(operator.type)) {
      throw new Error(`Operator type '${operator.type}' is already registered`);
    }
    this.operators.set(operator.type, operator);
  }

  /**
   * Register an alias for an operator type
   * Allows backward compatibility (e.g., 'fetch' -> 'fetch-json')
   * @param alias - The alias name
   * @param targetType - The actual operator type to resolve to
   */
  registerAlias(alias: string, targetType: string): void {
    if (this.operators.has(alias)) {
      throw new Error(`Cannot create alias '${alias}': an operator with this type already exists`);
    }
    this.aliases.set(alias, targetType);
  }

  /**
   * Get an operator by type (resolves aliases)
   * @param type - The operator type or alias
   * @returns The operator or undefined if not found
   */
  get(type: string): IOperator | undefined {
    // First check if it's an alias
    const resolvedType = this.aliases.get(type) || type;
    return this.operators.get(resolvedType);
  }

  /**
   * List all registered operator types (excludes aliases)
   * @returns Array of operator type names
   */
  list(): string[] {
    return Array.from(this.operators.keys());
  }

  /**
   * List all registered aliases
   * @returns Array of [alias, targetType] pairs
   */
  listAliases(): Array<[string, string]> {
    return Array.from(this.aliases.entries());
  }

  /**
   * Check if an operator type is registered (includes aliases)
   * @param type - The operator type or alias
   * @returns True if registered, false otherwise
   */
  has(type: string): boolean {
    const resolvedType = this.aliases.get(type) || type;
    return this.operators.has(resolvedType);
  }

  /**
   * Get the count of registered operators (excludes aliases)
   * @returns Number of registered operators
   */
  count(): number {
    return this.operators.size;
  }

  /**
   * Clear all registered operators and aliases
   * Useful for testing
   */
  clear(): void {
    this.operators.clear();
    this.aliases.clear();
  }
}

// Singleton instance
export const operatorRegistry = new OperatorRegistry();
