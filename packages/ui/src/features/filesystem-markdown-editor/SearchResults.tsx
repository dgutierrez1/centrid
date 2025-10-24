/**
 * Search Results Component
 * Displays search results with highlighted matches
 */

import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  DesktopHeader,
  Input,
  Button,
  Badge,
} from '@centrid/ui/components';
import {
  FileTextIcon,
} from './icons';

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  folder: string;
  modifiedAt: string;
  highlights?: { text: string; isHighlighted: boolean }[];
}

export interface SearchResultsProps {
  query?: string;
  results?: SearchResult[];
  totalResults?: number;
  searchTime?: number;
  onSearch?: (query: string) => void;
  onSelectResult?: (result: SearchResult) => void;
  logo?: string;
  appName?: string;
  userInitials?: string;
}

export function SearchResults({
  query = '',
  results = [],
  totalResults = 0,
  searchTime = 0,
  onSearch,
  onSelectResult,
  logo = 'C',
  appName = 'Centrid',
  userInitials = 'DG',
}: SearchResultsProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DesktopHeader
        logo={logo}
        appName={appName}
        activeTab="documents"
        userInitials={userInitials}
      />

      <div className="min-h-[calc(100vh-3.5rem)] p-8">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-4">
                <Input
                  type="search"
                  placeholder="Search documents..."
                  defaultValue={query}
                  className="flex-1 h-11"
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && onSearch) {
                      onSearch((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <Button onClick={() => onSearch?.(query)}>Search</Button>
              </div>
              <CardDescription>
                Found {totalResults} results in {searchTime} seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                  onClick={() => onSelectResult?.(result)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4 text-gray-500" />
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {result.highlights ? (
                          result.highlights.map((part, i) =>
                            part.isHighlighted ? (
                              <span key={i} className="bg-warning-100 dark:bg-warning-900/30">
                                {part.text}
                              </span>
                            ) : (
                              <span key={i}>{part.text}</span>
                            )
                          )
                        ) : (
                          result.title
                        )}
                      </h3>
                    </div>
                    <Badge variant="outline" className="text-xs">{result.folder}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {result.excerpt}
                  </p>
                  <p className="text-xs text-gray-500">{result.modifiedAt}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
