# AGENTS.md — Pacific World School ERP

Read this file fully before doing anything in this repository.

## Start here

1. Read `PROJECT_STATUS.md`.
2. Read `docs/superpowers/specs/2026-11-03-school-erp-design.md`.
3. Confirm the task belongs to the current milestone. If it does not, say so instead of building it.

## What this project is

A single-school ERP for Pacific World School. Expo (React Native) app for teachers and students, React + Vite + Tailwind admin console, Supabase for Postgres, Auth, Storage, Realtime, and Edge Functions. Monorepo with npm workspaces.

## Non-negotiable rules

1. **No secrets in clients.** The mobile app and admin SPA may contain only a public Supabase URL and a publishable key, under these names: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. `..._ANON_KEY` is an accepted legacy alias; use one key family, not both. Full classification of every Vercel/Supabase variable: `docs/security/environment-variables.md`. `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWT_SECRET`, and all `POSTGRES_*` values are server-side only.
2. **Never add an `EXPO_PUBLIC_` or `VITE_` variable whose name contains SECRET, SERVICE, PRIVATE, JWT, POSTGRES, DATABASE, PASSWORD, or TOKEN** (the publishable/anon key is the sole exception).
3. **RLS is the authorization boundary.** Every new table gets RLS enabled with default-deny and policies. A migration without RLS tests is incomplete.
4. **Admins never write academic content.** Admin access to assignments, submissions, threads, and messages is read-only and audited.
5. **No student-to-student channel.** Messaging is teacher↔student only, with admin read access.
6. **Targeting is enforced server-side.** Never trust a recipient list from the client. Do not silently filter unauthorized targets; reject them.
7. **Do not invent branding.** Use tokens in `packages/shared/src/theme.ts` and assets supplied by the school.
8. **Do not add features outside the current milestone.** Record them in `PROJECT_STATUS.md` under deferred instead.

## Workflow

1. Read `PROJECT_STATUS.md`.
2. Make the smallest change that completes the task.
3. Run the checks that exist for the area you touched (typecheck, lint, unit tests, and RLS tests for any migration).
4. Update `PROJECT_STATUS.md`: what changed, file paths, how it was verified, what is next.
5. If you changed scope or architecture, update the design document's decision log.

## Definition of done

- Code typechecks and lints.
- New database tables have RLS policies and tests.
- New Edge Functions verify JWT, role, and input before acting.
- No secret appears in `apps/`.
- `PROJECT_STATUS.md` reflects reality.

## Commands

Populated in Milestone 0. Until then, no build or test commands exist.

## Layout

```
apps/mobile/        Expo app (teachers, students)
apps/ios/           Native SwiftUI app (Pacific World School) — xtool / SwiftPM, no Xcode install needed
apps/admin/         React + Vite admin console
packages/shared/    Types, Zod schemas, targeting logic, theme, Supabase client factory
supabase/           Migrations, Edge Functions, seed, pgTAP tests
docs/superpowers/   Design specs
```
