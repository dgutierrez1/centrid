import React from 'react';
import { Badge } from '../components/badge';
import { Icon, type IconName } from '../components/icon';

export interface PageHeaderBadge {
  label: string;
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive';
  icon?: IconName;
}

export interface PageHeaderProps {
  title: string;
  titleAccent?: string;
  description?: string;
  badges?: PageHeaderBadge[];
  className?: string;
}

/**
 * PageHeader - Premium page header with gradient text and badges
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="Design System"
 *   titleAccent="Centrid"
 *   description="Premium components for AI-powered knowledge management"
 *   badges={[
 *     { label: 'Innovation', variant: 'default', icon: 'Zap' },
 *     { label: 'Security', variant: 'secondary', icon: 'Lock' }
 *   ]}
 * />
 * ```
 */
export function PageHeader({
  title,
  titleAccent,
  description,
  badges,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`border-b border-gray-200/50 dark:border-gray-700/50 pb-10 relative ${className}`}>
      <h1 className="text-5xl font-bold mb-4 tracking-tight">
        {titleAccent && (
          <>
            <span className="text-gradient-premium">{titleAccent}</span>{' '}
          </>
        )}
        <span className="text-gray-900 dark:text-white">{title}</span>
      </h1>
      {description && (
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      {badges && badges.length > 0 && (
        <div className="mt-4 flex gap-2">
          {badges.map((badge, index) => (
            <Badge key={index} variant={badge.variant || 'default'} className="gap-1.5">
              {badge.icon && <Icon name={badge.icon} className="w-3 h-3" />}
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </header>
  );
}
