/**
 * Design System Frame
 *
 * Wraps feature designs to separate design system navigation from actual feature UI.
 * This chrome/frame is NOT part of the feature design - it's just for navigating
 * the design system itself.
 *
 * Enhanced version supports:
 * - Screen navigation (for screen showcases)
 * - Component library link (for component states)
 * - Quick navigation between screens and component library
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface DesignSystemFramePropsLegacy {
  /** @deprecated Use featureId instead */
  title?: string;
  /** @deprecated Use featureId instead */
  backHref?: string;
  /** @deprecated Not used anymore */
  description?: string;
}

interface DesignSystemFrameProps extends DesignSystemFramePropsLegacy {
  /** Feature display name (e.g., "AI Agent System") */
  featureName?: string;
  /** Feature ID/slug (e.g., "ai-agent-system") */
  featureId?: string;
  /** Screen navigation options */
  screens?: Array<{ name: string; href: string }>;
  /** Child content to render */
  children: ReactNode;
}

export function DesignSystemFrame({
  // New API
  featureName,
  featureId,
  screens,
  // Legacy API (backward compatibility)
  title,
  backHref,
  children
}: DesignSystemFrameProps) {
  const router = useRouter();
  const currentPath = router.asPath;

  // Support legacy API
  const displayName = featureName || title || 'Feature';
  const featureSlug = featureId || backHref?.split('/').filter(Boolean)[0] || '';

  // Determine if current page is component library or screen
  const isComponentLibrary = currentPath.includes('/components');
  const isChatStates = currentPath.includes('-states');

  // Build component library link
  const componentLibraryHref = featureSlug ? `/${featureSlug}/components` : '#';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Design System Navigation Chrome - NOT part of the feature design */}
      <div className="bg-gray-900 text-white px-4 py-2 flex items-center gap-4 border-b border-gray-700 z-50">
        <Link
          href="/"
          className="text-sm hover:text-primary-400 transition-colors flex items-center gap-1"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Design System
        </Link>

        <div className="h-4 w-px bg-gray-600" />

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Feature:</span>
          <Link
            href={`/${featureSlug}`}
            className="text-sm font-medium hover:text-primary-400 transition-colors"
          >
            {displayName}
          </Link>
          {featureSlug && (
            <span className="text-xs text-gray-500">({featureSlug})</span>
          )}
        </div>

        {/* View Switcher: Screens vs Components */}
        <div className="h-4 w-px bg-gray-600" />
        <div className="flex items-center gap-2">
          <Link
            href={`/${featureSlug}`}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              !isComponentLibrary && !isChatStates
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Overview
          </Link>
          <Link
            href={componentLibraryHref}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              isComponentLibrary || isChatStates
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Components
          </Link>
        </div>

        {/* Screen Navigation (only show when on screen pages) */}
        {screens && screens.length > 0 && !isComponentLibrary && !isChatStates && (
          <>
            <div className="h-4 w-px bg-gray-600" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Screen:</span>
              <select
                className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600 hover:border-gray-500 cursor-pointer"
                value={currentPath}
                onChange={(e) => router.push(e.target.value)}
              >
                {screens.map((screen) => (
                  <option key={screen.href} value={screen.href}>
                    {screen.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-3">
          {isComponentLibrary && (
            <span className="text-xs text-primary-400 font-medium">Component Library</span>
          )}
          {isChatStates && (
            <span className="text-xs text-primary-400 font-medium">State Variations</span>
          )}
          <span className="text-xs text-gray-400">Design Preview</span>
        </div>
      </div>

      {/* Feature Design - This is what the real app looks like */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
