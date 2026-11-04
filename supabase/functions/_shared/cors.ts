// Shared CORS headers for the Supabase Edge Functions in this project.
// `*` is safe here: every function still requires a valid JWT and re-checks the
// caller's role against `profiles` before doing anything.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
