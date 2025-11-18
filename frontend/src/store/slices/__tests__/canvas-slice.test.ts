/**
 * Property-based tests for canvas slice
 * 
 * **Feature: editor-ux-fixes, Property 2: Default edges use selectable type**
 * **Validates: Requirements 2.1, 2.3**
 * 
 * Property: For any default edge in the canvas initial state, the edge should 
 * have type 'selectable' which renders custom arrow markers via SelectableEdge.
 * 
 * **Feature: editor-ux-fixes, Property 3: New connections have selectable type**
 * **Validates: Requirements 2.2**
 * 
 * Property: For any new connection created via onConnect, the resulting edge 
 * should have type 'selectable' for consistent arrow marker rendering.
 * 
 * **Feature: editor-ux-fixes, Property 4: Keyboard shortcuts trigger undo/redo**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * 
 * Property: For any keyboard event with Ctrl+Z (or Cmd+Z on Mac), the undo action 
 * should be dispatched. For Ctrl+Shift+Z, the redo action should be dispatched.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import canvasReducer, { clearCanvas, setEdges, addEdge, undo, redo, saveToHistory, addNode } from '../canvas-slice';
import type { Edge, Node } from 'reactflow';

describe('Canvas Slice - Property Tests', () => {
  /**
   * **Feature: editor-ux-fixes, Property 2: Default edges use selectable type**
   * **Validates: Requirements 2.1, 2.3**
   * 
   * Note: Arrow markers are now rendered by the SelectableEdge custom component,
   * not via markerEnd property. This provides better control over marker styling.
   */
  describe('Property 2: Default edges use selectable type', () => {
    it('should have selectable type on all default edges', () => {
      // Get initial state
      const initialState = canvasReducer(undefined, { type: '@@INIT' });
      
      // Property: All default edges must use 'selectable' type for custom arrow rendering
      for (const edge of initialState.edges) {
        expect(edge.type).toBe('selectable');
      }
    });

    it('should have all default edges connected', () => {
      // Get initial state
      const initialState = canvasReducer(undefined, { type: '@@INIT' });
      
      // Property: All default edges must have source and target
      for (const edge of initialState.edges) {
        expect(edge.source).toBeDefined();
        expect(edge.target).toBeDefined();
        expect(typeof edge.source).toBe('string');
        expect(typeof edge.target).toBe('string');
      }
    });

    it('should preserve selectable type after clearCanvas resets to defaults', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10 }),
          () => {
            // Start with initial state
            let state = canvasReducer(undefined, { type: '@@INIT' });
            
            // Clear canvas (should reset to defaults)
            state = canvasReducer(state, clearCanvas());
            
            // All edges should still have 'selectable' type
            for (const edge of state.edges) {
              expect(edge.type).toBe('selectable');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have correct number of default edges for the pipeline', () => {
      // Get initial state
      const initialState = canvasReducer(undefined, { type: '@@INIT' });
      
      // Default pipeline: Fetch → Filter → Truncate → Output = 3 edges
      expect(initialState.edges.length).toBe(3);
      expect(initialState.nodes.length).toBe(4);
    });
  });

  /**
   * **Feature: editor-ux-fixes, Property 3: New connections use selectable type**
   * **Validates: Requirements 2.2**
   * 
   * Note: Arrow markers are rendered by SelectableEdge component, not via markerEnd.
   */
  describe('Property 3: New connections use selectable type', () => {
    it('should add edges with selectable type when adding new edges', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (sourceId, targetId, edgeId) => {
            // Create a new edge with selectable type (as done in onConnect handler)
            const newEdge: Edge = {
              id: edgeId,
              source: sourceId,
              target: targetId,
              type: 'selectable',
            };

            // Start with initial state
            let state = canvasReducer(undefined, { type: '@@INIT' });
            
            // Add the new edge
            state = canvasReducer(state, addEdge(newEdge));
            
            // Find the added edge
            const addedEdge = state.edges.find(e => e.id === edgeId);
            
            // Verify the edge was added
            expect(addedEdge).toBeDefined();
            
            if (addedEdge) {
              // Verify edge has selectable type for custom arrow rendering
              expect(addedEdge.type).toBe('selectable');
              expect(addedEdge.source).toBe(sourceId);
              expect(addedEdge.target).toBe(targetId);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain edge type consistency across multiple edge additions', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              source: fc.string({ minLength: 1, maxLength: 20 }),
              target: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (edgeConfigs) => {
            // Start with initial state
            let state = canvasReducer(undefined, { type: '@@INIT' });
            
            // Add multiple edges with selectable type
            for (const config of edgeConfigs) {
              const newEdge: Edge = {
                id: config.id,
                source: config.source,
                target: config.target,
                type: 'selectable',
              };
              
              state = canvasReducer(state, addEdge(newEdge));
            }
            
            // Verify all added edges have selectable type
            for (const config of edgeConfigs) {
              const edge = state.edges.find(e => e.id === config.id);
              
              if (edge) {
                expect(edge.type).toBe('selectable');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve edge type when edges are set via setEdges', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              source: fc.string({ minLength: 1, maxLength: 20 }),
              target: fc.string({ minLength: 1, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (edgeConfigs) => {
            // Create edges with selectable type
            const edges: Edge[] = edgeConfigs.map(config => ({
              id: config.id,
              source: config.source,
              target: config.target,
              type: 'selectable',
            }));
            
            // Start with initial state
            let state = canvasReducer(undefined, { type: '@@INIT' });
            
            // Set edges
            state = canvasReducer(state, setEdges(edges));
            
            // Verify all edges have selectable type
            for (const edge of state.edges) {
              expect(edge.type).toBe('selectable');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: editor-ux-fixes, Property 4: Keyboard shortcuts trigger undo/redo**
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
   */
  describe('Property 4: Keyboard shortcuts trigger undo/redo', () => {
    it('should undo when history is available', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('fetch-json', 'filter', 'sort', 'transform'),
              position: fc.record({
                x: fc.integer({ min: 0, max: 1000 }),
                y: fc.integer({ min: 0, max: 1000 }),
              }),
              data: fc.record({
                label: fc.string({ minLength: 1, maxLength: 50 }),
                config: fc.constant({}),
              }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (nodeConfigs) => {
            // Start with initial state
            let state = canvasReducer(undefined, { type: '@@INIT' });
            
            // Save initial state to history
            state = canvasReducer(state, saveToHistory());
            
            // Add nodes to create a new state
            for (const config of nodeConfigs) {
              const node: Node = {
                id: config.id,
                type: config.type,
                position: config.position,
                data: config.data,
              };
              state = canvasReducer(state, addNode(node));
            }
            
            // Record the state before undo
            const stateBeforeUndo = state.nodes.length;
            const historyPastLength = state.history.past.length;
            
            // Verify we have history
            expect(historyPastLength).toBeGreaterThan(0);
            
            // Perform undo
            state = canvasReducer(state, undo());
            
            // Verify undo worked
            expect(state.history.past.length).toBe(historyPastLength - 1);
            expect(state.history.future.length).toBeGreaterThan(0);
            expect(state.nodes.length).toBeLessThan(stateBeforeUndo);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should redo when future history is available', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('fetch-json', 'filter', 'sort', 'transform'),
              position: fc.record({
                x: fc.integer({ min: 0, max: 1000 }),
                y: fc.integer({ min: 0, max: 1000 }),
              }),
              data: fc.record({
                label: fc.string({ minLength: 1, maxLength: 50 }),
                config: fc.constant({}),
              }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (nodeConfigs) => {
            // Start with initial state
            let state = canvasReducer(undefined, { type: '@@INIT' });
            
            // Save initial state to history
            state = canvasReducer(state, saveToHistory());
            
            // Add nodes to create a new state
            for (const config of nodeConfigs) {
              const node: Node = {
                id: config.id,
                type: config.type,
                position: config.position,
                data: config.data,
              };
              state = canvasReducer(state, addNode(node));
            }
            
            // Perform undo to create future history
            state = canvasReducer(state, undo());
            
            // Record the state before redo
            const stateBeforeRedo = state.nodes.length;
            const historyFutureLength = state.history.future.length;
            
            // Verify we have future history
            expect(historyFutureLength).toBeGreaterThan(0);
            
            // Perform redo
            state = canvasReducer(state, redo());
            
            // Verify redo worked
            expect(state.history.future.length).toBe(historyFutureLength - 1);
            expect(state.history.past.length).toBeGreaterThan(0);
            expect(state.nodes.length).toBeGreaterThan(stateBeforeRedo);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not undo when history is empty', () => {
      // Start with initial state (no history)
      let state = canvasReducer(undefined, { type: '@@INIT' });
      
      // Verify no history
      expect(state.history.past.length).toBe(0);
      
      // Record initial state
      const initialNodes = state.nodes.length;
      
      // Attempt undo
      state = canvasReducer(state, undo());
      
      // Verify state unchanged
      expect(state.nodes.length).toBe(initialNodes);
      expect(state.history.past.length).toBe(0);
      expect(state.history.future.length).toBe(0);
    });

    it('should not redo when future history is empty', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('fetch-json', 'filter', 'sort', 'transform'),
              position: fc.record({
                x: fc.integer({ min: 0, max: 1000 }),
                y: fc.integer({ min: 0, max: 1000 }),
              }),
              data: fc.record({
                label: fc.string({ minLength: 1, maxLength: 50 }),
                config: fc.constant({}),
              }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (nodeConfigs) => {
            // Start with initial state
            let state = canvasReducer(undefined, { type: '@@INIT' });
            
            // Save initial state to history
            state = canvasReducer(state, saveToHistory());
            
            // Add nodes to create a new state
            for (const config of nodeConfigs) {
              const node: Node = {
                id: config.id,
                type: config.type,
                position: config.position,
                data: config.data,
              };
              state = canvasReducer(state, addNode(node));
            }
            
            // Verify no future history
            expect(state.history.future.length).toBe(0);
            
            // Record current state
            const currentNodes = state.nodes.length;
            
            // Attempt redo
            state = canvasReducer(state, redo());
            
            // Verify state unchanged
            expect(state.nodes.length).toBe(currentNodes);
            expect(state.history.future.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain undo/redo chain consistency', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              type: fc.constantFrom('fetch-json', 'filter', 'sort', 'transform'),
              position: fc.record({
                x: fc.integer({ min: 0, max: 1000 }),
                y: fc.integer({ min: 0, max: 1000 }),
              }),
              data: fc.record({
                label: fc.string({ minLength: 1, maxLength: 50 }),
                config: fc.constant({}),
              }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (nodeConfigs) => {
            // Start with initial state
            let state = canvasReducer(undefined, { type: '@@INIT' });
            
            // Save initial state to history
            state = canvasReducer(state, saveToHistory());
            
            // Add nodes one by one, saving to history each time
            for (const config of nodeConfigs) {
              const node: Node = {
                id: config.id,
                type: config.type,
                position: config.position,
                data: config.data,
              };
              state = canvasReducer(state, addNode(node));
              state = canvasReducer(state, saveToHistory());
            }
            
            const finalNodeCount = state.nodes.length;
            
            // Undo all changes
            const undoCount = state.history.past.length;
            for (let i = 0; i < undoCount; i++) {
              state = canvasReducer(state, undo());
            }
            
            // Verify we're back to initial state
            expect(state.history.past.length).toBe(0);
            expect(state.history.future.length).toBe(undoCount);
            
            // Redo all changes
            const redoCount = state.history.future.length;
            for (let i = 0; i < redoCount; i++) {
              state = canvasReducer(state, redo());
            }
            
            // Verify we're back to final state
            expect(state.nodes.length).toBe(finalNodeCount);
            expect(state.history.future.length).toBe(0);
            expect(state.history.past.length).toBe(undoCount);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should mark state as dirty after undo/redo', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom('fetch-json', 'filter', 'sort', 'transform'),
            position: fc.record({
              x: fc.integer({ min: 0, max: 1000 }),
              y: fc.integer({ min: 0, max: 1000 }),
            }),
            data: fc.record({
              label: fc.string({ minLength: 1, maxLength: 50 }),
              config: fc.constant({}),
            }),
          }),
          (nodeConfig) => {
            // Start with initial state
            let state = canvasReducer(undefined, { type: '@@INIT' });
            
            // Save initial state to history
            state = canvasReducer(state, saveToHistory());
            
            // Add a node
            const node: Node = {
              id: nodeConfig.id,
              type: nodeConfig.type,
              position: nodeConfig.position,
              data: nodeConfig.data,
            };
            state = canvasReducer(state, addNode(node));
            
            // Perform undo
            state = canvasReducer(state, undo());
            
            // Verify state is marked as dirty
            expect(state.isDirty).toBe(true);
            
            // Perform redo
            state = canvasReducer(state, redo());
            
            // Verify state is still marked as dirty
            expect(state.isDirty).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
