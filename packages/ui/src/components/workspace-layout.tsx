import { ReactNode } from 'react';

export interface WorkspaceLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
  className?: string;
}

/**
 * WorkspaceLayout - Three-panel desktop workspace layout
 * Fixed proportions: 20% left (file tree), 50% center (editor), 30% right (AI chat)
 * Matches design spec from FilesystemMarkdownEditor.tsx (DesktopWorkspace)
 */
export function WorkspaceLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  className = '',
}: WorkspaceLayoutProps) {
  return (
    <div className={`flex flex-1 overflow-hidden ${className}`}>
      {/* Left Panel - File Tree (20%) */}
      <div className="w-1/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {leftPanel}
      </div>

      {/* Center Panel - Editor (50%) */}
      <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
        {centerPanel}
      </div>

      {/* Right Panel - AI Chat (30%) */}
      <div className="w-[30%] bg-white dark:bg-gray-800 flex flex-col">
        {rightPanel}
      </div>
    </div>
  );
}
