/**
 * Example Edge Function: Hello
 *
 * Demonstrates database access from Supabase Edge Functions using Drizzle ORM.
 * This function queries the database and returns statistics about documents.
 *
 * Deploy: supabase functions deploy hello
 * Test: curl http://localhost:54321/functions/v1/hello
 */

import { getDB } from '../_shared/db.ts';
import { eq } from 'npm:drizzle-orm@^0.29.0';
import * as schema from '../../db/schema.ts';

/**
 * CORS headers for client-side requests
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Main handler for the hello Edge Function
 */
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get database connection
    const { db, cleanup } = await getDB();

    try {
      // Example queries to demonstrate database access
      const userProfilesCount = await db
        .select({ count: schema.userProfiles.id })
        .from(schema.userProfiles);

      const documentsCount = await db
        .select({ count: schema.documents.id })
        .from(schema.documents);

      const agentRequestsCount = await db
        .select({ count: schema.agentRequests.id })
        .from(schema.agentRequests);

      // Return statistics
      const response = {
        message: 'Hello from Centrid Edge Function!',
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          statistics: {
            userProfiles: userProfilesCount.length,
            documents: documentsCount.length,
            agentRequests: agentRequestsCount.length,
          }
        },
        environment: {
          deno: Deno.version.deno,
          typescript: Deno.version.typescript,
          v8: Deno.version.v8,
        }
      };

      return new Response(
        JSON.stringify(response, null, 2),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
          status: 200,
        }
      );

    } finally {
      // CRITICAL: Always cleanup connection
      await cleanup();
    }

  } catch (error) {
    console.error('Edge Function error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 500,
      }
    );
  }
});
