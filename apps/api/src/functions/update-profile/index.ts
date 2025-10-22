/**
 * Update Profile Edge Function
 *
 * Server-side profile update with JWT verification and RLS enforcement.
 * Users can only update their own profile (enforced by RLS policies).
 *
 * Flow:
 * 1. Verify JWT from Authorization header
 * 2. Validate input with Zod schema
 * 3. Update profile (RLS ensures user can only update their own)
 * 4. Return updated profile with auto-updated timestamp
 *
 * Security: RLS enforces user can only update their own profile
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

    // Initialize Supabase with ANON_KEY (respects RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
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

    // Parse and validate request body
    const body = await req.json()
    const { firstName, lastName } = body

    // Basic validation (Zod validation would be done on frontend)
    if (firstName !== undefined && firstName !== null) {
      const trimmed = firstName.trim()
      if (trimmed.length === 0) {
        return new Response(
          JSON.stringify({ error: 'First name cannot be empty' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      if (trimmed.length > 100) {
        return new Response(
          JSON.stringify({ error: 'First name must be less than 100 characters' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
        return new Response(
          JSON.stringify({
            error: 'First name contains invalid characters',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    if (lastName !== undefined && lastName !== null) {
      const trimmed = lastName.trim()
      if (trimmed.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Last name cannot be empty' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      if (trimmed.length > 100) {
        return new Response(
          JSON.stringify({ error: 'Last name must be less than 100 characters' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
        return new Response(
          JSON.stringify({
            error: 'Last name contains invalid characters',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Build update object (only update fields that were provided)
    const updates: any = {}
    if (firstName !== undefined) updates.first_name = firstName?.trim() || null
    if (lastName !== undefined) updates.last_name = lastName?.trim() || null

    // Update profile (RLS enforces user can only update their own profile)
    // updated_at is auto-updated by database trigger
    const { data: profile, error: updateError } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update failed:', updateError)
      return new Response(
        JSON.stringify({ error: 'Profile update failed' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Success - return updated profile
    return new Response(
      JSON.stringify({
        success: true,
        profile,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error in update-profile:', error)

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
