/**
 * Spacing Tokens for Pipe Forge
 * 
 * Based on a 4px base unit for consistent spacing throughout the application.
 */

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

// Component-specific spacing
export const componentSpacing = {
  buttonPaddingX: {
    sm: spacing[3],  // 12px
    md: spacing[4],  // 16px
    lg: spacing[6],  // 24px
  },
  buttonPaddingY: {
    sm: spacing[2],  // 8px
    md: spacing[2],  // 8px
    lg: spacing[3],  // 12px
  },
  cardPadding: spacing[4],      // 16px
  modalPadding: spacing[6],     // 24px
  pagePadding: {
    mobile: spacing[4],   // 16px
    desktop: spacing[6],  // 24px
  },
  sectionGap: spacing[8],       // 32px
  inputHeight: {
    sm: '32px',
    md: '40px',
    lg: '48px',
  },
} as const;

export type SpacingKey = keyof typeof spacing;
