# Project Status — Pacific World School ERP

**Last updated:** 2026-11-05
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
| Login | `src/pages/Login.tsx` | School design; always-visible **"Try a demo"** button (Admin / Teacher / Student), including with Supabase configured; remembered account |
| Demo entry | `src/contexts/AuthContext.tsx` | `signInAsDemo(role)` opens isolated `/demo` with a seeded role; `src/lib/demo.ts` defines the route boundary; no Supabase client is created inside `/demo` |

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
| Function hardening | `supabase/migrations/0003_function_hardening.sql` | Narrows EXECUTE on the SECURITY DEFINER helpers to `authenticated` |
| **Security-audit hardening** | `supabase/migrations/0004_profiles_hardening.sql` | Fixes the 8 audit findings: protects `profiles.role/is_active/login_id` (column grants + trigger), scopes profile reads, closes audit-log forgery, scopes attendance/report-card/event/goal writes |
| Base RLS matrix | `supabase/tests/rls_matrix.sql` | 24 assertions |
| Dashboard RLS matrix | `supabase/tests/rls_matrix_dashboard.sql` | 24 assertions (leave routing, self-approval guard, events scoping, fees/siblings, cards) |
| Local RLS verifier | `supabase/tests/verify_rls_local.py` | Boots a throwaway Postgres, applies 0001–0004, asserts the rules as `authenticated` incl. new security regressions (self-escalation, audit forgery, cross-section writes) — run `npm run verify:rls` |
| Admin provisioning function | `supabase/functions/admin-users/index.ts` | `create-admin`, `import-students` (`Student@DDMMYYYY`); verifies JWT + admin role, writes audit log |
| Shared CORS | `supabase/functions/_shared/cors.ts` | — |
| Admin bootstrap | `scripts/create-admin.mjs` | Local-only, service role from environment |
| CI | `.github/workflows/ci.yml` | Rewritten (the committed file was a single line of literal `\n`): typecheck, lint, build, secret guard, env-name guard |

### Original demo entry + credential removal (2026-11-05; visibility restriction superseded below)

- Login page has a small "Try a demo" button that expands into Admin / Teacher / Student options; one click enters that role's dashboard with no login. Shown only in demo mode (no Supabase configured); `signInAsDemo` refuses when a Supabase client exists, so the client never decides identity against a live backend.
- Demo teacher display name is now **Teacher** (seed profile, sample notification, and teaching-assignment sample row). Existing `v3` demo data migrates to `v4` without resetting other demo edits. Verified: admin typecheck/lint/build clean; 39 role smoke checks and 6 storage-migration checks pass; production bundle contains no old display name.
- All hardcoded demo passwords removed (GitGuardian): `DEMO_LOGINS` in `AuthContext.tsx`, the split-string credential hint in `Login.tsx`, the hardcoded fallback password in `appData.tsx` (no DOB → no initial password shown), the literal sibling password in `seed.ts` (now derived via `passwordFromDob`), and the example password in `scripts/create-admin.mjs` (password is prompted interactively). The `__DEMO_MODE__` compile flag is gone — there is nothing left to strip. **2026-11-05: the git history was also purged** — `git filter-repo` replaced the demo-password literals across all commits and `main` was force-pushed, so they no longer appear in any reachable commit (GitGuardian may need a re-scan / GitHub GC of dangling objects to fully clear old incidents).
- Fixed a display bug in `People.tsx`: the import help rendered `Student@Student@14052010` (double prefix); it now shows the derived value once.
- The school's `Student@DDMMYYYY` initial-password rule is unchanged — it is derived from DOB at runtime (`utils.ts`, `admin-users` Edge Function), never stored as a literal.
- Verified: admin + shared typecheck clean; eslint 0 errors; production build passes; `grep` of `dist/assets/*.js` finds zero credential strings and the demo button ships in the bundle (works on a deployed demo-mode build). jsdom smoke test clicked through all three roles: correct seeded identity, role-aware nav, sign-out returns to login — 39/39 checks pass.

