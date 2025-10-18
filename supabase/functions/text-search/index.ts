// Centrid AI Filesystem - Text Search Edge Function
// Version: 3.1 - Supabase Plus MVP Architecture

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query: string;
  userId: string;
  searchType?: "documents" | "chunks" | "both";
  fileTypes?: string[];
  limit?: number;
  offset?: number;
}

interface SearchResult {
  id: string;
  type: "document" | "chunk";
  filename?: string;
  content: string;
  sectionTitle?: string;
  relevanceScore: number;
  metadata?: any;
  highlight?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const searchRequest: SearchRequest = await req.json();

    if (!searchRequest.query || !searchRequest.userId) {
      return new Response(
        JSON.stringify({ error: "Query and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      query,
      userId,
      searchType = "both",
      fileTypes = [],
      limit = 20,
      offset = 0,
    } = searchRequest;

    // Sanitize and prepare search query
    const searchQuery = sanitizeSearchQuery(query);
    const results: SearchResult[] = [];

    // Log usage event
    await supabase.from("usage_events").insert({
      user_id: userId,
      event_type: "text_search",
      metadata: {
        query: query.slice(0, 100), // Limit stored query length
        search_type: searchType,
        file_types: fileTypes,
      },
    });

    // Search documents if requested
    if (searchType === "documents" || searchType === "both") {
      const documentResults = await searchDocuments(
        supabase,
        userId,
        searchQuery,
        fileTypes,
        Math.ceil(limit / (searchType === "both" ? 2 : 1)),
        offset
      );
      results.push(...documentResults);
    }

    // Search chunks if requested
    if (searchType === "chunks" || searchType === "both") {
      const chunkResults = await searchChunks(
        supabase,
        userId,
        searchQuery,
        fileTypes,
        Math.ceil(limit / (searchType === "both" ? 2 : 1)),
        searchType === "both" ? Math.ceil(offset / 2) : offset
      );
      results.push(...chunkResults);
    }

    // Sort results by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply final limit
    const finalResults = results.slice(0, limit);

    return new Response(
      JSON.stringify({
        success: true,
        query,
        results: finalResults,
        totalResults: finalResults.length,
        searchType,
        executionTime: Date.now(), // Simple timing
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Text search error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper functions

function sanitizeSearchQuery(query: string): string {
  // Remove special characters that might interfere with PostgreSQL full-text search
  return query
    .replace(/[^\w\s-]/g, " ") // Remove special chars except hyphens
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .split(" ")
    .filter((term) => term.length > 2) // Remove very short terms
    .map((term) => `${term}:*`) // Add prefix matching
    .join(" | "); // OR operator for terms
}

async function searchDocuments(
  supabase: any,
  userId: string,
  searchQuery: string,
  fileTypes: string[],
  limit: number,
  offset: number
): Promise<SearchResult[]> {
  let query = supabase
    .from("documents")
    .select(
      `
      id,
      filename,
      file_type,
      content_text,
      metadata,
      created_at
    `
    )
    .eq("user_id", userId)
    .eq("processing_status", "completed");

  // Add file type filter if specified
  if (fileTypes.length > 0) {
    query = query.in("file_type", fileTypes);
  }

  // Apply full-text search
  if (searchQuery) {
    query = query.textSearch("search_vector", searchQuery);
  }

  const { data: documents, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Document search error:", error);
    return [];
  }

  return (documents || []).map((doc: any) => ({
    id: doc.id,
    type: "document" as const,
    filename: doc.filename,
    content: doc.content_text || "",
    relevanceScore: calculateDocumentRelevance(doc, searchQuery),
    metadata: doc.metadata,
    highlight: generateHighlight(doc.content_text || "", searchQuery),
  }));
}

async function searchChunks(
  supabase: any,
  userId: string,
  searchQuery: string,
  fileTypes: string[],
  limit: number,
  offset: number
): Promise<SearchResult[]> {
  let query = supabase
    .from("document_chunks")
    .select(
      `
      id,
      content,
      section_title,
      chunk_index,
      metadata,
      documents!inner(
        id,
        filename,
        file_type,
        user_id
      )
    `
    )
    .eq("documents.user_id", userId);

  // Add file type filter if specified
  if (fileTypes.length > 0) {
    query = query.in("documents.file_type", fileTypes);
  }

  // Apply full-text search
  if (searchQuery) {
    query = query.textSearch("search_vector", searchQuery);
  }

  const { data: chunks, error } = await query
    .order("chunk_index")
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Chunk search error:", error);
    return [];
  }

  return (chunks || []).map((chunk: any) => ({
    id: chunk.id,
    type: "chunk" as const,
    filename: chunk.documents.filename,
    content: chunk.content,
    sectionTitle: chunk.section_title,
    relevanceScore: calculateChunkRelevance(chunk, searchQuery),
    metadata: {
      ...chunk.metadata,
      documentId: chunk.documents.id,
      chunkIndex: chunk.chunk_index,
    },
    highlight: generateHighlight(chunk.content, searchQuery),
  }));
}

function calculateDocumentRelevance(
  document: any,
  searchQuery: string
): number {
  // Simple relevance scoring based on multiple factors
  let score = 0;
  const content = (document.content_text || "").toLowerCase();
  const filename = document.filename.toLowerCase();
  const queryTerms = searchQuery
    .replace(/:|\*/g, "")
    .split(" | ")
    .filter(Boolean);

  // Filename matches get higher score
  queryTerms.forEach((term) => {
    const cleanTerm = term.toLowerCase();
    if (filename.includes(cleanTerm)) {
      score += 10;
    }

    // Count occurrences in content
    const occurrences = (content.match(new RegExp(cleanTerm, "g")) || [])
      .length;
    score += Math.min(occurrences * 2, 20); // Cap content score
  });

  // Boost recent documents slightly
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(document.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  score += Math.max(0, 30 - daysSinceCreated) * 0.1;

  return Math.round(score * 100) / 100;
}

function calculateChunkRelevance(chunk: any, searchQuery: string): number {
  let score = 0;
  const content = chunk.content.toLowerCase();
  const sectionTitle = (chunk.section_title || "").toLowerCase();
  const filename = chunk.documents.filename.toLowerCase();
  const queryTerms = searchQuery
    .replace(/:|\*/g, "")
    .split(" | ")
    .filter(Boolean);

  queryTerms.forEach((term) => {
    const cleanTerm = term.toLowerCase();

    // Section title matches get highest score
    if (sectionTitle.includes(cleanTerm)) {
      score += 15;
    }

    // Filename matches
    if (filename.includes(cleanTerm)) {
      score += 8;
    }

    // Count occurrences in chunk content
    const occurrences = (content.match(new RegExp(cleanTerm, "g")) || [])
      .length;
    score += Math.min(occurrences * 3, 25); // Higher weight for chunk matches
  });

  // Shorter chunks with matches are more relevant
  const contentLength = content.length;
  if (contentLength < 500 && score > 0) {
    score *= 1.2;
  }

  return Math.round(score * 100) / 100;
}

function generateHighlight(content: string, searchQuery: string): string {
  const queryTerms = searchQuery
    .replace(/:|\*/g, "")
    .split(" | ")
    .filter(Boolean);
  let highlight = content.slice(0, 300); // Start with first 300 chars

  // Find the first occurrence of any query term
  let firstMatchPos = content.length;
  queryTerms.forEach((term) => {
    const cleanTerm = term.toLowerCase();
    const pos = content.toLowerCase().indexOf(cleanTerm);
    if (pos !== -1 && pos < firstMatchPos) {
      firstMatchPos = pos;
    }
  });

  // If we found a match, center the highlight around it
  if (firstMatchPos < content.length) {
    const start = Math.max(0, firstMatchPos - 150);
    const end = Math.min(content.length, firstMatchPos + 150);
    highlight = content.slice(start, end);

    if (start > 0) highlight = "..." + highlight;
    if (end < content.length) highlight = highlight + "...";
  }

  return highlight;
}

/* To deploy this function, run:
 * supabase functions deploy text-search --no-verify-jwt
 */
