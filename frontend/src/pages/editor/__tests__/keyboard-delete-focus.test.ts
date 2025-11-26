/**
 * Property-based tests for keyboard delete respecting focus
 * 
 * **Feature: editor-consolidation, Property 3: Keyboard delete respects focus**
 * **Validates: Requirements 12.4**
 * 
 * Property: For any keyboard delete event, if focus is in an input or textarea, 
 * the delete SHALL NOT remove nodes or edges.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, type KeyboardShortcut } from '../../../hooks/use-keyboard-shortcuts';

describe('Keyboard Delete Focus - Property Tests', () => {
  let deleteHandler: ReturnType<typeof vi.fn>;
  let backspaceHandler: ReturnType<typeof vi.fn>;
  let escapeHandler: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    deleteHandler = vi.fn();
    backspaceHandler = vi.fn();
    escapeHandler = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Helper to create a mock keyboard event
   */
  const createKeyboardEvent = (key: string, options: Partial<KeyboardEventInit> = {}): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
  };

  /**
   * Helper to create a mock element with specified tag
   */
  const createMockElement = (tagName: string, isContentEditable = false): HTMLElement => {
    const element = document.createElement(tagName);
    if (isContentEditable) {
      element.contentEditable = 'true';
    }
    document.body.appendChild(element);
    return element;
  };

  /**
   * **Feature: editor-consolidation, Property 3: Keyboard delete respects focus**
   * **Validates: Requirements 12.4**
   */
  describe('Property 3: Keyboard delete respects focus', () => {
    it('should NOT trigger delete handler when focus is in INPUT element', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Delete', 'Backspace'),
          (key) => {
            const handler = vi.fn();
            const shortcuts: KeyboardShortcut[] = [
              { key, handler, description: 'Delete selected' },
            ];

            // Render the hook
            renderHook(() => useKeyboardShortcuts(shortcuts));

            // Create and focus an input element
            const input = createMockElement('INPUT') as HTMLInputElement;
            input.focus();

            // Dispatch keyboard event
            const event = createKeyboardEvent(key);
            Object.defineProperty(event, 'target', { value: input, writable: false });
            window.dispatchEvent(event);

            // Handler should NOT be called when focus is in input
            expect(handler).not.toHaveBeenCalled();

            // Cleanup
            document.body.removeChild(input);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT trigger delete handler when focus is in TEXTAREA element', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Delete', 'Backspace'),
          (key) => {
            const handler = vi.fn();
            const shortcuts: KeyboardShortcut[] = [
              { key, handler, description: 'Delete selected' },
            ];

            // Render the hook
            renderHook(() => useKeyboardShortcuts(shortcuts));

            // Create and focus a textarea element
            const textarea = createMockElement('TEXTAREA') as HTMLTextAreaElement;
            textarea.focus();

            // Dispatch keyboard event
            const event = createKeyboardEvent(key);
            Object.defineProperty(event, 'target', { value: textarea, writable: false });
            window.dispatchEvent(event);

            // Handler should NOT be called when focus is in textarea
            expect(handler).not.toHaveBeenCalled();

            // Cleanup
            document.body.removeChild(textarea);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT trigger delete handler when focus is in contentEditable element', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Delete', 'Backspace'),
          (key) => {
            const handler = vi.fn();
            const shortcuts: KeyboardShortcut[] = [
              { key, handler, description: 'Delete selected' },
            ];

            // Render the hook
            renderHook(() => useKeyboardShortcuts(shortcuts));

            // Create and focus a contentEditable element
            const div = document.createElement('DIV');
            div.contentEditable = 'true';
            // jsdom doesn't automatically set isContentEditable, so we need to mock it
            Object.defineProperty(div, 'isContentEditable', { value: true, writable: false });
            document.body.appendChild(div);
            div.focus();

            // Dispatch keyboard event
            const event = createKeyboardEvent(key);
            Object.defineProperty(event, 'target', { value: div, writable: false });
            window.dispatchEvent(event);

            // Handler should NOT be called when focus is in contentEditable
            expect(handler).not.toHaveBeenCalled();

            // Cleanup
            document.body.removeChild(div);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger delete handler when focus is NOT in an input element', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Delete', 'Backspace'),
          fc.constantFrom('DIV', 'SPAN', 'BUTTON', 'SECTION', 'ARTICLE'),
          (key, tagName) => {
            const handler = vi.fn();
            const shortcuts: KeyboardShortcut[] = [
              { key, handler, description: 'Delete selected' },
            ];

            // Render the hook
            renderHook(() => useKeyboardShortcuts(shortcuts));

            // Create and focus a non-input element
            const element = createMockElement(tagName);
            element.tabIndex = 0; // Make it focusable
            element.focus();

            // Dispatch keyboard event
            const event = createKeyboardEvent(key);
            Object.defineProperty(event, 'target', { value: element, writable: false });
            window.dispatchEvent(event);

            // Handler SHOULD be called when focus is not in input
            expect(handler).toHaveBeenCalledTimes(1);

            // Cleanup
            document.body.removeChild(element);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ALWAYS trigger Escape handler regardless of focus', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('INPUT', 'TEXTAREA', 'DIV', 'SPAN', 'BUTTON'),
          (tagName) => {
            const handler = vi.fn();
            const shortcuts: KeyboardShortcut[] = [
              { key: 'Escape', handler, description: 'Deselect all' },
            ];

            // Render the hook
            renderHook(() => useKeyboardShortcuts(shortcuts));

            // Create and focus an element
            const element = createMockElement(tagName);
            if (tagName === 'DIV' || tagName === 'SPAN' || tagName === 'BUTTON') {
              element.tabIndex = 0;
            }
            element.focus();

            // Dispatch keyboard event
            const event = createKeyboardEvent('Escape');
            Object.defineProperty(event, 'target', { value: element, writable: false });
            window.dispatchEvent(event);

            // Escape handler SHOULD be called regardless of focus
            expect(handler).toHaveBeenCalledTimes(1);

            // Cleanup
            document.body.removeChild(element);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple input types consistently', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('Delete', 'Backspace'),
          fc.constantFrom('text', 'password', 'email', 'number', 'search', 'tel', 'url'),
          (key, inputType) => {
            const handler = vi.fn();
            const shortcuts: KeyboardShortcut[] = [
              { key, handler, description: 'Delete selected' },
            ];

            // Render the hook
            renderHook(() => useKeyboardShortcuts(shortcuts));

            // Create and focus an input element with specific type
            const input = document.createElement('INPUT') as HTMLInputElement;
            input.type = inputType;
            document.body.appendChild(input);
            input.focus();

            // Dispatch keyboard event
            const event = createKeyboardEvent(key);
            Object.defineProperty(event, 'target', { value: input, writable: false });
            window.dispatchEvent(event);

            // Handler should NOT be called for any input type
            expect(handler).not.toHaveBeenCalled();

            // Cleanup
            document.body.removeChild(input);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
