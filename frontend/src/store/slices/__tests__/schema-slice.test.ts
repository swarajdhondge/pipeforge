/**
 * Property-based tests for schema propagation
 * 
 * **Feature: pipe-forge-canvas, Property 2: Schema Propagation Consistency**
 * **Validates: Requirements 1.3, 1.6**
 * 
 * Property: For any valid pipe graph with connections, when an upstream operator's 
 * schema changes, all downstream operators SHALL receive the updated schema.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import schemaReducer, {
  setNodeSchema,
  propagateSchemas,
  updateNodeSchemaAndPropagate,
  clearAllSchemas,
} from '../schema-slice';
import type { ExtractedSchema } from '../../../types/schema.types';
import type { Edge } from 'reactflow';

// Arbitrary for generating valid schema fields
const schemaFieldArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)),
  path: fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(s)),
  type: fc.constantFrom('string', 'number', 'boolean', 'array', 'object', 'null', 'date') as fc.Arbitrary<'string' | 'number' | 'boolean' | 'array' | 'object' | 'null' | 'date'>,
});

// Arbitrary for generating valid extracted schemas
const extractedSchemaArb: fc.Arbitrary<ExtractedSchema> = fc.record({
  fields: fc.array(schemaFieldArb, { minLength: 1, maxLength: 10 }),
  rootType: fc.constantFrom('array', 'object') as fc.Arbitrary<'array' | 'object'>,
  itemCount: fc.option(fc.nat({ max: 1000 }), { nil: undefined }),
});

// Arbitrary for generating node IDs
const nodeIdArb = fc.string({ minLength: 1, maxLength: 10 })
  .filter(s => /^[a-zA-Z0-9_-]+$/.test(s))
  .map(s => `node_${s}`);

// Arbitrary for generating a simple linear graph (A -> B -> C)
const linearGraphArb: fc.Arbitrary<{ nodeIds: string[]; edges: Edge[] }> = fc.array(nodeIdArb, { minLength: 2, maxLength: 5 })
  .map((nodeIds) => {
    // Ensure unique node IDs
    const uniqueIds = [...new Set(nodeIds)];
    if (uniqueIds.length < 2) {
      return { nodeIds: ['node_a', 'node_b'], edges: [{ id: 'e1', source: 'node_a', target: 'node_b' }] as Edge[] };
    }
    
    // Create edges for linear chain
    const edges: Edge[] = [];
    for (let i = 0; i < uniqueIds.length - 1; i++) {
      edges.push({
        id: `edge_${i}`,
        source: uniqueIds[i],
        target: uniqueIds[i + 1],
      });
    }
    
    return { nodeIds: uniqueIds, edges };
  });

// Arbitrary for generating a branching graph (A -> B, A -> C)
const branchingGraphArb = fc.tuple(
  nodeIdArb,
  fc.array(nodeIdArb, { minLength: 2, maxLength: 4 }),
).map(([sourceId, targetIds]) => {
  const uniqueTargets = [...new Set(targetIds)].filter(id => id !== sourceId);
  if (uniqueTargets.length < 1) {
    uniqueTargets.push('node_target_1');
  }
  
  const edges: Edge[] = uniqueTargets.map((targetId, i) => ({
    id: `edge_${i}`,
    source: sourceId,
    target: targetId,
  }));
  
  return { sourceId, targetIds: uniqueTargets, edges };
});

describe('Schema Slice - Property Tests', () => {
  /**
   * **Feature: pipe-forge-canvas, Property 2: Schema Propagation Consistency**
   * **Validates: Requirements 1.3, 1.6**
   */
  describe('Property 2: Schema Propagation Consistency', () => {
    it('should propagate schema from source to all direct downstream nodes', () => {
      fc.assert(
        fc.property(
          branchingGraphArb,
          extractedSchemaArb,
          ({ sourceId, targetIds, edges }, schema) => {
            // Start with empty state
            let state = schemaReducer(undefined, clearAllSchemas());
            
            // Set schema on source node
            state = schemaReducer(state, setNodeSchema({ nodeId: sourceId, schema }));
            
            // Propagate schemas
            state = schemaReducer(state, propagateSchemas({ edges }));
            
            // All downstream nodes should have the source's schema as their upstream schema
            for (const targetId of targetIds) {
              expect(state.upstreamSchemas[targetId]).toEqual(schema);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should propagate schema changes through linear chain', () => {
      fc.assert(
        fc.property(
          linearGraphArb,
          extractedSchemaArb,
          ({ nodeIds, edges }, schema) => {
            // Start with empty state
            let state = schemaReducer(undefined, clearAllSchemas());
            
            // Set schema on first node (source)
            const sourceId = nodeIds[0];
            state = schemaReducer(state, setNodeSchema({ nodeId: sourceId, schema }));
            
            // Propagate schemas
            state = schemaReducer(state, propagateSchemas({ edges }));
            
            // Second node should have source's schema as upstream
            if (nodeIds.length >= 2) {
              expect(state.upstreamSchemas[nodeIds[1]]).toEqual(schema);
            }
            
            // Source node should not have upstream schema (it's the start)
            expect(state.upstreamSchemas[sourceId]).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });


    it('should update downstream schemas when source schema changes', () => {
      fc.assert(
        fc.property(
          branchingGraphArb,
          extractedSchemaArb,
          extractedSchemaArb,
          ({ sourceId, targetIds, edges }, schema1, schema2) => {
            // Start with empty state
            let state = schemaReducer(undefined, clearAllSchemas());
            
            // Set initial schema on source
            state = schemaReducer(state, setNodeSchema({ nodeId: sourceId, schema: schema1 }));
            state = schemaReducer(state, propagateSchemas({ edges }));
            
            // Verify initial propagation
            for (const targetId of targetIds) {
              expect(state.upstreamSchemas[targetId]).toEqual(schema1);
            }
            
            // Update schema on source using updateNodeSchemaAndPropagate
            state = schemaReducer(state, updateNodeSchemaAndPropagate({ 
              nodeId: sourceId, 
              schema: schema2, 
              edges 
            }));
            
            // All downstream nodes should now have the updated schema
            for (const targetId of targetIds) {
              expect(state.upstreamSchemas[targetId]).toEqual(schema2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not set upstream schema for nodes without incoming connections', () => {
      fc.assert(
        fc.property(
          fc.array(nodeIdArb, { minLength: 2, maxLength: 5 }),
          extractedSchemaArb,
          (nodeIds, schema) => {
            const uniqueIds = [...new Set(nodeIds)];
            if (uniqueIds.length < 2) return true; // Skip if not enough unique IDs
            
            // Start with empty state
            let state = schemaReducer(undefined, clearAllSchemas());
            
            // Set schema on first node
            state = schemaReducer(state, setNodeSchema({ nodeId: uniqueIds[0], schema }));
            
            // Propagate with empty edges (no connections)
            state = schemaReducer(state, propagateSchemas({ edges: [] }));
            
            // No node should have upstream schema since there are no connections
            for (const nodeId of uniqueIds) {
              expect(state.upstreamSchemas[nodeId]).toBeUndefined();
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clear upstream schema when connection is removed', () => {
      fc.assert(
        fc.property(
          nodeIdArb,
          nodeIdArb,
          extractedSchemaArb,
          (sourceId, targetId, schema) => {
            if (sourceId === targetId) return true; // Skip if same ID
            
            const edge: Edge = { id: 'e1', source: sourceId, target: targetId };
            
            // Start with empty state
            let state = schemaReducer(undefined, clearAllSchemas());
            
            // Set schema and propagate with connection
            state = schemaReducer(state, setNodeSchema({ nodeId: sourceId, schema }));
            state = schemaReducer(state, propagateSchemas({ edges: [edge] }));
            
            // Target should have upstream schema
            expect(state.upstreamSchemas[targetId]).toEqual(schema);
            
            // Remove connection by propagating with empty edges
            state = schemaReducer(state, propagateSchemas({ edges: [] }));
            
            // Target should no longer have upstream schema
            expect(state.upstreamSchemas[targetId]).toBeUndefined();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle nodes without output schema gracefully', () => {
      fc.assert(
        fc.property(
          nodeIdArb,
          nodeIdArb,
          (sourceId, targetId) => {
            if (sourceId === targetId) return true; // Skip if same ID
            
            const edge: Edge = { id: 'e1', source: sourceId, target: targetId };
            
            // Start with empty state (source has no schema)
            let state = schemaReducer(undefined, clearAllSchemas());
            
            // Propagate without setting source schema
            state = schemaReducer(state, propagateSchemas({ edges: [edge] }));
            
            // Target should not have upstream schema since source has none
            expect(state.upstreamSchemas[targetId]).toBeUndefined();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
