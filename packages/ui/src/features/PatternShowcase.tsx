import React from 'react';

export interface PatternShowcaseProps {
  title: string;
  description: string;
  pattern?: 'mesh-light' | 'mesh-dark' | 'dots' | 'dots-dark' | 'grid' | 'grid-dark';
  background?: 'mesh' | 'dots' | 'white' | 'dark';
  className?: string;
}

const patternClasses = {
  'mesh-light': 'bg-mesh-light pattern-grid',
  'mesh-dark': 'bg-mesh-dark pattern-grid-dark',
  dots: 'pattern-dots bg-white',
  'dots-dark': 'pattern-dots-dark bg-gray-900',
  grid: 'pattern-grid bg-white',
  'grid-dark': 'pattern-grid-dark bg-gray-900',
};

const backgroundClasses = {
  mesh: 'bg-mesh-light dark:bg-mesh-dark pattern-grid dark:pattern-grid-dark',
  dots: 'pattern-dots dark:pattern-dots-dark bg-white dark:bg-gray-900',
  white: 'bg-white dark:bg-gray-900',
  dark: 'bg-gray-900 dark:bg-gray-800',
};

/**
 * PatternShowcase - Showcase card for demonstrating design patterns
 *
 * @example
 * ```tsx
 * <PatternShowcase
 *   title="Mesh Gradient Background"
 *   description="Multi-layered radial gradients create depth and visual interest"
 *   background="mesh"
 * />
 * ```
 */
export function PatternShowcase({
  title,
  description,
  pattern,
  background = 'mesh',
  className = '',
}: PatternShowcaseProps) {
  const bgClass = pattern ? patternClasses[pattern] : backgroundClasses[background];

  return (
    <div
      className={`${bgClass} rounded-xl p-8 border border-gray-200/50 dark:border-gray-700/50 shadow-premium ${className}`}
    >
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        {title}
      </h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}
