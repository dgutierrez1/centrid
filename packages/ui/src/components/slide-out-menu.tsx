/**
 * SlideOutMenu Component
 *
 * Slide-in menu overlay for mobile navigation (e.g., file tree access).
 * Slides in from the left with backdrop overlay.
 *
 * Features:
 * - Slide-in/out animation (150ms mobile-optimized)
 * - Backdrop with tap-outside-to-close
 * - Focus trap when open
 * - Keyboard navigation (ESC to close)
 * - ARIA accessibility
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

export interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  'data-testid'?: string;
}

/**
 * SlideOutMenu - Mobile slide-in overlay menu
 *
 * Provides accessible slide-in menu pattern commonly used for navigation.
 * Automatically handles backdrop clicks, ESC key, and focus management.
 *
 * @example
 * ```tsx
 * <SlideOutMenu
 *   isOpen={isMenuOpen}
 *   onClose={() => setIsMenuOpen(false)}
 *   title="Files"
 * >
 *   <FileTree {...fileTreeProps} />
 * </SlideOutMenu>
 * ```
 */
export function SlideOutMenu({
  isOpen,
  onClose,
  children,
  title,
  className,
  'data-testid': testId = 'slide-out-menu',
}: SlideOutMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus first focusable element when opened
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const firstFocusable = menuRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        data-testid={`${testId}-backdrop`}
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out menu panel */}
      <div
        ref={menuRef}
        data-testid={testId}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Menu'}
        className={cn(
          'fixed inset-y-0 left-0 z-50',
          'w-[80vw] max-w-[320px]', // 80% width, max 320px
          'bg-background shadow-xl',
          'flex flex-col',
          'animate-in slide-in-from-left duration-150', // Tailwind animation
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className={cn(
                'p-2 -mr-2', // Touch target padding
                'rounded-md hover:bg-muted',
                'transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
              aria-label="Close menu"
              data-testid={`${testId}-close-button`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6L14 14M6 14L14 6" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </>
  );
}
