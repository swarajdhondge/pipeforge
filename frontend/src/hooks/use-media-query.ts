import { useState, useEffect } from 'react';

/**
 * Breakpoint values matching Tailwind config
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Hook to detect if a media query matches
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

/**
 * Hook to detect current breakpoint
 * @returns object with boolean flags for each breakpoint
 */
export const useBreakpoint = () => {
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isSmall = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);
  const isMedium = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isLarge = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isXLarge = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);
  const is2XLarge = useMediaQuery(`(min-width: ${breakpoints['2xl']}px)`);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isSmall,
    isMedium,
    isLarge,
    isXLarge,
    is2XLarge,
  };
};
