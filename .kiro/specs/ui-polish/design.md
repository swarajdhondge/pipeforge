# Design Document

## Overview

This document provides the complete technical design for the Yahoo Pipes 2025 UI Polish phase. It covers the design system, component specifications, page layouts, and implementation details for all 25 requirements. The design ensures a cohesive, polished experience that honors the original Yahoo Pipes aesthetic while applying modern UI/UX best practices.

### Design Goals

1. **Yahoo Pipes Nostalgia**: Capture the distinctive purple/blue aesthetic of the original
2. **Consistency**: Every component, page, and interaction follows the same design language
3. **Usability**: Clear, intuitive interfaces that guide users to success
4. **Performance**: Fast, responsive interactions that feel instant
5. **Accessibility**: WCAG AA compliant, usable by everyone
6. **Delight**: Subtle polish that makes the experience memorable

---

## Design System Specification

### Color Tokens

```typescript
// design-tokens.ts
export const colors = {
  // Primary - Yahoo Pipes Purple/Blue
  primary: {
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
  },
  
  // Secondary - Yahoo Pipes Blue
  secondary: {
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
  },
  
  // Accent - Orange (CTAs, highlights)
  accent: {
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
  },
  
  // Neutral - Grays
  neutral: {
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
  },
  
  // Semantic
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
};

// Gradients
export const gradients = {
  // Main Yahoo Pipes gradient (header, primary buttons)
  yahooPipes: 'linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%)',
  yahooPipesHover: 'linear-gradient(135deg, #5B3F87 0%, #3B7CC4 100%)',
  yahooPipesActive: 'linear-gradient(135deg, #4C3575 0%, #2D68AF 100%)',
  
  // Subtle gradients for cards/backgrounds
  subtlePurple: 'linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 100%)',
  subtleBlue: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)',
  
  // Canvas background
  canvasGrid: 'radial-gradient(circle, #E5E5E5 1px, transparent 1px)',
};
```

### Typography Scale

```typescript
// typography.ts
export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Predefined text styles
  styles: {
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
  },
};
```

### Spacing Scale

```typescript
// spacing.ts
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
};

// Component-specific spacing
export const componentSpacing = {
  buttonPaddingX: { sm: spacing[3], md: spacing[4], lg: spacing[6] },
  buttonPaddingY: { sm: spacing[2], md: spacing[2], lg: spacing[3] },
  cardPadding: spacing[4],
  modalPadding: spacing[6],
  pagePadding: { mobile: spacing[4], desktop: spacing[6] },
  sectionGap: spacing[8],
  inputHeight: { sm: '32px', md: '40px', lg: '48px' },
};
```

### Shadows and Elevation

```typescript
// shadows.ts
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
};

// Elevation levels
export const elevation = {
  0: shadows.none,      // Flat elements
  1: shadows.sm,        // Cards, dropdowns
  2: shadows.md,        // Modals, popovers
  3: shadows.lg,        // Floating elements
  4: shadows.xl,        // Drag previews
};
```

### Border Radius

```typescript
// borders.ts
export const borderRadius = {
  none: '0',
  sm: '4px',      // Buttons, inputs
  md: '8px',      // Cards, panels
  lg: '12px',     // Modals, large containers
  xl: '16px',     // Hero sections
  full: '9999px', // Pills, avatars
};
```

### Breakpoints

```typescript
// breakpoints.ts
export const breakpoints = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large screens
};

// Media queries
export const media = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  
  // Mobile-first helpers
  mobile: `@media (max-width: ${parseInt(breakpoints.md) - 1}px)`,
  tablet: `@media (min-width: ${breakpoints.md}) and (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
  desktop: `@media (min-width: ${breakpoints.lg})`,
};
```

### Animation Tokens

```typescript
// animations.ts
export const animations = {
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Predefined transitions
  transitions: {
    default: 'all 200ms cubic-bezier(0, 0, 0.2, 1)',
    fast: 'all 150ms cubic-bezier(0, 0, 0.2, 1)',
    colors: 'background-color 200ms, border-color 200ms, color 200ms',
    transform: 'transform 200ms cubic-bezier(0, 0, 0.2, 1)',
    opacity: 'opacity 200ms cubic-bezier(0, 0, 0.2, 1)',
  },
  
  // Keyframes
  keyframes: {
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
    pulse: `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `,
  },
};
```

---

## Component Specifications

### Button Component

**File**: `frontend/src/components/common/Button.tsx`

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}
```