### Demo visibility investigation (2026-11-05; before the fix below)

- Read-only application/configuration review confirmed the demo picker exists in `apps/admin/src/pages/Login.tsx`, but renders only when `missingSupabaseConfig()` is true (`src/lib/supabase.ts`, `src/contexts/AuthContext.tsx`). Network unavailability does not enable demo mode; the presence of both public configuration values disables the picker.
- Vercel metadata confirms the latest ready production deployment uses commit `29681ccca26a4af81602b2e072fe9018c5efe4fe` (the inspected source), and the project has `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` configured for production. This explains the hidden production demo entry; no secrets were decrypted and no deployment/settings were changed. Live browser behaviour was not tested in this investigation.
- The separate header **View as** control in `src/components/AppShell.tsx` is available only after signing in with an admin profile. Next: decide whether to offer a separate isolated demo deployment or implement an explicit isolated demo experience alongside live login; do not remove production authentication configuration to expose the picker.

### Demo alongside configured Supabase (2026-11-05)

- Owner requested demos on the configured production site without creating accounts. `apps/admin/src/pages/Login.tsx` now always offers **Try a demo → Admin / Teacher / Student**; the signed-in header also links to `/demo/login`. Live login remains visible while auth restoration is pending, so slow Supabase does not hide demo entry.
- `src/lib/demo.ts`, `src/lib/supabase.ts`, `src/contexts/AuthContext.tsx`, and `src/App.tsx` isolate the showcase under `/demo` using full-page entry/exit and a separate router base. No Supabase client or live auth subscription is created there; backend session identity stays null. The seeded role survives refresh in tab-local storage. Invalid roles are rejected; demo sign-out does not sign out a real account.
- `src/lib/appData.tsx` stores showcase edits separately (`pws.showcase.data.v1`), with no migration from the school-console store. `src/components/AppShell.tsx` displays a persistent sample-data banner and **Exit demo · School sign in**. Demo login never displays a remembered real account.
- Added Vitest/jsdom regression tests under `apps/admin/tests/`, `vitest.config.ts`, the `test` workspace script, and a CI test step. Verified: 10 tests pass (all roles, configured Supabase, direct entry, refresh, sign-out, data/reset isolation, blocked storage, invalid roles, pending auth, normal password login); admin/shared typechecks pass; admin lint has 0 errors and 3 existing fast-refresh warnings; production build passes (bundle-size warning only).
- PR #4 review follow-up: school password submission waits for session restoration (including Enter-key submission), while demo links remain available. Added regression assertions for this race; async mount checks use a closure to avoid incorrect static narrowing across `await`.
- Updated `docs/security/environment-variables.md` and the design decision log. No production environment variables, auth accounts, database policies, or deployments changed. Next: deploy this branch's changes to make the demo entry visible on the production site; keep future backend modules isolated from `/demo`.

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
- 25 RLS assertions run as the `authenticated` role: all pass (leave routing to the class teacher only, peer rows invisible, students cannot mark attendance, author report cards, create sibling links or approve their own leave, teachers cannot publish school-wide events).
- **Two SQL shadowing defects found on 2026-11-04**, by testing the helper functions directly on Postgres:
  1. `teaches_section(section_id uuid)` compared the column to *itself* (the parameter shadowed it), so it returned true for every caller and every section, widening every policy built on it.
  2. The `threads` INSERT policy had `e.student_id = student_id`, degenerating to `e.student_id = e.student_id` and letting any teacher open a thread with any student.
  Both fixed (parameters prefixed `p_`, outer references qualified) with regression assertions that fail if the bug is restored. Migration `0003` narrows EXECUTE on the `SECURITY DEFINER` helpers to `authenticated`. All helpers pin `search_path = ''`.

### Security, deployment and dependency state (2026-11-04)

