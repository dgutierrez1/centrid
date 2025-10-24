/**
 * Design System Frame
 *
 * Wraps feature designs to separate design system navigation from actual feature UI.
 * This chrome/frame is NOT part of the feature design - it's just for navigating
 * the design system itself.
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface DesignSystemFrameProps {
  featureName: string;
  featureId: string;
  screens?: Array<{ name: string; href: string }>;
  children: ReactNode;
}

export function DesignSystemFrame({ featureName, featureId, screens, children }: DesignSystemFrameProps) {
  const router = useRouter();
  const currentPath = router.asPath;

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
          <span className="text-sm font-medium">{featureName}</span>
          <span className="text-xs text-gray-500">({featureId})</span>
        </div>

        {screens && screens.length > 0 && (
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

        <div className="ml-auto text-xs text-gray-400">
          Design Preview
        </div>
      </div>

      {/* Feature Design - This is what the real app looks like */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
