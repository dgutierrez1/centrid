import React from 'react';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

/**
 * SectionHeader - Consistent section header for design system and app pages
 *
 * @example
 * ```tsx
 * <SectionHeader title="Color Palette" />
 * <SectionHeader
 *   title="Components"
 *   description="Reusable UI components built with Tailwind CSS"
 * />
 * ```
 */
export function SectionHeader({ title, description, className = '' }: SectionHeaderProps) {
  return (
    <div className={className}>
      <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {description}
        </p>
      )}
    </div>
  );
}