**Styling Specifications:**

| Variant | Background | Text | Border | Hover | Active |
|---------|------------|------|--------|-------|--------|
| primary | Yahoo Pipes gradient | white | none | Darker gradient | Even darker |
| secondary | transparent | primary.500 | primary.500 | primary.50 bg | primary.100 bg |
| danger | error.main | white | none | error.dark | Darker |
| ghost | transparent | primary.500 | none | neutral.100 bg | neutral.200 bg |
| link | transparent | primary.500 | none | underline | underline |

| Size | Height | Padding X | Font Size | Border Radius |
|------|--------|-----------|-----------|---------------|
| sm | 32px | 12px | 14px | 4px |
| md | 40px | 16px | 14px | 4px |
| lg | 48px | 24px | 16px | 4px |

**States:**
- **Disabled**: opacity 0.5, cursor not-allowed
- **Loading**: Show spinner, disable interactions
- **Focus**: Purple focus ring (3px)



### Card Component

**File**: `frontend/src/components/common/Card.tsx`

```typescript
interface CardProps {
  variant: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}
```

**Styling:**
- Background: white
- Border radius: 8px
- Padding: 16px (default)
- Shadow: elevation.1 (default), elevation.2 on hover (interactive)
- Border: 1px solid neutral.200 (outlined variant)
- Hover (interactive): scale(1.02), elevation.2

### Input Component

**File**: `frontend/src/components/common/Input.tsx`

```typescript
interface InputProps {
  type: 'text' | 'email' | 'password' | 'number' | 'search';
  size: 'sm' | 'md' | 'lg';
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  value: string;
  onChange: (value: string) => void;
}
```

**Styling:**
- Height: 32px (sm), 40px (md), 48px (lg)
- Border: 1px solid neutral.300
- Border radius: 4px
- Focus: primary.500 border, focusPurple shadow
- Error: error.main border, focusError shadow
- Disabled: neutral.100 background, opacity 0.7

### Modal Component

**File**: `frontend/src/components/common/Modal.tsx`

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  children: ReactNode;
  footer?: ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}
```

**Sizing:**
- sm: 400px max-width
- md: 500px max-width
- lg: 600px max-width
- xl: 800px max-width
- full: 90vw max-width

**Styling:**
- Background: white
- Border radius: 12px
- Shadow: elevation.3
- Overlay: rgba(0, 0, 0, 0.5)
- Animation: fadeIn + slideInUp

### Toast Component

**File**: `frontend/src/components/common/Toast.tsx`

```typescript
interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number; // ms, 0 = persistent
  action?: { label: string; onClick: () => void };
  onDismiss: (id: string) => void;
}
```

**Styling by Type:**
| Type | Background | Icon | Duration |
|------|------------|------|----------|
| success | success.main | CheckCircle | 3000ms |
| error | error.main | XCircle | 0 (persistent) |
| warning | warning.main | AlertTriangle | 5000ms |
| info | info.main | Info | 4000ms |

**Position**: Top-right, 16px from edges
**Animation**: slideInRight on enter, fadeOut on exit
**Max visible**: 4 toasts, stack vertically

### Skeleton Component

**File**: `frontend/src/components/common/Skeleton.tsx`

```typescript
interface SkeletonProps {
  variant: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  lines?: number; // for text variant
  className?: string;
}
```

**Styling:**
- Background: linear-gradient(90deg, neutral.200 25%, neutral.100 50%, neutral.200 75%)
- Animation: shimmer 1.5s infinite
- Border radius: 4px (text/rect), 50% (circular), 8px (card)

### EmptyState Component

**File**: `frontend/src/components/common/EmptyState.tsx`

```typescript
interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}
```

**Layout:**
- Centered vertically and horizontally
- Icon: 64px, primary.400 color
- Title: h3 style, neutral.800
- Description: body style, neutral.500
- Action button: below description, 16px margin-top



---

## Page Layouts

### Navigation Bar

**File**: `frontend/src/components/common/NavigationBar.tsx`

**Desktop Layout (≥768px):**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo]     Browse  Create  Templates     [Search]  [User Menu] │
└─────────────────────────────────────────────────────────────────┘
```

