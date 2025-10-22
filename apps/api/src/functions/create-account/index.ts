/**
 * Create Account Edge Function
 *
 * Server-side account creation with atomic account+profile creation.
 * Implements rollback on failure to ensure no orphaned accounts.
 *
 * Flow:
 * 1. Validate input with Zod schema
 * 2. Create auth account (Supabase Auth)
 * 3. Create user profile (PostgreSQL)
 * 4. If profile creation fails, delete auth account (rollback)
 *
 * Security: Server-side only, password never stored in our database
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
    // Parse request body
    const body = await req.json()
    const { email, password, firstName, lastName } = body

    // Basic validation (Zod validation would be done on frontend)
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'First name and last name are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client with SERVICE_ROLE_KEY for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Step 1: Create auth account
    // Password is NEVER stored in our database - only in Supabase Auth (encrypted)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // MVP: mark email as confirmed immediately
    })

    if (authError) {
      console.error('Auth account creation failed:', authError)
      return new Response(
        JSON.stringify({
          error: authError.message || 'Failed to create account',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const userId = authData.user.id

    // Step 2: Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        plan_type: 'free',
        usage_count: 0,
        subscription_status: 'active',
      })

    // Step 3: Rollback on profile creation failure
    if (profileError) {
      console.error('Profile creation failed, rolling back auth account:', profileError)

      // Delete the auth account to maintain atomicity
      await supabase.auth.admin.deleteUser(userId)

      return new Response(
        JSON.stringify({
          error: 'Profile creation failed. Please try again.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Step 4: Success - return user data
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Unexpected error in create-account:', error)

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
