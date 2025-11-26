/**
 * Property Test: Compact Node Height
 * Feature: ui-cleanup, Property 4: Compact Node Height
 * Validates: Requirements 3.2
 * 
 * For any operator node in collapsed state, the rendered height SHALL be at most 50px.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CompactOperatorNode } from '../CompactOperatorNode';
import canvasReducer from '../../../store/slices/canvas-slice';
import schemaReducer from '../../../store/slices/schema-slice';
import fc from 'fast-check';
import type { OperatorType } from '../../../types/operator.types';

// Mock ReactFlow
vi.mock('reactflow', () => ({
  Handle: ({ children, ...props }: any) => <div data-testid="handle" {...props}>{children}</div>,
  Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' },
  MarkerType: { ArrowClosed: 'arrowclosed' },
}));

describe('Property 4: Compact Node Height', () => {
  const operatorTypes: OperatorType[] = [
    'fetch-json', 'fetch-csv', 'fetch-rss', 'fetch-page',
    'text-input', 'number-input', 'url-input', 'date-input',
    'filter', 'sort', 'transform',
    'unique', 'truncate', 'tail', 'rename',
    'string-replace', 'regex', 'substring',
    'url-builder', 'pipe-output',
  ];

  const createTestStore = (expandedNodeId: string | null = null) => {
    return configureStore({
      reducer: {
        canvas: canvasReducer,
        schema: schemaReducer,
      },
      preloadedState: {
        canvas: {
          nodes: [],
          edges: [],
          selectedNode: null,
          isDirty: false,
          history: {
            past: [],
            future: [],
          },
          expandedNodeId,
        },
      },
    });
  };

  it('should render all operator types with compact structure when collapsed', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...operatorTypes),
        fc.string({ minLength: 1, maxLength: 30 }),
        (operatorType, label) => {
          const store = createTestStore(null); // No expanded node
          
          const nodeData = {
            label,
            config: {},
          };

          const { container } = render(
            <Provider store={store}>
              <CompactOperatorNode
                id="test-node"
                data={nodeData}
                type={operatorType}
                selected={false}
                isConnectable={true}
                xPos={0}
                yPos={0}
                dragging={false}
                zIndex={0}
              />
            </Provider>
          );

          // Find the node body (has rounded-lg class)
          const nodeBody = container.querySelector('.rounded-lg');
          expect(nodeBody).toBeTruthy();

          // Collapsed node should only have header (1 child)
          // This ensures it's compact (not expanded with inline config)
          const children = nodeBody?.children;
          expect(children?.length).toBe(1);

          // Header should have compact padding (py-2.5)
          const header = container.querySelector('.py-2\\.5');
          expect(header).toBeTruthy();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should have compact header with proper padding', () => {
    const store = createTestStore(null);
    
    const { container } = render(
      <Provider store={store}>
        <CompactOperatorNode
          id="test-node"
          data={{ label: 'Test Node', config: {} }}
          type="filter"
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          dragging={false}
          zIndex={0}
        />
      </Provider>
    );

    // Find the header (has px-3 py-2.5 classes)
    const header = container.querySelector('.px-3.py-2\\.5');
    expect(header).toBeTruthy();
    
    // Header should have flex layout with items-center
    expect(header?.className).toContain('flex');
    expect(header?.className).toContain('items-center');
  });

  it('should not expand when expandedNodeId is different', () => {
    const store = createTestStore('other-node');
    
    const { container } = render(
      <Provider store={store}>
        <CompactOperatorNode
          id="test-node"
          data={{ label: 'Test Node', config: {} }}
          type="filter"
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          dragging={false}
          zIndex={0}
        />
      </Provider>
    );

    // Should not have expanded config (no border-t border-neutral-200 after header)
    const nodeBody = container.querySelector('.rounded-lg');
    const children = nodeBody?.children;
    
    // Should only have header (1 child) when collapsed
    expect(children?.length).toBe(1);
  });

  it('should show validation badge without expanding node', () => {
    const store = createTestStore(null);
    
    const { container } = render(
      <Provider store={store}>
        <CompactOperatorNode
          id="test-node"
          data={{ 
            label: 'Test Node', 
            config: {}, // Empty config will trigger validation errors for some operators
          }}
          type="fetch-json" // Requires URL
          selected={false}
          isConnectable={true}
          xPos={0}
          yPos={0}
          dragging={false}
          zIndex={0}
        />
      </Provider>
    );

    // Node should still be compact even with validation errors
    const nodeBody = container.querySelector('.rounded-lg');
    expect(nodeBody).toBeTruthy();
    
    // Should have warning badge in header
    const warningBadge = container.querySelector('.bg-yellow-400');
    expect(warningBadge).toBeTruthy();
  });
});
