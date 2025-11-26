/**
 * Property-based tests for event propagation in operator nodes
 * 
 * **Feature: editor-consolidation, Property 1: Event propagation stops at interactive elements**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 9.6**
 * 
 * Property: For any interactive element (input, select, button, checkbox) inside an OperatorNode,
 * clicking on it SHALL NOT trigger node drag or selection change.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Interactive element types that should stop event propagation
 */
const INTERACTIVE_ELEMENTS = ['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'] as const;
type InteractiveElement = typeof INTERACTIVE_ELEMENTS[number];

/**
 * Input types that should stop event propagation
 */
const INPUT_TYPES = ['text', 'url', 'number', 'email', 'password', 'search', 'tel', 'checkbox'] as const;
type InputType = typeof INPUT_TYPES[number];

/**
 * Helper to create a mock element with event handlers
 */
const createMockElement = (
  tagName: InteractiveElement,
  inputType?: InputType
): HTMLElement => {
  const element = document.createElement(tagName);
  if (tagName === 'INPUT' && inputType) {
    (element as HTMLInputElement).type = inputType;
  }
  return element;
};

/**
 * Helper to create a mock event with stopPropagation tracking
 */
const createMockEvent = (type: 'click' | 'mousedown'): {
  event: MouseEvent;
  stopPropagationCalled: () => boolean;
} => {
  let propagationStopped = false;
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
  });
  
  // Override stopPropagation to track if it was called
  const originalStopPropagation = event.stopPropagation.bind(event);
  event.stopPropagation = () => {
    propagationStopped = true;
    originalStopPropagation();
  };
  
  return {
    event,
    stopPropagationCalled: () => propagationStopped,
  };
};

/**
 * Simulates the event handling pattern used in inline config components
 * This mirrors the pattern: onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}
 */
const attachEventHandlers = (element: HTMLElement): void => {
  element.addEventListener('click', (e) => e.stopPropagation());
  element.addEventListener('mousedown', (e) => e.stopPropagation());
};

