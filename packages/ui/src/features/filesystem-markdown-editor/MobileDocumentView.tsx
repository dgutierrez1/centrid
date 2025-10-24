/**
 * Mobile Document View Component
 * Single-panel mobile interface for document editing
 */

import { useState } from 'react';
import {
  MobileHeader,
  MobileMenu,
  MarkdownEditorMobile,
} from '@centrid/ui/components';
import {
  FileTextIcon,
  MessageSquareIcon,
  CloudIcon,
  CheckIcon,
} from './icons';

export interface MobileMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface MobileDocumentViewProps {
  documentName: string;
  documentContent: string;
  onEditorChange?: (content: string) => void;
  saveStatus?: 'saved' | 'saving' | 'error';
  logo?: string;
  appName?: string;
  userInitials?: string;
  userName?: string;
  userEmail?: string;
  menuItems?: MobileMenuItem[];
  onNavigateToChat?: () => void;
}

export function MobileDocumentView({
  documentName,
  documentContent,
  onEditorChange,
  saveStatus = 'saved',
  logo = 'C',
  appName = 'Centrid',
  userInitials = 'DG',
  userName = 'User',
  userEmail = 'user@example.com',
  menuItems = [],
  onNavigateToChat,
}: MobileDocumentViewProps) {
  const [activeView, setActiveView] = useState<'document' | 'chat'>('document');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      {/* Application Header */}
      <MobileHeader
        logo={logo}
        appName={appName}
        onMenuClick={() => setMenuOpen(!menuOpen)}
      />

      {/* Mobile Menu */}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userInitials={userInitials}
        userName={userName}
        userEmail={userEmail}
        items={menuItems}
      />

      {/* Document Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">{documentName}</h1>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {saveStatus === 'saved' && (
            <>
              <CloudIcon className="h-4 w-4 text-success-500" />
              <CheckIcon className="h-3 w-3 text-success-500" />
            </>
          )}
        </div>
      </div>

      {/* Markdown Editor Mobile Component */}
      <div className="h-[calc(100vh-200px)]">
        <MarkdownEditorMobile
          content={documentContent}
          showToolbar={true}
          touchOptimized={true}
          onChange={onEditorChange}
        />
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex h-16">
          <button
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${
              activeView === 'document' ? 'text-primary-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveView('document')}
          >
            <FileTextIcon className="h-5 w-5" />
            <span className="text-xs">Document</span>
          </button>
          <button
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${
              activeView === 'chat' ? 'text-primary-600' : 'text-gray-500'
            }`}
            onClick={() => {
              setActiveView('chat');
              onNavigateToChat?.();
            }}
          >
            <MessageSquareIcon className="h-5 w-5" />
            <span className="text-xs">Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
