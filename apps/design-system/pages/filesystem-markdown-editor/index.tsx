import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@centrid/ui/components';

export default function FilesystemMarkdownEditorIndex() {
  const screens = [
    { name: '1. Desktop Three-Panel Workspace', href: '/filesystem-markdown-editor/desktop-workspace', description: 'Default desktop view with file tree (20%), editor (50%), and chat (30%)' },
    { name: '2. Mobile Document View', href: '/filesystem-markdown-editor/mobile-document', description: 'Mobile single-panel view focused on document editing' },
    { name: '3. Mobile Chat View', href: '/filesystem-markdown-editor/mobile-chat', description: 'Mobile single-panel view focused on AI chat interface' },
    { name: '4. File Upload Interface', href: '/filesystem-markdown-editor/file-upload', description: 'Document upload with drag-and-drop and progress indicators' },
    { name: '5. Empty State - No Documents', href: '/filesystem-markdown-editor/empty-state', description: 'First-time user experience with no documents created yet' },
    { name: '6. File Tree Context Menu', href: '/filesystem-markdown-editor/context-menu', description: 'Right-click context menu for file operations' },
    { name: '7. Search Results View', href: '/filesystem-markdown-editor/search-results', description: 'Full-text search results with highlighted matches' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-sm text-primary-600 hover:underline mb-4 inline-block">
            ← Back to Design System
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">File System & Markdown Editor</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete workspace with hierarchical file management, markdown editing, and AI chat integration
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Feature: 003-filesystem-markdown-editor</p>
        </div>

        <div className="grid gap-4">
          {screens.map((screen) => (
            <Link key={screen.href} href={screen.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl">{screen.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {screen.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
