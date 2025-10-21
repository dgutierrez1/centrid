import React from 'react';
import { Icon, type IconName } from '../components/icon';

export interface FeatureCardProps {
  icon: IconName;
  title: string;
  description: string;
  iconColor?: 'primary' | 'success' | 'warning' | 'error';
  variant?: 'default' | 'glow' | 'gradient-border';
  className?: string;
}

const iconColorClasses = {
  primary: 'from-primary-500 to-primary-700',
  success: 'from-success-500 to-success-700',
  warning: 'from-warning-500 to-warning-700',
  error: 'from-error-500 to-error-700',
};

/**
 * FeatureCard - Premium glassmorphic card for showcasing features
 *
 * @example
 * ```tsx
 * <FeatureCard
 *   icon="Zap"
 *   title="AI-Powered"
 *   description="Context-aware intelligence"
 *   iconColor="primary"
 *   variant="default"
 * />
 * ```
 */
export function FeatureCard({
  icon,
  title,
  description,
  iconColor = 'primary',
  variant = 'default',
  className = '',
}: FeatureCardProps) {
  const baseClasses = 'glass shadow-premium rounded-lg p-6 transition-premium';

  const variantClasses = {
    default: 'hover-lift',
    glow: 'hover-glow shadow-premium-lg',
    'gradient-border': 'hover-lift border-gradient',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${iconColorClasses[iconColor]} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon name={icon} className="w-6 h-6 text-white" />
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
