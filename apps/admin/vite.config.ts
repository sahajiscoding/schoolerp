import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The admin console reads its public Supabase credentials from the exact names
 * the Vercel project already uses (`SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`),
 * with `VITE_` aliases kept for local `.env` files. These are inlined at build
 * time, so the names are part of the contract — do not rename them.
 *
 * Vite only auto-exposes `VITE_`-prefixed variables to client code and only
 * puts `VITE_` variables into `process.env`, so reading `process.env` alone
 * silently missed a plain `SUPABASE_URL=` line in `.env`. `loadEnv(…, '')`
 * reads *every* variable from `.env*` files, which makes the documented names
 * work from a local `.env` file, from the shell, and on Vercel alike.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const read = (name: string) => process.env[name] ?? env[name] ?? '';

  const supabaseUrl = read('SUPABASE_URL') || read('VITE_SUPABASE_URL');
  const supabaseKey =
    read('SUPABASE_PUBLISHABLE_KEY') ||
    read('VITE_SUPABASE_PUBLISHABLE_KEY') ||
    read('VITE_SUPABASE_ANON_KEY');

  return {
    plugins: [react()],
    define: {
      'import.meta.env.SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseKey),
      // Replaced with the literal `true`/`false`, so demo accounts and the
      // demo-credential hint are eliminated from production bundles.
      __DEMO_MODE__: JSON.stringify(mode !== 'production'),
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
  };
});
