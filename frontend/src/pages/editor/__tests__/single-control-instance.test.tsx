/**
 * Property Test: Single Control Instance
 * Feature: ui-cleanup, Property 3: Single Control Instance
 * Validates: Requirements 2.1, 2.2, 2.3, 2.5
 * 
 * For any action (Run, Save, Undo, Redo), there SHALL be exactly one control button in the DOM.
 * 
 * Layout: Toolbar with controls + Left sidebar for operators
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { EditorToolbar } from '../components/EditorToolbar';
import canvasReducer from '../../../store/slices/canvas-slice';
import authReducer from '../../../store/slices/auth-slice';
import schemaReducer from '../../../store/slices/schema-slice';
import { ToastProvider } from '../../../components/common/Toast';

// Mock pipe service
vi.mock('../../../services/pipe-service', () => ({
  pipeService: {
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      canvas: canvasReducer,
      auth: authReducer,
      schema: schemaReducer,
    },
    preloadedState: {
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
      auth: {
        user: { id: '1', email: 'test@example.com' },
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
      schema: {
        nodeSchemas: {},
        upstreamSchemas: {},
        previewLoading: {},
        previewErrors: {},
      },
    },
  });
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ToastProvider>
      {children}
    </ToastProvider>
  </BrowserRouter>
);

describe('Property Test: Single Control Instance', () => {
  it('should have exactly one Run button in EditorToolbar', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorToolbar />
        </TestWrapper>
      </Provider>
    );

    const runButtons = Array.from(container.querySelectorAll('button')).filter(
      (button) => button.textContent?.toLowerCase().includes('run')
    );

    expect(runButtons.length).toBe(1);
  });

  it('should have exactly one Save button in EditorToolbar', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorToolbar />
        </TestWrapper>
      </Provider>
    );

    const saveButtons = Array.from(container.querySelectorAll('button')).filter(
      (button) => {
        const text = button.textContent?.toLowerCase() || '';
        return text.includes('save') && !text.includes('unsaved');
      }
    );

    expect(saveButtons.length).toBe(1);
  });

  it('should have exactly one Undo button in EditorToolbar', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorToolbar />
        </TestWrapper>
      </Provider>
    );

    const undoButtons = Array.from(container.querySelectorAll('button')).filter(
      (button) => button.getAttribute('title')?.toLowerCase().includes('undo')
    );

    expect(undoButtons.length).toBe(1);
  });

  it('should have exactly one Redo button in EditorToolbar', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorToolbar />
        </TestWrapper>
      </Provider>
    );

    const redoButtons = Array.from(container.querySelectorAll('button')).filter(
      (button) => button.getAttribute('title')?.toLowerCase().includes('redo')
    );

    expect(redoButtons.length).toBe(1);
  });

  it('should have all control buttons (Run, Save, Undo, Redo) in toolbar', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <TestWrapper>
          <EditorToolbar />
        </TestWrapper>
      </Provider>
    );

    const allButtons = Array.from(container.querySelectorAll('button'));
    const controlButtons = allButtons.filter((button) => {
      const text = button.textContent?.toLowerCase() || '';
      const title = button.getAttribute('title')?.toLowerCase() || '';
      return (
        text.includes('run') ||
        (text.includes('save') && !text.includes('unsaved')) ||
        title.includes('undo') ||
        title.includes('redo')
      );
    });

    expect(controlButtons.length).toBe(4);
  });
});
