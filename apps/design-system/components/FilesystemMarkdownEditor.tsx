/**
 * Feature Design: File System & Markdown Editor
 *
 * Created during /speckit.design workflow
 * Feature: 003-filesystem-markdown-editor
 * Status: Draft
 */

import { useState } from 'react';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Toggle,
  ScrollArea,
  Alert,
  AlertDescription,
  Separator,
  MarkdownEditor,
  MarkdownEditorMobile,
  MobileMenu,
  MobileHeader,
  DesktopHeader,
} from '@centrid/ui/components';

// Icons (using heroicons style SVG paths)
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const MoreVerticalIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const CloudIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const MessageSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FolderPlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// File tree mock data
const fileTreeData = [
  {
    id: '1',
    name: 'Projects',
    type: 'folder' as const,
    expanded: true,
    children: [
      { id: '2', name: 'Getting Started', type: 'file' as const },
      { id: '3', name: 'Project Plan', type: 'file' as const },
    ],
  },
  {
    id: '4',
    name: 'Research',
    type: 'folder' as const,
    expanded: false,
    children: [
      { id: '5', name: 'Notes', type: 'file' as const },
    ],
  },
  { id: '6', name: 'README', type: 'file' as const },
];

// Screen 1: Desktop Three-Panel Workspace (Default)
export function DesktopWorkspace() {
  const [selectedFile, setSelectedFile] = useState('Getting Started');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DesktopHeader
        logo="C"
        appName="Centrid"
        activeTab="documents"
        userInitials="DG"
      />

      {/* Three-panel layout */}
      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        {/* Top Search Bar (Collapsible) */}
        {searchOpen && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <div className="flex items-center gap-2 max-w-4xl mx-auto">
              <SearchIcon className="h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search across all documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-9"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: File Tree (20%) */}
          <div className="w-1/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Files</h2>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <SearchIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Search</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New File</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <FolderPlusIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New Folder</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <UploadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload Files</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {fileTreeData.map((node) => (
                  <FileTreeNode
                    key={node.id}
                    node={node}
                    selectedFile={selectedFile}
                    onSelect={setSelectedFile}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Center Panel: Editor (50%) */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{selectedFile}</h2>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {saveStatus === 'saved' && (
                  <>
                    <CloudIcon className="h-4 w-4 text-success-500" />
                    <CheckIcon className="h-3 w-3 text-success-500" />
                    <span>Saved</span>
                  </>
                )}
                {saveStatus === 'saving' && (
                  <>
                    <CloudIcon className="h-4 w-4 text-gray-400 animate-pulse" />
                    <span>Saving...</span>
                  </>
                )}
              </div>
            </div>

            {/* Markdown Editor Component */}
            <MarkdownEditor
              content={`# Getting Started with Centrid

Welcome to Centrid! This is your persistent knowledge base powered by AI.

## Features

- Hierarchical file organization
- Markdown editing with auto-save
- AI-powered context management`}
              showToolbar={true}
            />
          </div>

          {/* Right Panel: AI Chat (30%) */}
          <div className="w-[30%] bg-white dark:bg-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 flex-shrink-0">
              <MessageSquareIcon className="h-5 w-5 text-primary-600" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hello! I can help you with your documents. Try asking me about your notes or request analysis.
                  </p>
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              <Input
                placeholder="Ask about your documents..."
                className="w-full h-11"
              />
            </div>
          </div>
        </div>
      </div>

      {/* State controls for design review */}
      <StateControls
        status={saveStatus}
        onStatusChange={setSaveStatus}
      />
    </div>
  );
}

