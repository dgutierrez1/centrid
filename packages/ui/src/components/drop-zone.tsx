/**
 * DropZone - Reusable drag-and-drop zone component
 * Pure presentational component with no business logic
 */

import { DragEvent, ReactNode } from 'react';
import { cn } from '@centrid/shared/utils';

export interface DropZoneProps {
  /** Called when files are dropped */
  onDrop?: (files: FileList) => void;
  /** Called when user clicks the drop zone */
  onClick?: () => void;
  /** Whether drag is currently active */
  isDragging?: boolean;
  /** Called when drag enters the zone */
  onDragEnter?: (e: DragEvent<HTMLDivElement>) => void;
  /** Called when drag leaves the zone */
  onDragLeave?: (e: DragEvent<HTMLDivElement>) => void;
  /** Called during drag over */
  onDragOver?: (e: DragEvent<HTMLDivElement>) => void;
  /** Content to display inside the drop zone */
  children?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether the drop zone is disabled */
  disabled?: boolean;
}

export function DropZone({
  onDrop,
  onClick,
  isDragging = false,
  onDragEnter,
  onDragLeave,
  onDragOver,
  children,
  className,
  disabled = false,
}: DropZoneProps) {
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0 && onDrop) {
      onDrop(files);
    }
  };

  const handleClick = () => {
    console.log('[DropZone] Clicked', { disabled, hasOnClick: !!onClick });
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
        isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]'
          : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-900',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer',
        className
      )}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      {children}
    </div>
  );
}
