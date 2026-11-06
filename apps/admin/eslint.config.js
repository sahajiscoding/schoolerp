import js from '@eslint/js'
import globals from 'globals'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['node_modules/', 'dist/', 'build/', '.vite/'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        // Build-time constant from vite.config.ts (see src/vite-env.d.ts).
        __DEMO_MODE__: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off',
      // Defence in depth for the printable documents built in printHtml() and
      // the study-room preview: dynamic HTML must go through escapeHtml().
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='write']",
          message:
            'document.write() with interpolated values is an XSS sink. Build the string with escapeHtml() from lib/utils first.',
        },
      ],
    },
  },
  {
    // The demo store must stay browser-only: appData.tsx and seed.ts may never
    // reach for a Supabase client. Auth (contexts/AuthContext.tsx) and Login
    // are the only files allowed to import it, and both refuse while a demo
    // session is active (see lib/demoSession.ts).
    files: ['src/lib/appData.tsx', 'src/lib/seed.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/supabase', '**/supabase.*'],
              message: 'Demo store must stay browser-only — never import the Supabase client here.',
            },
          ],
        },
      ],
    },
  },
]
