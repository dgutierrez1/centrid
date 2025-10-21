// Centrid AI Filesystem - Search Interface Component
// Version: 3.1 - Supabase Plus MVP Architecture
// Pure presentational component - no logic or integrations

import { 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface SearchResult {
  filename?: string;
  content?: string;
  highlight?: string;
  type: string;
  sectionTitle?: string;
}

interface SearchInterfaceProps {
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  showFilters: boolean;
  searchType: 'documents' | 'chunks' | 'both';
  onSearchQueryChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onToggleFilters: () => void;
  onSearchTypeChange: (type: 'documents' | 'chunks' | 'both') => void;
  onResultClick?: (result: SearchResult, index: number) => void;
}

export default function SearchInterface({
  searchQuery,
  searchResults,
  isSearching,
  showFilters,
  searchType,
  onSearchQueryChange,
  onSearchSubmit,
  onToggleFilters,
  onSearchTypeChange,
  onResultClick,
}: SearchInterfaceProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Search
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Search across all your documents and content
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={onSearchSubmit} className="space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search your documents..."
                className="input-field pl-10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="search-both"
                    name="searchType"
                    value="both"
                    checked={searchType === 'both'}
                    onChange={(e) => onSearchTypeChange(e.target.value as any)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="search-both" className="text-sm text-gray-700 dark:text-gray-300">
                    All
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="search-documents"
                    name="searchType"
                    value="documents"
                    checked={searchType === 'documents'}
                    onChange={(e) => onSearchTypeChange(e.target.value as any)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="search-documents" className="text-sm text-gray-700 dark:text-gray-300">
                    Documents
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="search-chunks"
                    name="searchType"
                    value="chunks"
                    checked={searchType === 'chunks'}
                    onChange={(e) => onSearchTypeChange(e.target.value as any)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <label htmlFor="search-chunks" className="text-sm text-gray-700 dark:text-gray-300">
                    Sections
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onToggleFilters}
                  className="btn-ghost"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
                  Filters
                </button>
                
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="btn-primary"
                >
                  {isSearching ? (
                    <LoadingSpinner size="small" color="white" className="mr-2" />
                  ) : (
                    <MagnifyingGlassIcon className="w-4 h-4 mr-2" />
                  )}
                  Search
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      File Type
                    </label>
                    <select className="input-field">
                      <option value="">All types</option>
                      <option value="markdown">Markdown</option>
                      <option value="text">Text</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date Range
                    </label>
                    <select className="input-field">
                      <option value="">Any time</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sort by
                    </label>
                    <select className="input-field">
                      <option value="relevance">Relevance</option>
                      <option value="date">Date modified</option>
                      <option value="name">Name</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Search Results */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Search Results
          </h2>
        </div>
        <div className="card-body">
          {isSearching ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="large" />
            </div>
          ) : searchResults.length === 0 && searchQuery ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No results found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Try adjusting your search terms or filters.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Search your documents
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter a search query to find content across all your documents.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => onResultClick?.(result, index)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer dark:border-gray-700 dark:hover:border-gray-600"
                >
                  <div className="flex items-start space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.filename || 'Untitled'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {result.highlight || result.content?.slice(0, 200) + '...'}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="badge badge-gray">
                          {result.type}
                        </span>
                        {result.sectionTitle && (
                          <span className="badge badge-primary">
                            {result.sectionTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
