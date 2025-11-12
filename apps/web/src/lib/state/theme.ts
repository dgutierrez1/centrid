/**
 * Theme State Management
 *
 * Simple Valtio state for theme switching with localStorage persistence.
 * Extracted from legacy state.ts to follow focused state module pattern.
 */

import { proxy, subscribe } from "valtio";
import { subscribeKey } from "valtio/utils";

// Theme state interface
interface ThemeState {
  theme: "light" | "dark" | "system";
}

// Initial state
const initialState: ThemeState = {
  theme: "system",
};

// Create the theme state proxy
export const themeState = proxy<ThemeState>(initialState);

// Theme actions
export const setTheme = (theme: ThemeState["theme"]) => {
  themeState.theme = theme;
};

// Persistence helpers
const STORAGE_KEY = "centrid-theme";

const saveToStorage = () => {
  localStorage.setItem(STORAGE_KEY, themeState.theme);
};

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
      themeState.theme = saved;
    }
  } catch (error) {
    console.warn("Failed to load theme from storage:", error);
  }
};

// Set up automatic persistence (only in browser)
if (typeof window !== "undefined") {
  // Load initial theme from storage
  loadFromStorage();

  // Subscribe to theme changes and persist
  subscribeKey(themeState, "theme", saveToStorage);
}

// Export type for convenience
export type { ThemeState };
