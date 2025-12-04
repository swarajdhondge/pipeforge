/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ============================================
      // SEMANTIC COLORS (CSS Variable-based)
      // These automatically adapt to light/dark mode
      // ============================================
      colors: {
        // Background Colors
        'bg-app': 'var(--bg-app)',
        'bg-surface': 'var(--bg-surface)',
        'bg-surface-secondary': 'var(--bg-surface-secondary)',
        'bg-surface-elevated': 'var(--bg-surface-elevated)',
        'bg-surface-hover': 'var(--bg-surface-hover)',
        'bg-surface-active': 'var(--bg-surface-active)',
        'bg-surface-inset': 'var(--bg-surface-inset)',
        'bg-canvas': 'var(--bg-canvas)',
        
        // Text Colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-quaternary': 'var(--text-quaternary)',
        'text-inverse': 'var(--text-inverse)',
        'text-inverse-secondary': 'var(--text-inverse-secondary)',
        'text-inverse-tertiary': 'var(--text-inverse-tertiary)',
        'text-link': 'var(--text-link)',
        
        // Border Colors
        'border-default': 'var(--border-default)',
        'border-muted': 'var(--border-muted)',
        'border-strong': 'var(--border-strong)',
        'border-focus': 'var(--border-focus)',
        'border-inverse': 'var(--border-inverse)',
        
        // Inverse Backgrounds (footer, etc.)
        'bg-inverse': 'var(--bg-inverse)',
        
        // Brand Colors - Yahoo Pipes
        'accent-purple': 'var(--accent-purple)',
        'accent-purple-hover': 'var(--accent-purple-hover)',
        'accent-purple-light': 'var(--accent-purple-light)',
        'accent-purple-dark': 'var(--accent-purple-dark)',
        'accent-purple-muted': 'var(--accent-purple-muted)',
        
        'accent-blue': 'var(--accent-blue)',
        'accent-blue-hover': 'var(--accent-blue-hover)',
        'accent-blue-light': 'var(--accent-blue-light)',
        'accent-blue-muted': 'var(--accent-blue-muted)',
        
        'accent-orange': 'var(--accent-orange)',
        'accent-orange-hover': 'var(--accent-orange-hover)',
        'accent-orange-light': 'var(--accent-orange-light)',
        'accent-orange-muted': 'var(--accent-orange-muted)',
        
        // Semantic Status Colors
        'status-success': 'var(--color-success)',
        'status-success-light': 'var(--color-success-light)',
        'status-success-dark': 'var(--color-success-dark)',
        
        'status-warning': 'var(--color-warning)',
        'status-warning-light': 'var(--color-warning-light)',
        'status-warning-dark': 'var(--color-warning-dark)',
        
        'status-error': 'var(--color-error)',
        'status-error-light': 'var(--color-error-light)',
        'status-error-dark': 'var(--color-error-dark)',
        
        'status-info': 'var(--color-info)',
        'status-info-light': 'var(--color-info-light)',
        'status-info-dark': 'var(--color-info-dark)',

        // ============================================
        // STATIC COLORS (Raw palette, use sparingly)
        // Prefer semantic colors above for theme support
        // ============================================
        
        // Primary - Pipe Forge Purple (static)
        primary: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#6B4C9A',
          600: '#5B3F87',
          700: '#4C3575',
          800: '#3D2A5E',
          900: '#2E1F47',
        },
        // Secondary - Pipe Forge Blue (static)
        secondary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#4A90D9',
          600: '#3B7CC4',
          700: '#2D68AF',
          800: '#1E549A',
          900: '#0F4085',
        },
        // Accent - Orange (static)
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F5A623',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        // Neutral grays (static)
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
          950: '#0A0A0A',
        },
      },

      // Font Families
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      
      // Custom Shadows (using CSS variables)
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'focus-purple': '0 0 0 3px var(--accent-purple-muted)',
        'focus-blue': '0 0 0 3px var(--accent-blue-muted)',
        'focus-error': '0 0 0 3px rgba(239, 68, 68, 0.4)',
      },
      
      // Border Radius
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
      },
      
      // Custom Animations
      animation: {
        'shimmer': 'shimmer 1.5s infinite',
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 200ms ease-out',
        'slide-in-right': 'slideInRight 300ms ease-out',
        'slide-in-up': 'slideInUp 200ms ease-out',
        'slide-out-right': 'slideOutRight 300ms ease-out',
        'pulse-slow': 'pulse 2s infinite',
        'spin-slow': 'spin 1s linear infinite',
        'confetti': 'confetti 3s ease-out forwards',
        'bounceIn': 'bounceIn 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // Keyframes
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutRight: {
          from: { transform: 'translateX(0)', opacity: '1' },
          to: { transform: 'translateX(100%)', opacity: '0' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      
      // Background Images (Gradients using CSS variables)
      backgroundImage: {
        'pipe-forge': 'var(--gradient-pipes)',
        'pipe-forge-hover': 'var(--gradient-pipes-hover)',
        'pipe-forge-active': 'var(--gradient-pipes-active)',
        'subtle-purple': 'linear-gradient(180deg, var(--accent-purple-light) 0%, var(--bg-surface) 100%)',
        'subtle-blue': 'linear-gradient(180deg, var(--accent-blue-light) 0%, var(--bg-surface) 100%)',
        'canvas-grid': 'radial-gradient(circle, var(--canvas-grid-color) 1px, transparent 1px)',
      },
      
      // Background Size (for grid pattern)
      backgroundSize: {
        'grid': '20px 20px',
      },
    },
  },
  plugins: [],
}
