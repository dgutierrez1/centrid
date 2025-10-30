/**
 * Database Access for Services
 * Supabase client for auth operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cached service role Supabase client (reused across warm requests)
let _serviceRoleClient: any = null;

/**
 * Get Supabase client for auth operations (service role)
 * Caches client at module scope for performance
 */
export async function getSupabase() {
  if (!_serviceRoleClient) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required.'
      );
    }

    _serviceRoleClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log('[Database] Service role Supabase client initialized (cold start)');
  }

  return { supabase: _serviceRoleClient };
}

/**
 * Type exports
 */
export type SupabaseClient = Awaited<ReturnType<typeof getSupabase>>['supabase'];
