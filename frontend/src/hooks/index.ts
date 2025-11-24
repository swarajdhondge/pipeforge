// Authentication
export { useAuth } from './use-auth';

// Anonymous user limits
export { useExecutionLimit } from './use-execution-limit';

// Schema & Preview (consolidated)
export { useSchema, useUpstreamFieldPaths, useIsPreviewable } from './use-schema';

// Storage
export { useLocalStorage } from './use-local-storage';

// Media queries & responsive
export { useMediaQuery, useBreakpoint, breakpoints } from './use-media-query';

// Accessibility
export { useReducedMotion, useAnimationDuration, useAnimationClass } from './use-reduced-motion';

// Keyboard shortcuts
export { 
  useKeyboardShortcuts, 
  isMac, 
  getModifierKey, 
  formatShortcut, 
  editorShortcuts,
  type KeyboardShortcut 
} from './use-keyboard-shortcuts';
