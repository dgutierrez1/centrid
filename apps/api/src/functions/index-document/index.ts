/**
 * Index Document Edge Function
 *
 * Background job to chunk document content and generate embeddings
 * Triggered by database trigger or manual API call
 *
 * Flow:
 * 1. Fetch document from database
 * 2. Update status to 'in_progress'
 * 3. Chunk content into 400-500 token segments
 * 4. Generate embeddings for each chunk (OpenAI)
 * 5. Delete old chunks (if re-indexing)
 * 6. Insert new chunks with embeddings
 * 7. Update status to 'completed' or 'failed'
 * 8. Retry up to 3 times with exponential backoff on failure
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { chunkDocument, getChunkStats } from '../../services/document-processor.ts';
import { generateEmbeddingsBatch } from '../../services/indexing.ts';

// ============================================================================
// Types
// ============================================================================

interface IndexDocumentRequest {
  document_id: string;
  retry_count?: number;
}

interface IndexDocumentResponse {
  success: boolean;
  document_id: string;
  chunks_created: number;
  indexing_status: 'completed' | 'failed';
  error?: string;
  chunk_stats?: {
    count: number;
    avgTokens: number;
    minTokens: number;
    maxTokens: number;
  };
}

// ============================================================================
// Constants
// ============================================================================

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// ============================================================================
// Supabase Admin Client (SERVICE_ROLE_KEY for backend operations)
// ============================================================================

function createAdminClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// Main Handler
// ============================================================================

Deno.serve(async (req) => {
  // CORS headers for pre-flight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    // Parse request body
    const body: IndexDocumentRequest = await req.json();
    const { document_id, retry_count = 0 } = body;

    if (!document_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'document_id is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[index-document] Starting indexing for document ${document_id} (retry ${retry_count})`);

    // Index the document with retry logic
    const result = await indexDocumentWithRetry(document_id, retry_count);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[index-document] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

// ============================================================================
// Indexing Logic with Retry
// ============================================================================

async function indexDocumentWithRetry(
  documentId: string,
  retryCount: number
): Promise<IndexDocumentResponse> {
  try {
    const result = await indexDocument(documentId);
    return result;
  } catch (error) {
    console.error(`[index-document] Indexing failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);

    // Retry with exponential backoff if under max retries
    if (retryCount < MAX_RETRIES) {
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(`[index-document] Retrying in ${delay}ms...`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return indexDocumentWithRetry(documentId, retryCount + 1);
    }

    // Max retries reached - mark as failed
    const supabase = createAdminClient();
    await supabase
      .from('documents')
      .update({ indexing_status: 'failed' })
      .eq('id', documentId);

    return {
      success: false,
      document_id: documentId,
      chunks_created: 0,
      indexing_status: 'failed',
      error: error instanceof Error ? error.message : 'Indexing failed after max retries',
    };
  }
}

// ============================================================================
// Core Indexing Function
// ============================================================================

async function indexDocument(documentId: string): Promise<IndexDocumentResponse> {
  const supabase = createAdminClient();

  // Step 1: Fetch document
  console.log(`[index-document] Fetching document ${documentId}`);

  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('id, name, content_text, user_id')
    .eq('id', documentId)
    .single();

  if (fetchError || !document) {
    throw new Error(`Failed to fetch document: ${fetchError?.message || 'Document not found'}`);
  }

  if (!document.content_text || document.content_text.trim().length === 0) {
    console.log(`[index-document] Document ${documentId} has no content - skipping indexing`);

    await supabase
      .from('documents')
      .update({ indexing_status: 'completed' })
      .eq('id', documentId);

    return {
      success: true,
      document_id: documentId,
      chunks_created: 0,
      indexing_status: 'completed',
    };
  }

  // Step 2: Update status to 'in_progress'
  console.log(`[index-document] Updating status to in_progress`);

  await supabase
    .from('documents')
    .update({ indexing_status: 'in_progress' })
    .eq('id', documentId);

  // Step 3: Chunk the document
  console.log(`[index-document] Chunking document content`);

  const chunks = chunkDocument(document.content_text);
  const stats = getChunkStats(chunks);

  console.log(`[index-document] Created ${chunks.length} chunks:`, stats);

  if (chunks.length === 0) {
    await supabase
      .from('documents')
      .update({ indexing_status: 'completed' })
      .eq('id', documentId);

    return {
      success: true,
      document_id: documentId,
      chunks_created: 0,
      indexing_status: 'completed',
    };
  }

  // Step 4: Generate embeddings
  console.log(`[index-document] Generating embeddings for ${chunks.length} chunks`);

  const embeddings = await generateEmbeddingsBatch(chunks);

  if (embeddings.length !== chunks.length) {
    throw new Error(
      `Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`
    );
  }

  // Step 5: Delete old chunks (if re-indexing)
  console.log(`[index-document] Deleting old chunks`);

  const { error: deleteError } = await supabase
    .from('document_chunks')
    .delete()
    .eq('document_id', documentId);

  if (deleteError) {
    console.warn(`[index-document] Failed to delete old chunks:`, deleteError);
    // Continue anyway - might be first indexing
  }

  // Step 6: Insert new chunks with embeddings
  console.log(`[index-document] Inserting ${chunks.length} new chunks`);

  const chunksToInsert = chunks.map((content, index) => ({
    document_id: documentId,
    content,
    position: index,
    embedding: embeddings[index],
  }));

  const { error: insertError } = await supabase
    .from('document_chunks')
    .insert(chunksToInsert);

  if (insertError) {
    throw new Error(`Failed to insert chunks: ${insertError.message}`);
  }

  // Step 7: Update status to 'completed'
  console.log(`[index-document] Updating status to completed`);

  await supabase
    .from('documents')
    .update({ indexing_status: 'completed' })
    .eq('id', documentId);

  console.log(`[index-document] Successfully indexed document ${documentId}`);

  return {
    success: true,
    document_id: documentId,
    chunks_created: chunks.length,
    indexing_status: 'completed',
    chunk_stats: stats,
  };
}
