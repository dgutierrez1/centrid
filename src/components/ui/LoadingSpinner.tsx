// Centrid AI Filesystem - Loading Spinner Component
// Version: 3.1 - Supabase Plus MVP Architecture

import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  color?: 'primary' | 'white' | 'gray';
}

export default function LoadingSpinner({ 
  size = 'medium', 
  className,
  color = 'primary' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'border-primary-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
  };

  return (
    <div
      className={clsx(
        'inline-block border-2 border-solid rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