// Screen 2: Mobile Single-Panel (Document View)
export function MobileDocumentView() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [activeView, setActiveView] = useState<'document' | 'chat'>('document');
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      onClick: () => console.log('Navigate to Dashboard'),
    },
    {
      label: 'Documents',
      icon: <FileTextIcon className="h-5 w-5" />,
      onClick: () => console.log('Navigate to Documents'),
    },
    {
      label: 'Profile',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => console.log('Navigate to Profile'),
    },
    {
      label: 'Settings',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => console.log('Navigate to Settings'),
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      {/* Application Header */}
      <MobileHeader
        logo="C"
        appName="Centrid"
        onMenuClick={() => setMenuOpen(!menuOpen)}
      />

      {/* Mobile Menu */}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userInitials="DG"
        userName="Daniel G."
        userEmail="daniel@example.com"
        items={menuItems}
      />


      {/* Document Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Getting Started</h1>
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
          content={`# Getting Started

Welcome to Centrid!`}
          showToolbar={true}
          touchOptimized={true}
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
            onClick={() => setActiveView('chat')}
          >
            <MessageSquareIcon className="h-5 w-5" />
            <span className="text-xs">Chat</span>
          </button>
        </div>
      </div>

      <StateControls status={saveStatus} onStatusChange={setSaveStatus} />
    </div>
  );
}

// Screen 3: Mobile Single-Panel (Chat View)
export function MobileChatView() {
  const [activeView, setActiveView] = useState<'document' | 'chat'>('chat');
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    {
      label: 'Dashboard',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      onClick: () => console.log('Navigate to Dashboard'),
    },
    {
      label: 'Documents',
      icon: <FileTextIcon className="h-5 w-5" />,
      onClick: () => console.log('Navigate to Documents'),
    },
    {
      label: 'Profile',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      onClick: () => console.log('Navigate to Profile'),
    },
    {
      label: 'Settings',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => console.log('Navigate to Settings'),
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      {/* Application Header */}
      <MobileHeader
        logo="C"
        appName="Centrid"
        onMenuClick={() => setMenuOpen(!menuOpen)}
      />

      {/* Mobile Menu */}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        userInitials="DG"
        userName="Daniel G."
        userEmail="daniel@example.com"
        items={menuItems}
      />


      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center bg-gray-50 dark:bg-gray-900">
        <MessageSquareIcon className="h-5 w-5 text-primary-600 mr-2" />
        <h1 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
      </div>

      {/* Chat messages */}
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-4 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hello! I can help you with your documents. Try asking me about your notes or request analysis.
            </p>
          </div>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 ml-8">
            <p className="text-sm text-gray-900 dark:text-white">
              Can you summarize my Getting Started document?
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your Getting Started document introduces Centrid's core features including hierarchical file organization, markdown editing with auto-save, and AI-powered context management.
            </p>
          </div>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <Input
          placeholder="Ask about your documents..."
          className="w-full h-11"
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
            onClick={() => setActiveView('chat')}
          >
            <MessageSquareIcon className="h-5 w-5" />
            <span className="text-xs">Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Screen 4: File Upload Interface - Inline Progress with Modal
export function FileUploadInterface() {
  const [uploadProgress, setUploadProgress] = useState(65);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('root');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Application Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Centrid</span>
            </div>
            <nav className="flex items-center gap-1">
              <Button variant="ghost" className="h-9 px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Dashboard
              </Button>
              <Button variant="ghost" className="h-9 px-3 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                Documents
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="h-9 w-9">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </Button>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 py-1">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">DG</span>
              </div>
              <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-3.5rem)] flex-col">
        <div className="flex flex-1">
          {/* File Tree */}
          <div className="w-1/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Files</h2>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New File</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setShowUploadDialog(true)}
                      >
                        <UploadIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Upload Files</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-60px)]">
              <div className="p-2 space-y-2">
                {fileTreeData.map((node) => (
                  <FileTreeNode
                    key={node.id}
                    node={node}
                    selectedFile=""
                    onSelect={() => {}}
                  />
                ))}

                {/* Inline upload progress indicators */}
                <div className="space-y-2 mt-4 px-2">
                  <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    <FileTextIcon className="h-4 w-4 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 dark:text-white truncate">Project-Plan</p>
                      <Progress value={uploadProgress} className="h-1 mt-1" />
                    </div>
                    <span className="text-xs text-gray-500">{uploadProgress}%</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-success-50 dark:bg-success-900/20 rounded">
                    <CheckIcon className="h-4 w-4 text-success-600" />
                    <p className="text-xs text-gray-900 dark:text-white flex-1 truncate">README</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 bg-white dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center max-w-md">
              <UploadIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Upload Files
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Upload progress shows in the file tree. Click Upload button to select folder and files.
              </p>
              <Button onClick={() => setShowUploadDialog(true)}>
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>

        {/* Upload Dialog with Folder Selection */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>
                Choose a folder and select files to upload
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                  Select Folder
                </label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                >
                  <option value="root">Root</option>
                  <option value="projects">Projects</option>
                  <option value="research">Research</option>
                </select>
              </div>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 transition-colors cursor-pointer">
                <UploadIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Drop files or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  .md and .txt files up to 10MB
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowUploadDialog(false)}>
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <StateControls
        status="saved"
        onStatusChange={() => {}}
        uploadProgress={uploadProgress}
        onUploadProgressChange={setUploadProgress}
      />
    </div>
  );
}

