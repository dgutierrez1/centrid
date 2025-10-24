/**
 * Document Processing Service
 *
 * Chunks markdown documents into segments for AI context retrieval
 */

// ============================================================================
// Constants
// ============================================================================

const AVG_CHARS_PER_TOKEN = 4; // Rough estimate: 1 token ≈ 4 characters
const TARGET_TOKEN_MIN = 400;
const TARGET_TOKEN_MAX = 500;
const TARGET_CHARS_MIN = TARGET_TOKEN_MIN * AVG_CHARS_PER_TOKEN; // 1600 chars
const TARGET_CHARS_MAX = TARGET_TOKEN_MAX * AVG_CHARS_PER_TOKEN; // 2000 chars

// ============================================================================
// Chunking Functions
// ============================================================================

/**
 * Chunk markdown document into segments of 400-500 tokens
 * Strategy: Split by paragraphs, combine until target size reached
 *
 * @param content - Markdown text content
 * @returns Array of text chunks (ordered by position)
 */
export function chunkDocument(content: string): string[] {
  if (!content || content.trim().length === 0) {
    return [];
  }

  // Split by double newline (paragraphs)
  const paragraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const tentativeChunk = currentChunk
      ? `${currentChunk}\n\n${paragraph}`
      : paragraph;

    // Check if adding this paragraph would exceed max size
    if (tentativeChunk.length > TARGET_CHARS_MAX && currentChunk.length > 0) {
      // Commit current chunk and start new one
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk = tentativeChunk;
    }

    // If single paragraph exceeds max, split it further
    if (currentChunk.length > TARGET_CHARS_MAX * 2) {
      const subChunks = splitLargeParagraph(currentChunk);
      chunks.push(...subChunks.slice(0, -1)); // Add all but last
      currentChunk = subChunks[subChunks.length - 1]; // Keep last as current
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Split a large paragraph into smaller chunks by sentences
 */
function splitLargeParagraph(paragraph: string): string[] {
  // Split by sentence boundaries (. ! ? followed by space or newline)
  const sentences = paragraph.split(/([.!?])\s+/).filter(s => s.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const tentativeChunk = currentChunk
      ? `${currentChunk} ${sentence}`
      : sentence;

    if (tentativeChunk.length > TARGET_CHARS_MAX && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = tentativeChunk;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Estimate token count from character count
 * Using rough approximation: 1 token ≈ 4 characters
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / AVG_CHARS_PER_TOKEN);
}

/**
 * Validate chunk size (should be within target range)
 */
export function isValidChunkSize(chunk: string): boolean {
  const tokens = estimateTokenCount(chunk);
  return tokens >= TARGET_TOKEN_MIN && tokens <= TARGET_TOKEN_MAX;
}

/**
 * Get chunk statistics for debugging/monitoring
 */
export function getChunkStats(chunks: string[]): {
  count: number;
  avgTokens: number;
  minTokens: number;
  maxTokens: number;
} {
  if (chunks.length === 0) {
    return { count: 0, avgTokens: 0, minTokens: 0, maxTokens: 0 };
  }

  const tokenCounts = chunks.map(estimateTokenCount);
  const sum = tokenCounts.reduce((a, b) => a + b, 0);

  return {
    count: chunks.length,
    avgTokens: Math.round(sum / chunks.length),
    minTokens: Math.min(...tokenCounts),
    maxTokens: Math.max(...tokenCounts),
  };
}
