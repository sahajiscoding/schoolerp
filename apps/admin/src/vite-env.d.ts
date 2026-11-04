/// <reference types="vite/client" />

/**
 * Replaced at build time by the `__DEMO_MODE__` define in `vite.config.ts`
 * (true outside production). Guarding demo-only code with it — rather than with
 * a runtime object such as `import.meta.env.DEV` — lets the bundler prove the
 * branch is dead and strip the demo credentials from a production bundle.
 */
declare const __DEMO_MODE__: boolean;
