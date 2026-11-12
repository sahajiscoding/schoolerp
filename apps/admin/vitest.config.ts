import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.SUPABASE_URL': JSON.stringify('https://school.example.invalid'),
    'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify('sb_publishable_test'),
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    testTimeout: 15_000,
  },
});
