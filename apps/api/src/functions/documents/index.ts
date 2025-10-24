import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Documents Edge Function
 * Handles document content and metadata updates
 *
 * Endpoints:
 * - POST /documents - Create a new document
 * - PUT /documents/:id - Update document content (with version check)
 * - PATCH /documents/:id - Update document metadata (name, folder)
 * - DELETE /documents/:id - Delete a document
 */

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with user auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for database operations (bypasses RLS)
    // Safe because we explicitly verify user auth and set user_id
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create user client for auth verification
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const documentId = pathParts[pathParts.length - 1]; // Extract document ID from path

    // Route to appropriate handler
    if (req.method === 'POST') {
      return await handleCreateDocument(supabaseAdmin, user.id, req);
    } else if (req.method === 'PUT') {
      return await handleUpdateDocument(supabaseAdmin, user.id, documentId, req);
    } else if (req.method === 'PATCH') {
      return await handleUpdateDocumentMetadata(supabaseAdmin, user.id, documentId, req);
    } else if (req.method === 'DELETE') {
      return await handleDeleteDocument(supabaseAdmin, user.id, documentId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle PUT /documents/:id - Update document content with optimistic locking
 */
async function handleUpdateDocument(
  supabase: any,
  userId: string,
  documentId: string,
  req: Request
) {
  try {
    const body = await req.json();
    const { content_text, version } = body;

    // Validate inputs
    if (content_text === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing content_text field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof version !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid version field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current document to verify ownership and version
    const { data: currentDoc, error: fetchError } = await supabase
      .from('documents')
      .select('id, user_id, version')
      .eq('id', documentId)
      .single();

    if (fetchError || !currentDoc) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (currentDoc.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check version for optimistic locking
    if (currentDoc.version !== version) {
      return new Response(
        JSON.stringify({
          error: 'Version conflict',
          message: 'Document was modified by another client. Please refresh and try again.',
          current_version: currentDoc.version,
          provided_version: version,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update document with new version
    const newVersion = version + 1;
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update({
        content_text,
        version: newVersion,
        updated_at: new Date().toISOString(),
        indexing_status: 'pending', // Re-queue indexing after content change
      })
      .eq('id', documentId)
      .eq('version', version) // Double-check version in UPDATE
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update document', message: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!updatedDoc) {
      // No rows updated - version mismatch (race condition)
      return new Response(
        JSON.stringify({
          error: 'Version conflict',
          message: 'Document was modified during the update. Please refresh and try again.',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TODO: Sync to Supabase Storage (async, non-blocking)
    // This can be done via a separate background job or database trigger

    return new Response(
      JSON.stringify(updatedDoc),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update document error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle PATCH /documents/:id - Update document metadata (name, folder)
 */
async function handleUpdateDocumentMetadata(
  supabase: any,
  userId: string,
  documentId: string,
  req: Request
) {
  try {
    const body = await req.json();
    const { name, folder_id } = body;

    // Fetch current document to verify ownership
    const { data: currentDoc, error: fetchError } = await supabase
      .from('documents')
      .select('id, user_id, folder_id, name')
      .eq('id', documentId)
      .single();

    if (fetchError || !currentDoc) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (currentDoc.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updates: any = {};

    // Handle rename
    if (name !== undefined && name !== currentDoc.name) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid document name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate name doesn't contain invalid characters
      if (name.includes('/') || name.includes('\\') || /[\x00-\x1F]/.test(name)) {
        return new Response(
          JSON.stringify({ error: 'Document name contains invalid characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      updates.name = name;
    }

    // Handle move
    if (folder_id !== undefined && folder_id !== currentDoc.folder_id) {
      updates.folder_id = folder_id || null;
    }

    // Recompute path if name or folder changed
    if (updates.name || updates.folder_id !== undefined) {
      // Get folder path
      let folderPath = '/';
      if (updates.folder_id || currentDoc.folder_id) {
        const folderId = updates.folder_id !== undefined ? updates.folder_id : currentDoc.folder_id;
        if (folderId) {
          const { data: folder } = await supabase
            .from('folders')
            .select('path')
            .eq('id', folderId)
            .single();

          if (folder) {
            folderPath = folder.path;
          }
        }
      }

      const docName = updates.name || currentDoc.name;
      updates.path = folderPath === '/' ? `/${docName}` : `${folderPath}/${docName}`;
    }

    // Update document
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('Update document metadata error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update document', message: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(updatedDoc),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update document metadata error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle POST /documents - Create a new document
 * Supports both JSON (for empty documents) and multipart/form-data (for file uploads)
 */
async function handleCreateDocument(
  supabase: any,
  userId: string,
  req: Request
) {
  try {
    const contentType = req.headers.get('content-type') || '';

    // Handle file upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      return await handleFileUpload(supabase, userId, req);
    }

    // Handle regular JSON document creation
    const body = await req.json();
    const { name, folder_id, content_text = '' } = body;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid document name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate name doesn't contain invalid characters
    if (name.includes('/') || name.includes('\\') || /[\x00-\x1F]/.test(name)) {
      return new Response(
        JSON.stringify({ error: 'Document name contains invalid characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute path
    let path = '/';
    if (folder_id) {
      const { data: folder } = await supabase
        .from('folders')
        .select('path')
        .eq('id', folder_id)
        .single();

      if (folder) {
        path = folder.path;
      }
    }

    const documentPath = path === '/' ? `/${name}` : `${path}/${name}`;

    // Generate storage path: user_id/folder_path/filename
    const storagePath = `${userId}${documentPath}`;

    // Create document
    const { data: newDocument, error: insertError} = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        name,
        folder_id: folder_id || null,
        path: documentPath,
        storage_path: storagePath,
        content_text: content_text,
        file_size: new TextEncoder().encode(content_text).length,
        mime_type: 'text/markdown',
        version: 0,
        indexing_status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create document', message: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(newDocument),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Create document error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle DELETE /documents/:id - Delete a document
 */
async function handleDeleteDocument(
  supabase: any,
  userId: string,
  documentId: string
) {
  try {
    // Fetch document to verify ownership
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (document.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete document (cascade will delete chunks)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete document', message: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete document error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle file upload - Process multipart/form-data file uploads
 * Validates file type, size, uploads to Storage, and creates document metadata
 */
async function handleFileUpload(
  supabase: any,
  userId: string,
  req: Request
) {
  try {
    console.log('[handleFileUpload] Starting upload', { userId });

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folder_id') as string | null;

    console.log('[handleFileUpload] File received', {
      fileName: file?.name,
      fileSize: file?.size,
      folderId
    });

    // Validate file is present
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side validation: File type (CANNOT BE BYPASSED)
    const ALLOWED_TYPES = ['text/markdown', 'text/plain', 'application/octet-stream'];
    const ALLOWED_EXTENSIONS = ['.md', '.txt'];

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const isValidExtension = ALLOWED_EXTENSIONS.includes(fileExtension);
    const isValidMimeType = ALLOWED_TYPES.includes(file.type);

    if (!isValidExtension) {
      return new Response(
        JSON.stringify({
          error: 'Invalid file type',
          message: `Only ${ALLOWED_EXTENSIONS.join(', ')} files are supported`,
          provided: fileExtension
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Server-side validation: File size (CANNOT BE BYPASSED)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return new Response(
        JSON.stringify({
          error: 'File too large',
          message: 'Maximum file size is 10MB',
          provided: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (file.size < 1) {
      return new Response(
        JSON.stringify({
          error: 'File is empty',
          message: 'File must contain at least 1 byte'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read file content for database caching
    const content = await file.text();

    // Check for duplicate name in the same folder
    let finalName = file.name;
    const { data: existingDocs } = await supabase
      .from('documents')
      .select('name')
      .eq('user_id', userId)
      .eq('folder_id', folderId || null);

    if (existingDocs && existingDocs.length > 0) {
      const existingNames = existingDocs.map((d: any) => d.name);
      if (existingNames.includes(finalName)) {
        // Append number to make unique: "Document.md" → "Document (1).md"
        const baseName = finalName.substring(0, finalName.lastIndexOf('.'));
        const extension = finalName.substring(finalName.lastIndexOf('.'));
        let counter = 1;
        while (existingNames.includes(`${baseName} (${counter})${extension}`)) {
          counter++;
        }
        finalName = `${baseName} (${counter})${extension}`;
      }
    }

    // Server generates document ID (secure, controlled)
    const documentId = crypto.randomUUID();

    // Validate and compute path
    let path = '/';
    if (folderId) {
      // SECURITY: Verify folder exists and belongs to user (prevent folder injection)
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .select('path, user_id')
        .eq('id', folderId)
        .single();

      if (folderError || !folder) {
        return new Response(
          JSON.stringify({
            error: 'Invalid folder',
            message: 'Folder not found'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (folder.user_id !== userId) {
        return new Response(
          JSON.stringify({
            error: 'Forbidden',
            message: 'You do not have access to this folder'
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      path = folder.path;
    }

    const documentPath = path === '/' ? `/${finalName}` : `${path}/${finalName}`;

    // Generate storage path: user_id/document_id/filename
    const storagePath = `${userId}/${documentId}/${finalName}`;

    // Upload to Supabase Storage (server-side, using admin client to bypass RLS)
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload failed:', storageError);
      return new Response(
        JSON.stringify({
          error: 'Upload failed',
          message: storageError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert metadata into documents table (atomic with upload)
    console.log('[handleFileUpload] Inserting document metadata', {
      documentId,
      userId,
      folderId,
      finalName,
      storagePath,
      contentLength: content.length
    });

    const { data: newDocument, error: insertError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        user_id: userId,
        folder_id: folderId || null,
        name: finalName,
        storage_path: storagePath,
        content_text: content, // Cached for fast reads
        file_size: file.size,
        mime_type: file.type,
        path: documentPath,
        version: 0,
        indexing_status: 'pending', // Trigger will queue background indexing
      })
      .select()
      .single();

    console.log('[handleFileUpload] Insert result', {
      success: !insertError,
      error: insertError?.message,
      documentId: newDocument?.id
    });

    if (insertError) {
      // Rollback: Delete from Storage if database insert fails
      await supabase.storage.from('documents').remove([storagePath]);
      console.error('Database insert failed:', insertError);
      return new Response(
        JSON.stringify({
          error: 'Upload failed',
          message: insertError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Success: Return document metadata
    return new Response(
      JSON.stringify(newDocument),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('File upload error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
