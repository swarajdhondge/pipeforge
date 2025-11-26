/**
 * Property-based tests for FirstTimeOverlay localStorage persistence
 * 
 * **Feature: editor-ux-fixes, Property 1: First-time overlay localStorage persistence**
 * **Validates: Requirements 1.2, 1.3**
 * 
 * Property: For any user interaction where the "Don't show again" button is clicked, 
 * the localStorage key should be set, and subsequent hook calls should return 
 * `showOverlay: false`.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFirstTimeOverlay } from '../FirstTimeOverlay';

const FIRST_TIME_GUIDE_KEY = 'pipe_forge_first_time_guide_dismissed';

describe('FirstTimeOverlay - Property Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Use fake timers to control setTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    // Restore real timers
    vi.useRealTimers();
  });

  /**
   * **Feature: editor-ux-fixes, Property 1: First-time overlay localStorage persistence**
   * **Validates: Requirements 1.2, 1.3**
   */
  describe('Property 1: First-time overlay localStorage persistence', () => {
    it('should set localStorage key when dismissGuide is called', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10 }),
          () => {
            // Clear localStorage
            localStorage.removeItem(FIRST_TIME_GUIDE_KEY);
            
            // Render the hook
            const { result } = renderHook(() => useFirstTimeOverlay());
            
            // Advance timers to trigger the setTimeout (500ms)
            act(() => {
              vi.advanceTimersByTime(500);
            });
            
            // Verify overlay should show initially
            expect(result.current.showOverlay).toBe(true);
            
            // Call dismissGuide
            act(() => {
              result.current.dismissGuide();
            });
            
            // Verify localStorage key is set
            const storedValue = localStorage.getItem(FIRST_TIME_GUIDE_KEY);
            expect(storedValue).toBe('true');
            
            // Verify showOverlay is false
            expect(result.current.showOverlay).toBe(false);
            
            // Verify step is complete
            expect(result.current.step).toBe('complete');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not show overlay when localStorage key exists', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10 }),
          () => {
            // Set localStorage key before rendering
            localStorage.setItem(FIRST_TIME_GUIDE_KEY, 'true');
            
            // Render the hook
            const { result } = renderHook(() => useFirstTimeOverlay());
            
            // Wait for initial effect to run
            act(() => {
              // Small delay to let useEffect run
            });
            
            // Verify overlay should not show
            expect(result.current.showOverlay).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should show overlay when localStorage key does not exist', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10 }),
          () => {
            // Ensure localStorage key does not exist
            localStorage.removeItem(FIRST_TIME_GUIDE_KEY);
            
            // Render the hook
            const { result } = renderHook(() => useFirstTimeOverlay());
            
            // Advance timers to trigger the setTimeout (500ms)
            act(() => {
              vi.advanceTimersByTime(500);
            });
            
            // After the effect runs, showOverlay should be true
            expect(result.current.showOverlay).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should persist dismissal across multiple hook instances', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }),
          (numInstances) => {
            // Clear localStorage
            localStorage.removeItem(FIRST_TIME_GUIDE_KEY);
            
            // First instance: dismiss the guide
            const { result: result1 } = renderHook(() => useFirstTimeOverlay());
            
            act(() => {
              result1.current.dismissGuide();
            });
            
            // Verify localStorage is set
            expect(localStorage.getItem(FIRST_TIME_GUIDE_KEY)).toBe('true');
            
            // Create multiple new instances
            for (let i = 0; i < numInstances; i++) {
              const { result } = renderHook(() => useFirstTimeOverlay());
              
              act(() => {
                // Let effect run
              });
              
              // All subsequent instances should not show overlay
              expect(result.current.showOverlay).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not persist when skipGuide is called', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10 }),
          () => {
            // Clear localStorage
            localStorage.removeItem(FIRST_TIME_GUIDE_KEY);
            
            // Render the hook
            const { result } = renderHook(() => useFirstTimeOverlay());
            
            act(() => {
              // Let initial effect run
            });
            
            // Call skipGuide
            act(() => {
              result.current.skipGuide();
            });
            
            // Verify localStorage key is NOT set
            const storedValue = localStorage.getItem(FIRST_TIME_GUIDE_KEY);
            expect(storedValue).toBeNull();
            
            // Verify showOverlay is false
            expect(result.current.showOverlay).toBe(false);
            
            // Verify step is complete
            expect(result.current.step).toBe('complete');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should allow showing overlay again after skip', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10 }),
          () => {
            // Clear localStorage
            localStorage.removeItem(FIRST_TIME_GUIDE_KEY);
            
            // First instance: skip the guide
            const { result: result1 } = renderHook(() => useFirstTimeOverlay());
            
            act(() => {
              result1.current.skipGuide();
            });
            
            // Verify localStorage is NOT set
            expect(localStorage.getItem(FIRST_TIME_GUIDE_KEY)).toBeNull();
            
            // Second instance: should show overlay again
            const { result: result2 } = renderHook(() => useFirstTimeOverlay());
            
            // Advance timers to trigger the setTimeout (500ms)
            act(() => {
              vi.advanceTimersByTime(500);
            });
            
            // Overlay should show again
            expect(result2.current.showOverlay).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reset guide and show overlay when resetGuide is called', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10 }),
          () => {
            // Set localStorage key (guide was dismissed)
            localStorage.setItem(FIRST_TIME_GUIDE_KEY, 'true');
            
            // Render the hook
            const { result } = renderHook(() => useFirstTimeOverlay());
            
            act(() => {
              // Let initial effect run
            });
            
            // Verify overlay is not showing
            expect(result.current.showOverlay).toBe(false);
            
            // Call resetGuide
            act(() => {
              result.current.resetGuide();
            });
            
            // Verify localStorage key is removed
            const storedValue = localStorage.getItem(FIRST_TIME_GUIDE_KEY);
            expect(storedValue).toBeNull();
            
            // Verify showOverlay is true
            expect(result.current.showOverlay).toBe(true);
            
            // Verify step is reset to 1
            expect(result.current.step).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain localStorage state after completing all steps', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 10 }),
          () => {
            // Clear localStorage
            localStorage.removeItem(FIRST_TIME_GUIDE_KEY);
            
            // Render the hook
            const { result } = renderHook(() => useFirstTimeOverlay());
            
            act(() => {
              // Let initial effect run
            });
            
            // Advance through all steps
            act(() => {
              result.current.advanceStep(); // Step 1 -> 2
            });
            
            act(() => {
              result.current.advanceStep(); // Step 2 -> 3
            });
            
            act(() => {
              result.current.advanceStep(); // Step 3 -> complete
            });
            
            // Verify localStorage key is set after completing all steps
            const storedValue = localStorage.getItem(FIRST_TIME_GUIDE_KEY);
            expect(storedValue).toBe('true');
            
            // Verify showOverlay is false
            expect(result.current.showOverlay).toBe(false);
            
            // Verify step is complete
            expect(result.current.step).toBe('complete');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple dismiss calls idempotently', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 10 }),
          (numDismissCalls) => {
            // Clear localStorage
            localStorage.removeItem(FIRST_TIME_GUIDE_KEY);
            
            // Render the hook
            const { result } = renderHook(() => useFirstTimeOverlay());
            
            act(() => {
              // Let initial effect run
            });
            
            // Call dismissGuide multiple times
            for (let i = 0; i < numDismissCalls; i++) {
              act(() => {
                result.current.dismissGuide();
              });
            }
            
            // Verify localStorage key is still set correctly
            const storedValue = localStorage.getItem(FIRST_TIME_GUIDE_KEY);
            expect(storedValue).toBe('true');
            
            // Verify showOverlay is false
            expect(result.current.showOverlay).toBe(false);
            
            // Verify step is complete
            expect(result.current.step).toBe('complete');
          }
        ),
        { numRuns: 100 }
      );
    });


  });
});
