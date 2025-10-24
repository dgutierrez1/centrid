/**
 * Toast Configuration
 * Centralized configuration for react-hot-toast with Centrid brand styling
 */

import type { ToasterProps } from 'react-hot-toast';

/**
 * Branded toast configuration matching Centrid design system
 * Colors from .specify/design-system/tokens.md
 */
export const toastConfig: ToasterProps = {
  position: 'top-right',
  toastOptions: {
    // Default options for all toasts
    duration: 4000,
    style: {
      background: '#fff',
      color: '#27272a', // zinc-800
      fontSize: '14px',
      fontWeight: '500',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      maxWidth: '500px',
    },
    // Success toasts
    success: {
      style: {
        background: '#f0fdf4', // green-50
        color: '#166534', // green-800
        border: '1px solid #86efac', // green-300
      },
      iconTheme: {
        primary: '#34c759', // success-500 from design tokens
        secondary: '#f0fdf4',
      },
    },
    // Error toasts
    error: {
      duration: 6000, // Longer duration for errors
      style: {
        background: '#fef2f2', // red-50
        color: '#991b1b', // red-800
        border: '1px solid #fecaca', // red-200
      },
      iconTheme: {
        primary: '#ff3b30', // error-500 from design tokens
        secondary: '#fef2f2',
      },
    },
    // Loading toasts
    loading: {
      style: {
        background: '#fff7ed', // orange-50
        color: '#9a3412', // orange-800
        border: '1px solid #fed7aa', // orange-200
      },
      iconTheme: {
        primary: '#ff9f0a', // warning-500 from design tokens
        secondary: '#fff7ed',
      },
    },
  },
};
