/**
 * Design Tokens for Pipe Forge
 * 
 * IMPORTANT: For theming, use CSS custom properties defined in index.css
 * These tokens are for reference and TypeScript type safety.
 * 
 * Semantic tokens (theme-aware) are defined in:
 * - :root {} for light mode
 * - .dark {} for dark mode
 * 
 * Use Tailwind classes like:
 * - bg-bg-surface (not bg-white)
 * - text-text-primary (not text-neutral-900)
 * - border-border-default (not border-neutral-200)
 */

// ===========================================
// STATIC COLOR PALETTE (Raw values)
// Use for reference; prefer CSS variables for theming
// ===========================================

// Primary - Pipe Forge Purple
export const primary = {
  50: '#F5F3FF',
  100: '#EDE9FE',
  200: '#DDD6FE',
  300: '#C4B5FD',
  400: '#A78BFA',
  500: '#6B4C9A',  // Main purple
  600: '#5B3F87',
  700: '#4C3575',
  800: '#3D2A5E',
  900: '#2E1F47',
} as const;

// Secondary - Pipe Forge Blue
export const secondary = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#4A90D9',  // Main blue
  600: '#3B7CC4',
  700: '#2D68AF',
  800: '#1E549A',
  900: '#0F4085',
} as const;

// Accent - Orange (CTAs, highlights)
export const accent = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F5A623',  // Main orange
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
} as const;

// Neutral - Grays
export const neutral = {
  0: '#FFFFFF',
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#A3A3A3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0A0A0A',
} as const;


// Semantic Colors (status)
export const semantic = {
  success: {
    light: '#D1FAE5',
    main: '#10B981',
    dark: '#047857',
  },
  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#B45309',
  },
  error: {
    light: '#FEE2E2',
    main: '#EF4444',
    dark: '#B91C1C',
  },
  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#1D4ED8',
  },
} as const;

// ===========================================
// SEMANTIC TOKEN REFERENCE
// These map to CSS custom properties
// ===========================================

/**
 * Semantic Color Tokens
 * 
 * BACKGROUNDS:
 * --bg-app              Application background
 * --bg-surface          Card/panel backgrounds
 * --bg-surface-secondary Alternate surface
 * --bg-surface-elevated Modal/popover backgrounds
 * --bg-surface-hover    Hover state backgrounds
 * --bg-surface-active   Active/pressed state
 * --bg-surface-inset    Inset elements (inputs)
 * --bg-canvas           Editor canvas background
 * --bg-overlay          Modal overlay
 * 
 * TEXT:
 * --text-primary        Main readable text
 * --text-secondary      Muted/description text
 * --text-tertiary       Placeholder/disabled text
 * --text-quaternary     Very muted text
 * --text-inverse        Text on colored backgrounds
 * --text-link           Link text color
 * 
 * BORDERS:
 * --border-default      Standard borders
 * --border-muted        Subtle dividers
 * --border-strong       Strong borders
 * --border-focus        Focus ring color
 * 
 * BRAND (Yahoo Pipes):
 * --accent-purple       Primary brand color
 * --accent-purple-hover Hover state
 * --accent-purple-light Light variant (backgrounds)
 * --accent-purple-muted Very light variant
 * 
 * --accent-blue         Secondary brand color
 * --accent-blue-hover   Hover state
 * --accent-blue-light   Light variant
 * --accent-blue-muted   Very light variant
 * 
 * --accent-orange       CTA/highlight color
 * --accent-orange-hover Hover state
 * --accent-orange-light Light variant
 * --accent-orange-muted Very light variant
 * 
 * STATUS:
 * --color-success       Success state
 * --color-success-light Success background
 * --color-success-dark  Success dark variant
 * 
 * --color-warning       Warning state
 * --color-warning-light Warning background
 * --color-warning-dark  Warning dark variant
 * 
 * --color-error         Error state
 * --color-error-light   Error background
 * --color-error-dark    Error dark variant
 * 
 * --color-info          Info state
 * --color-info-light    Info background
 * --color-info-dark     Info dark variant
 * 
 * GRADIENTS:
 * --gradient-pipes       Main Yahoo Pipes gradient
 * --gradient-pipes-hover Hover state
 * --gradient-pipes-active Active state
 */

// Gradients
export const gradients = {
  // Main Pipe Forge gradient (header, primary buttons)
  pipeForge: 'linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%)',
  pipeForgeHover: 'linear-gradient(135deg, #5B3F87 0%, #3B7CC4 100%)',
  pipeForgeActive: 'linear-gradient(135deg, #4C3575 0%, #2D68AF 100%)',
  
  // Subtle gradients for cards/backgrounds
  subtlePurple: 'linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 100%)',
  subtleBlue: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)',
  
  // Canvas background
  canvasGrid: 'radial-gradient(circle, #E5E5E5 1px, transparent 1px)',
} as const;

// Combined colors export for convenience
export const colors = {
  primary,
  secondary,
  accent,
  neutral,
  ...semantic,
} as const;

export type ColorScale = typeof primary;
export type SemanticColor = typeof semantic.success;

// ===========================================
// SPACING & TYPOGRAPHY (unchanged)
// ===========================================

// Spacing Scale
export const spacing = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
} as const;

// Font Sizes
export const fontSize = {
  xs: '0.75rem',    // 12px - Small labels, badges
  sm: '0.875rem',   // 14px - Body text, inputs
  base: '1rem',     // 16px - Default body text
  lg: '1.125rem',   // 18px - Subheadings
  xl: '1.25rem',    // 20px - Headings
  '2xl': '1.5rem',  // 24px - Large headings
  '3xl': '1.875rem', // 30px - Hero text
  '4xl': '2.25rem',  // 36px - Display text
} as const;

// Font Weights
export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',   // Fully rounded
} as const;

// Shadows (use CSS variables for theme-aware shadows)
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
} as const;

// Transitions
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slower: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;
