import { PipeDefinition } from '../types/operator.types';
import { OperatorRegistry } from '../operators/operator-registry';

/**
 * Validation result for pipe definition
 */
export interface PipeValidationResult {
  valid: boolean;
  errors: PipeValidationError[];
}

export interface PipeValidationError {
  type: 'unknown_operator' | 'invalid_connection' | 'cycle_detected' | 'operator_limit' | 'invalid_structure';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

/**
 * Resource limits for pipe validation
 */
export const PIPE_LIMITS = {
  maxOperators: 50,
};

/**
 * PipeValidator - Validates pipe definitions for correctness
 * 
 * Validates:
 * - All operator types are registered
 * - All connections reference existing nodes
 * - No circular dependencies exist
 * - Operator count is within limits
 * 
 * Requirements: 18.1, 18.2, 18.3, 17.7
 */
export class PipeValidator {
  constructor(private operatorRegistry: OperatorRegistry) {}

  /**
   * Validate a pipe definition
   * @param definition - The pipe definition to validate
   * @returns Validation result with errors if any
   */
  validate(definition: PipeDefinition): PipeValidationResult {
    const errors: PipeValidationError[] = [];

    // Validate basic structure
    const structureErrors = this.validateStructure(definition);
    errors.push(...structureErrors);

    // If structure is invalid, return early
    if (structureErrors.length > 0) {
      return { valid: false, errors };
    }

    // Validate operator count limit (Requirement 17.7)
    const countErrors = this.validateOperatorCount(definition);
    errors.push(...countErrors);

    // Validate all operator types are registered (Requirement 18.1)
    const operatorErrors = this.validateOperatorTypes(definition);
    errors.push(...operatorErrors);

    // Validate all connections reference existing nodes (Requirement 18.2)
    const connectionErrors = this.validateConnections(definition);
    errors.push(...connectionErrors);

    // Detect circular dependencies (Requirement 18.3)
    const cycleErrors = this.detectCycles(definition);
    errors.push(...cycleErrors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate basic structure of pipe definition
   */
  private validateStructure(definition: PipeDefinition): PipeValidationError[] {
    const errors: PipeValidationError[] = [];

    if (!definition) {
      errors.push({
        type: 'invalid_structure',
        message: 'Pipe definition is required',
      });
      return errors;
    }

    if (!Array.isArray(definition.nodes)) {
      errors.push({
        type: 'invalid_structure',
        message: 'Pipe definition must have nodes array',
      });
    }

    if (!Array.isArray(definition.edges)) {
      errors.push({
        type: 'invalid_structure',
        message: 'Pipe definition must have edges array',
      });
    }

    return errors;
  }

  /**
   * Validate operator count is within limits
   * Requirement 17.7: Reject pipes with > 50 operators
   */
  private validateOperatorCount(definition: PipeDefinition): PipeValidationError[] {
    const errors: PipeValidationError[] = [];

    if (definition.nodes.length > PIPE_LIMITS.maxOperators) {
      errors.push({
        type: 'operator_limit',
        message: `Maximum ${PIPE_LIMITS.maxOperators} operators per pipe (found ${definition.nodes.length})`,
      });
    }

    return errors;
  }

  /**
   * Validate all operator types are registered
   * Requirement 18.1: Validate all operator types are registered and known
   */
  private validateOperatorTypes(definition: PipeDefinition): PipeValidationError[] {
    const errors: PipeValidationError[] = [];

    for (const node of definition.nodes) {
      // Validate node has required fields
      if (!node.id || !node.type) {
        errors.push({
          type: 'invalid_structure',
          message: `Node is missing required fields (id or type)`,
          nodeId: node.id,
        });
        continue;
      }

      // Check if operator type is registered
      if (!this.operatorRegistry.has(node.type)) {
        errors.push({
          type: 'unknown_operator',
          message: `Unknown operator type: ${node.type}`,
          nodeId: node.id,
        });
      }
    }

    return errors;
  }

  /**
   * Validate all connections reference existing nodes
   * Requirement 18.2: Validate all connections reference existing node IDs
   */
  private validateConnections(definition: PipeDefinition): PipeValidationError[] {
    const errors: PipeValidationError[] = [];
    const nodeIds = new Set(definition.nodes.map(n => n.id));

    for (const edge of definition.edges) {
      // Validate edge has required fields
      if (!edge.source || !edge.target) {
        errors.push({
          type: 'invalid_structure',
          message: 'Edge is missing source or target',
          edgeId: edge.id,
        });
        continue;
      }

      // Check source node exists
      if (!nodeIds.has(edge.source)) {
        errors.push({
          type: 'invalid_connection',
          message: `Edge references non-existent source node: ${edge.source}`,
          edgeId: edge.id,
        });
      }

      // Check target node exists
      if (!nodeIds.has(edge.target)) {
        errors.push({
          type: 'invalid_connection',
          message: `Edge references non-existent target node: ${edge.target}`,
          edgeId: edge.id,
        });
      }
    }

    return errors;
  }

  /**
   * Detect circular dependencies in the pipe graph
   * Requirement 18.3: Validate no circular dependencies exist
   * 
   * Uses DFS with three-color marking:
   * - White (unvisited): not yet processed
   * - Gray (in progress): currently being processed (in recursion stack)
   * - Black (done): fully processed
   * 
   * A cycle exists if we encounter a gray node during DFS.
   */
  private detectCycles(definition: PipeDefinition): PipeValidationError[] {
    const errors: PipeValidationError[] = [];

    // Build adjacency list (source -> targets)
    const adjacencyList = new Map<string, string[]>();
    for (const node of definition.nodes) {
      adjacencyList.set(node.id, []);
    }
    for (const edge of definition.edges) {
      const targets = adjacencyList.get(edge.source);
      if (targets) {
        targets.push(edge.target);
      }
    }

    // Three-color marking for cycle detection
    const WHITE = 0; // Unvisited
    const GRAY = 1;  // In progress (in current DFS path)
    const BLACK = 2; // Fully processed

    const color = new Map<string, number>();
    for (const node of definition.nodes) {
      color.set(node.id, WHITE);
    }

    // Track the path for error reporting
    const path: string[] = [];

    const hasCycle = (nodeId: string): boolean => {
      color.set(nodeId, GRAY);
      path.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const neighborColor = color.get(neighbor);

        if (neighborColor === GRAY) {
          // Found a cycle - neighbor is in current path
          const cycleStart = path.indexOf(neighbor);
          const cyclePath = path.slice(cycleStart);
          cyclePath.push(neighbor); // Complete the cycle
          
          errors.push({
            type: 'cycle_detected',
            message: `Circular dependency detected: ${cyclePath.join(' -> ')}`,
            nodeId: neighbor,
          });
          return true;
        }

        if (neighborColor === WHITE) {
          if (hasCycle(neighbor)) {
            return true;
          }
        }
      }

      color.set(nodeId, BLACK);
      path.pop();
      return false;
    };

    // Run DFS from each unvisited node
    for (const node of definition.nodes) {
      if (color.get(node.id) === WHITE) {
        if (hasCycle(node.id)) {
          // Stop after finding first cycle to avoid duplicate errors
          break;
        }
      }
    }

    return errors;
  }
}

/**
 * Check if a pipe definition has cycles
 * Utility function for quick cycle check
 */
export function hasCycles(definition: PipeDefinition): boolean {
  // Build adjacency list
  const adjacencyList = new Map<string, string[]>();
  for (const node of definition.nodes) {
    adjacencyList.set(node.id, []);
  }
  for (const edge of definition.edges) {
    const targets = adjacencyList.get(edge.source);
    if (targets) {
      targets.push(edge.target);
    }
  }

  // Three-color marking
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;

  const color = new Map<string, number>();
  for (const node of definition.nodes) {
    color.set(node.id, WHITE);
  }

  const dfs = (nodeId: string): boolean => {
    color.set(nodeId, GRAY);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const neighborColor = color.get(neighbor);
      if (neighborColor === GRAY) {
        return true; // Cycle found
      }
      if (neighborColor === WHITE && dfs(neighbor)) {
        return true;
      }
    }

    color.set(nodeId, BLACK);
    return false;
  };

  for (const node of definition.nodes) {
    if (color.get(node.id) === WHITE) {
      if (dfs(node.id)) {
        return true;
      }
    }
  }

  return false;
}
