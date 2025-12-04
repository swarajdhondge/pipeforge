/**
 * Connection validation utilities for pipe canvas
 * 
 * Validates connections between operators to ensure:
 * - Source operators cannot have incoming connections
 * - Each operator can only have one input connection
 * - No circular connections (cycles) are allowed
 * 
 * Requirements: 3.6, 14.1, 14.2, 14.3
 */

import type { OperatorType } from '../types/operator.types';

export interface GraphNode {
  id: string;
  type?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface ConnectionValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Source operator types that cannot have incoming connections
 * These operators fetch data from external sources or accept user input
 */
export const SOURCE_OPERATOR_TYPES: OperatorType[] = [
  // Fetch operators (data sources)
  'fetch',
  'fetch-json',
  'fetch-csv',
  'fetch-rss',
  'fetch-page',
  // User input operators (parameter sources)
  'text-input',
  'number-input',
  'url-input',
  'date-input',
];

/**
 * Check if an operator type is a source operator
 * Source operators cannot have incoming connections
 * 
 * @param operatorType - The operator type to check
 * @returns True if the operator is a source type
 */
export function isSourceOperator(operatorType: string | undefined): boolean {
  if (!operatorType) return false;
  return SOURCE_OPERATOR_TYPES.includes(operatorType as OperatorType);
}

/**
 * Check if a connection would create a cycle in the graph
 * Uses DFS to detect if target can reach source (which would create a cycle)
 * 
 * @param sourceId - The source node ID of the new connection
 * @param targetId - The target node ID of the new connection
 * @param existingEdges - Array of existing edges in the graph
 * @returns True if the connection would create a cycle
 */
export function wouldCreateCycle(
  sourceId: string,
  targetId: string,
  existingEdges: GraphEdge[]
): boolean {
  // Build adjacency list from existing edges
  const adjacencyList = new Map<string, string[]>();
  
  existingEdges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
  });

  // Add the new connection temporarily
  if (!adjacencyList.has(sourceId)) {
    adjacencyList.set(sourceId, []);
  }
  adjacencyList.get(sourceId)!.push(targetId);

  // DFS to detect cycles starting from source
  const visited = new Set<string>();
  const recStack = new Set<string>();

  const hasCycle = (node: string): boolean => {
    visited.add(node);
    recStack.add(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true;
        }
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  };

  return hasCycle(sourceId);
}

/**
 * Find the cycle path that would be created by a connection
 * Returns the edge IDs that form the cycle
 * 
 * @param sourceId - The source node ID of the new connection
 * @param targetId - The target node ID of the new connection
 * @param existingEdges - Array of existing edges in the graph
 * @returns Array of edge IDs that form the cycle, or empty array if no cycle
 */
export function findCyclePath(
  sourceId: string,
  targetId: string,
  existingEdges: GraphEdge[]
): string[] {
  // Build adjacency list with edge IDs
  const adjacencyList = new Map<string, Array<{ target: string; edgeId: string }>>();
  
  existingEdges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push({ target: edge.target, edgeId: edge.id });
  });

  // DFS to find path from target back to source (which would complete the cycle)
  const visited = new Set<string>();
  const path: string[] = [];
  
  const findPath = (node: string): boolean => {
    if (node === sourceId) {
      return true; // Found the cycle
    }
    
    if (visited.has(node)) {
      return false;
    }
    
    visited.add(node);
    const neighbors = adjacencyList.get(node) || [];
    
    for (const { target, edgeId } of neighbors) {
      path.push(edgeId);
      if (findPath(target)) {
        return true;
      }
      path.pop();
    }
    
    return false;
  };

  // Start from target and try to reach source
  if (findPath(targetId)) {
    return path;
  }
  
  return [];
}

/**
 * Check if a node already has an incoming connection
 * 
 * @param nodeId - The node ID to check
 * @param existingEdges - Array of existing edges in the graph
 * @returns True if the node already has an incoming connection
 */
export function hasExistingInput(
  nodeId: string,
  existingEdges: GraphEdge[]
): boolean {
  return existingEdges.some(edge => edge.target === nodeId);
}

/**
 * Validate a connection between two nodes
 * 
 * Checks:
 * 1. Source operators cannot have incoming connections (Requirements 3.6, 14.1)
 * 2. Each operator can only have one input connection (Requirement 14.2)
 * 3. No circular connections are allowed (Requirement 14.3)
 * 
 * @param sourceNode - The source node of the connection
 * @param targetNode - The target node of the connection
 * @param existingEdges - Array of existing edges in the graph
 * @returns Validation result with error message if invalid
 */
export function validateConnection(
  sourceNode: GraphNode,
  targetNode: GraphNode,
  existingEdges: GraphEdge[]
): ConnectionValidationResult {
  // Rule 1: Prevent self-connections
  if (sourceNode.id === targetNode.id) {
    return {
      valid: false,
      error: 'Cannot connect an operator to itself',
    };
  }

  // Rule 2: Source operators cannot have incoming connections (Requirements 3.6, 14.1)
  if (isSourceOperator(targetNode.type)) {
    return {
      valid: false,
      error: 'Source operators cannot have incoming connections',
    };
  }

  // Rule 3: Single input only - no merging (Requirement 14.2)
  if (hasExistingInput(targetNode.id, existingEdges)) {
    return {
      valid: false,
      error: 'Operators can only have one input connection',
    };
  }

  // Rule 4: No circular connections (Requirement 14.3)
  if (wouldCreateCycle(sourceNode.id, targetNode.id, existingEdges)) {
    return {
      valid: false,
      error: 'Circular connections are not allowed',
    };
  }

  return { valid: true };
}

/**
 * Get the node that is the source of an existing input connection
 * 
 * @param nodeId - The node ID to check
 * @param existingEdges - Array of existing edges in the graph
 * @returns The source node ID if an input exists, null otherwise
 */
export function getInputSource(
  nodeId: string,
  existingEdges: GraphEdge[]
): string | null {
  const inputEdge = existingEdges.find(edge => edge.target === nodeId);
  return inputEdge ? inputEdge.source : null;
}
