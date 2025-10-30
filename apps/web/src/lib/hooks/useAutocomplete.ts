import { useState, useEffect, useCallback, useRef } from 'react';
import { useSnapshot } from 'valtio';
import { aiAgentState } from '@/lib/state/aiAgentState';
import { api } from '@/lib/api/client';

interface AutocompleteItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder' | 'thread';
  branchName?: string;
  branchId?: string;
  relevanceScore?: number;
  lastModified?: string;
}

interface UseAutocompleteOptions {
  entityType?: 'all' | 'files' | 'folders' | 'threads';
  minQueryLength?: number;
  debounceMs?: number;
}

export function useAutocomplete(threadId: string, options: UseAutocompleteOptions = {}) {
  const {
    entityType = 'all',
    minQueryLength = 1,
    debounceMs = 300
  } = options;

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debounceRef = useRef<NodeJS.Timeout>();

  const snap = useSnapshot(aiAgentState);

  // Reset search when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < minQueryLength) {
      setItems([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      await searchItems(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, minQueryLength, debounceMs]);

  const searchItems = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    setSelectedIndex(-1);

    try {
      // Call search API with unified client (automatic auth + retry)
      const response = await api.post<{
        data: {
          results: Array<{
            entity_id: string;
            name?: string;
            title?: string;
            path?: string;
            id: string;
            entity_type: 'file' | 'folder' | 'thread';
            branch_name?: string;
            branch_id?: string;
            relevance_score?: number;
            last_modified?: string;
          }>;
        };
      }>('/api/search-shadow-domain', {
        query: searchQuery,
        entityType: entityType === 'all' ? undefined : entityType,
        limit: 10,
      });

      const { data } = response;

      // Transform search results to AutocompleteItem format
      const transformedItems: AutocompleteItem[] = data.results.map((result: any) => ({
        id: result.entity_id,
        name: result.name || result.title || 'Untitled',
        path: result.path || result.id,
        type: result.entity_type,
        branchName: result.branch_name || 'Main',
        branchId: result.branch_id,
        relevanceScore: result.relevance_score,
        lastModified: result.last_modified,
      }));

      setItems(transformedItems);
      setIsOpen(transformedItems.length > 0);
    } catch (error) {
      console.error('Search failed:', error);
      setItems([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);

  const openAutocomplete = useCallback(() => {
    if (items.length > 0) {
      setIsOpen(true);
    }
  }, [items]);

  const closeAutocomplete = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  const selectItem = useCallback((item: AutocompleteItem) => {
    // Return formatted string for insertion into input
    const formattedName = item.type === 'thread'
      ? `Thread: ${item.name} [${item.branchName}]`
      : `${item.name} [${item.branchName}]`;

    return formattedName;
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev =>
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;

      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          const selectedItem = items[selectedIndex];
          closeAutocomplete();
          return selectedItem;
        }
        break;

      case 'Escape':
        event.preventDefault();
        closeAutocomplete();
        break;
    }

    return null;
  }, [isOpen, items, selectedIndex, closeAutocomplete]);

  const insertReference = useCallback((item: AutocompleteItem) => {
    // This will be handled by the calling component
    return selectItem(item);
  }, [selectItem]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    // State
    query,
    isOpen,
    isLoading,
    items,
    selectedIndex,

    // Actions
    setQuery,
    openAutocomplete,
    closeAutocomplete,
    selectItem,
    handleKeyDown,
    insertReference,

    // Computed
    hasResults: items.length > 0,
  };
}