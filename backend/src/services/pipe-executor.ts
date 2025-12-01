import { OperatorRegistry } from '../operators/operator-registry';
import { PipeDefinition, ExecutionContext, Edge } from '../types/operator.types';
import logger from '../utils/logger';
import { enforceOutputLimit, MAX_OUTPUT_SIZE } from '../utils/output-limiter';

/**
 * Execution limits for security
 * Requirements: 17.5, 17.6
 */
const EXECUTION_LIMITS = {
  /** Maximum execution time for full pipe (5 minutes) */
  MAX_PIPE_EXECUTION_TIME: 5 * 60 * 1000,
  /** Maximum execution time for individual operator (30 seconds) - enforced by axios timeout */
  MAX_OPERATOR_EXECUTION_TIME: 30 * 1000,
  /** Maximum output size per operator (1MB) */
  MAX_OUTPUT_SIZE: MAX_OUTPUT_SIZE,
};

/**
 * Execution result with intermediate results for each operator
 */
export interface ExecutionResult {
  finalResult: any;
  intermediateResults: Record<string, IntermediateResult>;
  executionOrder: string[];
  totalExecutionTime: number;
}

export interface IntermediateResult {
  nodeId: string;
  type: string;
  label: string;
  result: any;
  executionTime: number;
  status: 'success' | 'error';
  error?: string;
}

/**
 * Source operator types that don't require input connections
 */
const SOURCE_OPERATOR_TYPES = [
  'fetch',
  'fetch-json',
  'fetch-csv',
  'fetch-rss',
  'fetch-page',
  'text-input',
  'number-input',
  'url-input',
  'date-input',
];

/**
 * PipeExecutor - Executes pipe definitions
 * 
 * Features:
 * - Build execution graph from definition
 * - Topological sort for execution order
 * - Cycle detection
 * - Execute operators in sequence
 * - Store intermediate results
 * - Return detailed execution results with timing
 * 
 * Requirements: 10, 11
 */
export class PipeExecutor {
  constructor(private operatorRegistry: OperatorRegistry) {}

