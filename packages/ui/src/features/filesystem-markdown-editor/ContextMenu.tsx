/**
 * Context Menu Component
 * Demo component showing file tree context menu
 */

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  DesktopHeader,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Alert,
  AlertDescription,
} from '@centrid/ui/components';
import {
  FolderIcon,
  FileTextIcon,
} from './icons';

export interface ContextMenuProps {
  logo?: string;
  appName?: string;
  userInitials?: string;
}

export function ContextMenu({
  logo = 'C',
  appName = 'Centrid',
  userInitials = 'DG',
}: ContextMenuProps) {
  const [showContextMenu, setShowContextMenu] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DesktopHeader
        logo={logo}
        appName={appName}
        activeTab="documents"
        userInitials={userInitials}
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
