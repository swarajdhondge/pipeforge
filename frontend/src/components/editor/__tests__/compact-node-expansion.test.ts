/**
 * Property-based test for CompactOperatorNode single expansion behavior
 * 
 * **Feature: ux-simplification, Property 3: Single Node Expansion**
 * **Validates: Requirements 8.4**
 * 
 * This test verifies that only one node can be expanded at any time.
 * When a node is expanded, any previously expanded node should be collapsed.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { configureStore } from '@reduxjs/toolkit';
import canvasReducer, { setExpandedNode } from '../../../store/slices/canvas-slice';

describe('Property 3: Single Node Expansion', () => {
  /**
   * Property: For any sequence of node expansion actions,
   * at most one node should be expanded at any given time.
   */
  it('should ensure only one node is expanded at a time', () => {
    fc.assert(
      fc.property(
        // Generate a sequence of node IDs to expand (including null for collapse)
        fc.array(
          fc.oneof(
            fc.constant(null),
            fc.string({ minLength: 1, maxLength: 20 }).map(s => `node-${s}`)
          ),
          { minLength: 1, maxLength: 50 }
        ),
        (nodeIdSequence) => {
          // Create a fresh store for each test
          const store = configureStore({
            reducer: {
              canvas: canvasReducer,
            },
          });

          // Apply each expansion action in sequence
          for (const nodeId of nodeIdSequence) {
            store.dispatch(setExpandedNode(nodeId));
            
            // After each action, verify that at most one node is expanded
            const state = store.getState().canvas;
            const expandedNodeId = state.expandedNodeId;
            
            // The expanded node should match the last action
            expect(expandedNodeId).toBe(nodeId);
            
            // There should be at most one expanded node (0 or 1)
            // If expandedNodeId is not null, exactly one node is expanded
            // If expandedNodeId is null, no nodes are expanded
            if (expandedNodeId !== null) {
              expect(typeof expandedNodeId).toBe('string');
              expect(expandedNodeId.length).toBeGreaterThan(0);
            }
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  /**
   * Property: Expanding a node when another is already expanded
   * should collapse the previously expanded node.
   */
  it('should collapse previously expanded node when expanding a new one', () => {
    fc.assert(
      fc.property(
        // Generate two different node IDs
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 20 }).map(s => `node-${s}`),
          fc.string({ minLength: 1, maxLength: 20 }).map(s => `node-${s}`)
        ).filter(([id1, id2]) => id1 !== id2), // Ensure they're different
        ([nodeId1, nodeId2]) => {
          // Create a fresh store
          const store = configureStore({
            reducer: {
              canvas: canvasReducer,
            },
          });

          // Expand first node
          store.dispatch(setExpandedNode(nodeId1));
          let state = store.getState().canvas;
          expect(state.expandedNodeId).toBe(nodeId1);

          // Expand second node
          store.dispatch(setExpandedNode(nodeId2));
          state = store.getState().canvas;
          
          // Only the second node should be expanded
          expect(state.expandedNodeId).toBe(nodeId2);
          expect(state.expandedNodeId).not.toBe(nodeId1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Expanding the same node twice should keep it expanded.
   */
  it('should keep node expanded when expanding it again', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `node-${s}`),
        (nodeId) => {
          // Create a fresh store
          const store = configureStore({
            reducer: {
              canvas: canvasReducer,
            },
          });

          // Expand node
          store.dispatch(setExpandedNode(nodeId));
          let state = store.getState().canvas;
          expect(state.expandedNodeId).toBe(nodeId);

          // Expand same node again
          store.dispatch(setExpandedNode(nodeId));
          state = store.getState().canvas;
          
          // Node should still be expanded
          expect(state.expandedNodeId).toBe(nodeId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Setting expanded node to null should collapse all nodes.
   */
  it('should collapse all nodes when setting expanded node to null', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).map(s => `node-${s}`),
        (nodeId) => {
          // Create a fresh store
          const store = configureStore({
            reducer: {
              canvas: canvasReducer,
            },
          });

          // Expand a node
          store.dispatch(setExpandedNode(nodeId));
          let state = store.getState().canvas;
          expect(state.expandedNodeId).toBe(nodeId);

          // Collapse by setting to null
          store.dispatch(setExpandedNode(null));
          state = store.getState().canvas;
          
          // No nodes should be expanded
          expect(state.expandedNodeId).toBe(null);
        }
      ),
      { numRuns: 100 }
    );
  });
});
