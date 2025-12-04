/**
 * Property-based tests for canvas stability
 * 
 * **Feature: ux-simplification, Property 1: Canvas Stability**
 * **Validates: Requirements 4.1, 4.2, 4.5**
 * 
 * Layout: Toolbar at top + Left sidebar for operators + Canvas
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';
import { EditorPage } from '../editor';
import { ToastProvider } from '../../components/common/Toast';
import canvasReducer from '../../store/slices/canvas-slice';
import authReducer from '../../store/slices/auth-slice';
import anonymousReducer from '../../store/slices/anonymous-slice';
import executionReducer from '../../store/slices/execution-slice';
import pipesReducer from '../../store/slices/pipes-slice';
import schemaReducer from '../../store/slices/schema-slice';
import secretsReducer from '../../store/slices/secrets-slice';

// Mock ReactFlow
vi.mock('reactflow', () => {
  const ReactFlowComponent = ({ children }: any) => <div data-testid="react-flow">{children}</div>;
  const ReactFlowProvider = ({ children }: any) => <div data-testid="react-flow-provider">{children}</div>;
  return {
    default: ReactFlowComponent,
    ReactFlow: ReactFlowComponent,
    ReactFlowProvider,
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />,
    useNodesState: () => [[], vi.fn(), vi.fn()],
    useEdgesState: () => [[], vi.fn(), vi.fn()],
    useReactFlow: () => ({ fitView: vi.fn() }),
    addEdge: vi.fn(),
    MarkerType: { ArrowClosed: 'arrowclosed' },
    BackgroundVariant: { Dots: 'dots' },
  };
});

// Mock services
vi.mock('../../services/pipe-service', () => ({
  pipeService: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../services/execution-service', () => ({
  executionService: {
    executeDefinition: vi.fn(),
  },
}));

const createTestStore = (initialState?: any) => {
  return configureStore({
    reducer: {
      canvas: canvasReducer,
      auth: authReducer,
      anonymous: anonymousReducer,
      execution: executionReducer,
      pipes: pipesReducer,
      schema: schemaReducer,
      secrets: secretsReducer,
    },
    preloadedState: initialState,
  });
};

const renderEditor = (store: ReturnType<typeof createTestStore>) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <ToastProvider>
          <EditorPage />
        </ToastProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('Canvas Stability - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('Property 1: Canvas Stability', () => {
    it('should render the editor with flex layout', () => {
      const store = createTestStore({
        canvas: {
          nodes: [],
          edges: [],
          selectedNode: null,
          selectedEdges: [],
          expandedNodeId: null,
          viewport: { x: 0, y: 0, zoom: 1 },
          history: { past: [], future: [] },
          isDirty: false,
        },
      });
      
      const { container } = renderEditor(store);
      
      const flexContainer = container.querySelector('.h-screen.flex.flex-col');
      expect(flexContainer).toBeTruthy();
    });

    it('should render toolbar at the top', () => {
      const store = createTestStore({
        canvas: {
          nodes: [],
          edges: [],
          selectedNode: null,
          selectedEdges: [],
          expandedNodeId: null,
          viewport: { x: 0, y: 0, zoom: 1 },
          history: { past: [], future: [] },
          isDirty: false,
        },
      });
      
      const { container } = renderEditor(store);
      
      const toolbar = container.querySelector('.border-b.border-gray-200');
      expect(toolbar).toBeTruthy();
    });

    it('should render left sidebar for operators', () => {
      const store = createTestStore({
        canvas: {
          nodes: [],
          edges: [],
          selectedNode: null,
          selectedEdges: [],
          expandedNodeId: null,
          viewport: { x: 0, y: 0, zoom: 1 },
          history: { past: [], future: [] },
          isDirty: false,
        },
      });
      
      const { container } = renderEditor(store);
      
      const sidebar = container.querySelector('.border-r.border-gray-200');
      expect(sidebar).toBeTruthy();
    });

    it('should have main content area with flex-1', () => {
      const store = createTestStore({
        canvas: {
          nodes: [],
          edges: [],
          selectedNode: null,
          selectedEdges: [],
          expandedNodeId: null,
          viewport: { x: 0, y: 0, zoom: 1 },
          history: { past: [], future: [] },
          isDirty: false,
        },
      });
      
      const { container } = renderEditor(store);
      
      const mainContent = container.querySelector('.flex-1.flex.overflow-hidden');
      expect(mainContent).toBeTruthy();
    });

    it('should render ReactFlow canvas', () => {
      const store = createTestStore({
        canvas: {
          nodes: [],
          edges: [],
          selectedNode: null,
          selectedEdges: [],
          expandedNodeId: null,
          viewport: { x: 0, y: 0, zoom: 1 },
          history: { past: [], future: [] },
          isDirty: false,
        },
      });
      
      const { container } = renderEditor(store);
      
      const reactFlow = container.querySelector('[data-testid="react-flow"]');
      expect(reactFlow).toBeTruthy();
    });
  });
});
