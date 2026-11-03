# Project Status — Pacific World School ERP

**Last updated:** 2026-11-03
**Current milestone:** Milestone 2 — Auth + roster (in progress). Admin login page rebuilt to match the school's existing login design; Milestone 0 (Foundation) and Milestone 1 (Schema + RLS) complete.
**Next milestone:** Milestone 3 — Assignments (after Milestone 2 completes)

This file is the single source of truth for project state. Every agent must read it before starting work and update it before finishing. Keep it short, factual, and linked to files. Do not record intentions as completed work.

---

## What exists

| Item | Path | State |
|---|---|---|
| Approved v1 design | `docs/superpowers/specs/2026-11-03-school-erp-design.md` | Written, awaiting owner review |
| Agent contract | `AGENTS.md` | Written |
| Status document | `PROJECT_STATUS.md` | This file |
| npm workspaces monorepo | `package.json` | Initialized (apps/*, packages/*) |
| Shared package (theme, types foundation) | `packages/shared/` | Initialized |
| Admin app (React + Vite + Tailwind) | `apps/admin/` | Scaffolded |
| Mobile app (Expo + TypeScript) | `apps/mobile/` | Scaffolded |
| Supabase config | `supabase/config.toml` | Initialized |
| Environment variable docs | `docs/security/environment-variables.md` | Written |
| CI workflow with secret guard | `.github/workflows/ci.yml` | Added |
| .env.example files | `apps/admin/.env.example`, `apps/mobile/.env.example` | Added |
| Admin app shell + homepage | `apps/admin/src/App.tsx` | Router shell (AuthProvider + Layout); /home = Dashboard, /login, protected /dashboard, /classes, /people |
| Admin login page | `apps/admin/src/pages/Login.tsx` | Rebuilt to match the school's existing login: split layout, school logo, glass mission card over campus photo, remembered-account picker, Remember Me, password visibility |
| Login brand assets | `apps/admin/public/brand/` | School logo and two campus photos downloaded from the school's current PWS login page |
| Admin dependencies | `apps/admin/package.json` | Added react-router-dom, clsx, date-fns, tailwind-merge, react-icons |
| ESLint flat config | `apps/admin/eslint.config.js` | TypeScript parser, React globals, node_modules/dist ignored |
| Admin build | `apps/admin/dist/` | `npm run build` (tsc -b + vite build) passes |
| Shared package | `packages/shared/src/{theme,database.types,supabase,targeting}.ts` | Types, theme, Supabase client factory, targeting logic |
| Supabase initial schema + RLS | `supabase/migrations/0001_initial_schema.sql` | All tables, RLS policies, helper functions, views (uncommitted) |
| RLS matrix tests | `supabase/tests/rls_matrix.sql` | 24 pgTAP assertions (uncommitted) |

## In progress

Milestone 0 — Foundation complete. Milestone 1 — Schema + RLS complete. Milestone 2 — Auth + roster in progress: admin login UI rebuilt and manually verified at 1440×900 in both the form and remembered-account states. `npm run build --workspace=apps/admin` passes; lint passes with one pre-existing `react-refresh` warning in `AuthContext.tsx`. Remaining: apply migration/seed, mobile login, forced password change, roster flows.

## Next up

Milestone 2 — Auth + roster:

1. Apply `supabase/migrations/0001_initial_schema.sql` to local Supabase and seed data.
2. Wire mobile app (expo-router + NativeWind) login + dashboard screens.
3. Forced password change on first login.

Then Milestone 3 — Assignments.

## Deferred (explicitly out of v1)

Fees and payments · attendance · report cards and grades · library · gallery · events · course progress · parent accounts · student-to-student chat · multi-school tenancy · offline write queue · web version of student/teacher app · public signup.

## Known risks

| Risk | Impact | Mitigation |
|---|---|---|
| RLS is the only authorization wall | One bad policy exposes student data | RLS matrix tests required for every migration |
| Teacher↔minor private messaging | Safeguarding and legal exposure | Admin read access, audit log, no student-to-student channel, no admin posting inside threads |
| Service role key accidentally shipped | Full database compromise | Never referenced in `apps/`; CI grep; secrets only via `supabase secrets set` |
| Expo `EXPO_PUBLIC_*` is public | Silent secret leak in APK | Only URL and anon key allowed; documented ban list |
| Apple review of school apps | Rejection for thin functionality or missing account deletion | Native features, privacy policy, deletion request flow, reviewer demo account |
| Solo build alongside school | Schedule slip | Milestones with definitions of done; no dates |

## Secrets manifest

**Public (expected in clients):**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy alias: `EXPO_PUBLIC_SUPABASE_ANON_KEY`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (legacy alias: `VITE_SUPABASE_ANON_KEY`)

**Secret (Supabase Edge Functions only):**
- `SUPABASE_SERVICE_ROLE_KEY` and/or `SUPABASE_SECRET_KEY`
- `SUPABASE_JWT_SECRET` (never used manually; highest severity if leaked)
- All `POSTGRES_*` connection values
- `EXPO_ACCESS_TOKEN`
- Future payment, SMS, email, and AI provider keys

**Ignored in this stack:** `NEXT_PUBLIC_SUPABASE_*` (Next.js-only naming; Vite and Expo will not read it).

Full classification: `docs/security/environment-variables.md`.

No secret has been created or stored yet.

## Decisions log

See section 18 of the design document. Add new decisions there and summarize here only if they change scope.

## Open questions

- Which school staff member owns messaging moderation and the privacy policy?
- Academic year dates.
- Class/section/subject list and teacher mapping.
- Roster CSV format and source system.

## Agent update protocol

Before finishing any task:

1. Move completed items from "Next up" / "In progress" to "What exists" with file paths.
2. Record anything newly deferred.
3. Add new risks or open questions.
4. Update "Last updated".
5. Never mark something done without a test or manual verification note.
