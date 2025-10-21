import React from 'react';
import { Badge } from '../components/badge';

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  variant?: 'default' | 'glass';
  className?: string;
}

/**
 * StatCard - Statistics display card with optional change indicator
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Requests"
 *   value="12,345"
 *   change="+12.5%"
 *   changeType="positive"
 * />
 * ```
 */
export function StatCard({
  label,
  value,
  change,
  changeType = 'positive',
  variant = 'default',
  className = '',
}: StatCardProps) {
  const baseClasses =
    variant === 'glass'
      ? 'glass shadow-premium hover-lift transition-premium'
      : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700';

  const getBadgeVariant = () => {
    if (changeType === 'positive') return 'success';
    if (changeType === 'negative') return 'destructive';
    return 'secondary';
  };

  return (
    <div className={`rounded-lg p-4 ${baseClasses} ${className}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {change && (
          <Badge variant={getBadgeVariant()} className="text-xs">
            {change}
          </Badge>
        )}
      </div>
    </div>
  );
}
