import { useState, useEffect } from 'react';
import { Cloud, CloudOff, AlertCircle, Clock } from 'lucide-react';
import { BrandSpinner } from './icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export type SaveStatus = 'saving' | 'saved' | 'error' | 'offline' | 'idle';

export interface SaveIndicatorProps {
  status: SaveStatus;
  className?: string;
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
  debounceMs?: number; // For countdown timer
}

/**
 * Format relative time from a date (e.g., "2 minutes ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 10) return 'just now';
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  // For older dates, show the actual date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Visual indicator for document save status
 * Minimal design: icons only, no text labels, tooltips for context
 *
 * States:
 * 1. New document (never saved) → Show nothing
 * 2. Saved successfully → Green cloud, tooltip "Saved X time ago"
 * 3. Previously saved + pending changes → Subtle timer, tooltip "Saving in 3,2,1"
 * 4. Saving → Spinner
 * 5. Error → Red warning
 */
export function SaveIndicator({
  status,
  className = '',
  lastSavedAt = null,
  hasUnsavedChanges = false,
  debounceMs = 3000,
}: SaveIndicatorProps) {
  // Countdown timer for pending state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Document has never been saved if lastSavedAt is null
  const isNewDocument = lastSavedAt === null;

  // Determine effective status with priority order
  // Priority: saving > error > pending > saved > hidden
  let effectiveStatus: SaveStatus | 'pending' | 'hidden';

  if (status === 'saving') {
    // HIGHEST PRIORITY: Always show saving spinner when actively saving
    effectiveStatus = 'saving';
  } else if (status === 'error') {
    // Show error state
    effectiveStatus = 'error';
  } else if (status === 'offline') {
    // Show offline state
    effectiveStatus = 'offline';
  } else if (!isNewDocument && hasUnsavedChanges && status !== 'saving' && status !== 'error') {
    // Show pending countdown (has unsaved changes, not currently saving/error)
    effectiveStatus = 'pending';
  } else if (status === 'saved' || (!hasUnsavedChanges && lastSavedAt !== null)) {
    // Show success cloud (explicitly saved or no unsaved changes)
    effectiveStatus = 'saved';
  } else if (isNewDocument) {
    // New document never saved → show nothing
    effectiveStatus = 'hidden';
  } else {
    // Fallback: show nothing
    effectiveStatus = 'hidden';
  }

  // Calculate if we're in pending state (for countdown effect)
  const isPending = effectiveStatus === 'pending';

  // Countdown timer effect
  useEffect(() => {
    if (isPending) {
      if (startTime === null) {
        setStartTime(Date.now());
      }

      const interval = setInterval(() => {
        if (startTime) {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, Math.ceil((debounceMs - elapsed) / 1000));
          setCountdown(remaining);

          if (remaining === 0) {
            clearInterval(interval);
          }
        }
      }, 100); // Update every 100ms for smooth countdown

      return () => clearInterval(interval);
    } else {
      setStartTime(null);
      setCountdown(null);
    }
  }, [isPending, startTime, debounceMs]);

  // Don't render anything for new documents
  if (effectiveStatus === 'hidden') {
    return null;
  }

  const getIcon = () => {
    switch (effectiveStatus) {
      case 'pending':
        // Subtle clock icon for pending saves
        return (
          <Clock className="h-4 w-4 text-gray-400 opacity-60" />
        );
      case 'saving':
        // Brand spinner with Centrid coral color
        return <BrandSpinner className="h-4 w-4 text-primary-600" size={16} />;
      case 'saved':
        // Green cloud for successfully saved documents
        return <Cloud className="h-4 w-4 text-success-500" />;
      case 'error':
        // Red warning icon
        return <AlertCircle className="h-4 w-4 text-error-500" />;
      case 'offline':
        return <CloudOff className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const getTooltip = () => {
    if (effectiveStatus === 'saving') {
      return 'Saving...';
    }

    if (effectiveStatus === 'pending') {
      // Show countdown in tooltip: "Saving in 3" / "Saving in 2" / "Saving in 1"
      if (countdown !== null && countdown > 0) {
        return `Saving in ${countdown}`;
      }
      return 'Saving...';
    }

    if (effectiveStatus === 'error') {
      return 'Failed to save changes';
    }

    if (effectiveStatus === 'offline') {
      return 'No internet connection';
    }

    // For saved state, show timestamp
    if (effectiveStatus === 'saved' && lastSavedAt) {
      const relativeTime = getRelativeTime(lastSavedAt);
      return `Saved ${relativeTime}`;
    }

    return null;
  };

  const icon = getIcon();
  const tooltip = getTooltip();

  if (!icon) {
    return null;
  }

  const content = (
    <div className={`flex items-center ${className}`}>
      {icon}
    </div>
  );

  // Only wrap in tooltip if we have tooltip text
  if (!tooltip) {
    return content;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-default">
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 text-white border-gray-800">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
