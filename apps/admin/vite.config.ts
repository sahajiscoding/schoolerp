import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The admin console reads its public Supabase credentials from the exact names
 * the Vercel project already uses (`SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`),
 * with `VITE_` aliases kept for local `.env` files. These are inlined at build
 * time, so the names are part of the contract — do not rename them.
 */
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseKey),
  },
  server: {
    host: '0.0.0.0',
    // The Arena sandbox serves previews from a generated sub-domain; allow any
    // host so the live preview and localhost both work.
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
