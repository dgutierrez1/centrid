import React from 'react';
import { ColorSwatch, type ColorSwatchProps } from './ColorSwatch';

export interface ColorPaletteProps {
  colors: ColorSwatchProps[];
  columns?: 2 | 3 | 4 | 5 | 6;
  title?: string;
  className?: string;
}

/**
 * ColorPalette - Grid layout for color swatches
 *
 * @example
 * ```tsx
 * <ColorPalette
 *   title="Brand Colors"
 *   columns={5}
 *   colors={[
 *     { name: 'Primary', hex: '#ff4d4d', colorClass: 'bg-primary-600' },
 *     { name: 'Success', hex: '#34c759', colorClass: 'bg-success-500' }
 *   ]}
 * />
 * ```
 */
export function ColorPalette({
  colors,
  columns = 5,
  title,
  className = '',
}: ColorPaletteProps) {
  const gridClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-6',
  };

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <div className={`grid ${gridClasses[columns]} gap-4`}>
        {colors.map((color, index) => (
          <ColorSwatch key={index} {...color} />
        ))}
      </div>
    </div>
  );
}
