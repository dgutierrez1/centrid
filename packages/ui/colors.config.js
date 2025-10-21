/**
 * Centrid Design System - Centralized Color Configuration
 *
 * Single source of truth for all colors across the monorepo.
 * Import this in tailwind.config.js files to ensure consistency.
 *
 * Usage in tailwind.config.js:
 * const { colors, agentColors } = require('@centrid/ui/colors.config');
 */

/**
 * Brand Color Scales
 */
const colors = {
  // Primary Brand Color - Coral
  primary: {
    50: '#fff5f5',
    100: '#ffe3e3',
    200: '#ffc9c9',
    300: '#ffa8a8',
    400: '#ff8787',
    500: '#ff6d6d',
    600: '#ff4d4d',    // Main brand color
    700: '#e63946',
    800: '#cc2936',
    900: '#b31f2a',
  },

  // Success - Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#34c759',    // Main success color
    600: '#28a745',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },

  // Warning - Orange
  warning: {
    50: '#fff9e6',
    100: '#fff3cc',
    200: '#ffe699',
    300: '#ffd966',
    400: '#ffcc33',
    500: '#ff9f0a',    // Main warning color
    600: '#e68f00',
    700: '#b37000',
    800: '#805100',
    900: '#4d3100',
  },

  // Error/Destructive - Deep Red (distinct from coral primary)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#dc2626',    // Main error color
    600: '#b91c1c',
    700: '#991b1b',
    800: '#7f1d1d',
    900: '#5c1515',
  },

  // Gray - Neutral
  gray: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525B',    // Main gray
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b',
  },
};

/**
 * AI Agent Colors - Harmonized Coral System
 */
const agentColors = {
  create: '#ff4d4d',      // Matches primary-600
  edit: '#ff6d6d',        // Lighter coral (primary-500)
  research: '#ff7060',    // Softest coral variation
};

/**
 * shadcn/ui Theme Colors (HSL format for CSS variables)
 */
const shadcnTheme = {
  light: {
    background: '0 0% 100%',
    foreground: '240 10% 3.9%',
    card: '0 0% 100%',
    'card-foreground': '240 10% 3.9%',
    popover: '0 0% 100%',
    'popover-foreground': '240 10% 3.9%',
    primary: '0 100% 65%',           // Coral #ff4d4d
    'primary-foreground': '0 0% 98%',
    secondary: '240 4.8% 95.9%',
    'secondary-foreground': '240 5.9% 10%',
    muted: '240 4.8% 95.9%',
    'muted-foreground': '240 3.8% 46.1%',
    accent: '240 4.8% 95.9%',
    'accent-foreground': '240 5.9% 10%',
    destructive: '0 72% 51%',        // Deep Red #dc2626
    'destructive-foreground': '0 0% 98%',
    border: '240 5.9% 90%',
    input: '240 5.9% 90%',
    ring: '0 100% 65%',              // Coral ring (matches primary)
    radius: '0.5rem',
  },
  dark: {
    background: '240 10% 3.9%',
    foreground: '0 0% 98%',
    card: '240 10% 3.9%',
    'card-foreground': '0 0% 98%',
    popover: '240 10% 3.9%',
    'popover-foreground': '0 0% 98%',
    primary: '0 100% 70%',
    'primary-foreground': '240 5.9% 10%',
    secondary: '240 3.7% 15.9%',
    'secondary-foreground': '0 0% 98%',
    muted: '240 3.7% 15.9%',
    'muted-foreground': '240 5% 64.9%',
    accent: '240 3.7% 15.9%',
    'accent-foreground': '0 0% 98%',
    destructive: '0 60% 48%',
    'destructive-foreground': '0 0% 98%',
    border: '240 3.7% 15.9%',
    input: '240 3.7% 15.9%',
    ring: '0 100% 70%',
  },
};

module.exports = {
  colors,
  agentColors,
  shadcnTheme,
};
