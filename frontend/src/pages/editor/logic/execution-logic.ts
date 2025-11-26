/**
 * Execution Logic
 * Requirements: 5.3
 * 
 * Handles pipe execution and result handling
 */

import type { Node, Edge } from 'reactflow';
import { executionService, type ExecuteDefinitionResult } from '../../../services/execution-service';

/**
 * Execute pipe definition
 */
export const executePipe = async (
  nodes: Node[],
  edges: Edge[],
  userInputs?: Record<string, string | number | undefined>
): Promise<ExecuteDefinitionResult> => {
  // Convert ReactFlow nodes/edges to pipe definition format
  const definition = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type || 'unknown',
      position: node.position,
      data: {
        label: node.data?.label || '',
        config: node.data?.config || {},
      },
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };

  // Execute the pipe
  const result = await executionService.executeDefinition(definition, 'sync', userInputs);
  
  return result;
};

/**
 * Execute from a specific node (Run Selected)
 * Requirement 8.2, 8.3 - Execute upstream subgraph
 */
export const executeSelected = async (
  nodes: Node[],
  edges: Edge[],
  targetNodeId: string,
  userInputs?: Record<string, string | number | undefined>
): Promise<ExecuteDefinitionResult> => {
  // Convert ReactFlow nodes/edges to pipe definition format
  const definition = {
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type || 'unknown',
      position: node.position,
      data: {
        label: node.data?.label || '',
        config: node.data?.config || {},
      },
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };

  // Execute from the selected node
  const result = await executionService.executeSelected(definition, targetNodeId, userInputs);
  
  return result;
};

/**
 * Format execution result for display
 */
export const formatExecutionResult = (result: ExecuteDefinitionResult) => {
  if (result.status === 'completed') {
    return {
      status: 'success' as const,
      result: result.finalResult,
      intermediateResults: result.intermediateResults,
      executionOrder: result.executionOrder,
      executionTime: result.totalExecutionTime || result.executionTime,
    };
  } else {
    return {
      status: 'error' as const,
      error: result.error || 'Execution failed',
      intermediateResults: result.intermediateResults,
      executionOrder: result.executionOrder,
      executionTime: result.totalExecutionTime || result.executionTime,
      failedNodeId: result.nodeId,
      failedOperatorType: result.operatorType,
    };
  }
};

/**
 * Validate pipe before execution
 */
export const validatePipeForExecution = (nodes: Node[], edges: Edge[]): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check if pipe has nodes
  if (nodes.length === 0) {
    errors.push('Pipe must have at least one operator');
  }

  // Check for disconnected nodes (except source nodes)
  const connectedNodeIds = new Set<string>();
  edges.forEach(edge => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  // Source nodes don't need incoming connections
  const sourceTypes = ['fetch-json', 'fetch-csv', 'fetch-rss', 'fetch-page', 'text-input', 'number-input', 'url-input', 'date-input'];
  
  nodes.forEach(node => {
    const isSourceNode = sourceTypes.includes(node.type || '');
    if (!isSourceNode && !connectedNodeIds.has(node.id)) {
      errors.push(`Node "${node.data?.label || node.id}" is not connected`);
    }
  });

  // Check for pipe-output node
  const hasPipeOutput = nodes.some(node => node.type === 'pipe-output');
  if (!hasPipeOutput) {
    errors.push('Pipe must have a Pipe Output node');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
