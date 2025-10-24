# Research: File System & Markdown Editor with AI Context Management

**Feature**: 003-filesystem-markdown-editor
**Date**: 2025-10-22
**Status**: Completed

## Overview

This document consolidates research findings for implementing a full-featured file system with markdown editing, auto-save, hierarchical organization, and AI-ready document indexing.

---

## 1. Testing Strategy for Next.js + Supabase + TipTap

**Decision**: Jest + React Testing Library (frontend) + Vitest (Edge Functions) + Playwright (E2E)

**Rationale**:
- **Jest + React Testing Library**: Industry standard for Next.js component testing. Mock Supabase client for unit tests. Test presentational components in isolation with prop inputs.
- **Vitest**: Deno-compatible test runner for Edge Functions. Faster than Jest, supports ESM natively. Supabase Edge Runtime uses Deno, Vitest aligns better than Jest.
- **Playwright**: E2E tests for critical flows (upload → edit → save → search). Covers real-time subscriptions, file operations, auto-save reliability.
- **Integration Tests**: Mock Supabase Storage with local filesystem in tests. Use Supabase test database for RLS validation.

**Alternatives Considered**:
- **Cypress**: Slower than Playwright, more complex setup for component testing
- **Jest for Edge Functions**: Poor Deno compatibility, would require polyfills
- **No E2E tests**: Risky for auto-save reliability and real-time subscriptions (critical MVP features)

**Best Practices**:
- Test presentational components (packages/ui) with simple prop assertions
- Test smart components (apps/web) with mocked Supabase and Valtio state
- Test Edge Functions with Vitest using Supabase client mocks
- E2E tests for: document upload, auto-save, folder operations, search accuracy

---

## 2. TipTap Configuration for Extensible Markdown Editing

**Decision**: TipTap with StarterKit + Markdown extension + custom auto-save plugin

**Rationale**:
- **StarterKit**: Provides core formatting (bold, italic, headings, lists, code blocks, blockquotes) out-of-box
- **Markdown Extension**: Serializes/deserializes markdown syntax (enables storage as .md files)
- **Custom Auto-Save Plugin**: ProseMirror plugin that debounces edits (3s) and calls save handler
- **XSS Prevention**: TipTap sanitizes HTML via DOMPurify integration, prevents injection attacks
- **Future Diff UI**: ProseMirror's document model supports custom decorations and collaborative editing extensions (Y.js integration available for future use)

**Configuration Example**:
```typescript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      codeBlock: true,
      blockquote: true,
    }),
    Markdown,
    AutoSave.configure({
      delay: 3000, // 3s debounce
      onSave: (markdown) => saveDocument(markdown),
    }),
  ],
  content: initialMarkdown,
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none',
    },
  },
})
```

**Alternatives Considered**:
- **react-markdown + textarea**: Simpler but no WYSIWYG editing, poor UX for formatting
- **Draft.js**: Facebook abandoned, lacks markdown support, complex API
- **Slate**: More low-level than TipTap, requires more custom logic, weaker TypeScript support
- **Monaco Editor**: Overkill for markdown (designed for code), heavyweight bundle

**Best Practices**:
- Store raw markdown in Supabase Storage (not HTML) for portability
- Use TipTap's `getMarkdown()` method to serialize editor state
- Debounce auto-save to avoid excessive backend calls
- Add unsaved changes warning before navigation (useBeforeUnload hook)
- Disable editor during save operation to prevent race conditions

---

## 3. react-arborist File Tree Implementation

**Decision**: react-arborist with custom drag-and-drop handlers and virtualization

**Rationale**:
- **Virtualization**: Efficiently renders large file trees (1000+ nodes) without performance degradation
- **Built-in Drag-and-Drop**: Move files/folders via drag-and-drop with minimal config
- **Keyboard Navigation**: Arrow keys, Enter, Escape, Delete work out-of-box (accessibility)
- **TypeScript Support**: Full type safety for tree data structure
- **Custom Renderers**: Supports custom node components (icons, context menus, inline rename)

**Configuration Example**:
```typescript
<Tree
  data={fileTreeData}
  openByDefault={false}
  width="100%"
  height={600}
  indent={24}
  rowHeight={36}
  overscanCount={10}
  onMove={handleMove}
  onRename={handleRename}
  onDelete={handleDelete}
>
  {Node}
</Tree>
```

**Data Structure** (FileSystemNode):
```typescript
interface FileSystemNode {
  id: string;
  name: string;
  type: 'folder' | 'document';
  children?: FileSystemNode[];
  parentId?: string;
  path: string;
}
```

