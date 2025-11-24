import { useMediaQuery } from './use-media-query';

/**
 * Hook to detect if the user prefers reduced motion
 * 
 * This respects the user's system preference for reduced motion,
 * which is important for accessibility (WCAG 2.3.3).
 * 
 * @returns boolean indicating if reduced motion is preferred
 */
export const useReducedMotion = (): boolean => {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
};

/**
 * Hook to get animation duration based on reduced motion preference
 * 
 * @param normalDuration - Duration in ms when motion is allowed
 * @param reducedDuration - Duration in ms when reduced motion is preferred (default: 0)
 * @returns The appropriate duration based on user preference
 */
export const useAnimationDuration = (
  normalDuration: number,
  reducedDuration: number = 0
): number => {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? reducedDuration : normalDuration;
};

/**
 * Hook to conditionally apply animation classes
 * 
 * @param animationClass - The animation class to apply
 * @param fallbackClass - Optional fallback class when motion is reduced
 * @returns The appropriate class based on user preference
 */
export const useAnimationClass = (
  animationClass: string,
  fallbackClass: string = ''
): string => {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? fallbackClass : animationClass;
};
