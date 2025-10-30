"use strict";
/**
 * Supabase Service Client
 * Singleton Supabase client for Realtime subscriptions
 * ✅ STATELESS - Exported as singleton, not instantiated
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseServiceClient = getSupabaseServiceClient;
var supabase_js_2_1 = require("https://esm.sh/@supabase/supabase-js@2");
var supabaseClient = null;
function getSupabaseServiceClient() {
    if (supabaseClient)
        return supabaseClient;
    var supabaseUrl = Deno.env.get('SUPABASE_URL');
    var serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }
    supabaseClient = (0, supabase_js_2_1.createClient)(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
    return supabaseClient;
}