**Alternatives Considered**:
- **react-dnd-treeview**: No virtualization, poor performance for large trees
- **Custom tree component**: Reinventing the wheel, weeks of work for drag-and-drop + keyboard nav
- **ag-Grid tree mode**: Overkill for file tree, heavyweight bundle

**Best Practices**:
- Compute `path` field from parent hierarchy for breadcrumb display
- Lazy-load folders with 100+ children for initial render performance
- Optimistic UI updates (update tree immediately, rollback on API error)
- Context menu triggered by right-click or long-press (mobile)
- Use Valtio for file tree state (reactive updates from real-time subscriptions)

---

## 4. Supabase Storage Best Practices for Document Files

**Decision**: Store files at `documents/{user_id}/{document_id}/{filename}` with RLS policies and signed URLs

**Rationale**:
- **Path Structure**: Enforces user isolation at storage level, enables bucket-level RLS policies
- **Signed URLs**: Temporary (1hr expiry) URLs for secure file downloads without exposing service role key
- **RLS Policies**: Storage bucket policies check `auth.uid()` matches `user_id` in path
- **Versioning Disabled**: MVP doesn't need version history, reduces storage costs
- **Public Bucket**: Disabled for security (all access via signed URLs with RLS)

**Storage Policy Example** (Supabase SQL):
```sql
-- Allow users to read only their own documents
CREATE POLICY "Users can read own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Alternatives Considered**:
- **Store content in PostgreSQL text field**: Limited to ~1GB per row, poor performance for large files, expensive storage
- **Flat storage structure**: Harder to enforce RLS, complex path parsing
- **External storage (S3)**: Adds infrastructure complexity, Supabase Storage is built-in

**Best Practices**:
- Always validate file type (MIME type) and size before upload
- Generate `document_id` on client (UUID v4) before upload to avoid race conditions
- Upload to Storage first, then insert metadata row in `documents` table (rollback on failure)
- Delete from Storage when document row is deleted (use database trigger or Edge Function)
- Cache signed URLs client-side (1hr validity) to reduce API calls

---

## 5. Document Indexing Architecture (Database Triggers + Background Jobs)

**Decision**: PostgreSQL trigger on `documents` table → Supabase Edge Function (background indexing job)

**Rationale**:
- **Database Trigger**: Automatically fires on INSERT/UPDATE to `documents` table, queues indexing without client logic
- **Edge Function**: Fetches file content from Storage, chunks into 400-500 tokens, generates embeddings (OpenAI), stores in `document_chunks`
- **Async Processing**: User can continue working while indexing happens in background
- **Retry Logic**: Edge Function retries up to 3 times with exponential backoff on failure
- **Status Tracking**: `documents.indexing_status` field ('pending', 'in_progress', 'completed', 'failed')

**Trigger Implementation** (PostgreSQL):
```sql
CREATE OR REPLACE FUNCTION queue_document_indexing()
RETURNS TRIGGER AS $$
BEGIN
  -- Invoke Edge Function asynchronously via pg_net (Supabase HTTP extension)
  PERFORM net.http_post(
    url := 'https://PROJECT_REF.supabase.co/functions/v1/index-document',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('request.jwt.claims')::json->>'sub'),
    body := jsonb_build_object('document_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_queue_indexing
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW
WHEN (NEW.storage_path IS NOT NULL)
EXECUTE FUNCTION queue_document_indexing();
```

**Alternatives Considered**:
- **Client-side indexing trigger**: Less reliable (user could close browser), requires client to wait
- **pg_cron scheduled job**: Polls for unindexed documents, less responsive (minutes vs seconds)
- **Synchronous indexing in upload handler**: Blocks user, poor UX for large files

**Best Practices**:
- Set `indexing_status = 'pending'` in trigger before invoking Edge Function
- Edge Function updates status to 'in_progress' at start, 'completed' on success, 'failed' on error
- Delete old chunks before re-indexing (UPDATE case) to avoid duplicates
- Log errors to Supabase logging for debugging failed indexing jobs
- Use OpenAI `text-embedding-3-small` (1536 dims) for cost efficiency vs `ada-002`

---

## 6. Auto-Save Implementation with Conflict Resolution

**Decision**: Debounced auto-save (3s) with optimistic locking via `version` field

**Rationale**:
- **Debounce**: Wait 3s after last keystroke before saving (balances UX and backend load)
- **Optimistic Locking**: `documents.version` field (integer) incremented on each save. Client includes version in save request, backend checks version match before updating.
- **Conflict Resolution**: If version mismatch, backend returns 409 Conflict. Client shows warning and offers to merge or overwrite.
- **Last-Write-Wins (MVP)**: If version matches, update wins. Future: operational transforms (OT) or CRDTs for collaborative editing.

**Save Handler Example**:
```typescript
const autoSave = useDebouncedCallback(async (markdown: string) => {
  const currentVersion = editorState.document?.version;

  const { data, error } = await supabase
    .from('documents')
    .update({
      content_text: markdown,
      version: currentVersion + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)
    .eq('version', currentVersion) // Optimistic lock check
    .select()
    .single();

  if (error?.code === 'PGRST116') { // No rows updated (version mismatch)
    setSaveStatus('conflict');
    // Show conflict dialog
  } else if (error) {
    setSaveStatus('error');
  } else {
    setSaveStatus('saved');
    editorState.document.version = currentVersion + 1;
  }
}, 3000);
```

**Alternatives Considered**:
- **No conflict detection**: Risk of overwriting concurrent edits (bad UX for future multi-device support)
- **Manual save only**: Users forget to save, data loss risk (violates SC-002: 99%+ auto-save reliability)
- **Shorter debounce (<1s)**: Excessive backend load, network costs

**Best Practices**:
- Show save status indicator (saving, saved, error) with visual feedback
- Queue saves locally during offline mode, sync when connection restored
- Add `beforeunload` event listener to warn user if unsaved changes exist
- Disable editor during save operation to prevent race conditions
- Exponential backoff for failed saves (retry after 1s, 2s, 4s, then give up)

---

## 7. Real-Time Updates for File Tree and Save Status

**Decision**: Supabase Realtime subscriptions on `documents` and `folders` tables

**Rationale**:
- **WebSocket Connection**: Persistent connection for instant updates (<100ms propagation)
- **RLS-Filtered**: Realtime respects RLS policies, users only see their own data
- **Payload Types**: Listen for INSERT, UPDATE, DELETE events on tables
- **Valtio Integration**: Real-time payload updates Valtio state, triggers UI re-renders automatically

**Subscription Example**:
```typescript
const subscription = supabase
  .channel('filesystem_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'documents',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    if (payload.eventType === 'INSERT') {
      filesystemState.documents.push(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const index = filesystemState.documents.findIndex(d => d.id === payload.new.id);
      filesystemState.documents[index] = payload.new;
    } else if (payload.eventType === 'DELETE') {
      filesystemState.documents = filesystemState.documents.filter(d => d.id !== payload.old.id);
    }
  })
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'folders',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Similar handling for folders
  })
  .subscribe();
