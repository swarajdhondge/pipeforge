import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { PipeExecutor } from '../pipe-executor';
import { OperatorRegistry } from '../../operators/operator-registry';
import { PipeDefinition, Edge, OperatorType } from '../../types/operator.types';
import { BaseOperator } from '../../operators/base-operator';
import { ValidationResult, OperatorCategory } from '../../types/operator.types';
import { ExtractedSchema } from '../../types/schema.types';

/**
 * Mock operator for testing - simply passes through input or returns configured value
 */
class MockSourceOperator extends BaseOperator {
  type = 'mock-source';
  category: OperatorCategory = 'sources';
  description = 'Mock source operator for testing';

  async execute(_input: any, config: any): Promise<any> {
    return config?.value ?? [{ id: 1, name: 'test' }];
  }

  validate(): ValidationResult {
    return { valid: true };
  }

  getOutputSchema(): ExtractedSchema | null {
    return null;
  }
}

class MockTransformOperator extends BaseOperator {
  type = 'mock-transform';
  category: OperatorCategory = 'operators';
  description = 'Mock transform operator for testing';

  async execute(input: any, config: any): Promise<any> {
    if (config?.shouldFail) {
      throw new Error('Mock operator failure');
    }
    // Simply pass through input with optional transformation
    if (config?.addField) {
      if (Array.isArray(input)) {
        return input.map((item: any) => ({ ...item, transformed: true }));
      }
      return { ...input, transformed: true };
    }
    return input;
  }

  validate(): ValidationResult {
    return { valid: true };
  }

  getOutputSchema(inputSchema?: ExtractedSchema): ExtractedSchema | null {
    return inputSchema ?? null;
  }
}

/**
 * Helper to create a simple pipe definition for testing
 */
function createPipeDefinition(
  nodes: Array<{ id: string; type: string; config?: any }>,
  edges: Array<{ source: string; target: string }>
): PipeDefinition {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type as OperatorType,
      position: { x: 0, y: 0 },
      data: {
        label: n.id,
        config: n.config ?? {},
      },
    })),
    edges: edges.map((e, i) => ({
      id: `edge-${i}`,
      source: e.source,
      target: e.target,
    })),
  };
}

