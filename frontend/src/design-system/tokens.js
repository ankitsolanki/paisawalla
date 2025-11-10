/**
 * Design System Tokens
 * Centralized design tokens for consistent styling across all forms
 */

export const tokens = {
  colors: {
    // Paisawaala Primary Brand Colors
    primary: {
      50: '#e8e7fe',   // royal-blue-100
      100: '#e8e7fe',
      200: '#2d40ea1a', // light blue tint
      300: '#1f14ae',   // royal-blue-300
      400: '#1c3693',   // Main brand blue
      500: '#1c3693',   // Main brand blue
      600: '#160e7a',   // royal-blue-500
      700: '#113eb5',
      800: '#1a1b1f',
      900: '#000000',
    },
    // Paisawaala CTA/Button Color
    cta: {
      primary: '#160E7A',  // Main CTA color (royal-blue-500)
      hover: '#1c3693',    // Hover state (slightly lighter)
    },
    // Semantic colors
    success: {
      50: '#edfcf5',
      100: '#cef5ca',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ec3957',  // Using brand error color
      600: '#dc2626',
      700: '#b91c1c',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
    },
    // Paisawaala Neutral/Gray palette
    gray: {
      50: '#f7f7f7',   // Background gray
      100: '#f2f2f2',  // grey-100
      200: '#e4ebf3',  // Light gray
      300: '#cbcbcb',  // grey-200
      400: '#8b8b8b',  // grey-300
      500: '#656c77',  // Main text gray
      600: '#494949',  // grey-400
      700: '#43464d',
      800: '#32343a',
      900: '#1a1b1f',
    },
    // Background colors
    background: {
      light: '#ffffff',
      dark: '#1a1b1f',
      gray: '#f7f7f7',  // Paisawaala gray background
      blue: '#e8e7fe',  // royal-blue-100
    },
  },
  typography: {
    fontFamily: {
      sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
      mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
    },
    fontSize: {
      tiny: '0.75rem',    // 12px - text-size-tiny
      xs: '0.75rem',      // 12px
      sm: '0.875rem',    // 14px - text-size-small
      base: '1rem',      // 16px - text-size-regular
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px - text-size-medium, heading-style-h4
      '2xl': '1.5rem',   // 24px - text-size-large, heading-style-h3
      '3xl': '2rem',     // 32px - heading-style-h2
      '4xl': '3rem',     // 48px - heading-style-h1
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,         // All headings use 700
    },
    lineHeight: {
      tight: 1.2,        // H1, H2, H3
      normal: 1.4,       // H4
      base: 1.5,         // H5, regular text
      relaxed: 1.75,
      // Specific line heights from Paisawaala
      textRegular: '24px',  // text-size-regular line-height
      textMedium: '30px',   // text-size-medium line-height
    },
  },
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px - padding-small
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '5rem',   // 80px - padding-xxlarge
    // Paisawaala specific spacing
    buttonPadding: '0.75rem 1.5rem',  // Button padding
    buttonHeight: '48px',              // Button height
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '1000px',   // Paisawaala button border-radius (fully rounded)
    pill: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
  },
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Theme presets - Paisawaala brand theme
export const themes = {
  light: {
    background: tokens.colors.background.light,
    text: '#000000',                    // Paisawaala heading color
    textSecondary: tokens.colors.gray[500], // #656c77 - main text gray
    textMuted: tokens.colors.gray[400],     // #8b8b8b
    border: tokens.colors.gray[300],
    input: {
      background: tokens.colors.background.light,
      border: tokens.colors.gray[300],
      focus: tokens.colors.primary[500],    // #1c3693
    },
    button: {
      primary: tokens.colors.cta.primary,  // #ec3957
      primaryHover: tokens.colors.cta.hover,
      text: '#ffffff',
    },
  },
  dark: {
    background: tokens.colors.background.dark,
    text: tokens.colors.gray[100],
    textSecondary: tokens.colors.gray[400],
    border: tokens.colors.gray[700],
    input: {
      background: tokens.colors.gray[800],
      border: tokens.colors.gray[700],
      focus: tokens.colors.primary[400],
    },
    button: {
      primary: tokens.colors.cta.primary,
      primaryHover: tokens.colors.cta.hover,
      text: '#ffffff',
    },
  },
};

