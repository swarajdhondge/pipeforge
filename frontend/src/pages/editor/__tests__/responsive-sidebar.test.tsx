/**
 * Property Test: Operators Sidebar
 * Feature: ui-cleanup, Property 6: Operators Sidebar
 * Validates: Requirements 6.1, 6.2
 * 
 * Tests the OperatorsSidebar component for proper rendering.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { OperatorsSidebar } from '../components/OperatorsSidebar';
import canvasReducer from '../../../store/slices/canvas-slice';

const createMockStore = () => {
  return configureStore({
    reducer: {
      canvas: canvasReducer,
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
    },
  });
};

describe('Property Test: Operators Sidebar', () => {
  it('should have fixed width (w-56)', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <OperatorsSidebar />
      </Provider>
    );

    const sidebar = container.firstChild as HTMLElement;
    expect(sidebar.className).toContain('w-56');
  });

  it('should have flex-shrink-0 to prevent shrinking', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <OperatorsSidebar />
      </Provider>
    );

    const sidebar = container.firstChild as HTMLElement;
    expect(sidebar.className).toContain('flex-shrink-0');
  });

  it('should have border on the right side', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <OperatorsSidebar />
      </Provider>
    );

    const sidebar = container.firstChild as HTMLElement;
    expect(sidebar.className).toContain('border-r');
  });

  it('should display "Operators" header', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <OperatorsSidebar />
      </Provider>
    );

    expect(container.textContent).toContain('Operators');
  });

  it('should display operator categories', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <OperatorsSidebar />
      </Provider>
    );

    expect(container.textContent).toContain('Sources');
    expect(container.textContent).toContain('User Inputs');
    expect(container.textContent).toContain('String');
  });

  it('should have collapsible category sections', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <OperatorsSidebar />
      </Provider>
    );

    // Should have category buttons
    const categoryButtons = container.querySelectorAll('button');
    expect(categoryButtons.length).toBeGreaterThan(0);
  });

  it('should expand category when clicked', () => {
    const store = createMockStore();
    const { container } = render(
      <Provider store={store}>
        <OperatorsSidebar />
      </Provider>
    );

    // Sources should be expanded by default, showing Fetch JSON
    expect(container.textContent).toContain('Fetch JSON');
    
    // Click on User Inputs category
    const userInputsButton = Array.from(container.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('User Inputs')
    );
    
    if (userInputsButton) {
      fireEvent.click(userInputsButton);
    }

    // Should now show User Inputs operators
    expect(container.textContent).toContain('Text Input');
  });
});
