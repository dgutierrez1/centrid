import * as React from 'react';
import { cn } from '../lib/utils';
import { Icons } from './icon';
import { Input } from './input';
import { ScrollArea } from './scroll-area';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder' | 'thread';
  icon?: React.ReactNode;
  branchName?: string;
  branchId?: string;
  relevanceScore?: number;
  lastModified?: string;
}

export interface FileAutocompleteProps {
  /** Array of file/folder items to search */
  items: FileItem[];
  /** Search query */
  query: string;
  /** Callback when query changes */
  onQueryChange: (query: string) => void;
  /** Callback when user selects an item */
  onSelect: (item: FileItem) => void;
  /** Callback when user closes autocomplete */
  onClose: () => void;
  /** Whether autocomplete is open */
  open: boolean;
  /** Optional placeholder text */
  placeholder?: string;
  /** Optional className for container */
  className?: string;
}

export const FileAutocomplete = React.forwardRef<HTMLDivElement, FileAutocompleteProps>(
  (
    {
      items,
      query,
      onQueryChange,
      onSelect,
      onClose,
      open,
      placeholder = 'Search files and folders...',
      className,
    },
    ref
  ) => {
    const [selectedIndex, setSelectedIndex] = React.useState(0);

    // Filter items based on query
    const filteredItems = React.useMemo(() => {
      if (!query) return items.slice(0, 8); // Show first 8 items if no query

      const lowerQuery = query.toLowerCase();
      return items
        .filter(
          (item) =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.path.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 8); // Limit to 8 results
    }, [items, query]);

    // Reset selected index when filtered items change
    React.useEffect(() => {
      setSelectedIndex(0);
    }, [filteredItems]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            onSelect(filteredItems[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    const getFileIcon = (item: FileItem) => {
      if (item.icon) return item.icon;

      if (item.type === 'folder') {
        return <Icons.folder className="h-4 w-4 text-gray-500" />;
      }

      // Determine file icon based on extension
      const ext = item.name.split('.').pop()?.toLowerCase();
      if (ext === 'md' || ext === 'markdown') {
        return <Icons.fileText className="h-4 w-4 text-primary-500" />;
      }
      return <Icons.file className="h-4 w-4 text-gray-500" />;
    };

    if (!open) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-80',
          className
        )}
        onKeyDown={handleKeyDown}
      >
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="h-9"
            autoFocus
          />
        </div>
        <ScrollArea className="h-full max-h-64">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No files found
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2 py-1.5">
                Files & Folders
              </div>
              {filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    index === selectedIndex && 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  {getFileIcon(item)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.path}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }
);
FileAutocomplete.displayName = 'FileAutocomplete';
