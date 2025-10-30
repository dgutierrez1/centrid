/**
 * Search Service
 * Handles semantic search across user's files and shadow domain
 * ✅ STATELESS - All methods are static utility functions
 */

import { fileRepository } from '../repositories/file.ts';

export class SearchService {
  /**
   * Semantic search across files
   * 
   * @param userId - User ID performing the search
   * @param query - Search query string
   * @param options - Search options (limit, file types, etc)
   * @returns Array of search results with relevance scores
   * 
   * TODO Phase 2 (Post-MVP):
   * - Implement vector search using shadow_domain table
   * - Add OpenAI embeddings for semantic similarity
   * - Apply relationship modifiers (sibling, parent/child)
   * - Apply temporal decay for recency
   * - Support hybrid search (vector + keyword)
   */
  static async search(
    userId: string,
    query: string,
    options?: {
      limit?: number;
      fileTypes?: string[];
      entityTypes?: Array<'file' | 'thread' | 'concept'>;
    }
  ): Promise<Array<{
    id: string;
    path: string;
    excerpt: string;
    relevance: number;
    entityType: 'file' | 'thread' | 'concept';
  }>> {
    // MVP Implementation: Basic text search on files
    // Full semantic search deferred to Phase 2
    
    const limit = options?.limit || 10;
    const files = await fileRepository.findByUserId(userId);
    
    // Simple case-insensitive text matching
    const lowerQuery = query.toLowerCase();
    const results = files
      .filter(f => {
        // Filter by file type if specified
        if (options?.fileTypes && options.fileTypes.length > 0) {
          const fileExt = f.path.split('.').pop()?.toLowerCase() || '';
          if (!options.fileTypes.includes(fileExt)) {
            return false;
          }
        }
        
        // Match query in path or content
        return (
          f.path.toLowerCase().includes(lowerQuery) ||
          f.content.toLowerCase().includes(lowerQuery)
        );
      })
      .slice(0, limit)
      .map(f => ({
        id: f.id,
        path: f.path,
        excerpt: extractExcerpt(f.content, query),
        relevance: calculateBasicRelevance(f, query),
        entityType: 'file' as const,
      }))
      .sort((a, b) => b.relevance - a.relevance); // Sort by relevance
    
    return results;
  }
}

/**
 * Extract excerpt from content around the search query
 * Shows context before and after the match
 */
function extractExcerpt(content: string, query: string, contextLength = 100): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerContent.indexOf(lowerQuery);
  
  if (index === -1) {
    // Query not in content (matched in path), return start
    return content.substring(0, contextLength * 2) + (content.length > contextLength * 2 ? '...' : '');
  }
  
  // Extract context around the match
  const start = Math.max(0, index - contextLength);
  const end = Math.min(content.length, index + query.length + contextLength);
  
  let excerpt = content.substring(start, end);
  
  // Add ellipsis if truncated
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';
  
  return excerpt;
}

/**
 * Calculate basic relevance score (0-1)
 * TODO: Replace with vector similarity in Phase 2
 */
function calculateBasicRelevance(file: any, query: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerPath = file.path.toLowerCase();
  const lowerContent = file.content.toLowerCase();
  
  let score = 0;
  
  // Path exact match: 0.3
  if (lowerPath === lowerQuery) score += 0.3;
  // Path contains: 0.15
  else if (lowerPath.includes(lowerQuery)) score += 0.15;
  
  // Count occurrences in content (max 0.5)
  const occurrences = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;
  score += Math.min(0.5, occurrences * 0.1);
  
  // Bonus for matches in file name (not full path)
  const fileName = lowerPath.split('/').pop() || '';
  if (fileName.includes(lowerQuery)) score += 0.2;
  
  return Math.min(1, score); // Cap at 1.0
}
