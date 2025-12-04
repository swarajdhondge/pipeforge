/**
 * Typography Tokens for Pipe Forge
 * 
 * Defines font families, sizes, weights, line heights, and predefined text styles.
 */

export const fontFamily = {
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
} as const;

export const fontSize = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

// Predefined text styles
export const textStyles = {
  h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.25 },
  h2: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.25 },
  h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.25 },
  h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.25 },
  h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.25 },
  h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.25 },
  body: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
  bodySmall: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5 },
  label: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.25 },
} as const;

export const typography = {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  styles: textStyles,
} as const;
