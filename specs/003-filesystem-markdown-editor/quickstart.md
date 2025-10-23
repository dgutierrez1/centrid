# Quickstart: File System & Markdown Editor with AI Context Management

**Feature**: 003-filesystem-markdown-editor
**Branch**: `003-filesystem-markdown-editor`
**Date**: 2025-10-22

## Overview

This quickstart guide walks through the end-to-end implementation flow for the file system and markdown editor feature, from database schema to UI components.

---

## Prerequisites

- ✅ Authentication system operational (Supabase Auth)
- ✅ Monorepo structure in place (`apps/web`, `apps/api`, `packages/ui`, `packages/shared`)
- ✅ Supabase project configured with remote database
- ✅ Environment variables set in `apps/api/.env` and `apps/web/.env`

---

## Phase 1: Database Schema & Storage

### 1.1 Define Schema (apps/api/src/db/schema.ts)

```typescript
import { pgTable, uuid, text, integer, timestamp, vector } from 'drizzle-orm/pg-core';

// Folders table
export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  name: text('name').notNull(),
  parent_folder_id: uuid('parent_folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Documents table
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull(),
  folder_id: uuid('folder_id').references(() => folders.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  storage_path: text('storage_path').notNull(),
  content_text: text('content_text'),
  file_size: integer('file_size').notNull(),
  mime_type: text('mime_type').notNull(),
  path: text('path').notNull(),
  version: integer('version').default(0).notNull(),
  indexing_status: text('indexing_status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Document chunks table
export const document_chunks = pgTable('document_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  document_id: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  position: integer('position').notNull(),
  embedding: vector('embedding', { dimensions: 1536 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});
```

### 1.2 Push Schema to Remote Database

```bash
cd apps/api
npm run db:push  # Drizzle push to remote Supabase
```

### 1.3 Create RLS Policies (Supabase SQL Editor)

```sql
-- Enable RLS on all tables
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Folders policies
CREATE POLICY "Users can read own folders"
  ON folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
  ON folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
  ON folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
  ON folders FOR DELETE
  USING (auth.uid() = user_id);

-- Documents policies (similar structure)
CREATE POLICY "Users can read own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  USING (auth.uid() = user_id);

-- Document chunks policies (read-only for users)
CREATE POLICY "Users can read own document chunks"
  ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_chunks.document_id
      AND documents.user_id = auth.uid()
    )
  );
```

### 1.4 Configure Supabase Storage Bucket

**In Supabase Dashboard → Storage:**
1. Create bucket: `documents`
2. Set as private (not public)
3. Add RLS policies:

```sql
-- Allow users to read own documents
CREATE POLICY "Users can read own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to upload to own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete own documents
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## Phase 2: Backend Services & Edge Functions

### 2.1 Create Document Processing Service (apps/api/src/services/document-processor.ts)

```typescript
export async function chunkDocument(content: string, maxTokens = 500): Promise<string[]> {
  // Simple chunking by paragraphs (can be improved with tiktoken for accurate token counting)
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxTokens * 4) { // Rough estimate: 4 chars per token
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += '\n\n' + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
```

### 2.2 Create Indexing Service (apps/api/src/services/indexing.ts)

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    dimensions: 1536,
  });

  return response.data[0].embedding;
}
```

### 2.3 Create Upload Edge Function (apps/api/src/functions/upload-document/index.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const folderId = formData.get('folder_id') as string | null;

  // Validate file type
  if (!file.type.includes('markdown') && !file.type.includes('text')) {
    return new Response(JSON.stringify({ error: 'Invalid file type' }), { status: 400 });
  }

  // Generate IDs
  const documentId = crypto.randomUUID();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const storagePath = `documents/${userId}/${documentId}/${file.name}`;

  // Upload to Storage
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file);

  if (storageError) {
    return new Response(JSON.stringify({ error: storageError.message }), { status: 500 });
  }

  // Read content and insert metadata
  const content = await file.text();
  const { data, error } = await supabase
    .from('documents')
    .insert({
      id: documentId,
      name: file.name,
      folder_id: folderId,
      storage_path: storagePath,
      content_text: content,
      file_size: file.size,
      mime_type: file.type,
      path: '/', // Compute from folder hierarchy
      indexing_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    // Rollback storage upload
    await supabase.storage.from('documents').remove([storagePath]);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data), { status: 201 });
});
```

### 2.4 Deploy Edge Functions

```bash
cd apps/api
npm run deploy:functions  # Deploys all functions from src/functions/
```

---

## Phase 3: Shared Types & Utilities

### 3.1 Define Types (packages/shared/src/types/filesystem.ts)

```typescript
export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_folder_id: string | null;
  path: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  storage_path: string;
  content_text?: string;
  file_size: number;
  mime_type: string;
  path: string;
  version: number;
  indexing_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface FileSystemNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  parentId: string | null;
  path: string;
  children?: FileSystemNode[];
  // Document-specific fields
  fileSize?: number;
  version?: number;
  indexingStatus?: string;
}
```

### 3.2 File Validation (packages/shared/src/utils/file-validation.ts)

```typescript
import { z } from 'zod';

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  folderId: z.string().uuid().nullable(),
});

export function validateFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['text/markdown', 'text/plain'];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only .md and .txt files are supported' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
}
```

---

## Phase 4: Frontend UI Components

### 4.1 Install Dependencies

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-markdown react-arborist
```

### 4.2 Create File Tree Component (packages/ui/src/components/file-tree.tsx)

