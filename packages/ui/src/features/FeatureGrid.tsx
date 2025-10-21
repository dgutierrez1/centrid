import React from 'react';
import { FeatureCard, type FeatureCardProps } from './FeatureCard';

export interface FeatureGridProps {
  features: FeatureCardProps[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * FeatureGrid - Grid layout for multiple feature cards
 *
 * @example
 * ```tsx
 * <FeatureGrid
 *   columns={3}
 *   features={[
 *     { icon: 'Zap', title: 'Fast', description: 'Lightning speed' },
 *     { icon: 'Shield', title: 'Secure', description: 'Enterprise-grade' },
 *     { icon: 'Cpu', title: 'Smart', description: 'AI-powered' }
 *   ]}
 * />
 * ```
 */
export function FeatureGrid({
  features,
  columns = 3,
  className = '',
}: FeatureGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-4 ${className}`}>
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))}
    </div>
  );
}