**Mobile Layout (<768px):**
```
┌─────────────────────────────────────────────────────────────────┐
│ [☰]  [Logo]                                        [User Menu] │
└─────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Background: Yahoo Pipes gradient
- Height: 64px
- Position: fixed, top: 0, z-index: 50
- Logo: White text/icon
- Links: White text, opacity 0.9, hover opacity 1
- User menu: Avatar (32px), dropdown on click

### Landing Page (Home)

**File**: `frontend/src/pages/HomePage.tsx`

**Sections:**

1. **Hero Section**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Yahoo Pipes gradient background               │
│                                                                  │
│              "Yahoo Pipes is Back"                               │
│     "The visual data mashup tool you loved, rebuilt for 2025"   │
│                                                                  │
│         [Try it Free]  [Browse Pipes]                           │
│                                                                  │
│              [Animated pipe illustration]                        │
└─────────────────────────────────────────────────────────────────┘
```

2. **How It Works**
```
┌─────────────────────────────────────────────────────────────────┐
│                      How It Works                                │
│                                                                  │
│   [1. Connect]     [2. Transform]     [3. Output]               │
│   Fetch data       Filter, sort,      Get JSON                  │
│   from APIs        transform          results                    │
└─────────────────────────────────────────────────────────────────┘
```

3. **Featured Pipes**
```
┌─────────────────────────────────────────────────────────────────┐
│                    Featured Pipes                                │
│                                                                  │
│   [Pipe Card]  [Pipe Card]  [Pipe Card]  [Pipe Card]           │
│                                                                  │
│                    [Browse All →]                                │
└─────────────────────────────────────────────────────────────────┘
```

4. **Templates Section**
```
┌─────────────────────────────────────────────────────────────────┐
│                  Start with a Template                          │
│                                                                  │
│   [GitHub API]  [Weather Data]  [JSON Placeholder]              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

5. **Footer**
```
┌─────────────────────────────────────────────────────────────────┐
│  Yahoo Pipes 2025                                                │
│                                                                  │
│  Product        Resources       Legal                           │
│  - Browse       - Documentation - Privacy Policy                │
│  - Create       - FAQ           - Terms of Service              │
│  - Templates    - About                                         │
│                                                                  │
│  © 2025 Yahoo Pipes 2025. The beloved tool is back.            │
└─────────────────────────────────────────────────────────────────┘
```

### Browse Pipes Page

**File**: `frontend/src/pages/BrowsePipesPage.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Navigation Bar]                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Browse Pipes                                                    │
│                                                                  │
│  [Search Bar with autocomplete........................] [Search] │
│                                                                  │
│  Filters: [All ▼] [Sort: Recent ▼] [Tags: ...]                  │
│                                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Pipe    │ │ Pipe    │ │ Pipe    │ │ Pipe    │               │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Pipe    │ │ Pipe    │ │ Pipe    │ │ Pipe    │               │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
│  [Load More] or Pagination                                       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ [Footer]                                                         │
└─────────────────────────────────────────────────────────────────┘
```

**Pipe Card Design:**
```
┌─────────────────────────────────────────┐
│  Pipe Name                         [♥]  │
│  Description text that may be           │
│  truncated after two lines...           │
│                                         │
│  [tag1] [tag2]                          │
│                                         │
│  👤 Username  •  ⚡ 123 runs  •  ♥ 45   │
└─────────────────────────────────────────┘
```



### Pipe Editor Page

**File**: `frontend/src/pages/PipeEditorPage.tsx`

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Navigation Bar]                                                 │
├────────┬────────────────────────────────────────────┬───────────┤
│        │                                            │           │
│ Opera- │                                            │  Config   │
│ tor    │              Canvas                        │  Panel    │
│ Palet- │         (ReactFlow)                        │           │
│ te     │                                            │  ──────   │
│        │    ┌─────┐      ┌─────┐                   │           │
│ [Fetch]│    │Fetch│──────│Filter│                  │  Operator │
│ [Filtr]│    └─────┘      └─────┘                   │  Settings │
│ [Sort] │                    │                       │           │
│ [Trans]│               ┌─────┐                     │           │
│        │               │Sort │                     │           │
│        │               └─────┘                     │           │
│        │                                            │           │
│        ├────────────────────────────────────────────┤           │
│        │ [Undo] [Redo] [Zoom] [Fit] [Save ▼] [Run] │           │
└────────┴────────────────────────────────────────────┴───────────┘
```

