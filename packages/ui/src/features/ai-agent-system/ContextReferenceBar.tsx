import * as React from 'react';
import { cn } from '../../lib/utils';
import { ContextReference, ContextReferenceData } from './ContextReference';
import { ScrollArea, ScrollBar } from '../../components/scroll-area';
import { Badge } from '../../components/badge';
import { Icons } from '../../components/icon';

export interface ContextReferenceBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of context references */
  references: ContextReferenceData[];
  /** Maximum number of references to show before collapsing (desktop: 5, mobile: 3) */
  collapseThreshold?: number;
  /** Whether references can be removed */
  removable?: boolean;
  /** Callback when remove button clicked */
  onRemove?: (referenceId: string) => void;
  /** Callback when reference is clicked */
  onReferenceClick?: (reference: ContextReferenceData) => void;
  /** Callback when "Add reference" button clicked */
  onAddReference?: () => void;
  /** Active reference ID (for highlighting) */
  activeReferenceId?: string;
}

export const ContextReferenceBar = React.forwardRef<HTMLDivElement, ContextReferenceBarProps>(
  (
    {
      references,
      collapseThreshold = 5,
      removable = true,
      onRemove,
      onReferenceClick,
      onAddReference,
      activeReferenceId,
      className,
      ...props
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    const visibleReferences = isExpanded
      ? references
      : references.slice(0, collapseThreshold);
    const hiddenCount = references.length - collapseThreshold;
    const shouldCollapse = hiddenCount > 0;

    if (references.length === 0 && !onAddReference) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900', className)}
        {...props}
      >
        {/* References */}
        {references.length > 0 && (
          <ScrollArea className="flex-1">
            <div className="flex items-center gap-2 pb-2">
              {visibleReferences.map((reference) => (
                <ContextReference
                  key={reference.id}
                  reference={reference}
                  removable={removable}
                  onRemove={onRemove}
                  onClick={onReferenceClick}
                  isActive={reference.id === activeReferenceId}
                />
              ))}
              {shouldCollapse && !isExpanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  +{hiddenCount} more
                </button>
              )}
              {isExpanded && shouldCollapse && (
                <button
                  onClick={() => setIsExpanded(false)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <Icons.chevronUp className="h-3 w-3" />
                  Show less
                </button>
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        {/* Add Reference Button */}
        {onAddReference && (
          <button
            onClick={onAddReference}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <Icons.plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </button>
        )}

        {/* Context Limit Warning */}
        {references.length >= 10 && (
          <Badge variant="outline" className="shrink-0 text-xs">
            <Icons.alertCircle className="h-3 w-3 mr-1" />
            Max references (10)
          </Badge>
        )}
      </div>
    );
  }
);
ContextReferenceBar.displayName = 'ContextReferenceBar';
