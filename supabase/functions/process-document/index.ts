// Centrid AI Filesystem - Document Processing Edge Function
// Version: 3.1 - Supabase Plus MVP Architecture

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessDocumentRequest {
  documentId: string;
  userId: string;
}

interface DocumentChunk {
  content: string;
  chunkIndex: number;
  sectionTitle?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { documentId, userId }: ProcessDocumentRequest = await req.json();

    if (!documentId || !userId) {
      return new Response(
        JSON.stringify({ error: "Document ID and User ID are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get document from database
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (docError || !document) {
      return new Response(
        JSON.stringify({ error: "Document not found or access denied" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update document status to processing
    await supabase
      .from("documents")
      .update({ processing_status: "processing" })
      .eq("id", documentId);

    try {
      // Download file from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.storage_path);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message}`);
      }

      // Process file based on type
      let contentText = "";
      const chunks: DocumentChunk[] = [];

      switch (document.file_type) {
        case "text":
        case "markdown":
          contentText = await fileData.text();
          break;

        case "pdf":
          // For MVP, we'll add PDF processing later
          throw new Error("PDF processing not implemented in MVP");

        default:
          throw new Error(`Unsupported file type: ${document.file_type}`);
      }

      // Simple chunking strategy for MVP (split by paragraphs/sections)
      const chunkContent = chunkText(contentText, document.file_type);

      // Generate chunks
      chunkContent.forEach((chunk, index) => {
        chunks.push({
          content: chunk.content,
          chunkIndex: index,
          sectionTitle: chunk.title,
          metadata: {
            wordCount: chunk.content.split(/\s+/).length,
            characterCount: chunk.content.length,
          },
        });
      });

      // Update document with extracted content
      const { error: updateError } = await supabase
        .from("documents")
        .update({
          content_text: contentText,
          processing_status: "completed",
          metadata: {
            ...document.metadata,
            wordCount: contentText.split(/\s+/).length,
            characterCount: contentText.length,
            chunkCount: chunks.length,
            processedAt: new Date().toISOString(),
          },
        })
        .eq("id", documentId);

      if (updateError) {
        throw new Error(`Failed to update document: ${updateError.message}`);
      }

      // Insert document chunks
      if (chunks.length > 0) {
        const chunksToInsert = chunks.map((chunk) => ({
          document_id: documentId,
          content: chunk.content,
          chunk_index: chunk.chunkIndex,
          section_title: chunk.sectionTitle,
          metadata: chunk.metadata,
        }));

        const { error: chunksError } = await supabase
          .from("document_chunks")
          .insert(chunksToInsert);

        if (chunksError) {
          throw new Error(`Failed to insert chunks: ${chunksError.message}`);
        }
      }

      // Log usage event
      await supabase.from("usage_events").insert({
        user_id: userId,
        event_type: "document_processing",
        metadata: {
          document_id: documentId,
          file_type: document.file_type,
          file_size: document.file_size,
          chunk_count: chunks.length,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          documentId,
          contentLength: contentText.length,
          chunkCount: chunks.length,
          processingStatus: "completed",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (processingError) {
      // Update document status to failed
      await supabase
        .from("documents")
        .update({
          processing_status: "failed",
          metadata: {
            ...document.metadata,
            error: processingError.message,
            failedAt: new Date().toISOString(),
          },
        })
        .eq("id", documentId);

      throw processingError;
    }
  } catch (error) {
    console.error("Document processing error:", error);

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

// Simple text chunking function for MVP
function chunkText(
  text: string,
  fileType: string
): Array<{ content: string; title?: string }> {
  const chunks: Array<{ content: string; title?: string }> = [];

  if (fileType === "markdown") {
    // Split by markdown headers
    const sections = text.split(/\n(?=#{1,6}\s)/);

    sections.forEach((section) => {
      if (section.trim()) {
        const lines = section.split("\n");
        const titleMatch = lines[0].match(/^#{1,6}\s(.+)$/);
        const title = titleMatch ? titleMatch[1] : undefined;

        // Split large sections into smaller chunks (max ~1000 words)
        const content = section.trim();
        if (content.split(/\s+/).length > 1000) {
          const paragraphs = content.split("\n\n");
          let currentChunk = "";

          paragraphs.forEach((paragraph) => {
            if (
              (currentChunk + paragraph).split(/\s+/).length > 1000 &&
              currentChunk
            ) {
              chunks.push({ content: currentChunk.trim(), title });
              currentChunk = paragraph;
            } else {
              currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
            }
          });

          if (currentChunk.trim()) {
            chunks.push({ content: currentChunk.trim(), title });
          }
        } else {
          chunks.push({ content, title });
        }
      }
    });
  } else {
    // Simple paragraph-based chunking for plain text
    const paragraphs = text.split("\n\n").filter((p) => p.trim());
    let currentChunk = "";

    paragraphs.forEach((paragraph) => {
      if (
        (currentChunk + paragraph).split(/\s+/).length > 1000 &&
        currentChunk
      ) {
        chunks.push({ content: currentChunk.trim() });
        currentChunk = paragraph;
      } else {
        currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
      }
    });

    if (currentChunk.trim()) {
      chunks.push({ content: currentChunk.trim() });
    }
  }

  return chunks.length > 0 ? chunks : [{ content: text }];
}

/* To deploy this function, run:
 * supabase functions deploy process-document --no-verify-jwt
 */
