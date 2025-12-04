/**
 * Property-based tests for connection validation
 * 
 * Tests the connection validator utility to ensure:
 * - Source operators cannot have incoming connections (Property 18)
 * - Each operator can only have one input connection (Property 19)
 * - No circular connections are allowed (Property 20)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateConnection,
  isSourceOperator,
  wouldCreateCycle,
  hasExistingInput,
  SOURCE_OPERATOR_TYPES,
  type GraphEdge,
} from '../connection-validator';

// Arbitrary for generating node IDs
const nodeIdArb = fc.string({ minLength: 1, maxLength: 10 })
  .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
  .map(s => `node_${s}`);

// Arbitrary for generating source operator types
const sourceOperatorTypeArb = fc.constantFrom(...SOURCE_OPERATOR_TYPES);

// Arbitrary for generating non-source operator types
const nonSourceOperatorTypes = ['filter', 'sort', 'transform', 'unique', 'truncate', 'tail', 'rename', 'string-replace', 'regex', 'substring', 'url-builder', 'pipe-output'] as const;
const nonSourceOperatorTypeArb = fc.constantFrom(...nonSourceOperatorTypes);

// Arbitrary for generating any operator type
const anyOperatorTypeArb = fc.oneof(sourceOperatorTypeArb, nonSourceOperatorTypeArb);

// Arbitrary for generating a graph node
const graphNodeArb = (operatorType: fc.Arbitrary<string>) => 
  fc.tuple(nodeIdArb, operatorType).map(([id, type]) => ({
    id,
    type,
  }));

// Arbitrary for generating a graph edge
const graphEdgeArb = fc.tuple(nodeIdArb, nodeIdArb)
  .filter(([source, target]) => source !== target)
  .map(([source, target]) => ({
    id: `e_${source}_${target}`,
    source,
    target,
  }));

describe('Connection Validator - Property Tests', () => {
  /**
   * **Feature: pipe-forge-canvas, Property 18: Source Connection Rejection**
   * **Validates: Requirements 3.6, 14.1**
   * 
   * Property: For any source operator type, attempting to create an incoming 
   * connection SHALL be rejected.
   */
  describe('Property 18: Source Connection Rejection', () => {
    it('should reject connections to any source operator type', () => {
      fc.assert(
        fc.property(
          graphNodeArb(nonSourceOperatorTypeArb), // source node (non-source type)
          graphNodeArb(sourceOperatorTypeArb),    // target node (source type)
          fc.array(graphEdgeArb, { maxLength: 10 }),
          (sourceNode, targetNode, existingEdges) => {
            // Ensure nodes have different IDs
            if (sourceNode.id === targetNode.id) return true;
            
            const result = validateConnection(sourceNode, targetNode, existingEdges);
            
            // Connection to source operator should always be rejected
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Source operators cannot have incoming connections');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify all source operator types', () => {
      fc.assert(
        fc.property(
          sourceOperatorTypeArb,
          (operatorType) => {
            expect(isSourceOperator(operatorType)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly identify non-source operator types', () => {
      fc.assert(
        fc.property(
          nonSourceOperatorTypeArb,
          (operatorType) => {
            expect(isSourceOperator(operatorType)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow connections to non-source operators', () => {
      fc.assert(
        fc.property(
          graphNodeArb(anyOperatorTypeArb),
          graphNodeArb(nonSourceOperatorTypeArb),
          (sourceNode, targetNode) => {
            // Ensure nodes have different IDs
            if (sourceNode.id === targetNode.id) return true;
            
            // No existing edges, so no single-input or cycle violations
            const result = validateConnection(sourceNode, targetNode, []);
            
            // Connection to non-source operator should be allowed
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: pipe-forge-canvas, Property 19: Single Input Enforcement**
   * **Validates: Requirements 14.2**
   * 
   * Property: For any operator with an existing input connection, attempting 
   * to create a second input SHALL be rejected.
   */
  describe('Property 19: Single Input Enforcement', () => {
    it('should reject second input connection to any operator', () => {
      fc.assert(
        fc.property(
          graphNodeArb(anyOperatorTypeArb),       // first source
          graphNodeArb(anyOperatorTypeArb),       // second source
          graphNodeArb(nonSourceOperatorTypeArb), // target (non-source)
          (firstSource, secondSource, targetNode) => {
            // Ensure all nodes have different IDs
            if (firstSource.id === targetNode.id || 
                secondSource.id === targetNode.id ||
                firstSource.id === secondSource.id) {
              return true;
            }
            
            // Create existing edge from first source to target
            const existingEdge: GraphEdge = {
              id: `e_${firstSource.id}_${targetNode.id}`,
              source: firstSource.id,
              target: targetNode.id,
            };
            
            // Try to connect second source to same target
            const result = validateConnection(secondSource, targetNode, [existingEdge]);
            
            // Second connection should be rejected
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Operators can only have one input connection');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly detect existing input connections', () => {
      fc.assert(
        fc.property(
          nodeIdArb,
          nodeIdArb,
          (sourceId, targetId) => {
            if (sourceId === targetId) return true;
            
            const edge: GraphEdge = {
              id: `e_${sourceId}_${targetId}`,
              source: sourceId,
              target: targetId,
            };
            
            // Target should have existing input
            expect(hasExistingInput(targetId, [edge])).toBe(true);
            
            // Source should not have existing input (it's the source)
            expect(hasExistingInput(sourceId, [edge])).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow first input connection', () => {
      fc.assert(
        fc.property(
          graphNodeArb(anyOperatorTypeArb),
          graphNodeArb(nonSourceOperatorTypeArb),
          (sourceNode, targetNode) => {
            if (sourceNode.id === targetNode.id) return true;
            
            // No existing edges
            const result = validateConnection(sourceNode, targetNode, []);
            
            // First connection should be allowed
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: pipe-forge-canvas, Property 20: Cycle Detection**
   * **Validates: Requirements 14.3**
   * 
   * Property: For any pipe graph, attempting to create a connection that 
   * would form a cycle SHALL be rejected.
   */
  describe('Property 20: Cycle Detection', () => {
    it('should reject direct self-connections', () => {
      fc.assert(
        fc.property(
          graphNodeArb(nonSourceOperatorTypeArb),
          (node) => {
            const result = validateConnection(node, node, []);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Cannot connect an operator to itself');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject connections that create a 2-node cycle (A -> B -> A)', () => {
      fc.assert(
        fc.property(
          graphNodeArb(nonSourceOperatorTypeArb),
          graphNodeArb(nonSourceOperatorTypeArb),
          (nodeA, nodeB) => {
            if (nodeA.id === nodeB.id) return true;
            
            // Existing edge: A -> B
            const existingEdge: GraphEdge = {
              id: `e_${nodeA.id}_${nodeB.id}`,
              source: nodeA.id,
              target: nodeB.id,
            };
            
            // Try to create B -> A (would create cycle)
            const result = validateConnection(nodeB, nodeA, [existingEdge]);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Circular connections are not allowed');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject connections that create a 3-node cycle (A -> B -> C -> A)', () => {
      fc.assert(
        fc.property(
          graphNodeArb(nonSourceOperatorTypeArb),
          graphNodeArb(nonSourceOperatorTypeArb),
          graphNodeArb(nonSourceOperatorTypeArb),
          (nodeA, nodeB, nodeC) => {
            // Ensure all nodes have different IDs
            if (nodeA.id === nodeB.id || nodeB.id === nodeC.id || nodeA.id === nodeC.id) {
              return true;
            }
            
            // Existing edges: A -> B -> C
            const existingEdges: GraphEdge[] = [
              { id: `e_${nodeA.id}_${nodeB.id}`, source: nodeA.id, target: nodeB.id },
              { id: `e_${nodeB.id}_${nodeC.id}`, source: nodeB.id, target: nodeC.id },
            ];
            
            // Try to create C -> A (would create cycle)
            const result = validateConnection(nodeC, nodeA, existingEdges);
            
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Circular connections are not allowed');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly detect cycles using wouldCreateCycle', () => {
      fc.assert(
        fc.property(
          nodeIdArb,
          nodeIdArb,
          (nodeAId, nodeBId) => {
            if (nodeAId === nodeBId) return true;
            
            // Existing edge: A -> B
            const existingEdge: GraphEdge = {
              id: `e_${nodeAId}_${nodeBId}`,
              source: nodeAId,
              target: nodeBId,
            };
            
            // B -> A would create cycle
            expect(wouldCreateCycle(nodeBId, nodeAId, [existingEdge])).toBe(true);
            
            // A -> B again would create cycle (self-loop through existing)
            // Actually this is a duplicate edge, not a cycle in the traditional sense
            // The cycle detection should still work
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow valid non-cyclic connections', () => {
      fc.assert(
        fc.property(
          graphNodeArb(nonSourceOperatorTypeArb),
          graphNodeArb(nonSourceOperatorTypeArb),
          graphNodeArb(nonSourceOperatorTypeArb),
          (nodeA, nodeB, nodeC) => {
            // Ensure all nodes have different IDs
            if (nodeA.id === nodeB.id || nodeB.id === nodeC.id || nodeA.id === nodeC.id) {
              return true;
            }
            
            // Existing edge: A -> B
            const existingEdges: GraphEdge[] = [
              { id: `e_${nodeA.id}_${nodeB.id}`, source: nodeA.id, target: nodeB.id },
            ];
            
            // B -> C should be allowed (extends the chain, no cycle)
            const result = validateConnection(nodeB, nodeC, existingEdges);
            
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow parallel branches without cycles', () => {
      fc.assert(
        fc.property(
          graphNodeArb(nonSourceOperatorTypeArb),
          graphNodeArb(nonSourceOperatorTypeArb),
          graphNodeArb(nonSourceOperatorTypeArb),
          (nodeA, nodeB, nodeC) => {
            // Ensure all nodes have different IDs
            if (nodeA.id === nodeB.id || nodeB.id === nodeC.id || nodeA.id === nodeC.id) {
              return true;
            }
            
            // Existing edge: A -> B
            const existingEdges: GraphEdge[] = [
              { id: `e_${nodeA.id}_${nodeB.id}`, source: nodeA.id, target: nodeB.id },
            ];
            
            // A -> C should be allowed (parallel branch from A)
            const result = validateConnection(nodeA, nodeC, existingEdges);
            
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
