/**
 * SearchModal - Spotlight-style search modal
 *
 * Keyboard shortcut-driven modal overlay for fuzzy file search.
 * Similar to VS Code Cmd+P, Notion Cmd+K, or macOS Spotlight.
 *
 * Features:
 * - Cmd+K / Ctrl+K to open
 * - ESC to close
 * - Focus trap in search input
 * - Fuzzy search results with file preview
 * - Recent files section
 */

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Search, FileText, Folder, Clock } from 'lucide-react';
import { Dialog, DialogContent } from '@centrid/ui/components/dialog';
import { Input } from '@centrid/ui/components/input';
import { cn } from '@/lib/utils/cn';

export interface SearchResult {
  id: string;
  name: string;
  type: 'document' | 'folder';
  path: string;
  modified?: Date;
}

export interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectResult: (resultId: string) => void;
  recentFiles?: SearchResult[];
  searchFn: (query: string) => Promise<SearchResult[]>;
}

export function SearchModal({
  open,
  onOpenChange,
  onSelectResult,
  recentFiles = [],
  searchFn,
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const searchResults = await searchFn(query);
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(performSearch, 200);
    return () => clearTimeout(timeoutId);
  }, [query, searchFn]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const displayedResults = query.trim() ? results : recentFiles;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < displayedResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && displayedResults[selectedIndex]) {
      e.preventDefault();
      handleSelectResult(displayedResults[selectedIndex].id);
    }
  };

  const handleSelectResult = (resultId: string) => {
    onSelectResult(resultId);
    onOpenChange(false);
  };

  const displayedResults = query.trim() ? results : recentFiles;
  const showRecent = !query.trim() && recentFiles.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 gap-0 overflow-hidden"
        aria-labelledby="search-modal-title"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search files and folders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-auto py-1"
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto">
          {showRecent && (
            <div className="px-2 py-2">
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 font-medium">
                <Clock className="w-3.5 h-3.5" />
                Recent Files
              </div>
              {recentFiles.map((result, index) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  selected={index === selectedIndex}
                  onSelect={() => handleSelectResult(result.id)}
                />
              ))}
            </div>
          )}

          {query.trim() && results.length > 0 && (
            <div className="px-2 py-2">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium">
                {results.length} {results.length === 1 ? 'result' : 'results'}
              </div>
              {results.map((result, index) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  selected={index === selectedIndex}
                  onSelect={() => handleSelectResult(result.id)}
                />
              ))}
            </div>
          )}

          {query.trim() && !loading && results.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No files found matching &quot;{query}&quot;</p>
            </div>
          )}

          {!query.trim() && recentFiles.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Start typing to search files and folders</p>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px]">↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px]">↵</kbd>
              <span>Open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border text-[10px]">ESC</kbd>
              <span>Close</span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SearchResultItemProps {
  result: SearchResult;
  selected: boolean;
  onSelect: () => void;
}

function SearchResultItem({ result, selected, onSelect }: SearchResultItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors',
        selected ? 'bg-primary-50 text-primary-900' : 'hover:bg-gray-100'
      )}
    >
      {/* Icon */}
      {result.type === 'document' ? (
        <FileText className={cn('w-4 h-4 flex-shrink-0', selected ? 'text-primary-600' : 'text-gray-400')} />
      ) : (
        <Folder className={cn('w-4 h-4 flex-shrink-0', selected ? 'text-primary-600' : 'text-gray-400')} />
      )}

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <div className={cn('text-sm font-medium truncate', selected ? 'text-primary-900' : 'text-gray-900')}>
          {result.name}
        </div>
        <div className={cn('text-xs truncate', selected ? 'text-primary-700' : 'text-gray-500')}>
          {result.path}
        </div>
      </div>

      {/* Modified Date */}
      {result.modified && (
        <div className={cn('text-xs flex-shrink-0', selected ? 'text-primary-700' : 'text-gray-400')}>
          {formatRelativeTime(result.modified)}
        </div>
      )}
    </button>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
