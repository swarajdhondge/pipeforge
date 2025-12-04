/**
 * Animation Tokens for Pipe Forge
 * 
 * Defines durations, easing functions, transitions, and keyframe animations.
 */

export const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Predefined transitions
export const transitions = {
  default: `all ${duration.normal} ${easing.easeOut}`,
  fast: `all ${duration.fast} ${easing.easeOut}`,
  colors: `background-color ${duration.normal}, border-color ${duration.normal}, color ${duration.normal}`,
  transform: `transform ${duration.normal} ${easing.easeOut}`,
  opacity: `opacity ${duration.normal} ${easing.easeOut}`,
} as const;

// Keyframe animation names (to be used with Tailwind or CSS)
export const keyframes = {
  shimmer: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  fadeOut: `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `,
  slideInRight: `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `,
  slideInUp: `
    @keyframes slideInUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
  slideOutRight: `
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  flowAnimation: `
    @keyframes flowAnimation {
      from { stroke-dashoffset: 24; }
      to { stroke-dashoffset: 0; }
    }
  `,
} as const;

export const animations = {
  duration,
  easing,
  transitions,
  keyframes,
} as const;
