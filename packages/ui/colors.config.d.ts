/**
 * TypeScript type definitions for colors.config.js
 * This allows TypeScript projects to import colors with full type safety
 */

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Colors {
  primary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  gray: ColorScale;
}

export interface AgentColors {
  create: string;
  edit: string;
  research: string;
}

export interface ShadcnTheme {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export declare const colors: Colors;
export declare const agentColors: AgentColors;
export declare const shadcnTheme: ShadcnTheme;