```

**Alternatives Considered**:
- **Polling**: Higher latency (seconds vs milliseconds), excessive backend load
- **GraphQL subscriptions**: Unnecessary complexity, Supabase Realtime provides what's needed
- **Custom WebSocket server**: Reinventing the wheel, weeks of work for reconnection logic

**Best Practices**:
- Unsubscribe on component unmount to prevent memory leaks
- Handle reconnection automatically (Supabase client does this)
- Show connection status indicator (online/offline) in UI
- Queue local changes during disconnection, replay on reconnect
- Use single channel for multiple table subscriptions (more efficient than separate channels)

---

## 8. File Upload with Progress Tracking (Server-Side, Secure)

**Decision**: Server-side upload via Edge Function with validation, progress tracking via client polling

**Rationale**:
- **Security First**: Edge Function validates file type, size, and content server-side (cannot be bypassed)
- **Least Privilege**: Client only sends file to Edge Function, no direct Storage access
- **Server Controls IDs**: Edge Function generates document IDs (prevents manipulation)
- **Atomic Operations**: Edge Function handles upload + metadata insertion in single transaction
- **Progress Tracking**: Client polls Edge Function for upload progress (stored in temporary state)
- **Audit Trail**: All uploads logged server-side with user context

**Frontend Upload Handler**:
```typescript
const uploadFile = async (file: File, folderId: string | null) => {
  // Client-side pre-flight validation (UX, not security)
  if (!file.type.includes('markdown') && !file.type.includes('text')) {
    uploadState.errors[file.name] = 'Only .md and .txt files supported';
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    uploadState.errors[file.name] = 'File must be less than 10MB';
    return;
  }

  // Prepare multipart form data
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folder_id', folderId);

  // Upload via Edge Function (secure, server-side)
  const session = await supabase.auth.getSession();
  const uploadId = crypto.randomUUID(); // For progress tracking

  uploadState.progress[uploadId] = 0;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/upload-document`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      uploadState.errors[uploadId] = error.message;
      return;
    }

    const data = await response.json();
    uploadState.completed[uploadId] = true;
    uploadState.documents.push(data); // Add to local state

    // Real-time subscription will sync this across devices
  } catch (error) {
    uploadState.errors[uploadId] = error.message;
  }
};
```

**Edge Function Implementation** (apps/api/src/functions/upload-document/index.ts):
```typescript
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // Server-side authentication (enforced)
  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!, // RLS enforced
    { global: { headers: { Authorization: authHeader! } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Parse multipart form data
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const folderId = formData.get('folder_id') as string | null;

  // Server-side validation (CANNOT BE BYPASSED)
  const ALLOWED_TYPES = ['text/markdown', 'text/plain'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (!file || !ALLOWED_TYPES.includes(file.type)) {
    return new Response(
      JSON.stringify({ error: 'Invalid file type', message: 'Only .md and .txt files are supported' }),
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return new Response(
      JSON.stringify({ error: 'File too large', message: 'Maximum file size is 10MB' }),
      { status: 413 }
    );
  }

  // Server generates document ID (secure, controlled)
  const documentId = crypto.randomUUID();
  const storagePath = `documents/${user.id}/${documentId}/${file.name}`;

  // Upload to Storage (server-side, using authenticated client with RLS)
  const { error: storageError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file);

  if (storageError) {
    console.error('Storage upload failed:', storageError);
    return new Response(
      JSON.stringify({ error: 'Upload failed', message: storageError.message }),
      { status: 500 }
    );
  }

  // Read content for caching in database
  const content = await file.text();

  // Insert metadata into documents table (atomic with upload)
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert({
      id: documentId,
      user_id: user.id,
      folder_id: folderId,
      name: file.name,
      storage_path: storagePath,
      content_text: content, // Cached for fast reads
      file_size: file.size,
      mime_type: file.type,
      path: '/', // Computed from folder hierarchy in separate step
      version: 0,
      indexing_status: 'pending', // Trigger will queue background indexing
    })
    .select()
    .single();

  if (docError) {
    // Rollback: Delete from Storage if database insert fails
    await supabase.storage.from('documents').remove([storagePath]);
    console.error('Database insert failed:', docError);
    return new Response(
      JSON.stringify({ error: 'Upload failed', message: docError.message }),
      { status: 500 }
    );
  }

  // Success: Return document metadata
  return new Response(JSON.stringify(docData), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Alternatives Considered**:
- **Direct client upload**: Less secure, client can bypass validation, larger attack surface
- **Base64 encoding**: Increases file size by 33%, poor performance
- **Streaming upload with progress**: Complex to implement in Edge Functions, not worth tradeoff for MVP

**Security Benefits**:
- ✅ Server validates file type, size, content (cannot be bypassed by malicious client)
- ✅ Server generates document IDs (prevents ID manipulation attacks)
- ✅ Server controls Storage paths (prevents path traversal)
- ✅ No direct client access to Storage (minimizes attack surface)
- ✅ Audit trail: All uploads logged with user context in Edge Function logs
- ✅ Rate limiting: Can be enforced at Edge Function level
- ✅ Future: Add malware scanning, content moderation, etc. server-side

**Best Practices**:
- Client-side validation for UX only (show errors before upload attempt)
- Server-side validation is source of truth (security boundary)
- Use multipart form data for file uploads (standard HTTP)
- Return detailed error messages for debugging (but not sensitive info)
- Clean up Storage on database insert failure (maintain consistency)
- Log all upload attempts for security auditing
- Consider adding virus scanning via ClamAV or similar (post-MVP)

---

## Summary

All technical unknowns resolved. Key decisions:

1. **Testing**: Jest + React Testing Library (frontend), Vitest (Edge Functions), Playwright (E2E)
2. **TipTap**: StarterKit + Markdown extension + custom auto-save plugin (3s debounce)
3. **react-arborist**: Virtualized file tree with drag-and-drop and keyboard navigation
4. **Storage**: Supabase Storage at `documents/{user_id}/{document_id}/{filename}` with RLS policies
5. **Indexing**: Database trigger → Edge Function → chunking → embeddings → `document_chunks`
6. **Auto-Save**: Debounced (3s) with optimistic locking via `version` field
7. **Real-Time**: Supabase Realtime subscriptions on `documents` and `folders` tables
8. **Upload**: Server-side via Edge Function (secure, least privilege), multipart support, drag-and-drop UI

**Security**: All uploads go through Edge Function for server-side validation, ID generation, and Storage access. Client has no direct Storage permissions (least privilege principle).

No blockers for Phase 1 design. Ready to proceed with data model and contracts generation.
