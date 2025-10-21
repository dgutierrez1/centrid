import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'premium' | 'premium-xl';
  hover?: boolean;
  className?: string;
}

/**
 * GlassCard - Reusable glass morphism card wrapper
 *
 * @example
 * ```tsx
 * <GlassCard variant="premium" hover>
 *   <h3>Card Title</h3>
 *   <p>Card content</p>
 * </GlassCard>
 * ```
 */
export function GlassCard({
  children,
  variant = 'default',
  hover = true,
  className = '',
}: GlassCardProps) {
  const baseClasses = 'glass rounded-xl border border-white/20 dark:border-gray-700/50';

  const variantClasses = {
    default: 'shadow-premium p-6',
    premium: 'shadow-premium-lg p-8',
    'premium-xl': 'shadow-premium-xl p-8 relative overflow-hidden',
  };

  const hoverClasses = hover ? 'hover-lift transition-premium' : '';

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}