**Mobile Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Navigation Bar]                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                         Canvas                                   │
│                      (Full width)                                │
│                                                                  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ [Palette] [Config] [Run]              [Undo] [Redo] [Save]      │
└─────────────────────────────────────────────────────────────────┘
```

**Operator Node Design (Yahoo Pipes Style):**
```
┌─────────────────────────────────────┐
│  ○ Input                            │  ← Pipe connector (circle)
├─────────────────────────────────────┤
│  [Icon]  Fetch                      │  ← Header with gradient
├─────────────────────────────────────┤
│  URL: api.github.com/...            │  ← Config preview
│  Method: GET                        │
└─────────────────────────────────────┘
│  ● Output                           │  ← Pipe connector (filled)
```

**Node Colors by Type:**
| Operator | Header Color | Icon |
|----------|--------------|------|
| Fetch | Blue gradient | 🌐 Globe |
| Filter | Green gradient | 🔍 Filter |
| Sort | Orange gradient | ↕️ Sort |
| Transform | Purple gradient | ⚡ Transform |

### Pipe Detail Page

**File**: `frontend/src/pages/PipeDetailPage.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Navigation Bar]                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ← Back to Browse                                                │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │  Pipe Name                                    [🌐 Public]   ││
│  │  Created by @username • Updated 2 days ago                  ││
│  │                                                              ││
│  │  Description text goes here. This can be multiple           ││
│  │  lines of text explaining what the pipe does.               ││
│  │                                                              ││
│  │  [tag1] [tag2] [tag3]                                       ││
│  │                                                              ││
│  │  ⚡ 1,234 runs  •  ♥ 89 likes  •  🔀 12 forks              ││
│  │                                                              ││
│  │  [▶ Run Pipe]  [Fork]  [Share]  [Edit] [Delete]            ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Pipe Structure                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [Mini canvas preview of pipe structure]                    ││
│  │  Read-only, shows nodes and connections                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  By the Same Author                                              │
│  [Pipe Card] [Pipe Card] [Pipe Card]                            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ [Footer]                                                         │
└─────────────────────────────────────────────────────────────────┘
```

### User Profile Page

**File**: `frontend/src/pages/UserProfilePage.tsx`

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Navigation Bar]                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  [Avatar]  Display Name                    [Edit Profile] │   │
│  │   64px     @username                                      │   │
│  │            Member since Jan 2025                          │   │
│  │            Bio text goes here...                          │   │
│  │                                                           │   │
│  │  📊 12 Pipes  •  ⚡ 5,432 total runs  •  ♥ 234 likes     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [My Pipes] [Drafts] [Liked] [Settings]  ← Tabs (own profile)   │
│                                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ Pipe    │ │ Pipe    │ │ Pipe    │ │ Pipe    │               │
│  │ Card    │ │ Card    │ │ Card    │ │ Card    │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                  │
│  [Empty state if no pipes]                                       │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ [Footer]                                                         │
└─────────────────────────────────────────────────────────────────┘
```



---

## Error Pages

### 404 Not Found

**File**: `frontend/src/pages/NotFoundPage.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [Navigation Bar]                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                                                                  │
│                    [Broken pipe illustration]                    │
│                                                                  │
│                         404                                      │
│                  This pipe doesn't exist                         │
│                                                                  │
│     It may have been deleted, or the URL might be incorrect.    │
│                                                                  │
│              [Go Home]  [Browse Pipes]                          │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 500 Server Error

**File**: `frontend/src/pages/ServerErrorPage.tsx`

```
┌─────────────────────────────────────────────────────────────────┐
│ [Navigation Bar]                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    [Leaking pipe illustration]                   │
│                                                                  │
│                  Something went wrong                            │
│                                                                  │
│     We're working on fixing this. Please try again later.       │
│                                                                  │
│              [Try Again]  [Go Home]                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Toast Notification System

### ToastProvider Architecture

**File**: `frontend/src/components/common/ToastProvider.tsx`

```typescript
// Context
interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// Hook
export function useToast() {
  const context = useContext(ToastContext);
  
  return {
    success: (title: string, description?: string) => 
      context.addToast({ type: 'success', title, description }),
    error: (title: string, description?: string) => 
      context.addToast({ type: 'error', title, description, duration: 0 }),
    warning: (title: string, description?: string) => 
      context.addToast({ type: 'warning', title, description }),
    info: (title: string, description?: string) => 
      context.addToast({ type: 'info', title, description }),
  };
}
```

### Toast Container Layout

```
                                    ┌─────────────────────────┐
                                    │ ✓ Pipe saved            │
                                    │   Your changes are safe │ ← Toast 1
                                    └─────────────────────────┘
                                    ┌─────────────────────────┐
                                    │ ✗ Failed to execute     │
                                    │   Network error    [×]  │ ← Toast 2
                                    └─────────────────────────┘
```

