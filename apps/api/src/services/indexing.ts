/**
 * Indexing Service
 *
 * Generates embeddings for document chunks using OpenAI API
 */

import OpenAI from 'openai';

// ============================================================================
// OpenAI Client
// ============================================================================

// Use process.env for TypeScript/Node.js compatibility
const getApiKey = () => {
  return process.env.OPENAI_API_KEY;
};

const openai = new OpenAI({
  apiKey: getApiKey(),
});

// ============================================================================
// Embedding Generation
// ============================================================================

/**
 * Generate embedding for a text chunk using OpenAI text-embedding-3-small
 *
 * @param text - Text content to embed (chunk)
 * @returns 1536-dimensional embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text');
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536, // Fixed dimension for consistency
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI');
    }

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate embeddings for multiple text chunks in batch
 *
 * @param chunks - Array of text chunks
 * @returns Array of embeddings (same order as input)
 */
export async function generateEmbeddingsBatch(chunks: string[]): Promise<number[][]> {
  if (!chunks || chunks.length === 0) {
    return [];
  }

  // Filter out empty chunks
  const validChunks = chunks.filter(c => c.trim().length > 0);

  if (validChunks.length === 0) {
    return [];
  }

  try {
    // OpenAI API supports batch requests (up to 2048 inputs per request)
    const MAX_BATCH_SIZE = 2048;

    if (validChunks.length <= MAX_BATCH_SIZE) {
      // Single batch
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: validChunks,
        dimensions: 1536,
      });

      return response.data.map(item => item.embedding);
    } else {
      // Multiple batches (rare for single document)
      const embeddings: number[][] = [];

      for (let i = 0; i < validChunks.length; i += MAX_BATCH_SIZE) {
        const batch = validChunks.slice(i, i + MAX_BATCH_SIZE);
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
          dimensions: 1536,
        });

        embeddings.push(...response.data.map(item => item.embedding));
      }

      return embeddings;
    }
  } catch (error) {
    console.error('Error generating embeddings batch:', error);
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Estimate cost of embedding generation
 * Pricing: text-embedding-3-small is $0.020 / 1M tokens (as of Jan 2025)
 *
 * @param tokenCount - Estimated token count
 * @returns Cost in USD
 */
export function estimateEmbeddingCost(tokenCount: number): number {
  const COST_PER_MILLION_TOKENS = 0.020;
  return (tokenCount / 1_000_000) * COST_PER_MILLION_TOKENS;
}
