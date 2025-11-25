import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import { PipeValidator, hasCycles, PIPE_LIMITS } from '../pipe-validator';
import { OperatorRegistry } from '../../operators/operator-registry';
import { PipeDefinition, OperatorNode, Edge } from '../../types/operator.types';

// Create a test registry with mock operators
function createTestRegistry(): OperatorRegistry {
  const registry = new OperatorRegistry();
  
  // Register mock operators for testing
  const mockOperator = {
    type: 'fetch-json',
    category: 'sources' as const,
    description: 'Test operator',
    execute: async (input: any) => input,
    validate: () => ({ valid: true }),
    getOutputSchema: () => null,
  };
  
  registry.register(mockOperator);
  registry.register({ ...mockOperator, type: 'filter', category: 'operators' });
  registry.register({ ...mockOperator, type: 'sort', category: 'operators' });
  registry.register({ ...mockOperator, type: 'transform', category: 'operators' });
  registry.register({ ...mockOperator, type: 'pipe-output', category: 'operators' });
  
  return registry;
}

// Arbitrary for generating valid operator types
const validOperatorTypeArb = fc.constantFrom('fetch-json', 'filter', 'sort', 'transform', 'pipe-output');

describe('PipeValidator', () => {
  let validator: PipeValidator;
  let registry: OperatorRegistry;

  beforeAll(() => {
    registry = createTestRegistry();
    validator = new PipeValidator(registry);
  });

  describe('validate() - basic structure', () => {
    it('should accept valid empty pipe definition', () => {
      const definition: PipeDefinition = {
        nodes: [],
        edges: [],
      };
      
      const result = validator.validate(definition);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null definition', () => {
      const result = validator.validate(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'invalid_structure')).toBe(true);
    });

    it('should reject definition without nodes array', () => {
      const result = validator.validate({ edges: [] } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('nodes array'))).toBe(true);
    });

    it('should reject definition without edges array', () => {
      const result = validator.validate({ nodes: [] } as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('edges array'))).toBe(true);
    });
  });

  describe('validate() - operator types (Requirement 18.1)', () => {
    /**
     * **Feature: pipe-forge-canvas, Property 25: Pipe Definition Validation**
     * **Validates: Requirements 18.1, 18.2, 18.3**
     * 
     * For any pipe definition, saving SHALL validate that all operator types are known,
     * all connections reference existing nodes, and no cycles exist.
     */
    it('Property 25: Pipe Definition Validation - valid operator types are accepted', () => {
      fc.assert(
        fc.property(
          fc.array(validOperatorTypeArb, { minLength: 1, maxLength: 10 }),
          (types) => {
            const nodes: OperatorNode[] = types.map((type, i) => ({
              id: `node-${i}`,
              type: type as any,
              position: { x: i * 100, y: 0 },
              data: { label: `Node ${i}`, config: {} },
            }));
            
            const definition: PipeDefinition = { nodes, edges: [] };
            const result = validator.validate(definition);
            
            // All valid operator types should be accepted
            return !result.errors.some(e => e.type === 'unknown_operator');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 25: Pipe Definition Validation - unknown operator types are rejected', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => !['fetch-json', 'filter', 'sort', 'transform', 'pipe-output'].includes(s)),
          (unknownType) => {
            const definition: PipeDefinition = {
              nodes: [{
                id: 'node-1',
                type: unknownType as any,
                position: { x: 0, y: 0 },
                data: { label: 'Unknown', config: {} },
              }],
              edges: [],
            };
            
            const result = validator.validate(definition);
            
            // Unknown operator types should be rejected
            return result.errors.some(e => e.type === 'unknown_operator');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validate() - connections (Requirement 18.2)', () => {
    it('Property 25: Pipe Definition Validation - valid connections are accepted', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (nodeCount) => {
            // Create a linear chain of nodes
            const nodes: OperatorNode[] = Array.from({ length: nodeCount }, (_, i) => ({
              id: `node-${i}`,
              type: i === 0 ? 'fetch-json' : 'filter',
              position: { x: i * 100, y: 0 },
              data: { label: `Node ${i}`, config: {} },
            }));
            
            // Create edges connecting them in sequence
            const edges: Edge[] = Array.from({ length: nodeCount - 1 }, (_, i) => ({
              id: `edge-${i}`,
              source: `node-${i}`,
              target: `node-${i + 1}`,
            }));
            
            const definition: PipeDefinition = { nodes, edges };
            const result = validator.validate(definition);
            
            // Valid connections should be accepted
            return !result.errors.some(e => e.type === 'invalid_connection');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 25: Pipe Definition Validation - invalid source references are rejected', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s !== 'node-1'),
          (invalidSource) => {
            const definition: PipeDefinition = {
              nodes: [{
                id: 'node-1',
                type: 'fetch-json',
                position: { x: 0, y: 0 },
                data: { label: 'Node 1', config: {} },
              }],
              edges: [{
                id: 'edge-1',
                source: invalidSource,
                target: 'node-1',
              }],
            };
            
            const result = validator.validate(definition);
            
            // Invalid source references should be rejected
            return result.errors.some(e => e.type === 'invalid_connection');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('Property 25: Pipe Definition Validation - invalid target references are rejected', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s !== 'node-1'),
          (invalidTarget) => {
            const definition: PipeDefinition = {
              nodes: [{
                id: 'node-1',
                type: 'fetch-json',
                position: { x: 0, y: 0 },
                data: { label: 'Node 1', config: {} },
              }],
              edges: [{
                id: 'edge-1',
                source: 'node-1',
                target: invalidTarget,
              }],
            };
            
            const result = validator.validate(definition);
            
            // Invalid target references should be rejected
            return result.errors.some(e => e.type === 'invalid_connection');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('validate() - cycle detection (Requirement 18.3)', () => {
    it('Property 25: Pipe Definition Validation - acyclic graphs are accepted', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (nodeCount) => {
            // Create a DAG (directed acyclic graph) - linear chain
            const nodes: OperatorNode[] = Array.from({ length: nodeCount }, (_, i) => ({
              id: `node-${i}`,
              type: i === 0 ? 'fetch-json' : 'filter',
              position: { x: i * 100, y: 0 },
              data: { label: `Node ${i}`, config: {} },
            }));
            
            const edges: Edge[] = Array.from({ length: nodeCount - 1 }, (_, i) => ({
              id: `edge-${i}`,
              source: `node-${i}`,
              target: `node-${i + 1}`,
            }));
            
            const definition: PipeDefinition = { nodes, edges };
            const result = validator.validate(definition);
            
            // Acyclic graphs should not have cycle errors
            return !result.errors.some(e => e.type === 'cycle_detected');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect simple self-loop cycle', () => {
      const definition: PipeDefinition = {
        nodes: [{
          id: 'node-1',
          type: 'filter',
          position: { x: 0, y: 0 },
          data: { label: 'Node 1', config: {} },
        }],
        edges: [{
          id: 'edge-1',
          source: 'node-1',
          target: 'node-1',
        }],
      };
      
      const result = validator.validate(definition);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'cycle_detected')).toBe(true);
    });

    it('should detect two-node cycle', () => {
      const definition: PipeDefinition = {
        nodes: [
          { id: 'node-1', type: 'filter', position: { x: 0, y: 0 }, data: { label: 'Node 1', config: {} } },
          { id: 'node-2', type: 'filter', position: { x: 100, y: 0 }, data: { label: 'Node 2', config: {} } },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' },
          { id: 'edge-2', source: 'node-2', target: 'node-1' },
        ],
      };
      
      const result = validator.validate(definition);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'cycle_detected')).toBe(true);
    });

    it('should detect three-node cycle', () => {
      const definition: PipeDefinition = {
        nodes: [
          { id: 'node-1', type: 'filter', position: { x: 0, y: 0 }, data: { label: 'Node 1', config: {} } },
          { id: 'node-2', type: 'filter', position: { x: 100, y: 0 }, data: { label: 'Node 2', config: {} } },
          { id: 'node-3', type: 'filter', position: { x: 200, y: 0 }, data: { label: 'Node 3', config: {} } },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' },
          { id: 'edge-2', source: 'node-2', target: 'node-3' },
          { id: 'edge-3', source: 'node-3', target: 'node-1' },
        ],
      };
      
      const result = validator.validate(definition);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'cycle_detected')).toBe(true);
    });

    it('should accept diamond-shaped DAG (no cycle)', () => {
      const definition: PipeDefinition = {
        nodes: [
          { id: 'source', type: 'fetch-json', position: { x: 0, y: 0 }, data: { label: 'Source', config: {} } },
          { id: 'left', type: 'filter', position: { x: 100, y: -50 }, data: { label: 'Left', config: {} } },
          { id: 'right', type: 'filter', position: { x: 100, y: 50 }, data: { label: 'Right', config: {} } },
          { id: 'sink', type: 'pipe-output', position: { x: 200, y: 0 }, data: { label: 'Sink', config: {} } },
        ],
        edges: [
          { id: 'edge-1', source: 'source', target: 'left' },
          { id: 'edge-2', source: 'source', target: 'right' },
          { id: 'edge-3', source: 'left', target: 'sink' },
          { id: 'edge-4', source: 'right', target: 'sink' },
        ],
      };
      
      const result = validator.validate(definition);
      // Diamond shape is a DAG, not a cycle
      expect(result.errors.some(e => e.type === 'cycle_detected')).toBe(false);
    });
  });

  describe('validate() - operator count limit (Requirement 17.7)', () => {
    it('should accept pipes with exactly 50 operators', () => {
      const nodes: OperatorNode[] = Array.from({ length: 50 }, (_, i) => ({
        id: `node-${i}`,
        type: 'filter',
        position: { x: i * 100, y: 0 },
        data: { label: `Node ${i}`, config: {} },
      }));
      
      const definition: PipeDefinition = { nodes, edges: [] };
      const result = validator.validate(definition);
      
      expect(result.errors.some(e => e.type === 'operator_limit')).toBe(false);
    });

    it('should reject pipes with more than 50 operators', () => {
      const nodes: OperatorNode[] = Array.from({ length: 51 }, (_, i) => ({
        id: `node-${i}`,
        type: 'filter',
        position: { x: i * 100, y: 0 },
        data: { label: `Node ${i}`, config: {} },
      }));
      
      const definition: PipeDefinition = { nodes, edges: [] };
      const result = validator.validate(definition);
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.type === 'operator_limit')).toBe(true);
    });

    it('Property 25: Pipe Definition Validation - operator count limit is enforced', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: PIPE_LIMITS.maxOperators + 1, max: PIPE_LIMITS.maxOperators + 20 }),
          (nodeCount) => {
            const nodes: OperatorNode[] = Array.from({ length: nodeCount }, (_, i) => ({
              id: `node-${i}`,
              type: 'filter',
              position: { x: i * 100, y: 0 },
              data: { label: `Node ${i}`, config: {} },
            }));
            
            const definition: PipeDefinition = { nodes, edges: [] };
            const result = validator.validate(definition);
            
            // Pipes exceeding limit should be rejected
            return result.errors.some(e => e.type === 'operator_limit');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('hasCycles() utility function', () => {
    it('should return false for empty graph', () => {
      expect(hasCycles({ nodes: [], edges: [] })).toBe(false);
    });

    it('should return false for single node', () => {
      const definition: PipeDefinition = {
        nodes: [{ id: 'node-1', type: 'filter', position: { x: 0, y: 0 }, data: { label: 'Node 1', config: {} } }],
        edges: [],
      };
      expect(hasCycles(definition)).toBe(false);
    });

    it('should return true for self-loop', () => {
      const definition: PipeDefinition = {
        nodes: [{ id: 'node-1', type: 'filter', position: { x: 0, y: 0 }, data: { label: 'Node 1', config: {} } }],
        edges: [{ id: 'edge-1', source: 'node-1', target: 'node-1' }],
      };
      expect(hasCycles(definition)).toBe(true);
    });

    it('should return false for linear chain', () => {
      const definition: PipeDefinition = {
        nodes: [
          { id: 'node-1', type: 'fetch-json', position: { x: 0, y: 0 }, data: { label: 'Node 1', config: {} } },
          { id: 'node-2', type: 'filter', position: { x: 100, y: 0 }, data: { label: 'Node 2', config: {} } },
          { id: 'node-3', type: 'pipe-output', position: { x: 200, y: 0 }, data: { label: 'Node 3', config: {} } },
        ],
        edges: [
          { id: 'edge-1', source: 'node-1', target: 'node-2' },
          { id: 'edge-2', source: 'node-2', target: 'node-3' },
        ],
      };
      expect(hasCycles(definition)).toBe(false);
    });
  });
});
