# Project Status — Pacific World School ERP

**Last updated:** 2026-11-04
**Current milestone:** Milestone 3 — Dashboard modules (admin console complete, backend schema written, mobile pending).
**Next milestone:** Wire the admin console to Supabase (replace demo store), then Milestone 4 — Messaging.

This file is the single source of truth for project state. Every agent must read it before starting work and update it before finishing. Keep it short, factual, and linked to files. Do not record intentions as completed work.

---

## What exists

### Admin console (`apps/admin`)

| Item | Path | State |
|---|---|---|
| Routes + role guards | `src/App.tsx` | 19 routes; admin-only routes redirect non-admins; `AppDataProvider` mounted |
| Shell, sidebar, notifications | `src/components/AppShell.tsx` | Role-aware nav (student view hides administration and relabels pages), badges, mobile drawer |
| UI kit | `src/components/ui.tsx` | Button, Card, Badge, Table, StatCard, Breadcrumbs, NotificationsDropdown, RoleSwitcher |
| Demo domain types | `src/lib/types.ts` | Students, leave, goals, declarations, polls, events, library, report cards, attendance, fees |
| Demo store + actions | `src/lib/appData.tsx` | `localStorage`-backed, versioned key, back-fills newly seeded collections |
| Seed data | `src/lib/seed.ts` | 1 admin, 2 teachers, 9 students, 3 study materials, 1 poll, events, fees, siblings |
| Helpers | `src/lib/utils.ts` | Dates, INR, CSV parser, `normalizeDob` (rejects 31 Feb), `passwordFromDob`, `gradeFor`, `printHtml` |
| Supabase client | `src/lib/supabase.ts` | Reads `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`; `configHint()` names the missing pair |
| Build config | `vite.config.ts` | `loadEnv(mode, cwd, '')` so **unprefixed** `SUPABASE_URL` works from `.env`; inlines both names via `define` |
| Login | `src/pages/Login.tsx` | School design; demo credentials hint; remembered account |

### Dashboard modules

| Page | Path | Behaviour |
|---|---|---|
| Dashboard | `src/pages/Dashboard.tsx` | Distinct admin / teacher / student layouts, fee collection bar, quick links |
| Approvals | `src/pages/Approvals.tsx` | Student applies; **class teacher of the section** approves/rejects; history + filters |
| Course Progress | `src/pages/CourseProgress.tsx` | Teacher/admin add goals per student; student sees own goals |
| Communications | `src/pages/Communications.tsx` | Declaration forms (compose + sign), message broadcast, polls (create + vote) |
| Events & Calendar | `src/pages/Events.tsx` | Month calendar; admins publish school-wide, teachers publish class-only |
| Assignments | `src/pages/Assignments.tsx` | Teacher name on every card, attachments, submit flow, submissions review tab |
| Study Room | `src/pages/StudyRoom.tsx` | **Share PDF** for teachers/admin; students open shared material |
| My Library | `src/pages/Library.tsx` | Add/remove books, issue to a student, return, reserve |
| My Report Card | `src/pages/ReportCard.tsx` | Teacher enters student + class + subjects + marks → card generated, printable, assigned |
| My Attendance | `src/pages/Attendance.tsx` | Day grid; teacher marks present/absent per student; student reads own |
| My Fee | `src/pages/Fees.tsx` | Invoices, payments, **50% sibling discount on the second child**, sibling link/unlink |
| People | `src/pages/People.tsx` | Add student, **CSV import** with validation, template + credentials export |
| Classes / Enrollments / Subjects / Audit | `src/pages/*` | Class + section management, placement, subject list, read-only audit trail |
| Gallery | `src/pages/Gallery.tsx` | Album grid from seed |

### Backend

| Item | Path | State |
|---|---|---|
| Initial schema + RLS | `supabase/migrations/0001_initial_schema.sql` | 77 statements, parses clean; `current_role()` renamed to `app_role()` (was a reserved-keyword bug) |
| Dashboard schema + RLS | `supabase/migrations/0002_dashboard_modules.sql` | 15 tables, class-teacher helpers, sibling links, admin-only fees; 82 statements, parses clean |
| Base RLS matrix | `supabase/tests/rls_matrix.sql` | 24 assertions |
| Dashboard RLS matrix | `supabase/tests/rls_matrix_dashboard.sql` | 24 assertions (leave routing, self-approval guard, events scoping, fees/siblings, cards) |
| Local RLS verifier | `supabase/tests/verify_rls_local.py` | Boots a throwaway Postgres, applies both migrations, asserts 20 rules as `authenticated` — **all pass** |
| Admin provisioning function | `supabase/functions/admin-users/index.ts` | `create-admin`, `import-students` (`Student@DDMMYYYY`); verifies JWT + admin role, writes audit log |
| Shared CORS | `supabase/functions/_shared/cors.ts` | — |
| Admin bootstrap | `scripts/create-admin.mjs` | Local-only, service role from environment |
| CI | `.github/workflows/ci.yml` | Rewritten (the committed file was a single line of literal `\n`): typecheck, lint, build, secret guard, env-name guard |

### Verification done

- `npm run typecheck --workspace=apps/admin` — clean.
- `npm run build --workspace=apps/admin` — passes (tsc -b + vite build).
- `npm run lint --workspace=apps/admin` — 0 errors, 6 pre-existing fast-refresh/exhaustive-deps warnings.
- Runtime smoke test (jsdom + esbuild bundle, 2026-11-04): booted the real app, signed in as each demo user, visited all 19 routes — no runtime errors; student menu excludes administration; teacher is redirected off admin routes.
- CSV import smoke test: 4-row file with `Student Name, Admission No., Date of Birth` headers → 2 valid / 2 flagged, correct `Student@DDMMYYYY` passwords, bad date rejected, import writes rows to the table.
- All three SQL files parse with `pglast`.
- **Both migrations applied to a real Postgres 14 instance** (via `pgserver`) on 2026-11-04. This caught three genuine defects that a parser cannot see:
  1. `class_teacher_id` was added *after* the helper functions that read it — every call raised `column s.class_teacher_id does not exist`. The `ALTER TABLE` now runs first.
  2. `section_ids <@ ARRAY(SELECT …)` in the teacher-event policy compared an array against a single row, so teachers could never publish a class event. Replaced with `NOT EXISTS (… NOT teaches_section(…))`.
  3. A leave could be moved between any two statuses by any reviewer; the policy now requires `status = 'pending'` on the way in and `decided_by = auth.uid()` on the way out.
- 20 RLS assertions run as the `authenticated` role: all pass (leave routing to the class teacher only, peer rows invisible, students cannot mark attendance, author report cards, create sibling links or approve their own leave, teachers cannot publish school-wide events).

## Known gaps

1. The admin console still runs on the demo store. Wiring it to the new tables (replacing `appData.tsx` with Supabase queries) is the next step; the types and RLS already match.
2. The pgTAP suites themselves have not been run through `supabase test db` (no Docker here); their rules are covered by `supabase/tests/verify_rls_local.py`, which passes against real Postgres 14.
3. Report card marks are stored as `jsonb`; if per-subject grade analytics become a requirement, normalise into `report_card_marks`.
4. Mobile app screens are still scaffold-only.
5. Design review against the owner's reference screenshots is pending — the sandbox cannot run a browser, so visual QA is by code and build.

## Next up

1. Apply `0001` + `0002`, run both pgTAP suites, fix any policy fallout.
2. Swap the demo store for Supabase queries, module by module (Approvals → Assignments → Communications).
3. Deploy `admin-users`; run `scripts/create-admin.mjs` for the first admin.
4. Mobile: login, assignments, approvals.
