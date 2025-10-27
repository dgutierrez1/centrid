import React from 'react';
import { DesignSystemFrame } from '../../components/DesignSystemFrame';
import { FileEditorWithProvenance } from '@centrid/ui/features';
import { mockProvenance } from '../../components/ai-agent-system/mockData';

const sampleContent = `# RAG Implementation Plan

## Overview

This document outlines the implementation plan for the Retrieval-Augmented Generation (RAG) system.

## Key Components

### 1. Vector Database
- **Choice**: Supabase pgvector extension
- **Rationale**: Native PostgreSQL integration, good performance for < 1M vectors

### 2. Embedding Model
- **Choice**: OpenAI text-embedding-3-small (768 dimensions)
- **Rationale**: Best balance of quality and cost

### 3. Chunking Strategy
- **Approach**: Semantic chunking with 200-300 token chunks
- **Overlap**: 20% overlap between chunks to preserve context

## Implementation Steps

1. Set up vector database schema
2. Implement document processing pipeline
3. Create embedding generation service
4. Build retrieval service with ranking
5. Integrate with LLM for generation

## Performance Targets

- Embedding: < 500ms for 10K tokens
- Retrieval: < 300ms for top-10 results
- End-to-end: < 10s from question to answer
`;

export default function FileEditorPage() {
  const [content, setContent] = React.useState(sampleContent);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // Simulate saving
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <DesignSystemFrame
      title="File Editor (Provenance)"
      description="File editor with creation context and source tracking"
      backHref="/ai-agent-system"
    >
      <div className="space-y-6">
        {/* Description */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-400">
            The File Editor with Provenance Header shows AI-generated files with full context
            tracking: source branch, creation context, last edit info, and navigation to source
            conversation. Manually created files show "Manual" badge without provenance header.
          </p>
        </div>

        {/* AI-Generated File */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            AI-Generated File (with Provenance)
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-[500px]">
            <FileEditorWithProvenance
              filePath="rag-implementation-plan.md"
              content={content}
              onContentChange={handleContentChange}
              provenance={mockProvenance}
              onGoToSource={(branchId) => alert(`Navigate to branch: ${branchId}`)}
              isSaving={isSaving}
              data-testid="file-editor-provenance"
            />
          </div>
        </div>

        {/* Manual File (No Provenance) */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Manually Created File (no Provenance)
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden h-[300px]">
            <FileEditorWithProvenance
              filePath="notes.md"
              content="# Personal Notes\n\nThese are my personal project notes..."
              onContentChange={() => {}}
              provenance={null}
              data-testid="file-editor-manual"
            />
          </div>
        </div>

        {/* Provenance Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Provenance Features
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Source Tracking</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Shows which branch and when the file was created
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Context Summary
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                2-3 sentences explaining WHY the file was created
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Edit History</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last edited by user/agent, in which branch, when
              </p>
            </div>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Go to Source
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Navigate to the conversation that created this file
              </p>
            </div>
          </div>
        </div>
      </div>
    </DesignSystemFrame>
  );
}
