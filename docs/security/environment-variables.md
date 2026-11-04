# Environment Variables Classification

Two families, never mixed:

- **Public** — safe to ship in a browser bundle. These are the names the Vercel
  project already uses. Keep them; do not rename.
- **Secret** — server-side only (Supabase Edge Functions, scripts, CI). Never
  referenced from `apps/`.

## Public (safe in clients)

| Name | Used by | Notes |
|---|---|---|
| `SUPABASE_URL` | `apps/admin` | Project URL. Vercel name. |
| `SUPABASE_PUBLISHABLE_KEY` | `apps/admin` | Publishable (anon) key. Vercel name. |
| `VITE_SUPABASE_URL` | `apps/admin` | Local `.env` alias for `SUPABASE_URL`. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `apps/admin` | Local `.env` alias. |
| `VITE_SUPABASE_ANON_KEY` | `apps/admin` | Legacy alias, accepted for `PUBLISHABLE_KEY`. |
| `EXPO_PUBLIC_SUPABASE_URL` | `apps/mobile` | Expo public name. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `apps/mobile` | Expo public name. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `apps/mobile` | Legacy alias. |

`apps/admin/vite.config.ts` inlines `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` into `import.meta.env` at build time. The alias
lookup order is: exact Vercel name → `VITE_` alias → legacy `ANON` alias.
`apps/admin/src/lib/supabase.ts` reads the same names, so a `.env` written with
either family works without touching source.

Vite only puts `VITE_`-prefixed variables into `process.env` and only exposes
`VITE_`-prefixed variables to client code, so the config reads `.env*` files
through `loadEnv(mode, process.cwd(), '')`. Without that, a plain
`SUPABASE_URL=` line in `apps/admin/.env` was ignored and the console fell back
to demo mode, reporting "Supabase not configured" even though the value was set.
Shell/Vercel values still win over `.env` file values.

### Why the names matter

The admin app is deployed on Vercel with `SUPABASE_URL` and
`SUPABASE_PUBLISHABLE_KEY` already set. Renaming them would force an env
migration for no security benefit — both are public by design. Only the prefix
differs; the value is the same publishable key.

## Secret (server-side only)

| Name | Where it may live |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions env, local scripts, CI secrets |
| `SUPABASE_SECRET_KEY` | Same as above (newer Supabase naming) |
| `SUPABASE_JWT_SECRET` | Supabase project settings only |
| `POSTGRES_*` | Local or CI database connections |
| `EXPO_ACCESS_TOKEN` | Expo build server |

### Enforcement

1. Never prefix a secret with `EXPO_PUBLIC_` or `VITE_`. Anything with those
   prefixes is shipped to every visitor.
2. `.github/workflows/ci.yml` greps `apps/` and `scripts/` for
   `(EXPO_PUBLIC|VITE)_*(SECRET|SERVICE|PRIVATE|JWT|POSTGRES|PASSWORD|TOKEN)`
   and fails the build, allowing only `PUBLISHABLE_KEY` / `ANON_KEY`.
3. CI also fails if `SUPABASE_SERVICE_ROLE_KEY` appears anywhere under `apps/`.
4. The service role key is only used by `supabase/functions/*` (from the
   function environment) and `scripts/create-admin.mjs` (run locally).

## Local setup (admin console)

```bash
cp apps/admin/.env.example apps/admin/.env
# then fill in the two public values from the Supabase dashboard → Settings → API
```

`apps/admin/.env.example`:

```dotenv
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

Without these values the console starts in **demo mode** on the seeded school
data and shows a banner. Nothing is written to a database, so it is safe to
demo to staff.
