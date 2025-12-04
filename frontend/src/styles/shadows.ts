/**
 * Shadow and Elevation Tokens for Pipe Forge
 * 
 * Defines shadow values for different elevation levels and focus states.
 */

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Focus rings
  focusPurple: '0 0 0 3px rgba(107, 76, 154, 0.4)',
  focusBlue: '0 0 0 3px rgba(74, 144, 217, 0.4)',
  focusError: '0 0 0 3px rgba(239, 68, 68, 0.4)',
} as const;

// Elevation levels for semantic usage
export const elevation = {
  0: shadows.none,      // Flat elements
  1: shadows.sm,        // Cards, dropdowns
  2: shadows.md,        // Modals, popovers
  3: shadows.lg,        // Floating elements
  4: shadows.xl,        // Drag previews
} as const;

// Border radius values
export const borderRadius = {
  none: '0',
  sm: '4px',      // Buttons, inputs
  md: '8px',      // Cards, panels
  lg: '12px',     // Modals, large containers
  xl: '16px',     // Hero sections
  full: '9999px', // Pills, avatars
} as const;

export type ElevationLevel = keyof typeof elevation;
export type BorderRadiusKey = keyof typeof borderRadius;
