import { createClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (() => {
  if (!url || !key) return null;
  try {
    return createClient<Database>(url, key);
  } catch {
    return null;
  }
})();