// Screen 5: Empty State - No Documents
export function EmptyStateNoDocuments() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DesktopHeader
        logo="C"
        appName="Centrid"
        activeTab="documents"
        userInitials="DG"
      />

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* File tree with empty state */}
        <div className="w-1/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Files</h2>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New File</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <FolderPlusIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>New Folder</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <UploadIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Upload Files</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="p-8 text-center">
            <FolderIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">No documents yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Create your first document or folder to organize your knowledge
            </p>
            <Button size="sm" className="w-full mb-2">
              <PlusIcon className="h-4 w-4 mr-2" />
              New Document
            </Button>
            <Button size="sm" variant="outline" className="w-full mb-2">
              <FolderPlusIcon className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <Button size="sm" variant="outline" className="w-full">
              <UploadIcon className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>

        {/* Editor with empty state */}
        <div className="flex-1 bg-white dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center max-w-md">
            <FileTextIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No document open
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Select a document from the file tree or create a new one to get started
            </p>
            <div className="flex flex-col gap-2">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create New Document
              </Button>
              <Button variant="outline">
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-[30%] border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <MessageSquareIcon className="h-5 w-5 text-primary-600" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI Assistant</h2>
          </div>
          <div className="p-8 text-center">
            <MessageSquareIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create documents to start chatting with your AI assistant
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Screen 6: File Tree with Context Menu
export function FileTreeContextMenu() {
  const [showContextMenu, setShowContextMenu] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DesktopHeader
        logo="C"
        appName="Centrid"
        activeTab="documents"
        userInitials="DG"
      />

      <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-800 p-8">
        <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>File Tree - Context Menu</CardTitle>
          <CardDescription>
            Right-click demo showing available file operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer">
              <FolderIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-900 dark:text-white">Projects</span>
            </div>
            <div className="ml-6 space-y-1">
              <DropdownMenu open={showContextMenu} onOpenChange={setShowContextMenu}>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 p-2 rounded bg-gray-50 dark:bg-gray-900 cursor-pointer">
                    <FileTextIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900 dark:text-white">Project Plan</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem>
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Open
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    Move to...
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-error-600">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertDescription className="text-xs">
              Context menu shown automatically for demo. In production, this appears on right-click.
            </AlertDescription>
          </Alert>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Screen 7: Search Results View
export function SearchResultsView() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DesktopHeader
        logo="C"
        appName="Centrid"
        activeTab="documents"
        userInitials="DG"
      />

      <div className="min-h-[calc(100vh-3.5rem)] p-8">
        <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-4">
              <Input
                type="search"
                placeholder="Search documents..."
                defaultValue="project management"
                className="flex-1 h-11"
              />
              <Button>Search</Button>
            </div>
            <CardDescription>
              Found 3 results in 0.2 seconds
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search results */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    <span className="bg-warning-100 dark:bg-warning-900/30">Project</span> Plan
                  </h3>
                </div>
                <Badge variant="outline" className="text-xs">Projects</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                This document outlines our <span className="bg-warning-100 dark:bg-warning-900/30 font-medium">project management</span> approach including milestones, deliverables, and timeline...
              </p>
              <p className="text-xs text-gray-500">Modified 2 hours ago</p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Team Structure</h3>
                </div>
                <Badge variant="outline" className="text-xs">Research</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Our team structure for <span className="bg-warning-100 dark:bg-warning-900/30 font-medium">project management</span> includes roles, responsibilities, and communication channels...
              </p>
              <p className="text-xs text-gray-500">Modified 1 day ago</p>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Getting Started</h3>
                </div>
                <Badge variant="outline" className="text-xs">Root</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Welcome to Centrid! This is your persistent knowledge base powered by AI. Features include hierarchical file organization, markdown editing with auto-save, and AI-powered context <span className="bg-warning-100 dark:bg-warning-900/30 font-medium">management</span>...
              </p>
              <p className="text-xs text-gray-500">Modified 3 days ago</p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}