- `npm audit` reports **0 vulnerabilities**. Existing advisories were fixed, not
  suppressed: zod → 4.6.7 (PR #1), glob pinned to ^14.0.3 and minimatch to
  ^11.0.4 via `overrides` in the root `package.json`.
- eslint upgraded 9 → 10 with typescript-eslint 8.72 (which already supports
  eslint 10) and react-hooks 7 / react-refresh 0.5. eslint 10 found three dead
  stores in `normalizeDob()`, fixed.
- **XSS fixed** in the two `document.write()` sinks (`printHtml()` and the study
  room preview). Both interpolated teacher-entered text into HTML. Every value
  now passes through `escapeHtml()`, and an eslint `no-restricted-syntax` rule
  bans new `document.write()` calls. Verified with a hostile `<img src=x
  onerror=...>` title pushed through the real UI: stored verbatim, rendered
  inert, zero live injected elements.
- **Deploy 404 fixed**: `vercel.json` now rewrites unknown paths to
  `index.html` (excluding `/assets` and `/brand`), so refreshing `/login` no
  longer 404s. Verified against the real build output.
- CI runs on Node 22 with `npm ci`; typecheck, lint (0 errors) and the admin
  build all pass. First-party actions moved off deprecated Node 20 runtimes.
- All seven paid vendor scanners (**Black Duck, Synopsys, CxFlow, Checkmarx One,
  CodeScan, Endor Labs, Debricked**) were **removed on 2026-11-05** — they only
  ever failed on missing vendor credentials, not findings. CodeQL stays the
  always-on baseline, with free Codacy + OSSAR on top. See `docs/security/scanning.md`.

### Supabase project

`apps/admin/.env` points at project `ausnymdtnpewcfvdrpcu` using the documented
unprefixed names. The file is git-ignored and holds only the public publishable
key, which is safe to ship in a browser bundle. The sandbox cannot reach
`*.supabase.co`, so the console still runs in demo mode here and the migrations
have not been applied to that project from this environment.

## Known gaps

0. **Functional audit (2026-11-05) — all defects FIXED:** every module was click-tested as admin/teacher/student. The first pass found 12 broken + 4 partial defects (Teaching Assignments stub, four desktop-hidden dialogs, students marking attendance, empty audit log, "View as" trap, Submissions roster, Subjects edit, per-student declarations, event/broadcast targeting). **All 15 were fixed and re-verified: 82 working / 0 broken / 0 partial / 11 notes across 93 runtime checks.** Details: `docs/audits/2026-11-05-functional-audit.md`.
0b. **Security audit (2026-11-05) — full Cloudflare `security-audit` skill, all findings FIXED:** the live Supabase RLS layer, Edge Function, client, deploy headers and CI were audited. Found **1 critical + 4 medium + 3 low** issues — the critical one let any signed-in user escalate themselves to admin via the `profiles_self` policy. All 8 are fixed in `supabase/migrations/0004_profiles_hardening.sql` (+ an Edge Function normalization fix), with new regression assertions in `verify_rls_local.py`. Report, traces and owner replay plan: `~/security-audit-skill/schoolerp/run-1/` (REPORT.md / FINDINGS-DETAIL.md / NEEDS-VALIDATION.md). **Migrations 0001–0004 have now been APPLIED to the live Supabase project (`ausnymdtnpewcfvdrpcu`) and verified empirically:** 32 tables all RLS-enabled; a live student self-escalation attempt returns `permission denied for table profiles`, while a legitimate self-service rename succeeds (role unchanged). Test data was cleaned up.
1. The admin console still runs on the demo store. Wiring it to the new tables (replacing `appData.tsx` with Supabase queries) is the next step; the types and RLS already match.
2. The pgTAP suites themselves have not been run through `supabase test db` (no Docker here); their rules are covered by `supabase/tests/verify_rls_local.py`, which passes against real Postgres 14.
3. Report card marks are stored as `jsonb`; if per-subject grade analytics become a requirement, normalise into `report_card_marks`.
4. Mobile app screens are still scaffold-only.
5. Design review against the owner's reference screenshots is pending — the sandbox cannot run a browser, so visual QA is by code and build.

## Next up

1. ~~Apply `0001`–`0004`~~ **Done** — applied to the live project and verified. Remaining: run the pgTAP suites (`supabase test db`) when Docker is available, and deploy the `admin-users` Edge Function.
2. Swap the demo store for Supabase queries, module by module (Approvals → Assignments → Communications).
3. Deploy `admin-users`; run `scripts/create-admin.mjs` for the first admin.
4. Mobile: login, assignments, approvals.

## Security audit — 2026-11-06 (application security & agentic threat model)

Full report: `docs/audits/2026-11-06-application-security-audit.md`. Executable proofs:
`apps/admin/tests/poc-security.test.tsx` (4 tests, green — they assert the *current, insecure*
behaviour so the suite stays honest; each carries a commented FIXED assertion to enable after
remediation).

**Result:** 2 critical, 5 high, 5 medium, 6 low. No secrets in history; `npm audit` clean; no
LLM/MCP/agent surface exists in the repo (the agentic taxonomy was applied to the credential and
trust boundaries instead).

**Critical / high, in fix order:**
- **F-01 (High residual — SCHOOL POLICY, accepted 2026-11-06)** `Student@DDMMYYYY` derived
  credentials (`lib/utils.ts:32`, `admin-users/index.ts:26`, `appData.tsx:277/317`) stay, because
  staff must hand a known password to a parent at the counter. Design doc §18 records this. The
  password is derived from public data, so **login is now a low-assurance identifier and the data
  behind it must be defended in RLS**. Mandatory compensating controls (report §F-01a–F-01e):
  F-01a self-chosen PIN + trusted-device step-up (no SMS cost, the school's stated constraint),
  F-01b assurance tiers that deny `leave_requests`/`fee_records`/guardian contact to password-only
  sessions, F-01c Supabase Auth rate limits + `login_events` burst alerting, F-01d no bulk credential
  display or CSV export, F-01e formal accepted-risk record with a review date and a named owner.
  Without them the residual rating is still Critical.
- **F-02 (critical)** `declaration_signatures_student_insert` only checks `auth.uid() = student_id`
  (`0002:352`) — any user can sign any consent form for any student. **Live in the deployed schema.**
- **F-03 (high)** `polls_teacher_insert` lets any teacher broadcast school-wide and
  `poll_options_owner_insert` guards writes but `polls_read` is unscoped (`0002:356-364`).
- **F-04 (high)** `viewAsRole` feeds `isAdmin()`/`requireRole()` (`AuthContext.tsx:96-104`) — a
  teacher session can open every admin client gate. Proven by PoC-2.
- **F-05 (high)** DOB, guardian phone and initial passwords serialized to `localStorage`
  (`appData.tsx:248`). Proven by PoC-3.
- **F-06 (high)** `must_change_password` is never enforced and no change-password flow exists
  anywhere (`grep updateUser` → none), so initial credentials never rotate.

Medium: poll votes (F-08), audit-log integrity + unaudited exports (F-09), notice receipts (F-10),
unscoped `is_enrolled`/`class_teacher_of_section` (F-11), library `FOR ALL` for all teachers (F-12),
DPDP data-transfer posture (F-13), plus lows F-14…F-18.

**Proposed migration (NOT applied):** `supabase/migrations/0005_authorization_hardening.sql` consolidates
the SQL remediation (helpers, assurance tiers, declaration signatures, polls, votes, receipts, audit
trail, library). Apply to a staging project first and extend `supabase/tests/verify_rls_local.py` with
negative cases for F-02/F-03/F-08/F-10 before touching production.

**Next up (changed):** apply `0005_authorization_hardening.sql` to the live project **before** wiring
the console to Supabase. The credential scheme stays (school policy); the compensating controls in
report §F-01a-F-01e are now the priority work, not credential replacement.