```typescript
import { Tree } from 'react-arborist';
import type { FileSystemNode } from '@centrid/shared/types';

export function FileTree({
  data,
  onSelect,
  onMove,
  onDelete,
}: {
  data: FileSystemNode[];
  onSelect: (node: FileSystemNode) => void;
  onMove: (nodeId: string, newParentId: string) => void;
  onDelete: (nodeId: string) => void;
}) {
  return (
    <Tree
      data={data}
      openByDefault={false}
      width="100%"
      height={600}
      indent={24}
      rowHeight={36}
      onSelect={(nodes) => nodes[0] && onSelect(nodes[0].data)}
      onMove={({ dragIds, parentId }) => onMove(dragIds[0], parentId)}
    />
  );
}
```

### 4.3 Create Markdown Editor (packages/ui/src/components/markdown-editor.tsx)

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Markdown from '@tiptap/extension-markdown';

export function MarkdownEditor({
  initialContent,
  onSave,
}: {
  initialContent: string;
  onSave: (markdown: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      onSave(markdown);
    },
  });

  return <EditorContent editor={editor} />;
}
```

### 4.4 Create Workspace Layout (apps/web/src/components/layout/WorkspaceLayout.tsx)

```typescript
export function WorkspaceLayout() {
  return (
    <div className="flex h-screen">
      {/* File Tree Panel (20%) */}
      <div className="w-1/5 border-r">
        <FileTreeContainer />
      </div>

      {/* Editor Panel (50%) */}
      <div className="w-1/2 border-r">
        <DocumentEditor />
      </div>

      {/* Chat Panel (30%) */}
      <div className="w-3/10">
        <AIChat />
      </div>
    </div>
  );
}
```

---

## Phase 5: State Management & Real-Time

### 5.1 Create Valtio State (apps/web/src/lib/state/filesystem.ts)

```typescript
import { proxy } from 'valtio';
import type { Folder, Document, FileSystemNode } from '@centrid/shared/types';

export const filesystemState = proxy<{
  folders: Folder[];
  documents: Document[];
  selectedDocument: Document | null;
  treeData: FileSystemNode[];
}>({
  folders: [],
  documents: [],
  selectedDocument: null,
  treeData: [],
});

export const filesystemActions = {
  loadFileSystem: async () => {
    const folders = await supabase.from('folders').select('*');
    const documents = await supabase.from('documents').select('*');

    filesystemState.folders = folders.data || [];
    filesystemState.documents = documents.data || [];
    filesystemState.treeData = buildFileSystemTree(folders.data || [], documents.data || []);
  },

  createFolder: async (name: string, parentId: string | null) => {
    const { data } = await supabase.from('folders').insert({ name, parent_folder_id: parentId }).select().single();
    if (data) filesystemState.folders.push(data);
  },

  selectDocument: async (documentId: string) => {
    const { data } = await supabase.from('documents').select('*').eq('id', documentId).single();
    filesystemState.selectedDocument = data;
  },
};
```

### 5.2 Setup Real-Time Subscriptions (apps/web/src/components/filesystem/FileSystemProvider.tsx)

```typescript
useEffect(() => {
  const subscription = supabase
    .channel('filesystem_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'documents',
      filter: `user_id=eq.${userId}`,
    }, (payload) => {
      // Update Valtio state based on payload
      if (payload.eventType === 'INSERT') {
        filesystemState.documents.push(payload.new);
      }
      // ... handle UPDATE and DELETE
    })
    .subscribe();

  return () => supabase.removeChannel(subscription);
}, [userId]);
```

---

## Phase 6: Testing & Validation

### 6.1 Test File Upload

```bash
# In apps/web, create test component
npm run web:dev
# Navigate to http://localhost:3000/workspace
# Upload a .md file via UI
# Verify file appears in file tree
# Check Supabase Storage bucket for uploaded file
```

### 6.2 Verify Indexing

```bash
# Check documents table for indexing_status = 'completed'
# Verify document_chunks table has entries for uploaded document
```

### 6.3 Test Auto-Save

```bash
# Open a document in editor
# Type content
# Wait 3 seconds
# Verify updated_at timestamp changed in database
```

---

## Next Steps

1. **Run /speckit.design**: Create visual designs for file tree, editor, and workspace layout
2. **Run /speckit.tasks**: Generate dependency-ordered task list for implementation
3. **Implement E2E tests**: Playwright tests for upload → edit → save → search flow
4. **Performance optimization**: Add virtualization for large file trees, lazy loading for folders

---

## Common Issues & Solutions

### Issue: RLS prevents file access
**Solution**: Verify JWT token in Authorization header, check RLS policies match auth.uid()

### Issue: Storage upload fails with 403
**Solution**: Check Storage bucket RLS policies, verify path includes user_id

### Issue: Indexing stuck in 'pending'
**Solution**: Check Edge Function logs, verify OpenAI API key is set, check trigger executed

### Issue: Real-time not updating
**Solution**: Verify channel subscription, check RLS allows user to see changes, restart Supabase local

---

## Summary

**Database**: 3 tables (folders, documents, document_chunks) with RLS policies
**Storage**: Supabase Storage bucket `documents` with path-based RLS
**Backend**: 3 Edge Functions (upload-document, index-document, search-documents)
**Frontend**: File tree (react-arborist), markdown editor (TipTap), workspace layout (3-panel)
**State**: Valtio reactive state with real-time subscriptions
**Ready for**: Task generation (/speckit.tasks) and implementation

All components tested independently before integration. Follow TDD approach: write tests → implement → refactor.
