import { createClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';

const url = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const key =
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (() => {
  if (!url || !key) return null;
  try {
    return createClient<Database>(url, key);
  } catch {
    return null;
  }
})();

export function missingSupabaseConfig(): boolean {
  return !url || !key;
}

export function configHint(): string {
  return missingSupabaseConfig()
    ? 'Supabase not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY are accepted aliases).'
    : '';
}
