// Centrid AI Filesystem - Theme Provider
// Version: 3.1 - Supabase Plus MVP Architecture

import { useEffect, ReactNode } from 'react';
import { useSnapshot } from 'valtio';
import { themeState } from '@/lib/state/theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const state = useSnapshot(themeState);

  // Apply theme to document
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      
      // Remove existing theme classes
      root.classList.remove('light', 'dark');
      
      let finalTheme = state.theme;
      
      // Handle system theme preference
      if (state.theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        finalTheme = systemPrefersDark ? 'dark' : 'light';
      }
      
      // Apply theme class
      root.classList.add(finalTheme);
      
      // Update meta theme-color for mobile browsers
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', finalTheme === 'dark' ? '#111827' : '#f9fafb');
      }
    };

    applyTheme();

    // Listen for system theme changes if using system theme
    if (state.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        if (state.theme === 'system') {
          applyTheme();
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      
      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [state.theme]);

  // Prevent flash of wrong theme
  useEffect(() => {
    // Add transition classes after initial load to prevent flash
    const timer = setTimeout(() => {
      document.documentElement.style.setProperty('--theme-transition', 'background-color 0.2s ease, color 0.2s ease');
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return <>{children}</>;
}
