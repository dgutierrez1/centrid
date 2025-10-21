import React from 'react';

export interface BrandLogoProps {
  variant?: 'default' | 'icon-only' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    icon: 'w-6 h-6',
    iconContainer: 'w-6 h-6',
    iconInner: 'w-4 h-4',
    text: 'text-sm',
  },
  md: {
    icon: 'w-10 h-10',
    iconContainer: 'w-10 h-10',
    iconInner: 'w-6 h-6',
    text: 'text-2xl',
  },
  lg: {
    icon: 'w-12 h-12',
    iconContainer: 'w-12 h-12',
    iconInner: 'w-7 h-7',
    text: 'text-3xl',
  },
  xl: {
    icon: 'w-16 h-16',
    iconContainer: 'w-16 h-16',
    iconInner: 'w-9 h-9',
    text: 'text-4xl',
  },
};

/**
 * BrandLogo - Centrid brand logo component
 *
 * @example
 * ```tsx
 * <BrandLogo size="lg" variant="default" />
 * <BrandLogo size="md" variant="icon-only" />
 * <BrandLogo size="sm" variant="minimal" />
 * ```
 */
export function BrandLogo({
  variant = 'default',
  size = 'md',
  showText = true,
  className = '',
}: BrandLogoProps) {
  const config = sizeConfig[size];

  const iconElement = (
    <div className={`${config.iconContainer} rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center ${variant === 'default' ? 'shadow-premium' : ''}`}>
      <svg className={`${config.iconInner} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </div>
  );

  if (variant === 'icon-only') {
    return <div className={className}>{iconElement}</div>;
  }

  return (
    <div className={`flex items-center gap-${size === 'sm' ? '2' : '3'} ${className}`}>
      {iconElement}
      {showText && (
        <span className={`${config.text} font-bold ${variant === 'minimal' ? 'text-gray-900 dark:text-white' : 'text-gradient'}`}>
          Centrid
        </span>
      )}
    </div>
  );
}