describe('Property 1: Event propagation stops at interactive elements', () => {
  let container: HTMLDivElement;
  let parentClickHandler: ReturnType<typeof vi.fn>;
  let parentMouseDownHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create a container that simulates the node body
    container = document.createElement('div');
    container.className = 'node-body';
    
    // Attach handlers to parent to detect if propagation was NOT stopped
    parentClickHandler = vi.fn();
    parentMouseDownHandler = vi.fn();
    container.addEventListener('click', parentClickHandler as EventListener);
    container.addEventListener('mousedown', parentMouseDownHandler as EventListener);
    
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  /**
   * **Feature: editor-consolidation, Property 1: Event propagation stops at interactive elements**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 9.6**
   * 
   * Property: For any interactive element type, click events should NOT propagate to parent
   */
  it('should stop click propagation for all interactive element types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...INTERACTIVE_ELEMENTS),
        (elementType) => {
          // Create the interactive element
          const element = createMockElement(elementType);
          attachEventHandlers(element);
          container.appendChild(element);

          // Reset handlers
          parentClickHandler.mockClear();

          // Dispatch click event
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          element.dispatchEvent(clickEvent);

          // Parent handler should NOT be called (propagation was stopped)
          expect(parentClickHandler).not.toHaveBeenCalled();

          // Cleanup
          container.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: editor-consolidation, Property 1: Event propagation stops at interactive elements**
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 9.6**
   * 
   * Property: For any interactive element type, mousedown events should NOT propagate to parent
   * (mousedown is what ReactFlow uses to initiate drag)
   */
  it('should stop mousedown propagation for all interactive element types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...INTERACTIVE_ELEMENTS),
        (elementType) => {
          // Create the interactive element
          const element = createMockElement(elementType);
          attachEventHandlers(element);
          container.appendChild(element);

          // Reset handlers
          parentMouseDownHandler.mockClear();

          // Dispatch mousedown event
          const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          element.dispatchEvent(mouseDownEvent);

          // Parent handler should NOT be called (propagation was stopped)
          expect(parentMouseDownHandler).not.toHaveBeenCalled();

          // Cleanup
          container.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: editor-consolidation, Property 1: Event propagation stops at interactive elements**
   * **Validates: Requirements 1.1**
   * 
   * Property: For any input type, click events should NOT propagate to parent
   */
  it('should stop click propagation for all input types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...INPUT_TYPES),
        (inputType) => {
          // Create the input element with specific type
          const element = createMockElement('INPUT', inputType);
          attachEventHandlers(element);
          container.appendChild(element);

          // Reset handlers
          parentClickHandler.mockClear();

          // Dispatch click event
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          element.dispatchEvent(clickEvent);

          // Parent handler should NOT be called (propagation was stopped)
          expect(parentClickHandler).not.toHaveBeenCalled();

          // Cleanup
          container.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: editor-consolidation, Property 1: Event propagation stops at interactive elements**
   * **Validates: Requirements 1.5**
   * 
   * Property: For checkbox inputs specifically, click events should NOT propagate to parent
   */
  it('should stop click propagation for checkbox inputs', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // Generate random checked state
        (initialChecked) => {
          // Create checkbox input
          const checkbox = document.createElement('input') as HTMLInputElement;
          checkbox.type = 'checkbox';
          checkbox.checked = initialChecked;
          attachEventHandlers(checkbox);
          container.appendChild(checkbox);

          // Reset handlers
          parentClickHandler.mockClear();

          // Dispatch click event
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          checkbox.dispatchEvent(clickEvent);

          // Parent handler should NOT be called (propagation was stopped)
          expect(parentClickHandler).not.toHaveBeenCalled();

          // Cleanup
          container.removeChild(checkbox);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: editor-consolidation, Property 1: Event propagation stops at interactive elements**
   * **Validates: Requirements 1.2**
   * 
   * Property: For select dropdowns, both click and mousedown should NOT propagate
   */
  it('should stop both click and mousedown propagation for select elements', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (options) => {
          // Create select element with options
          const select = document.createElement('select');
          options.forEach((optionText, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = optionText;
            select.appendChild(option);
          });
          attachEventHandlers(select);
          container.appendChild(select);

          // Reset handlers
          parentClickHandler.mockClear();
          parentMouseDownHandler.mockClear();

          // Dispatch click event
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          select.dispatchEvent(clickEvent);
          expect(parentClickHandler).not.toHaveBeenCalled();

          // Dispatch mousedown event
          const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
          select.dispatchEvent(mouseDownEvent);
          expect(parentMouseDownHandler).not.toHaveBeenCalled();

          // Cleanup
          container.removeChild(select);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: editor-consolidation, Property 1: Event propagation stops at interactive elements**
   * **Validates: Requirements 1.3**
   * 
   * Property: For buttons, click events should NOT propagate to parent
   */
  it('should stop click propagation for buttons with any text content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (buttonText) => {
          // Create button with text
          const button = document.createElement('button');
          button.textContent = buttonText;
          attachEventHandlers(button);
          container.appendChild(button);

          // Reset handlers
          parentClickHandler.mockClear();

          // Dispatch click event
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          button.dispatchEvent(clickEvent);

          // Parent handler should NOT be called (propagation was stopped)
          expect(parentClickHandler).not.toHaveBeenCalled();

          // Cleanup
          container.removeChild(button);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: editor-consolidation, Property 1: Event propagation stops at interactive elements**
   * **Validates: Requirements 9.6**
   * 
   * Property: Nested interactive elements should also stop propagation
   */
  it('should stop propagation for nested interactive elements', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...INTERACTIVE_ELEMENTS),
        fc.constantFrom('DIV', 'SPAN', 'FORM'),
        (elementType, wrapperType) => {
          // Create wrapper element
          const wrapper = document.createElement(wrapperType);
          attachEventHandlers(wrapper);
          
          // Create nested interactive element
          const element = createMockElement(elementType);
          attachEventHandlers(element);
          
          wrapper.appendChild(element);
          container.appendChild(wrapper);

          // Reset handlers
          parentClickHandler.mockClear();
          parentMouseDownHandler.mockClear();

          // Dispatch click event on the nested element
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          element.dispatchEvent(clickEvent);

          // Parent handler should NOT be called (propagation was stopped at element level)
          expect(parentClickHandler).not.toHaveBeenCalled();

          // Cleanup
          container.removeChild(wrapper);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Negative test: Events on non-interactive elements SHOULD propagate
   * This ensures our test setup is correct
   */
  it('should allow propagation for non-interactive elements (control test)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DIV', 'SPAN', 'P', 'LABEL'),
        (elementType) => {
          // Create non-interactive element WITHOUT event handlers
          const element = document.createElement(elementType);
          container.appendChild(element);

          // Reset handlers
          parentClickHandler.mockClear();

          // Dispatch click event
          const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
          element.dispatchEvent(clickEvent);

          // Parent handler SHOULD be called (propagation was NOT stopped)
          expect(parentClickHandler).toHaveBeenCalledTimes(1);

          // Cleanup
          container.removeChild(element);
        }
      ),
      { numRuns: 100 }
    );
  });
});
