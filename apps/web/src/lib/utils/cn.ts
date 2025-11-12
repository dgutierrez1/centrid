/**
 * cn - Class Name utility
 *
 * Combines Tailwind classes with conditional logic using clsx and tailwind-merge.
 * Handles class conflicts intelligently (e.g., "p-4 p-6" becomes "p-6").
 *
 * @example
 * cn("text-base", isActive && "text-primary", className)
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
