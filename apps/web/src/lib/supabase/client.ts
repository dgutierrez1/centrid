import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/types'

/**
 * Browser Supabase Client
 *
 * Creates a Supabase client for use in browser/client-side code.
 * Automatically handles session persistence in localStorage.
 *
 * Usage:
 *   import { supabase } from '@/lib/supabase/client'
 *   const { data } = await supabase.from('table').select('*')
 *
 * Or:
 *   import { createClient } from '@/lib/supabase/client'
 *   const supabase = createClient()
 */
export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Singleton instance for convenience (most common usage)
export const supabase = createClient()