describe('PipeExecutor', () => {
  let registry: OperatorRegistry;
  let executor: PipeExecutor;

  beforeEach(() => {
    registry = new OperatorRegistry();
    registry.register(new MockSourceOperator());
    registry.register(new MockTransformOperator());
    executor = new PipeExecutor(registry);
  });

  describe('findUpstreamNodes() - Property Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 16: Upstream Traversal Completeness**
     * **Validates: Requirements 10.1**
     *
     * For any pipe graph and target node, the upstream traversal SHALL identify
     * ALL nodes that feed into the target.
     */
    it('Property 16: Upstream Traversal Completeness - all upstream nodes are found', () => {
      fc.assert(
        fc.property(
          // Generate a random DAG (directed acyclic graph)
          fc.integer({ min: 2, max: 10 }).chain((nodeCount) => {
            // Generate node IDs
            const nodeIds = Array.from({ length: nodeCount }, (_, i) => `node-${i}`);

            // Generate edges that form a DAG (only forward edges to prevent cycles)
            const edgeArb = fc.array(
              fc.tuple(
                fc.integer({ min: 0, max: nodeCount - 2 }),
                fc.integer({ min: 1, max: nodeCount - 1 })
              ).filter(([from, to]) => from < to),
              { minLength: 0, maxLength: nodeCount * 2 }
            ).map((edgePairs) => {
              // Remove duplicates
              const uniqueEdges = new Map<string, { source: string; target: string }>();
              for (const [from, to] of edgePairs) {
                const key = `${from}-${to}`;
                if (!uniqueEdges.has(key)) {
                  uniqueEdges.set(key, {
                    source: nodeIds[from],
                    target: nodeIds[to],
                  });
                }
              }
              return Array.from(uniqueEdges.values());
            });

            return fc.tuple(
              fc.constant(nodeIds),
              edgeArb,
              fc.integer({ min: 0, max: nodeCount - 1 })
            );
          }),
          ([nodeIds, edges, targetIndex]) => {
            const targetNodeId = nodeIds[targetIndex];
            const edgesWithIds: Edge[] = edges.map((e, i) => ({
              id: `edge-${i}`,
              source: e.source,
              target: e.target,
            }));

            // Find upstream nodes using the executor
            const upstream = executor.findUpstreamNodes(targetNodeId, edgesWithIds);

            // Verify: all nodes that can reach target should be in upstream
            // Use BFS to find all nodes that can reach target (ground truth)
            const canReachTarget = new Set<string>();
            const queue = [targetNodeId];
            const visited = new Set<string>();

            while (queue.length > 0) {
              const current = queue.shift()!;
              if (visited.has(current)) continue;
              visited.add(current);

              for (const edge of edgesWithIds) {
                if (edge.target === current && !canReachTarget.has(edge.source)) {
                  canReachTarget.add(edge.source);
                  queue.push(edge.source);
                }
              }
            }

            // The upstream set should match our ground truth
            return (
              upstream.size === canReachTarget.size &&
              Array.from(canReachTarget).every((id) => upstream.has(id))
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 16: Upstream Traversal - target node is not included in upstream', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (nodeCount) => {
            const nodeIds = Array.from({ length: nodeCount }, (_, i) => `node-${i}`);
            // Create a simple chain: node-0 -> node-1 -> ... -> node-n
            const edges: Edge[] = [];
            for (let i = 0; i < nodeCount - 1; i++) {
              edges.push({
                id: `edge-${i}`,
                source: nodeIds[i],
                target: nodeIds[i + 1],
              });
            }

            const targetNodeId = nodeIds[nodeCount - 1];
            const upstream = executor.findUpstreamNodes(targetNodeId, edges);

            // Target node should NOT be in upstream set
            return !upstream.has(targetNodeId);
          }
        ),
        { numRuns: 50 }
      );
    });
  });


  describe('executeSelected() - Property Tests', () => {
    /**
     * **Feature: yahoo-pipes-canvas, Property 17: Execution Order Correctness**
     * **Validates: Requirements 10.2**
     *
     * For any pipe subgraph, execution SHALL process operators in topological order
     * (upstream before downstream).
     */
    it('Property 17: Execution Order Correctness - upstream executes before downstream', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate chain length
          fc.integer({ min: 2, max: 6 }),
          async (chainLength) => {
            // Create a simple chain: source -> transform1 -> transform2 -> ... -> target
            const nodes: Array<{ id: string; type: string; config?: any }> = [];
            const edges: Array<{ source: string; target: string }> = [];

            // First node is a source
            nodes.push({ id: 'node-0', type: 'mock-source', config: { value: [{ step: 0 }] } });

            // Rest are transforms
            for (let i = 1; i < chainLength; i++) {
              nodes.push({ id: `node-${i}`, type: 'mock-transform', config: { addField: true } });
              edges.push({ source: `node-${i - 1}`, target: `node-${i}` });
            }

            const definition = createPipeDefinition(nodes, edges);
            const targetNodeId = `node-${chainLength - 1}`;

            const result = await executor.executeSelected(definition, targetNodeId);

            // Verify execution order: each node should appear after its dependencies
            const executionOrder = result.executionOrder;
            
            for (const edge of edges) {
              const sourceIndex = executionOrder.indexOf(edge.source);
              const targetIndex = executionOrder.indexOf(edge.target);
              
              // Source must execute before target
              if (sourceIndex === -1 || targetIndex === -1) {
                return false;
              }
              if (sourceIndex >= targetIndex) {
                return false;
              }
            }

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Property 17: Execution Order - all upstream nodes are executed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (chainLength) => {
            const nodes: Array<{ id: string; type: string; config?: any }> = [];
            const edges: Array<{ source: string; target: string }> = [];

            nodes.push({ id: 'node-0', type: 'mock-source', config: { value: [{ id: 1 }] } });

            for (let i = 1; i < chainLength; i++) {
              nodes.push({ id: `node-${i}`, type: 'mock-transform' });
              edges.push({ source: `node-${i - 1}`, target: `node-${i}` });
            }

            const definition = createPipeDefinition(nodes, edges);
            const targetNodeId = `node-${chainLength - 1}`;

            const result = await executor.executeSelected(definition, targetNodeId);

            // All nodes should be in execution order
            return result.executionOrder.length === chainLength;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('executeSelected() - Unit Tests', () => {
    it('should execute a simple chain correctly', async () => {
      const definition = createPipeDefinition(
        [
          { id: 'source', type: 'mock-source', config: { value: [{ id: 1 }] } },
          { id: 'transform', type: 'mock-transform', config: { addField: true } },
        ],
        [{ source: 'source', target: 'transform' }]
      );

      const result = await executor.executeSelected(definition, 'transform');

      expect(result.executionOrder).toEqual(['source', 'transform']);
      expect(result.finalResult).toEqual([{ id: 1, transformed: true }]);
      expect(result.intermediateResults['source'].status).toBe('success');
      expect(result.intermediateResults['transform'].status).toBe('success');
    });

    it('should only execute upstream nodes of target', async () => {
      // Create a diamond shape: A -> B, A -> C, B -> D, C -> D
      // If we target B, only A and B should execute
      const definition = createPipeDefinition(
        [
          { id: 'A', type: 'mock-source', config: { value: [{ id: 1 }] } },
          { id: 'B', type: 'mock-transform' },
          { id: 'C', type: 'mock-transform' },
          { id: 'D', type: 'mock-transform' },
        ],
        [
          { source: 'A', target: 'B' },
          { source: 'A', target: 'C' },
          { source: 'B', target: 'D' },
          { source: 'C', target: 'D' },
        ]
      );

      const result = await executor.executeSelected(definition, 'B');

      // Only A and B should be executed
      expect(result.executionOrder).toHaveLength(2);
      expect(result.executionOrder).toContain('A');
      expect(result.executionOrder).toContain('B');
      expect(result.executionOrder).not.toContain('C');
      expect(result.executionOrder).not.toContain('D');
    });

    it('should throw error for non-existent target node', async () => {
      const definition = createPipeDefinition(
        [{ id: 'source', type: 'mock-source' }],
        []
      );

      await expect(
        executor.executeSelected(definition, 'non-existent')
      ).rejects.toThrow('Target node non-existent not found');
    });

    it('should throw error for non-source operator without input', async () => {
      const definition = createPipeDefinition(
        [
          { id: 'transform', type: 'mock-transform' }, // No input connection
        ],
        []
      );

      await expect(
        executor.executeSelected(definition, 'transform')
      ).rejects.toThrow('has no input connection');
    });

    it('should preserve intermediate results on failure (Requirement 16.6)', async () => {
      const definition = createPipeDefinition(
        [
          { id: 'source', type: 'mock-source', config: { value: [{ id: 1 }] } },
          { id: 'transform1', type: 'mock-transform', config: { addField: true } },
          { id: 'transform2', type: 'mock-transform', config: { shouldFail: true } },
        ],
        [
          { source: 'source', target: 'transform1' },
          { source: 'transform1', target: 'transform2' },
        ]
      );

      try {
        await executor.executeSelected(definition, 'transform2');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        // Verify intermediate results are preserved
        expect(error.intermediateResults).toBeDefined();
        expect(error.intermediateResults['source'].status).toBe('success');
        expect(error.intermediateResults['transform1'].status).toBe('success');
        expect(error.intermediateResults['transform2'].status).toBe('error');
        expect(error.intermediateResults['transform2'].error).toBe('Mock operator failure');
        
        // Verify last successful result is available
        expect(error.lastSuccessfulResult).toEqual([{ id: 1, transformed: true }]);
      }
    });
  });

  describe('validateOperatorInputs() - Unit Tests', () => {
    it('should allow source operators without input', async () => {
      const definition = createPipeDefinition(
        [{ id: 'source', type: 'mock-source' }],
        []
      );

      // Should not throw
      const result = await executor.executeSelected(definition, 'source');
      expect(result.finalResult).toBeDefined();
    });

    it('should reject non-source operators without input', async () => {
      const definition = createPipeDefinition(
        [{ id: 'transform', type: 'mock-transform' }],
        []
      );

      await expect(
        executor.executeSelected(definition, 'transform')
      ).rejects.toThrow('has no input connection');
    });
  });
});


/**
 * Mock user input operator for testing user input injection
 */
class MockTextInputOperator extends BaseOperator {
  type = 'text-input';
  category: OperatorCategory = 'user-inputs';
  description = 'Mock text input operator for testing';

  async execute(_input: any, config: any, context?: any): Promise<string> {
    // Get value from execution context (userInputs) or fall back to defaultValue
    let value: string | undefined;
    
    if (context?.userInputs && config.label && context.userInputs[config.label] !== undefined) {
      value = String(context.userInputs[config.label]);
    } else {
      value = config.defaultValue;
    }

    // Validate required field
    if (config.required && (value === undefined || value === null || value.trim() === '')) {
      throw new Error(`Text input "${config.label}" is required`);
    }

    return value ?? '';
  }

  validate(): ValidationResult {
    return { valid: true };
  }

  getOutputSchema(): ExtractedSchema | null {
    return null;
  }
}

class MockNumberInputOperator extends BaseOperator {
  type = 'number-input';
  category: OperatorCategory = 'user-inputs';
  description = 'Mock number input operator for testing';

  async execute(_input: any, config: any, context?: any): Promise<number> {
    let rawValue: number | string | undefined;
    
    if (context?.userInputs && config.label && context.userInputs[config.label] !== undefined) {
      rawValue = context.userInputs[config.label];
    } else {
      rawValue = config.defaultValue;
    }

    if (config.required && (rawValue === undefined || rawValue === null || rawValue === '')) {
      throw new Error(`Number input "${config.label}" is required`);
    }

    if (rawValue === undefined || rawValue === null || rawValue === '') {
      return 0;
    }

    const value = typeof rawValue === 'string' ? parseFloat(rawValue) : rawValue;

    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Number input "${config.label}" must be a valid number`);
    }

    if (config.min !== undefined && value < config.min) {
      throw new Error(`Number input "${config.label}" must be at least ${config.min}`);
    }

    if (config.max !== undefined && value > config.max) {
      throw new Error(`Number input "${config.label}" must be at most ${config.max}`);
    }

    return value;
  }

  validate(): ValidationResult {
    return { valid: true };
  }

  getOutputSchema(): ExtractedSchema | null {
    return null;
  }
}

describe('PipeExecutor - User Input Injection', () => {
  let registry: OperatorRegistry;
  let executor: PipeExecutor;

  beforeEach(() => {
    registry = new OperatorRegistry();
    registry.register(new MockTextInputOperator());
    registry.register(new MockNumberInputOperator());
    registry.register(new MockTransformOperator());
    executor = new PipeExecutor(registry);
  });

  /**
   * Test user input value injection
   * Requirements: 4.5, 4.6
   */
  it('should inject user input values from execution context', async () => {
    const definition = createPipeDefinition(
      [
        { 
          id: 'text-input-1', 
          type: 'text-input', 
          config: { label: 'Search Term', defaultValue: 'default' } 
        },
      ],
      []
    );

    // Execute with user input values
    const result = await executor.executeSelected(definition, 'text-input-1', {
      userInputs: {
        'Search Term': 'custom value',
      },
    });

    expect(result.finalResult).toBe('custom value');
  });

  it('should use default value when user input not provided', async () => {
    const definition = createPipeDefinition(
      [
        { 
          id: 'text-input-1', 
          type: 'text-input', 
          config: { label: 'Search Term', defaultValue: 'default value' } 
        },
      ],
      []
    );

    // Execute without user input values
    const result = await executor.executeSelected(definition, 'text-input-1');

    expect(result.finalResult).toBe('default value');
  });

  it('should inject number input values with validation', async () => {
    const definition = createPipeDefinition(
      [
        { 
          id: 'number-input-1', 
          type: 'number-input', 
          config: { label: 'Count', min: 1, max: 100, defaultValue: 10 } 
        },
      ],
      []
    );

    // Execute with user input values
    const result = await executor.executeSelected(definition, 'number-input-1', {
      userInputs: {
        'Count': 50,
      },
    });

    expect(result.finalResult).toBe(50);
  });

  it('should throw error when required user input is missing', async () => {
    const definition = createPipeDefinition(
      [
        { 
          id: 'text-input-1', 
          type: 'text-input', 
          config: { label: 'Required Field', required: true } 
        },
      ],
      []
    );

    // Execute without providing required input
    await expect(
      executor.executeSelected(definition, 'text-input-1')
    ).rejects.toThrow('is required');
  });

  it('should throw error when number input violates constraints', async () => {
    const definition = createPipeDefinition(
      [
        { 
          id: 'number-input-1', 
          type: 'number-input', 
          config: { label: 'Count', min: 1, max: 10 } 
        },
      ],
      []
    );

    // Execute with value exceeding max
    await expect(
      executor.executeSelected(definition, 'number-input-1', {
        userInputs: {
          'Count': 100,
        },
      })
    ).rejects.toThrow('must be at most 10');
  });
});
