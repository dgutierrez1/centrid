/**
 * Auth Middleware
 * Verifies JWT token with Supabase and attaches user context
 *
 * PERFORMANCE: Caches Supabase client at module scope for warm starts
 * TIMEOUT: 5s timeout on auth.getUser() to prevent hanging requests
 */

import type { Context, Next } from "hono";
import { createClient } from "@supabase/supabase-js";

// Cached Supabase client (reused across warm requests)
let _supabaseClient: any = null;

/**
 * Get cached Supabase client (lazy initialization)
 */
function getSupabaseClient() {
  if (!_supabaseClient) {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
    }

    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("[Auth] Supabase client initialized (cold start)");
  }
  return _supabaseClient;
}

/**
 * Timeout wrapper for promises
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMsg: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    ),
  ]);
}

export const authMiddleware = async (c: Context, next: Next) => {
  const startTime = performance.now();
  const authStartTime = performance.now();

  // Allow CORS preflight OPTIONS requests without auth
  if (c.req.method === "OPTIONS") {
    return c.text("", 204);
  }

  // Extract token from Authorization header
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    console.warn("[Auth] Missing or invalid Authorization header");
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = authHeader.substring(7);

  // SPECIAL: Allow service role key for internal endpoints (/execute)
  // Service role key is used for service-to-service calls
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (token === serviceRoleKey) {
    console.log(
      "[Auth] Service role key detected - allowing internal request for:",
      c.req.path
    );
    // For internal requests, use a system ID
    c.set("userId", "system-internal");
    c.set("userEmail", "system@internal");
    c.set("requestId", crypto.randomUUID());
    c.set("startTime", startTime);
    await next();
    return;
  }

  try {
    // Get cached Supabase client
    const supabase = getSupabaseClient();
    const clientInitTime = performance.now() - authStartTime;

    // Verify token with 5-second timeout
    const authPromiseStartTime = performance.now();
    const result = await withTimeout(
      supabase.auth.getUser(token),
      5000,
      "Auth verification timed out after 5s"
    );
    const authCallTime = performance.now() - authPromiseStartTime;

    const {
      data: { user },
      error,
    } = result;

    if (error || !user) {
      console.warn(
        JSON.stringify({
          level: "warn",
          message: "Auth verification failed",
          error: error?.message || "No user returned",
          authCallTime_ms: Math.round(authCallTime),
          timestamp: new Date().toISOString(),
        })
      );

      return c.json({ error: "Invalid or expired token" }, 401);
    }

    // Attach user context to request
    c.set("userId", user.id);
    c.set("userEmail", user.email);
    c.set("requestId", crypto.randomUUID());
    c.set("startTime", startTime);

    // Log auth timing
    const totalAuthTime = performance.now() - authStartTime;
    console.log(
      JSON.stringify({
        level: "debug",
        message: "Auth successful",
        userId: user.id,
        clientInit_ms: Math.round(clientInitTime),
        authCall_ms: Math.round(authCallTime),
        totalAuth_ms: Math.round(totalAuthTime),
        timestamp: new Date().toISOString(),
      })
    );

    // Continue to next handler
    await next();

    // Log request completion
    const duration = performance.now() - startTime;
    console.log(
      JSON.stringify({
        level: "info",
        message: "Request completed",
        userId: user.id,
        requestId: c.get("requestId"),
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration_ms: Math.round(duration),
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    const errorTime = performance.now() - authStartTime;
    console.error(
      JSON.stringify({
        level: "error",
        message: "Auth middleware error",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        errorTime_ms: Math.round(errorTime),
        timestamp: new Date().toISOString(),
      })
    );

    return c.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
