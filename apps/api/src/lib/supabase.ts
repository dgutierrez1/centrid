/**
 * Supabase Service Client
 * Singleton Supabase client for Realtime subscriptions
 * ✅ STATELESS - Exported as singleton, not instantiated
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

let supabaseClient: any = null;

export function getSupabaseServiceClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
}

export type SupabaseServiceClient = ReturnType<typeof getSupabaseServiceClient>;
