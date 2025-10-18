// Centrid AI Filesystem - Cross-device Synchronization Edge Function
// Version: 3.1 - Supabase Plus MVP Architecture

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SyncRequest {
  userId: string;
  deviceId: string;
  lastSyncTimestamp: string;
  operations?: SyncOperation[];
}

interface SyncOperation {
  type: "create" | "update" | "delete";
  entityType: "document" | "agent_request" | "agent_session";
  entityId: string;
  data?: any;
  timestamp: string;
}

interface SyncResponse {
  success: boolean;
  conflicts: ConflictItem[];
  operations: SyncOperation[];
  newSyncTimestamp: string;
}

interface ConflictItem {
  entityType: string;
  entityId: string;
  conflict: "version_mismatch" | "concurrent_edit" | "delete_modified";
  serverData: any;
  clientData: any;
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
    const syncRequest: SyncRequest = await req.json();

    if (
      !syncRequest.userId ||
      !syncRequest.deviceId ||
      !syncRequest.lastSyncTimestamp
    ) {
      return new Response(
        JSON.stringify({
          error: "userId, deviceId, and lastSyncTimestamp are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const conflicts: ConflictItem[] = [];
    const operationsToSend: SyncOperation[] = [];
    const currentTimestamp = new Date().toISOString();

    // Process incoming operations from client
    if (syncRequest.operations && syncRequest.operations.length > 0) {
      const processedConflicts = await processIncomingOperations(
        supabase,
        syncRequest.userId,
        syncRequest.operations,
        syncRequest.lastSyncTimestamp
      );
      conflicts.push(...processedConflicts);
    }

    // Get operations that happened since last sync
    const serverOperations = await getServerOperations(
      supabase,
      syncRequest.userId,
      syncRequest.lastSyncTimestamp,
      syncRequest.deviceId
    );
    operationsToSend.push(...serverOperations);

    // Update device sync timestamp
    await updateDeviceSyncTimestamp(
      supabase,
      syncRequest.userId,
      syncRequest.deviceId,
      currentTimestamp
    );

    const response: SyncResponse = {
      success: true,
      conflicts,
      operations: operationsToSend,
      newSyncTimestamp: currentTimestamp,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync operations error:", error);

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

async function processIncomingOperations(
  supabase: any,
  userId: string,
  operations: SyncOperation[],
  lastSyncTimestamp: string
): Promise<ConflictItem[]> {
  const conflicts: ConflictItem[] = [];

  for (const operation of operations) {
    try {
      const conflict = await processOperation(
        supabase,
        userId,
        operation,
        lastSyncTimestamp
      );
      if (conflict) {
        conflicts.push(conflict);
      }
    } catch (error) {
      console.error(`Error processing operation ${operation.entityId}:`, error);
    }
  }

  return conflicts;
}

async function processOperation(
  supabase: any,
  userId: string,
  operation: SyncOperation,
  lastSyncTimestamp: string
): Promise<ConflictItem | null> {
  const tableName = getTableName(operation.entityType);

  switch (operation.type) {
    case "create":
      return await processCreateOperation(
        supabase,
        userId,
        operation,
        tableName
      );

    case "update":
      return await processUpdateOperation(
        supabase,
        userId,
        operation,
        tableName,
        lastSyncTimestamp
      );

    case "delete":
      return await processDeleteOperation(
        supabase,
        userId,
        operation,
        tableName,
        lastSyncTimestamp
      );

    default:
      console.warn(`Unknown operation type: ${operation.type}`);
      return null;
  }
}

async function processCreateOperation(
  supabase: any,
  userId: string,
  operation: SyncOperation,
  tableName: string
): Promise<ConflictItem | null> {
  // Check if entity already exists
  const { data: existing } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", operation.entityId)
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Conflict: entity already exists
    return {
      entityType: operation.entityType,
      entityId: operation.entityId,
      conflict: "version_mismatch",
      serverData: existing,
      clientData: operation.data,
    };
  }

  // Create new entity
  const { error } = await supabase.from(tableName).insert({
    id: operation.entityId,
    user_id: userId,
    ...operation.data,
    created_at: operation.timestamp,
    updated_at: operation.timestamp,
  });

  if (error) {
    console.error(`Error creating ${operation.entityType}:`, error);
  }

  return null;
}

async function processUpdateOperation(
  supabase: any,
  userId: string,
  operation: SyncOperation,
  tableName: string,
  lastSyncTimestamp: string
): Promise<ConflictItem | null> {
  // Get current server version
  const { data: current } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", operation.entityId)
    .eq("user_id", userId)
    .single();

  if (!current) {
    // Entity doesn't exist on server, treat as create
    return await processCreateOperation(supabase, userId, operation, tableName);
  }

  // Check for conflicts
  if (current.updated_at > lastSyncTimestamp) {
    // Concurrent modification detected
    return {
      entityType: operation.entityType,
      entityId: operation.entityId,
      conflict: "concurrent_edit",
      serverData: current,
      clientData: operation.data,
    };
  }

  // Apply update
  const { error } = await supabase
    .from(tableName)
    .update({
      ...operation.data,
      updated_at: operation.timestamp,
    })
    .eq("id", operation.entityId)
    .eq("user_id", userId);

  if (error) {
    console.error(`Error updating ${operation.entityType}:`, error);
  }

  return null;
}

async function processDeleteOperation(
  supabase: any,
  userId: string,
  operation: SyncOperation,
  tableName: string,
  lastSyncTimestamp: string
): Promise<ConflictItem | null> {
  // Get current server version
  const { data: current } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", operation.entityId)
    .eq("user_id", userId)
    .single();

  if (!current) {
    // Entity already deleted or doesn't exist
    return null;
  }

  // Check for conflicts
  if (current.updated_at > lastSyncTimestamp) {
    // Entity was modified after client's last sync
    return {
      entityType: operation.entityType,
      entityId: operation.entityId,
      conflict: "delete_modified",
      serverData: current,
      clientData: null,
    };
  }

  // Perform delete
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", operation.entityId)
    .eq("user_id", userId);

  if (error) {
    console.error(`Error deleting ${operation.entityType}:`, error);
  }

  return null;
}

async function getServerOperations(
  supabase: any,
  userId: string,
  lastSyncTimestamp: string,
  deviceId: string
): Promise<SyncOperation[]> {
  const operations: SyncOperation[] = [];

  // Get document changes
  const documentOps = await getEntityOperations(
    supabase,
    "documents",
    "document",
    userId,
    lastSyncTimestamp
  );
  operations.push(...documentOps);

  // Get agent request changes
  const agentRequestOps = await getEntityOperations(
    supabase,
    "agent_requests",
    "agent_request",
    userId,
    lastSyncTimestamp
  );
  operations.push(...agentRequestOps);

  // Get agent session changes
  const agentSessionOps = await getEntityOperations(
    supabase,
    "agent_sessions",
    "agent_session",
    userId,
    lastSyncTimestamp
  );
  operations.push(...agentSessionOps);

  return operations;
}

async function getEntityOperations(
  supabase: any,
  tableName: string,
  entityType: string,
  userId: string,
  lastSyncTimestamp: string
): Promise<SyncOperation[]> {
  const operations: SyncOperation[] = [];

  // Get created/updated entities
  const { data: entities } = await supabase
    .from(tableName)
    .select("*")
    .eq("user_id", userId)
    .gte("updated_at", lastSyncTimestamp)
    .order("updated_at");

  if (entities) {
    entities.forEach((entity: any) => {
      const isNew = entity.created_at >= lastSyncTimestamp;
      operations.push({
        type: isNew ? "create" : "update",
        entityType: entityType as any,
        entityId: entity.id,
        data: entity,
        timestamp: entity.updated_at,
      });
    });
  }

  // Note: For deletes, we would need a separate deleted_entities table
  // or soft delete mechanism to track deletions since last sync
  // This is simplified for MVP

  return operations;
}

async function updateDeviceSyncTimestamp(
  supabase: any,
  userId: string,
  deviceId: string,
  timestamp: string
): Promise<void> {
  // This would typically be stored in a devices table
  // For MVP, we can store in user metadata or separate table
  const { error } = await supabase
    .from("user_profiles")
    .update({
      metadata: supabase.rpc("jsonb_set", {
        target: supabase.rpc("COALESCE", { value: "metadata", fallback: "{}" }),
        path: `{device_sync,${deviceId}}`,
        new_value: JSON.stringify({
          last_sync: timestamp,
          device_id: deviceId,
        }),
      }),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating device sync timestamp:", error);
  }
}

function getTableName(entityType: string): string {
  const tableMap: { [key: string]: string } = {
    document: "documents",
    agent_request: "agent_requests",
    agent_session: "agent_sessions",
  };

  return tableMap[entityType] || entityType + "s";
}

/* To deploy this function, run:
 * supabase functions deploy sync-operations --no-verify-jwt
 *
 * This function handles:
 * - Incoming client operations (create, update, delete)
 * - Conflict detection and resolution
 * - Server-side change tracking
 * - Cross-device synchronization
 */
