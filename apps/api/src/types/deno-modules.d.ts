/**
 * Type declarations for Deno-specific module imports
 * These imports work at runtime in Deno but TypeScript doesn't recognize the protocols
 * during type-checking with Node/tsc
 */

// npm: protocol - Deno's npm package import
declare module 'npm:drizzle-orm@^0.29.0' {
  export * from 'drizzle-orm';
}

// jsr: protocol - JavaScript Registry imports
declare module 'jsr:@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}

// https: protocol - ESM CDN imports
declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export * from '@supabase/supabase-js';
}