  /**
   * Execute a pipe definition and return detailed results
   * @param definition - Pipe definition with nodes and edges
   * @param context - Execution context (optional, for secrets support)
   * @returns Detailed execution result with intermediate results
   */
  async executeWithDetails(definition: PipeDefinition, context?: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    // Validate pipe has nodes
    if (!definition.nodes || definition.nodes.length === 0) {
      throw new Error('Pipe has no operators');
    }

    // Build execution graph
    const graph = this.buildGraph(definition);

    // Topological sort to get execution order
    const executionOrder = this.topologicalSort(graph);

    // Execute operators in order
    const results = new Map<string, any>();
    const intermediateResults: Record<string, IntermediateResult> = {};

    for (const nodeId of executionOrder) {
      // Check for execution timeout (Requirement 17.5)
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > EXECUTION_LIMITS.MAX_PIPE_EXECUTION_TIME) {
        const timeoutError = new Error(
          `Execution timeout: Pipe took too long to complete (exceeded ${EXECUTION_LIMITS.MAX_PIPE_EXECUTION_TIME / 1000 / 60} minutes)`
        );
        (timeoutError as any).nodeId = nodeId;
        (timeoutError as any).intermediateResults = intermediateResults;
        (timeoutError as any).totalExecutionTime = elapsedTime;
        
        logger.error('Pipe execution timeout', {
          elapsedTime,
          maxTime: EXECUTION_LIMITS.MAX_PIPE_EXECUTION_TIME,
          nodeId,
        });
        
        throw timeoutError;
      }

      const node = definition.nodes.find((n) => n.id === nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found in definition`);
      }

      // Get operator
      const operator = this.operatorRegistry.get(node.type);
      if (!operator) {
        throw new Error(`Unknown operator type: ${node.type}`);
      }

      // Get input from previous operator
      const input = this.getInput(nodeId, definition.edges, results);

      // Execute operator with timing
      const operatorStartTime = Date.now();
      
      try {
        let result = await operator.execute(input, node.data.config, context);
        
        // Enforce output size limit (Requirement 17.6)
        const limitResult = enforceOutputLimit(result, EXECUTION_LIMITS.MAX_OUTPUT_SIZE);
        if (limitResult.truncated) {
          logger.warn('Operator output truncated', {
            nodeId,
            type: node.type,
            originalSize: limitResult.originalSize,
            finalSize: limitResult.finalSize,
            originalCount: limitResult.originalCount,
            finalCount: limitResult.finalCount,
          });
          result = limitResult.output;
        }
        
        results.set(nodeId, result);

        const operatorExecutionTime = Date.now() - operatorStartTime;

        // Store intermediate result
        intermediateResults[nodeId] = {
          nodeId,
          type: node.type,
          label: node.data.label || node.type,
          result,
          executionTime: operatorExecutionTime,
          status: 'success',
        };

      } catch (error) {
        const operatorExecutionTime = Date.now() - operatorStartTime;
        const errorMessage = (error as Error).message;

        // Store error in intermediate results
        intermediateResults[nodeId] = {
          nodeId,
          type: node.type,
          label: node.data.label || node.type,
          result: null,
          executionTime: operatorExecutionTime,
          status: 'error',
          error: errorMessage,
        };

        logger.error('Operator execution failed', {
          nodeId,
          type: node.type,
          error: errorMessage,
        });

        // Re-throw with node info for better error handling
        const enhancedError = new Error(`Operator ${nodeId} (${node.type}) failed: ${errorMessage}`);
        (enhancedError as any).nodeId = nodeId;
        (enhancedError as any).operatorType = node.type;
        (enhancedError as any).intermediateResults = intermediateResults;
        throw enhancedError;
      }
    }

    // Get final result (last operator's output)
    const finalNodeId = executionOrder[executionOrder.length - 1];
    const finalResult = results.get(finalNodeId);
    const totalExecutionTime = Date.now() - startTime;

    return {
      finalResult,
      intermediateResults,
      executionOrder,
      totalExecutionTime,
    };
  }

  /**
   * Execute a pipe definition (legacy method for backward compatibility)
   * @param definition - Pipe definition with nodes and edges
   * @param context - Execution context (optional, for secrets support)
   * @returns Final execution result only
   */
  async execute(definition: PipeDefinition, context?: ExecutionContext): Promise<any> {
    const result = await this.executeWithDetails(definition, context);
    return result.finalResult;
  }

  /**
   * Build execution graph from pipe definition
   * @param definition - Pipe definition
   * @returns Graph mapping node IDs to their dependencies
   */
  private buildGraph(definition: PipeDefinition): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    // Initialize all nodes with empty dependencies
    for (const node of definition.nodes) {
      graph.set(node.id, []);
    }

    // Add dependencies based on edges
    for (const edge of definition.edges) {
      const deps = graph.get(edge.target) || [];
      deps.push(edge.source);
      graph.set(edge.target, deps);
    }

    return graph;
  }

  /**
   * Topological sort using Kahn's algorithm
   * @param graph - Execution graph
   * @returns Sorted array of node IDs
   */
  private topologicalSort(graph: Map<string, string[]>): string[] {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Calculate in-degrees
    for (const [node, deps] of graph.entries()) {
      inDegree.set(node, deps.length);
      if (deps.length === 0) {
        queue.push(node);
      }
    }

    // Process queue
    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);

      // Reduce in-degree of dependent nodes
      for (const [n, deps] of graph.entries()) {
        if (deps.includes(node)) {
          const degree = inDegree.get(n)! - 1;
          inDegree.set(n, degree);
          if (degree === 0) {
            queue.push(n);
          }
        }
      }
    }

    // Check for cycles
    if (result.length !== graph.size) {
      throw new Error('Cycle detected in pipe definition');
    }

    return result;
  }

  /**
   * Get input for a node from previous operator's result
   * @param nodeId - Node ID
   * @param edges - Pipe edges
   * @param results - Execution results map
   * @returns Input data or null
   */
  private getInput(
    nodeId: string,
    edges: Array<{ id: string; source: string; target: string }>,
    results: Map<string, any>
  ): any {
    const incomingEdge = edges.find((e) => e.target === nodeId);
    if (!incomingEdge) {
      return null;
    }
    return results.get(incomingEdge.source);
  }

  /**
   * Execute a pipe from a specific target node, tracing back through all upstream sources
   * This implements the "Run Selected" feature from Yahoo Pipes
   * 
   * @param definition - Full pipe definition with nodes and edges
   * @param targetNodeId - The node to execute up to
   * @param context - Execution context (optional, for secrets and user inputs)
   * @returns Detailed execution result with intermediate results
   * 
   * Requirements: 10.1, 10.2
   */
  async executeSelected(
    definition: PipeDefinition,
    targetNodeId: string,
    context?: ExecutionContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Validate target node exists
    const targetNode = definition.nodes.find((n) => n.id === targetNodeId);
    if (!targetNode) {
      throw new Error(`Target node ${targetNodeId} not found in pipe definition`);
    }

    // Find all upstream nodes using BFS traversal
    const upstreamNodeIds = this.findUpstreamNodes(targetNodeId, definition.edges);
    
    // Include target node in the subgraph
    const relevantNodeIds = new Set([targetNodeId, ...upstreamNodeIds]);

    // Build subgraph with only relevant nodes and edges
    const subgraph = this.buildSubgraph(definition, relevantNodeIds);

    // Validate non-source operators have input (Requirement 10.3)
    this.validateOperatorInputs(subgraph);

    // Execute the subgraph
    return this.executeSubgraph(subgraph, context, startTime);
  }

  /**
   * Find all upstream nodes from a target node using BFS traversal
   * @param targetNodeId - The target node ID
   * @param edges - All edges in the pipe
   * @returns Set of upstream node IDs
   * 
   * Requirements: 10.1
   */
  findUpstreamNodes(targetNodeId: string, edges: Edge[]): Set<string> {
    const upstream = new Set<string>();
    const queue: string[] = [targetNodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (visited.has(currentId)) {
        continue;
      }
      visited.add(currentId);

      // Find all edges where current node is the target (incoming edges)
      const incomingEdges = edges.filter((e) => e.target === currentId);

      for (const edge of incomingEdges) {
        if (!upstream.has(edge.source)) {
          upstream.add(edge.source);
          queue.push(edge.source);
        }
      }
    }

    return upstream;
  }

  /**
   * Build a subgraph containing only the specified nodes and their connecting edges
   * @param definition - Full pipe definition
   * @param relevantNodeIds - Set of node IDs to include
   * @returns Subgraph pipe definition
   */
  private buildSubgraph(
    definition: PipeDefinition,
    relevantNodeIds: Set<string>
  ): PipeDefinition {
    return {
      nodes: definition.nodes.filter((n) => relevantNodeIds.has(n.id)),
      edges: definition.edges.filter(
        (e) => relevantNodeIds.has(e.source) && relevantNodeIds.has(e.target)
      ),
      viewport: definition.viewport,
    };
  }

  /**
   * Validate that non-source operators have input connections
   * @param definition - Pipe definition to validate
   * @throws Error if a non-source operator has no input
   * 
   * Requirements: 10.3
   */
  private validateOperatorInputs(definition: PipeDefinition): void {
    for (const node of definition.nodes) {
      // Check if operator type is in the source list
      const isSourceByType = SOURCE_OPERATOR_TYPES.includes(node.type);
      
      // Also check operator category from registry (for custom operators)
      const operator = this.operatorRegistry.get(node.type);
      const isSourceByCategory = operator?.category === 'sources' || operator?.category === 'user-inputs';
      
      const isSourceOperator = isSourceByType || isSourceByCategory;
      
      if (!isSourceOperator) {
        // Check if this node has an incoming edge
        const hasInput = definition.edges.some((e) => e.target === node.id);
        
        if (!hasInput) {
          throw new Error(
            `Operator "${node.data.label || node.id}" (${node.type}) has no input connection. ` +
            `Non-source operators require an upstream connection.`
          );
        }
      }
    }
  }

  /**
   * Execute a subgraph and return results, preserving intermediate results on failure
   * @param definition - Subgraph pipe definition
   * @param context - Execution context
   * @param startTime - Execution start time
   * @returns Execution result with intermediate results
   * 
   * Requirements: 16.6
   */
  private async executeSubgraph(
    definition: PipeDefinition,
    context: ExecutionContext | undefined,
    startTime: number
  ): Promise<ExecutionResult> {
    // Validate pipe has nodes
    if (!definition.nodes || definition.nodes.length === 0) {
      throw new Error('Pipe has no operators');
    }

    // Build execution graph
    const graph = this.buildGraph(definition);

    // Topological sort to get execution order
    const executionOrder = this.topologicalSort(graph);

    // Execute operators in order
    const results = new Map<string, any>();
    const intermediateResults: Record<string, IntermediateResult> = {};
    let lastSuccessfulNodeId: string | null = null;

    for (const nodeId of executionOrder) {
      // Check for execution timeout (Requirement 17.5)
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > EXECUTION_LIMITS.MAX_PIPE_EXECUTION_TIME) {
        const timeoutError = new Error(
          `Execution timeout: Pipe took too long to complete (exceeded ${EXECUTION_LIMITS.MAX_PIPE_EXECUTION_TIME / 1000 / 60} minutes)`
        );
        (timeoutError as any).nodeId = nodeId;
        (timeoutError as any).intermediateResults = intermediateResults;
        (timeoutError as any).executionOrder = executionOrder;
        (timeoutError as any).totalExecutionTime = elapsedTime;
        (timeoutError as any).lastSuccessfulResult = lastSuccessfulNodeId 
          ? results.get(lastSuccessfulNodeId) 
          : null;
        
        logger.error('Pipe execution timeout', {
          elapsedTime,
          maxTime: EXECUTION_LIMITS.MAX_PIPE_EXECUTION_TIME,
          nodeId,
        });
        
        throw timeoutError;
      }

      const node = definition.nodes.find((n) => n.id === nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found in definition`);
      }

