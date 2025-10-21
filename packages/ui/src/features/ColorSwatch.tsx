import React from 'react';

export interface ColorSwatchProps {
  name: string;
  hex: string;
  colorClass?: string;
  className?: string;
}

/**
 * ColorSwatch - Reusable color swatch display component
 *
 * @example
 * ```tsx
 * <ColorSwatch
 *   name="Primary (Coral)"
 *   hex="#ff4d4d"
 *   colorClass="bg-primary-600"
 * />
 * ```
 */
export function ColorSwatch({
  name,
  hex,
  colorClass,
  className = '',
}: ColorSwatchProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`h-24 rounded-lg shadow-sm ${colorClass || ''}`}
        style={!colorClass ? { backgroundColor: hex } : undefined}
      />
      <p className="text-sm font-medium">{name}</p>
      <p className="text-xs text-gray-500">{hex}</p>
    </div>
  );
}
