/**
 * Property Test: Layout Stability
 * Feature: ui-cleanup, Property 1: Layout Stability
 * Validates: Requirements 1.4
 * 
 * Layout: Toolbar at top + Left sidebar for operators + Canvas
 * No navigation bar in editor.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { EditorPage } from '../index';
import canvasReducer from '../../../store/slices/canvas-slice';
import authReducer from '../../../store/slices/auth-slice';
import executionReducer from '../../../store/slices/execution-slice';
import pipesReducer from '../../../store/slices/pipes-slice';
import schemaReducer from '../../../store/slices/schema-slice';
import anonymousReducer from '../../../store/slices/anonymous-slice';
import { ToastProvider } from '../../../components/common/Toast';

// Mock ReactFlow
vi.mock('reactflow', () => ({
  default: ({ children }: any) => <div data-testid="reactflow">{children}</div>,
  Background: () => <div>Background</div>,
  Controls: () => <div>Controls</div>,
  BackgroundVariant: { Dots: 'dots' },
  useNodesState: () => [[], () => {}, () => {}],
  useEdgesState: () => [[], () => {}, () => {}],
  MarkerType: { ArrowClosed: 'arrowclosed' },
  ReactFlowProvider: ({ children }: any) => <div>{children}</div>,
}));

// Mock pipe service
vi.mock('../../../services/pipe-service', () => ({
  pipeService: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ToastProvider>
      {children}
    </ToastProvider>
  </BrowserRouter>
);

describe('Property 1: Layout Stability', () => {
  const createTestStore = () => {
    return configureStore({
      reducer: {
        canvas: canvasReducer,
        auth: authReducer,
        execution: executionReducer,
        pipes: pipesReducer,
        schema: schemaReducer,
        anonymous: anonymousReducer,
      },
      preloadedState: {
        canvas: {
          nodes: [],
          edges: [],
          selectedNode: null,
          selectedEdges: [],
          expandedNodeId: null,
          viewport: { x: 0, y: 0, zoom: 1 },
          isDirty: false,
          history: { past: [], future: [] },
        },
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        },
        execution: {
          isExecuting: false,
          result: null,
          error: null,
        },
        pipes: {
          items: [],
          isLoading: false,
          error: null,
        },
        schema: {
          nodeSchemas: {},
          upstreamSchemas: {},
          previewLoading: {},
          previewErrors: {},
        },
        anonymous: {
          executionCount: 0,
          executionLimit: 5,
          localPipes: [],
        },
      },
    });
  };

  it('should have h-screen flex flex-col layout', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorPage />
        </TestWrapper>
      </Provider>
    );

    const mainLayout = container.querySelector('.h-screen.flex.flex-col');
    expect(mainLayout).toBeTruthy();
  });

  it('should have toolbar at the top with border-b', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorPage />
        </TestWrapper>
      </Provider>
    );

    const toolbar = container.querySelector('.border-b.border-gray-200');
    expect(toolbar).toBeTruthy();
  });

  it('should have left sidebar with border-r', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorPage />
        </TestWrapper>
      </Provider>
    );

    const sidebar = container.querySelector('.border-r.border-gray-200');
    expect(sidebar).toBeTruthy();
  });

  it('should have main content area with flex-1', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorPage />
        </TestWrapper>
      </Provider>
    );

    const mainContent = container.querySelector('.flex-1.flex.overflow-hidden');
    expect(mainContent).toBeTruthy();
  });

  it('should render ReactFlow canvas', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorPage />
        </TestWrapper>
      </Provider>
    );

    const reactFlow = container.querySelector('[data-testid="reactflow"]');
    expect(reactFlow).toBeTruthy();
  });
});
