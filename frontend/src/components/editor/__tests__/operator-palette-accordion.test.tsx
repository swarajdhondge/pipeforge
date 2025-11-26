import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import * as fc from 'fast-check';
import { OperatorPalette } from '../OperatorPalette';
import canvasReducer from '../../../store/slices/canvas-slice';

/**
 * Property 2: Accordion Category Exclusivity
 * Validates: Requirements 3.3
 * 
 * For any sequence of category clicks, at most one category should be expanded at any time.
 */

// Helper to create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      canvas: canvasReducer,
    },
    preloadedState: {
      canvas: {
        nodes: [],
        edges: [],
        history: [],
        historyIndex: -1,
        selectedNodeId: null,
      },
    },
  });
};

// Helper to render component with store
const renderWithStore = () => {
  const store = createTestStore();
  const result = render(
    <Provider store={store}>
      <OperatorPalette />
    </Provider>
  );
  return { ...result, store };
};

// Helper to count expanded categories
const countExpandedCategories = (container: HTMLElement): number => {
  // Find all category buttons with aria-expanded="true"
  const expandedButtons = container.querySelectorAll('button[aria-expanded="true"]');
  return expandedButtons.length;
};

// Helper to get all category buttons
const getCategoryButtons = (container: HTMLElement): HTMLElement[] => {
  // Get all buttons that have aria-expanded attribute (category headers)
  const buttons = Array.from(container.querySelectorAll('button[aria-expanded]'));
  return buttons as HTMLElement[];
};

describe('OperatorPalette - Accordion Exclusivity Property', () => {
  it('should have at most one category expanded at any time (property test)', { timeout: 30000 }, () => {
    // Render once and reuse for all property test iterations
    const { container } = renderWithStore();
    const categoryButtons = getCategoryButtons(container);
    
    fc.assert(
      fc.property(
        // Generate random sequences of category indices to click
        fc.array(fc.integer({ min: 0, max: categoryButtons.length - 1 }), { minLength: 1, maxLength: 10 }),
        (clickSequence) => {
          // Reset state by collapsing all categories
          const currentExpanded = getCategoryButtons(container).findIndex(
            btn => btn.getAttribute('aria-expanded') === 'true'
          );
          if (currentExpanded !== -1) {
            fireEvent.click(categoryButtons[currentExpanded]);
          }
          
          // Initially, all categories should be collapsed
          const initialExpanded = countExpandedCategories(container);
          expect(initialExpanded).toBe(0);
          
          // Perform the sequence of clicks
          for (const categoryIndex of clickSequence) {
            fireEvent.click(categoryButtons[categoryIndex]);
            
            // After each click, verify at most one category is expanded
            const expandedCount = countExpandedCategories(container);
            expect(expandedCount).toBeLessThanOrEqual(1);
          }
          
          // Final check: at most one category should be expanded
          const finalExpanded = countExpandedCategories(container);
          expect(finalExpanded).toBeLessThanOrEqual(1);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design doc
    );
  });

  it('should collapse category when clicked twice', () => {
    const { container } = renderWithStore();
    const categoryButtons = getCategoryButtons(container);
    
    // Click first category to expand
    fireEvent.click(categoryButtons[0]);
    expect(countExpandedCategories(container)).toBe(1);
    
    // Click same category again to collapse
    fireEvent.click(categoryButtons[0]);
    expect(countExpandedCategories(container)).toBe(0);
  });

  it('should switch expanded category when clicking different category', () => {
    const { container } = renderWithStore();
    const categoryButtons = getCategoryButtons(container);
    
    // Click first category to expand
    fireEvent.click(categoryButtons[0]);
    expect(countExpandedCategories(container)).toBe(1);
    expect(categoryButtons[0].getAttribute('aria-expanded')).toBe('true');
    
    // Click second category - should collapse first and expand second
    fireEvent.click(categoryButtons[1]);
    expect(countExpandedCategories(container)).toBe(1);
    expect(categoryButtons[0].getAttribute('aria-expanded')).toBe('false');
    expect(categoryButtons[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('should start with all categories collapsed by default', () => {
    const { container } = renderWithStore();
    const expandedCount = countExpandedCategories(container);
    expect(expandedCount).toBe(0);
  });
});
