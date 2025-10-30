/**
 * CORS headers for Edge Functions
 * Allows requests from the web application
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

/**
 * Get CORS headers with specific origin
 */
export function getCorsHeadersWithOrigin(origin?: string) {
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': origin || '*',
  };
}