---

## Loading States

### Page Loading

```typescript
// Skeleton for pipe cards grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
    <Skeleton key={i} variant="card" height={200} />
  ))}
</div>
```

### Button Loading

```typescript
<Button isLoading>
  <Spinner size="sm" />
  Saving...
</Button>
```

### Inline Loading

```typescript
// For async operations within content
<div className="flex items-center gap-2">
  <Spinner size="sm" />
  <span>Loading execution results...</span>
</div>
```

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action | Context |
|----------|--------|---------|
| `/` | Focus search bar | Any page |
| `?` | Show shortcuts help | Any page |
| `Escape` | Close modal/dropdown | When open |

### Editor Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save pipe |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Delete` / `Backspace` | Delete selected node |
| `Escape` | Deselect all |
| `Ctrl/Cmd + A` | Select all nodes |
| `Ctrl/Cmd + D` | Duplicate selected |

### Shortcuts Modal Design

```
┌─────────────────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                                        [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  General                                                         │
│  ─────────────────────────────────────────────────────────────  │
│  /              Focus search                                     │
│  ?              Show this help                                   │
│  Esc            Close modal                                      │
│                                                                  │
│  Editor                                                          │
│  ─────────────────────────────────────────────────────────────  │
│  ⌘S             Save pipe                                        │
│  ⌘Z             Undo                                             │
│  ⌘⇧Z            Redo                                             │
│  Delete         Delete selected                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Onboarding Flow

### First Visit Welcome

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    Welcome to Yahoo Pipes 2025!                  │
│                                                                  │
│     The visual data mashup tool is back. Connect APIs,          │
│     transform data, and automate workflows - all visually.      │
│                                                                  │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│     │ Create Pipe │  │ Use Template│  │ Take a Tour │          │
│     └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                  │
│                    [Skip for now]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Editor Tooltips (First Time)

1. **Operator Palette**: "Drag operators from here onto the canvas"
2. **Canvas**: "Connect operators by dragging from output to input"
3. **Config Panel**: "Configure the selected operator here"
4. **Save Button**: "Save your pipe as a draft or publish it"

---

## Responsive Breakpoints Summary

| Breakpoint | Width | Grid Cols | Nav | Editor Panels |
|------------|-------|-----------|-----|---------------|
| Mobile | <768px | 1 | Hamburger | Stacked/Tabs |
| Tablet | 768-1023px | 2-3 | Full | Collapsible |
| Desktop | ≥1024px | 3-4 | Full | All visible |

---

## Accessibility Checklist

### Color Contrast
- All text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- Interactive elements have 3:1 contrast against background
- Focus indicators are clearly visible

### Keyboard Navigation
- All interactive elements are focusable
- Focus order follows visual order
- Skip links provided for main content
- No keyboard traps

### Screen Readers
- All images have alt text
- Form inputs have associated labels
- ARIA labels for icon-only buttons
- Live regions for dynamic content

### Motion
- Respect `prefers-reduced-motion`
- No auto-playing animations that can't be paused
- Animations are subtle and purposeful



---

## Implementation Architecture

### File Structure

```
frontend/src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Toggle.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── ToastProvider.tsx
│   │   ├── Skeleton.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Spinner.tsx
│   │   ├── NavigationBar.tsx
│   │   ├── Footer.tsx
│   │   ├── SearchBar.tsx
│   │   ├── PipeCard.tsx
│   │   ├── UserCard.tsx
│   │   └── KeyboardShortcutsModal.tsx
│   ├── editor/
│   │   ├── OperatorNode.tsx (updated styling)
│   │   ├── OperatorPalette.tsx (updated styling)
│   │   ├── CanvasToolbar.tsx (updated styling)
│   │   └── ...
│   ├── onboarding/
│   │   ├── WelcomeModal.tsx
│   │   ├── EditorTour.tsx
│   │   └── TooltipGuide.tsx
│   └── ...
├── pages/
│   ├── HomePage.tsx (landing page)
│   ├── BrowsePipesPage.tsx (updated)
│   ├── PipeDetailPage.tsx (updated)
│   ├── PipeEditorPage.tsx (updated)
│   ├── UserProfilePage.tsx (updated)
│   ├── SettingsPage.tsx (new)
│   ├── NotFoundPage.tsx (new)
│   └── ServerErrorPage.tsx (new)
├── styles/
│   ├── design-tokens.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── shadows.ts
│   ├── animations.ts
│   └── theme.ts
├── hooks/
│   ├── useToast.ts
│   ├── useKeyboardShortcuts.ts
│   ├── useOnboarding.ts
│   ├── useMediaQuery.ts
│   └── useReducedMotion.ts
└── utils/
    ├── accessibility.ts
    └── responsive.ts
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          // ... full scale
          500: '#6B4C9A',
          // ...
        },
        secondary: {
          // ... blue scale
          500: '#4A90D9',
        },
        accent: {
          // ... orange scale
          500: '#F5A623',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'focus-purple': '0 0 0 3px rgba(107, 76, 154, 0.4)',
        'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.4)',
      },
      backgroundImage: {
        'yahoo-pipes': 'linear-gradient(135deg, #6B4C9A 0%, #4A90D9 100%)',
        'yahoo-pipes-hover': 'linear-gradient(135deg, #5B3F87 0%, #3B7CC4 100%)',
      },
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in-right': 'slideInRight 200ms ease-out',
        'slide-in-up': 'slideInUp 200ms ease-out',
      },
    },
  },
};
```

---

## Demo Pipes Specification

### Template 1: GitHub User Info

**Name**: "GitHub User Info"
**Description**: "Fetch a GitHub user's profile and transform the data"
**Difficulty**: Beginner

**Nodes**:
1. Fetch: `https://api.github.com/users/octocat`
2. Transform: Extract `login`, `name`, `bio`, `public_repos`