      // Get operator
      const operator = this.operatorRegistry.get(node.type);
      if (!operator) {
        throw new Error(`Unknown operator type: ${node.type}`);
      }

      // Get input from previous operator
      const input = this.getInput(nodeId, definition.edges, results);

      // Execute operator with timing
      const operatorStartTime = Date.now();

      try {
        let result = await operator.execute(input, node.data.config, context);
        
        // Enforce output size limit (Requirement 17.6)
        const limitResult = enforceOutputLimit(result, EXECUTION_LIMITS.MAX_OUTPUT_SIZE);
        if (limitResult.truncated) {
          logger.warn('Operator output truncated', {
            nodeId,
            type: node.type,
            originalSize: limitResult.originalSize,
            finalSize: limitResult.finalSize,
            originalCount: limitResult.originalCount,
            finalCount: limitResult.finalCount,
          });
          result = limitResult.output;
        }
        
        results.set(nodeId, result);
        lastSuccessfulNodeId = nodeId;

        const operatorExecutionTime = Date.now() - operatorStartTime;

        // Store intermediate result
        intermediateResults[nodeId] = {
          nodeId,
          type: node.type,
          label: node.data.label || node.type,
          result,
          executionTime: operatorExecutionTime,
          status: 'success',
        };
      } catch (error) {
        const operatorExecutionTime = Date.now() - operatorStartTime;
        const errorMessage = (error as Error).message;

        // Store error in intermediate results (Requirement 16.6 - preserve successful upstream results)
        intermediateResults[nodeId] = {
          nodeId,
          type: node.type,
          label: node.data.label || node.type,
          result: null,
          executionTime: operatorExecutionTime,
          status: 'error',
          error: errorMessage,
        };

        logger.error('Operator execution failed', {
          nodeId,
          type: node.type,
          error: errorMessage,
        });

        // Return partial results with error info (Requirement 16.6)
        const totalExecutionTime = Date.now() - startTime;
        
        // Create enhanced error with intermediate results
        const enhancedError = new Error(`Operator ${nodeId} (${node.type}) failed: ${errorMessage}`);
        (enhancedError as any).nodeId = nodeId;
        (enhancedError as any).operatorType = node.type;
        (enhancedError as any).intermediateResults = intermediateResults;
        (enhancedError as any).executionOrder = executionOrder;
        (enhancedError as any).totalExecutionTime = totalExecutionTime;
        (enhancedError as any).lastSuccessfulResult = lastSuccessfulNodeId 
          ? results.get(lastSuccessfulNodeId) 
          : null;
        
        throw enhancedError;
      }
    }

    // Get final result (last operator's output)
    const finalNodeId = executionOrder[executionOrder.length - 1];
    const finalResult = results.get(finalNodeId);
    const totalExecutionTime = Date.now() - startTime;

    return {
      finalResult,
      intermediateResults,
      executionOrder,
      totalExecutionTime,
    };
  }
}
