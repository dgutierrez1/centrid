import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Folders Edge Function
 * Handles folder CRUD operations with circular reference validation and path recomputation
 *
 * Endpoints:
 * - POST /folders - Create new folder
 * - PUT /folders/:id - Update folder (rename/move)
 * - DELETE /folders/:id - Delete folder (cascade)
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const folderId = pathParts[pathParts.length - 1]; // Extract folder ID from path

    // Route to appropriate handler
    if (req.method === 'POST') {
      return await handleCreateFolder(supabase, user.id, req);
    } else if (req.method === 'PUT' && folderId) {
      return await handleUpdateFolder(supabase, user.id, folderId, req);
    } else if (req.method === 'DELETE' && folderId) {
      return await handleDeleteFolder(supabase, user.id, folderId);
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed or missing folder ID' }),
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
 * Compute folder path from parent hierarchy
 */
async function computeFolderPath(supabase: any, folderId: string | null): Promise<string> {
  if (!folderId) return '/';

  const pathParts: string[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const { data: folder, error } = await supabase
      .from('folders')
      .select('name, parent_folder_id')
      .eq('id', currentId)
      .single();

    if (error || !folder) break;

    pathParts.unshift(folder.name); // Prepend to array
    currentId = folder.parent_folder_id;
  }

  return '/' + pathParts.join('/');
}

/**
 * Check for circular references when moving a folder
 */
async function hasCircularReference(
  supabase: any,
  folderId: string,
  newParentId: string | null
): Promise<boolean> {
  if (!newParentId) return false; // Moving to root is always safe

  // Check if newParentId is the same as folderId (self-reference)
  if (newParentId === folderId) return true;

  // Traverse up from newParentId to check if folderId appears in ancestry
  let currentId: string | null = newParentId;

  while (currentId) {
    if (currentId === folderId) {
      return true; // Circular reference detected
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .select('parent_folder_id')
      .eq('id', currentId)
      .single();

    if (error || !folder) break;

    currentId = folder.parent_folder_id;
  }

  return false;
}

/**
 * Recompute paths for folder and all descendants recursively
 */
async function recomputePaths(supabase: any, folderId: string) {
  // Compute new path for this folder
  const { data: folder, error: folderError } = await supabase
    .from('folders')
    .select('parent_folder_id')
    .eq('id', folderId)
    .single();

  if (folderError || !folder) {
    console.error('Failed to fetch folder for path recomputation:', folderError);
    return;
  }

  const newPath = await computeFolderPath(supabase, folder.parent_folder_id);
  const folderName = await supabase
    .from('folders')
    .select('name')
    .eq('id', folderId)
    .single();

  const fullPath = newPath === '/' ? `/${folderName.data?.name}` : `${newPath}/${folderName.data?.name}`;

  // Update this folder's path
  await supabase
    .from('folders')
    .update({ path: fullPath })
    .eq('id', folderId);

  // Get all direct children (folders and documents)
  const { data: childFolders } = await supabase
    .from('folders')
    .select('id')
    .eq('parent_folder_id', folderId);

  const { data: childDocuments } = await supabase
    .from('documents')
    .select('id, name')
    .eq('folder_id', folderId);

  // Recursively recompute child folders
  if (childFolders && childFolders.length > 0) {
    for (const child of childFolders) {
      await recomputePaths(supabase, child.id);
    }
  }

  // Recompute document paths
  if (childDocuments && childDocuments.length > 0) {
    for (const doc of childDocuments) {
      const docPath = fullPath === '/' ? `/${doc.name}` : `${fullPath}/${doc.name}`;
      await supabase
        .from('documents')
        .update({ path: docPath })
        .eq('id', doc.id);
    }
  }
}

/**
 * Handle POST /folders - Create new folder
 */
async function handleCreateFolder(supabase: any, userId: string, req: Request) {
  try {
    const body = await req.json();
    const { name, parent_folder_id } = body;

    // Validate inputs
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid folder name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate name doesn't contain invalid characters
    if (name.includes('/') || name.includes('\\') || /[\x00-\x1F]/.test(name)) {
      return new Response(
        JSON.stringify({ error: 'Folder name contains invalid characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute path from parent
    const path = await computeFolderPath(supabase, parent_folder_id);
    const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;

    // Create folder
    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        name,
        parent_folder_id: parent_folder_id || null,
        path: fullPath,
      })
      .select()
      .single();

    if (error) {
      console.error('Create folder error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create folder', message: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(folder),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Create folder error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle PUT /folders/:id - Update folder (rename/move)
 */
async function handleUpdateFolder(supabase: any, userId: string, folderId: string, req: Request) {
  try {
    const body = await req.json();
    const { name, parent_folder_id } = body;

    // Fetch current folder
    const { data: currentFolder, error: fetchError } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId)
      .single();

    if (fetchError || !currentFolder) {
      return new Response(
        JSON.stringify({ error: 'Folder not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (currentFolder.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updates: any = {};

    // Handle rename
    if (name !== undefined && name !== currentFolder.name) {
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid folder name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (name.includes('/') || name.includes('\\') || /[\x00-\x1F]/.test(name)) {
        return new Response(
          JSON.stringify({ error: 'Folder name contains invalid characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      updates.name = name;
    }

    // Handle move
    if (parent_folder_id !== undefined && parent_folder_id !== currentFolder.parent_folder_id) {
      // Check for circular references
      const isCircular = await hasCircularReference(supabase, folderId, parent_folder_id);
      if (isCircular) {
        return new Response(
          JSON.stringify({ error: 'Circular reference detected', message: 'Cannot move folder into its own descendant' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      updates.parent_folder_id = parent_folder_id || null;
    }

    // Update folder
    const { data: updatedFolder, error: updateError } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', folderId)
      .select()
      .single();

    if (updateError) {
      console.error('Update folder error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update folder', message: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Recompute paths for this folder and all descendants
    await recomputePaths(supabase, folderId);

    return new Response(
      JSON.stringify(updatedFolder),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Update folder error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handle DELETE /folders/:id - Delete folder (cascade via FK)
 */
async function handleDeleteFolder(supabase: any, userId: string, folderId: string) {
  try {
    // Fetch folder to verify ownership
    const { data: folder, error: fetchError } = await supabase
      .from('folders')
      .select('user_id')
      .eq('id', folderId)
      .single();

    if (fetchError || !folder) {
      return new Response(
        JSON.stringify({ error: 'Folder not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership
    if (folder.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete folder (cascade deletes children via FK)
    const { error: deleteError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);

    if (deleteError) {
      console.error('Delete folder error:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete folder', message: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Delete folder error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