### Template 2: Weather Dashboard

**Name**: "Weather Dashboard"
**Description**: "Get weather data and filter by temperature"
**Difficulty**: Beginner

**Nodes**:
1. Fetch: `https://api.openweathermap.org/...`
2. Filter: Temperature > 20°C
3. Sort: By temperature descending

### Template 3: JSON Placeholder Posts

**Name**: "JSON Placeholder Posts"
**Description**: "Fetch posts and filter by user"
**Difficulty**: Beginner

**Nodes**:
1. Fetch: `https://jsonplaceholder.typicode.com/posts`
2. Filter: `userId === 1`
3. Transform: Extract `title`, `body`

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Design Token Consistency
*For any* UI component, all colors, spacing, typography, and shadows used SHALL match values defined in the design tokens.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Button State Consistency
*For any* button component, the visual state (default, hover, active, disabled, loading) SHALL be visually distinct and consistent across all button variants.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 3: Responsive Layout Integrity
*For any* page at any viewport width, the layout SHALL not have horizontal overflow and all content SHALL remain accessible.
**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 4: Toast Notification Behavior
*For any* toast notification, it SHALL appear in the correct position, display the correct styling for its type, and auto-dismiss according to its duration setting.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 5: Keyboard Navigation Completeness
*For any* interactive element on any page, it SHALL be reachable via keyboard navigation and have a visible focus indicator.
**Validates: Requirements 12.1, 25.1, 25.2, 25.3, 25.4, 25.5**

### Property 6: Loading State Presence
*For any* async operation, a loading indicator SHALL be displayed until the operation completes or fails.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 7: Empty State Helpfulness
*For any* empty list or search result, an empty state SHALL be displayed with a clear message and actionable next step.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 8: Error Recovery Path
*For any* error state (404, 500, network), the user SHALL be presented with clear navigation options to recover.
**Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5**

### Property 9: Color Contrast Compliance
*For any* text element, the color contrast ratio against its background SHALL meet WCAG AA requirements (4.5:1 for normal text, 3:1 for large text).
**Validates: Requirements 12.3**

### Property 10: Yahoo Pipes Visual Identity
*For any* page in the application, the Yahoo Pipes color scheme (purple, blue, orange) SHALL be consistently applied to primary UI elements.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

---

## Testing Strategy

### Visual Regression Testing
- Use Chromatic or Percy for visual regression
- Capture screenshots at all breakpoints
- Test all component states

### Accessibility Testing
- Automated: axe-core, jest-axe
- Manual: Screen reader testing (VoiceOver, NVDA)
- Keyboard navigation testing

### Responsive Testing
- Test at 320px, 768px, 1024px, 1440px widths
- Test on real devices (iOS Safari, Android Chrome)

### Component Testing
- Unit tests for all common components
- Interaction tests for buttons, forms, modals
- Toast notification behavior tests

### Integration Testing
- Full page rendering tests
- Navigation flow tests
- Error page routing tests

