/**
 * Property Test: Canvas Maximum Space
 * Feature: ui-cleanup, Property 2: Canvas Maximum Space
 * Validates: Requirements 1.5
 * 
 * Layout: Toolbar at top + Left sidebar for operators + Canvas takes remaining space
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
  default: () => <div data-testid="reactflow">ReactFlow</div>,
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

describe('Property 2: Canvas Maximum Space', () => {
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

  it('should have canvas container with flex-1 class', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorPage />
        </TestWrapper>
      </Provider>
    );

    const canvasContainer = container.querySelector('.flex-1.flex.flex-col.overflow-hidden');
    expect(canvasContainer).toBeTruthy();
    expect(canvasContainer?.className).toContain('flex-1');
  });

  it('should have left sidebar with fixed width (w-56)', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorPage />
        </TestWrapper>
      </Provider>
    );

    const sidebar = container.querySelector('.w-56.bg-white.border-r');
    expect(sidebar).toBeTruthy();
    expect(sidebar?.className).toContain('flex-shrink-0');
  });

  it('should have toolbar with flex-shrink-0', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorPage />
        </TestWrapper>
      </Provider>
    );

    const toolbar = container.querySelector('.flex-shrink-0');
    expect(toolbar).toBeTruthy();
  });

  it('should have main layout with h-screen and flex-col', () => {
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
