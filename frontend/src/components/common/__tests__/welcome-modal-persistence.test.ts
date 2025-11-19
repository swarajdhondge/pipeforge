/**
 * Property-based tests for WelcomeModal localStorage persistence
 *
 * **Feature: editor-ux-fixes, Property 5: Welcome modal localStorage persistence**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';

// Mock react-router-dom before importing the hook
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

import { useWelcomeModal } from '../WelcomeModal';

const WELCOME_SHOWN_KEY = 'pipe_forge_welcome_shown';

describe('WelcomeModal - Property Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  /**
   * **Feature: editor-ux-fixes, Property 5: Welcome modal localStorage persistence**
   * **Validates: Requirements 5.1, 5.2, 5.3**
   */
  describe('Property 5: Welcome modal localStorage persistence', () => {
    it('should set localStorage key when closeModal is called', () => {
      fc.assert(
        fc.property(fc.nat({ max: 10 }), () => {
          localStorage.removeItem(WELCOME_SHOWN_KEY);
          const { result } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          expect(result.current.isOpen).toBe(true);
          act(() => { result.current.closeModal(); });
          expect(localStorage.getItem(WELCOME_SHOWN_KEY)).toBe('true');
          expect(result.current.isOpen).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should not show modal when localStorage key exists', () => {
      fc.assert(
        fc.property(fc.nat({ max: 10 }), () => {
          localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
          const { result } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          expect(result.current.isOpen).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should show modal when localStorage key does not exist', () => {
      fc.assert(
        fc.property(fc.nat({ max: 10 }), () => {
          localStorage.removeItem(WELCOME_SHOWN_KEY);
          const { result } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          expect(result.current.isOpen).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should persist dismissal across multiple hook instances', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 5 }), (numInstances) => {
          localStorage.removeItem(WELCOME_SHOWN_KEY);
          const { result: result1 } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          act(() => { result1.current.closeModal(); });
          expect(localStorage.getItem(WELCOME_SHOWN_KEY)).toBe('true');
          for (let i = 0; i < numInstances; i++) {
            const { result } = renderHook(() => useWelcomeModal());
            act(() => { vi.advanceTimersByTime(500); });
            expect(result.current.isOpen).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should allow showing modal again after resetWelcome is called', () => {
      fc.assert(
        fc.property(fc.nat({ max: 10 }), () => {
          localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
          const { result } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          expect(result.current.isOpen).toBe(false);
          act(() => { result.current.resetWelcome(); });
          expect(localStorage.getItem(WELCOME_SHOWN_KEY)).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    it('should handle multiple closeModal calls idempotently', () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 10 }), (numCloseCalls) => {
          localStorage.removeItem(WELCOME_SHOWN_KEY);
          const { result } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          for (let i = 0; i < numCloseCalls; i++) {
            act(() => { result.current.closeModal(); });
          }
          expect(localStorage.getItem(WELCOME_SHOWN_KEY)).toBe('true');
          expect(result.current.isOpen).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should show modal again after browser data is cleared', () => {
      fc.assert(
        fc.property(fc.nat({ max: 10 }), () => {
          localStorage.removeItem(WELCOME_SHOWN_KEY);
          const { result: result1, unmount: unmount1 } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          act(() => { result1.current.closeModal(); });
          expect(localStorage.getItem(WELCOME_SHOWN_KEY)).toBe('true');
          unmount1();
          localStorage.clear();
          const { result: result2 } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          expect(result2.current.isOpen).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain closed state after unmount and remount', () => {
      fc.assert(
        fc.property(fc.nat({ max: 10 }), () => {
          localStorage.removeItem(WELCOME_SHOWN_KEY);
          const { result: result1, unmount } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          act(() => { result1.current.closeModal(); });
          unmount();
          const { result: result2 } = renderHook(() => useWelcomeModal());
          act(() => { vi.advanceTimersByTime(500); });
          expect(result2.current.isOpen).toBe(false);
          expect(localStorage.getItem(WELCOME_SHOWN_KEY)).toBe('true');
        }),
        { numRuns: 100 }
      );
    });
  });
});
