// Centrid AI Filesystem - Supabase Client Configuration
// Version: 3.1 - Supabase Plus MVP Architecture

import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Minimal Database type to satisfy @supabase/auth-helpers-nextjs constraints
// We don't use this for type safety - GraphQL types are used instead
type Database = {
  public: {
    Tables: Record<string, any>;
    Views: Record<string, any>;
    Functions: Record<string, any>;
    Enums: Record<string, any>;
  };
};

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Note: Database generic is a placeholder for @supabase/auth-helpers-nextjs.
// We use GraphQL types (@/types/graphql) for actual type safety.
// These clients are only used for auth, storage, and realtime subscriptions.

// Client-side Supabase client (for browser usage)
export const supabase = createClientComponentClient<Database>();

// Alias for compatibility with new code
export const createClient = () => {
  return createClientComponentClient<Database>();
};

// Alternative client for server-side rendering and API routes
export const createSupabaseClient = () => {
  return createSupabaseJsClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Service role client for admin operations (server-side only)
export const createSupabaseServiceClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("Service role key not available");
  }
  return createSupabaseJsClient<Database>(supabaseUrl, serviceRoleKey);
};

// Real-time subscription helper
export const createRealtimeSubscription = (
  table: string,
  callback: (payload: any) => void,
  filters?: { [key: string]: string }
) => {
  let subscription = supabase
    .channel(`realtime:${table}`)
    .on("postgres_changes", { event: "*", schema: "public", table }, callback);

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      subscription = subscription.filter(key, "eq", value);
    });
  }

  return subscription.subscribe();
};

// Storage helpers
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || "3600",
      upsert: options?.upsert || false,
      contentType: options?.contentType || file.type,
    });

  if (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }

  return data;
};

export const downloadFile = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) {
    throw new Error(`File download failed: ${error.message}`);
  }

  return data;
};

export const getFileUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return data.publicUrl;
};

// Authentication helpers
export const signInWithProvider = async (
  provider: "google" | "github" | "apple"
) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(`Sign in failed: ${error.message}`);
  }

  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Sign in failed: ${error.message}`);
  }

  return data;
};

export const signUp = async (
  email: string,
  password: string,
  metadata?: any
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
};

// Database query helpers
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError!;
};

// Edge Function helpers
export const callEdgeFunction = async (
  functionName: string,
  payload?: any,
  options?: {
    method?: string;
    headers?: Record<string, string>;
  }
) => {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: payload,
    method: options?.method || "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (error) {
    throw new Error(`Edge function ${functionName} failed: ${error.message}`);
  }

  return data;
};

// Utility functions for common patterns
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Failed to get current user: ${error.message}`);
  }

  return user;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }

  return data;
};

// Export types for convenience
export type SupabaseClient = typeof supabase;
