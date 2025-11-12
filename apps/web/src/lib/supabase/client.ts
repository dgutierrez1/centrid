import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser Supabase Client
 *
 * Creates a Supabase client for use in browser/client-side code.
 * Automatically handles session persistence in localStorage.
 *
 * Note: No Database generic type needed - we use GraphQL for queries/mutations.
 * This client is only used for auth and realtime subscriptions.
 *
 * Usage:
 *   import { supabase } from '@/lib/supabase/client'
 *   const { data } = await supabase.auth.getSession()
 *
 * Or:
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 */
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Singleton instance for convenience (most common usage)
export const supabase = createClient()
