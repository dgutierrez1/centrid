/**
 * Delete Account Edge Function
 *
 * Permanently deletes user account with cascade delete of all related data.
 * Requires explicit confirmation ("DELETE") to prevent accidental deletion.
 *
 * Flow:
 * 1. Verify JWT from Authorization header
 * 2. Validate confirmation input
 * 3. Delete auth account (triggers cascade delete of all user data)
 * 4. Return success message
 *
 * Security: JWT verification ensures only the account owner can delete
 * GDPR Compliance: Cascade delete removes 100% of user data (no orphans)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get JWT from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Initialize Supabase with SERVICE_ROLE_KEY for admin operations (deleteUser)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify JWT and get user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse and validate confirmation
    const body = await req.json()
    const { confirmation } = body

    if (confirmation !== 'DELETE') {
      return new Response(
        JSON.stringify({ error: 'Type DELETE to confirm' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Delete user account
    // This triggers CASCADE DELETE on all related data:
    // - user_profiles
    // - documents
    // - document_chunks (via documents)
    // - agent_requests
    // - agent_sessions
    // - usage_events
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Account deletion failed:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Account deletion failed. Please try again.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully. You have been logged out.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error in delete-account:', error)

    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