// Helper Components

interface FileTreeNodeProps {
  node: {
    id: string;
    name: string;
    type: 'folder' | 'file';
    expanded?: boolean;
    children?: any[];
  };
  selectedFile: string;
  onSelect: (name: string) => void;
  level?: number;
}

function FileTreeNode({ node, selectedFile, onSelect, level = 0 }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(node.expanded ?? false);
  const isFolder = node.type === 'folder';
  const isSelected = node.name === selectedFile;

  return (
    <div>
      <div
        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all duration-150 ease-in group ${
          isSelected
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 scale-[1.02]'
            : 'hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-white scale-100'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            setExpanded(!expanded);
          } else {
            onSelect(node.name);
          }
        }}
      >
        {isFolder && (
          <ChevronRightIcon
            className={`h-4 w-4 transition-transform ${
              expanded ? 'rotate-90' : ''
            } ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}
          />
        )}
        {isFolder ? (
          <FolderIcon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`} />
        ) : (
          <FileTextIcon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500'}`} />
        )}
        <span className="text-sm truncate">{node.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 ml-auto opacity-0 group-hover:opacity-100"
            >
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-error-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isFolder && expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              selectedFile={selectedFile}
              onSelect={onSelect}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface StateControlsProps {
  status: 'saved' | 'saving' | 'error';
  onStatusChange: (status: 'saved' | 'saving' | 'error') => void;
  uploadProgress?: number;
  onUploadProgressChange?: (progress: number) => void;
}

function StateControls({ status, onStatusChange, uploadProgress, onUploadProgressChange }: StateControlsProps) {
  return (
    <div className="fixed bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px]">
      <p className="text-xs font-semibold mb-3 text-gray-700 dark:text-gray-300">Design Controls</p>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Save Status</p>
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange('saved')}
              className={`px-2 py-1 text-xs rounded ${
                status === 'saved' ? 'bg-success-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Saved
            </button>
            <button
              onClick={() => onStatusChange('saving')}
              className={`px-2 py-1 text-xs rounded ${
                status === 'saving' ? 'bg-warning-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Saving
            </button>
            <button
              onClick={() => onStatusChange('error')}
              className={`px-2 py-1 text-xs rounded ${
                status === 'error' ? 'bg-error-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Error
            </button>
          </div>
        </div>
        {uploadProgress !== undefined && onUploadProgressChange && (
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Upload Progress</p>
            <input
              type="range"
              min="0"
              max="100"
              value={uploadProgress}
              onChange={(e) => onUploadProgressChange(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-center text-gray-500 mt-1">{uploadProgress}%</p>
          </div>
        )}
      </div>
    </div>
  );
}
