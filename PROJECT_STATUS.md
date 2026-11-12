# Project Status — Pacific World School ERP

**Last updated:** 2026-11-12
**Current milestone:** PWS clone (owner-approved re-scope beyond Milestone 3, 2026-11-07) — 28-route report parity UI + `0005` clone tables landed on the demo store; live Supabase wiring follows module by module.
**Next milestone:** Wire clone routes to Supabase queries/RPCs (Homeworks → Library → Fees), then Milestone 4 — Messaging (live).

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
| Login | `src/pages/Login.tsx` | Rebuilt to reference parity (owner's site, 2026-11-07): layout, copy, logo/photos, `#020817` tokens, `.pws-checkbox`, measured crossfade, reference tab title; always-visible **"Try a demo"** button (Admin / Teacher / Student) including with Supabase configured; remembered account |
| Authenticated shell | `src/components/AppShell.tsx` | Rebuilt from owner-authorized live DOM recon (2026-11-07): olive sticky header, 20% fixed sidebar, student nav order/icons, collapse/reflow, fixed School For Schools footer, mobile drawer, notifications, account menu, theme toggle, demo controls; assistant tab uses a local no-token fallback (no vendor iframe/JWT) |
| Student dashboard | `src/pages/Dashboard.tsx`, `src/lib/dashboard.ts` | Live-reference parity for greeting/profile hero, recent-actions empty state, and four-row Upcoming Events card; multi-day events expand into dated rows; demo identity/avatar remain anonymized. Admin/teacher dashboards retained under the rebuilt shell |
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
| Homeworks | `src/pages/Homeworks.tsx`, `src/pages/HomeworkSubmit.tsx`, `src/lib/useHomeworksData.ts`, `src/lib/homeworksLive.ts` | Live-Supabase-wired assignment hub + submit. Demo store unchanged; live mode reads/writes Supabase via typed assignments, atomic publish RPC, student-owned submission RPC, private Storage signed URLs |
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
| Homeworks live wiring | `supabase/migrations/0006_homeworks_live.sql`, `supabase/tests/rls_homeworks.sql` | Typed assignments (`kind`, `subject_id`), atomic `publish_assignment` RPC, student-owned `submit_assignment`/`review_submission` RPCs, private Storage buckets (`homework-files`, `submission-files`) with owner-folder RLS; fixes submission INSERT policy OR-precedence bug that allowed section-member forgery |
| Admin provisioning function | `supabase/functions/admin-users/index.ts` | `create-admin`, `import-students` (`Student@DDMMYYYY`); verifies JWT + admin role, writes audit log |
| Shared CORS | `supabase/functions/_shared/cors.ts` | — |
| Admin bootstrap | `scripts/create-admin.mjs` | Local-only, service role from environment |
| CI | `.github/workflows/ci.yml` | Rewritten (the committed file was a single line of literal `\n`): typecheck, lint, build, secret guard, env-name guard |
| Supabase config | `supabase/config.toml` | Fixed 2026-11-07: was a single line of literal `\n` (`toml: expected newline but got U+005C` in CI run 128104765111); restored real newlines, `project_id = "schoolerp"` unchanged |

### Original demo entry + credential removal (2026-11-05; visibility restriction superseded below)

- **2026-11-06 — Demo is browser-only and isolated from Supabase:** `apps/admin/src/lib/demoSession.ts` (new) is the single flag (`sessionStorage`, per-tab) for a demo session. `lib/supabase.ts` returns a null client while it is set, `AuthContext` restores the seeded profile without any `getSession`/profile fetch and blocks real `signIn` while demo is active, `signOut` in demo clears only the flag (never calls Supabase), and `Login` is guarded the same way. All demo mutations stay in `lib/appData.tsx` → `localStorage` (`pws.demo.data.v5`); `appData.tsx`/`seed.ts` carry an eslint guard that forbids importing the Supabase client. "Try a demo" is now available even when Supabase is configured (same URLs — no `/demo` prefix); the sidebar banner reads "Demo mode — sample data only. Changes stay in this browser and never write to Supabase." + Reset / Exit demo. Design decision log updated (supersedes the 2026-11-05 "disabled when Supabase is configured" rule).
- **2026-11-06 — Demo names anonymized to role labels:** every demo profile that carried a personal name now shows the role only — `p-teacher-2` (`apps/admin/src/lib/seed.ts`, `apps/ios/Sources/PacificWorldSchool/Seed.swift`) became `Teacher` and all seven seeded students became `Student` (admin stays `School Administrator`); `Assigned by …` cards now read `Teacher` everywhere. Name-derived seed emails were also replaced with login-derived `@pws.local` addresses, audit targets now use `Student <admission no.>` identifiers, the iOS message greeting and the seeded submission filename use the generic role, and the People CSV template/placeholder examples (`apps/admin/src/pages/People.tsx`) use `Student`. Web storage bumped to `pws.demo.data.v5` (`apps/admin/src/lib/appData.tsx`) with a migration that refreshes stored seeded ids (people, `aud-2/3/5`, seeded submission) on next load (no reset needed; legacy values are matched by id so they are not kept in the bundle). Verified: admin + shared typecheck clean, eslint 0 errors, production build passes, and a scan of `dist/assets/*.js` finds none of the old demo names. iOS is seed-parity only and was not rebuilt here. The design-spec Owner line is unchanged — it is project metadata, not a demo user.
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

- **2026-11-07 (config fix):** `supabase/config.toml` re-parses (`tomllib` → `{'project_id': 'schoolerp', 'api': {...}, 'db': {...}}`); `supabase status` / `db lint` now fail only on missing Docker/Postgres, no longer on TOML parse. All 4 workflow YAMLs parse; no other `.toml` in repo. `npm run typecheck --workspace=apps/admin|@schoolerp/shared` + mobile `tsc` clean; `npm run lint --workspace=apps/admin` 0 errors (4 pre-existing warnings). Note: root `npm run typecheck` (`scripts/typecheck-all.mjs`) exits 1 on Windows only — `spawnSync npm ENOENT` (needs `shell:true` for `npm.cmd`); all 3 workspace checks pass individually and it works on `ubuntu-latest` CI. No push / no new runs triggered.

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

### Native iOS (`apps/ios`) — 2026-11-05

| Item | Path | State |
|---|---|---|
| SwiftUI app (native, xtool / SwiftPM; no Xcode install required) | `apps/ios` | Builds for `arm64-apple-ios17.0` with `xtool dev build` — clean, no warnings; artifact at `apps/ios/xtool/PacificWorldSchool.app` |
| Scope | `Sources/PacificWorldSchool/` | Role-aware demo (Admin / Teacher / Student) mirroring the web console: login + demo entry, dashboard, leave approvals, assignments (submit / composer / roster review), messages (teacher↔student threads + admin read-only oversight), course progress, notices, declarations, polls, events, study room, library, attendance, fees (50% 2nd-child sibling discount), report cards (shareable), people (add student, DOB-derived password preview), audit log, profile, account deletion request, gallery |
| Demo parity | `Seed.swift`, `DemoStore.swift` | Live Supabase wiring is not done; same state as the admin console (demo-first, unchanged by this addition) |
| Verification | `xtool dev build` | Debug build passes on iOS 27.2 SDK; no SwiftUI/Swift 6 errors; not run on a device (no device attached here) |

### PWS clone (2026-11-07, owner-approved re-scope)

- Approach A (evolve in place), spec `docs/superpowers/specs/2026-11-07-pws-clone-design.md`. 28 canonical URLs byte-identical to the report; old routes redirect with query strings preserved verbatim (`QueryRedirect` in `apps/admin/src/App.tsx` — no `/demo` prefix). Deep links to old URLs land on the new page, never 404.
- New routes: `/homeworks`, `/homeworks/:id/submit`, `/my-library`, `/issue-book`, `/digital-library`, `/examination-report-cards`, `/my-attendance`, `/fee-collections/create`, `/school-gallery`, `/school-gallery/:albumId/:mediaId`, `/circulars`, `/circulars/:id`, `/declaration-forms`, `/messages` (+ `/create`, `/:id`), `/polls`, `/profile` — all wired to the browser-only demo store (`lib/appData.tsx`, `pws.demo.data.v5`); live Supabase queries follow module by module.
- Reskin: Roboto, Pacific Navy `#1e3a8a` + blue `#2563eb` accent via `packages/shared/src/theme.ts` + `apps/admin/tailwind.config.cjs` (legacy `olive`/`terracotta` classes alias to the report identity so existing pages recolor without edits); daylight auto theme 05:00–18:00 + manual override in `lib/theme.tsx` + `index.html` inline init (`dps-theme-preference`/`dps-theme-mode` keys kept for parity). `dark:` surfaces on new pages + shell.
- **Color-accent match (2026-11-07, owner decision: use olive):** navy/blue replaced with the live-measured olive canonical set from `documentElement` on `pws.schoolforschools.ai/login` — primary/main/sidebar-primary `#5A6638` (hsl 76,29%,31%), accent `#7C8D4E` (43%), ring/sidebar-ring `#687641` (36%), hover/hover-text `#FE1616` (hsl 0,99%,54%), on-primary `#FFFFFF`. Tokens in `packages/shared/src/theme.ts` + `apps/admin/tailwind.config.cjs` (olive scale 300/400/600/700 added; `navy`/`olive` legacy aliases = primary, `terracotta` = accent). UI kit (`ui.tsx`: Button/Badge/StatCard to `brand.*` roles, new `danger`/`holiday` badges, blue removed), `Login.tsx` (primary bg + red hover + olive ring), `AppShell.tsx` + `Layout.tsx` (nav/sidebar hover red), `Dashboard.tsx` gradient `from-olive to-olive-700` now resolves (`#404828`), and semantic fixes off `terracotta`-as-blue: Approvals rejected `danger`/pending `warning`, Attendance present `success`/absent `danger`, Fees outstanding/unpaid `danger`, Assignments missing `warning`, Events holiday indigo. Verified: shared + admin `typecheck` clean, `lint` 0 errors (4 pre-existing fast-refresh warnings), `build` passes (`5a6638`/`404828`/`fe1616` present in `dist` CSS), `test` 6/6 vitest pass. WCAG note: white-on-primary ≈6.8:1 passes AA; white on accent (≈4.1:1) and hover red (≈3.9:1) match the reference verbatim but fail AA for small text — use red hover for bold/large or sidebar affordance only. Browser was disconnected in this session, so live computed-style re-measurement was not possible; values are the owner-supplied live DOM vars.
- Radius deps added (`lucide-react`, Radix dialog/dropdown/avatar/tabs) per spec §3; `lucide` icons roll out in the shell migration pass.
- Backend: `supabase/migrations/0005_pws_clone_tables.sql` adds `schools`, `academic_sessions`, fee chain (`fee_cycles` → `fee_installments`), examination family (9 tables, CBSE 9-point), library chain (`library_books`/`transactions`/`rules`/`kiosk_sessions`), `circulars`, `transport_area_routes`, `transport_vehicles`, `parent_links` — each RLS default-deny with policies; private Storage buckets `homework-files`, `submission-files`, `gallery-media`, `avatars`, `circular-files` (signed URLs only). Kiosk sessions are service-role only.
- Demo isolation unchanged: `sessionStorage` flag + `localStorage` store, null Supabase client while demo, banner "Changes stay in this browser and never write to Supabase". Demo identities stay anonymized (`Teacher`/`Student` only); report PII/S3 URLs never copied into seeds.
- Verified: admin `typecheck` clean, `lint` 0 errors (4 pre-existing fast-refresh warnings), `build` passes; no secret-like public vars in `apps/`; `dist` scan still clean of old demo names.

### Replica build pass (2026-11-07)

- Artifacts (reference screenshots deliberately NOT captured — headless browser; recon is DOM-measured + spec-scoped): `replica/recon.md` (26 screens S01–S26, 7 flows F01–F07, S02+ guess-marked behind login), `replica/features.csv` (parity **85.2**, must-haves **26/28**), `replica/design/tokens.json` + `components.md` (olive locked from live DOM: primary `#5A6638`, accent-2 `#7C8D4E`, ring `#687641`, hover `#FE1616` — matches `theme.ts`/`tailwind.config.cjs` after accent-fix; contrast **0 AA failures** with white-on-accent-2 as large-text exception 3.64:1), `replica/build-log.md`, `replica/test-plan.md`, `replica/bugs.md`, `replica/rea-notes.md` (REA = method cross-check only; replica clean-room wins), `replica/diff-report.md`.
- Host finding: `schoolerp-desktop.vercel.app` is the live clone; `school-erp.vercel.app` returns "React App" (not the clone).
- Skipped: reference-logo/photo/copy/PII/private-API rows in `features.csv` (clean-room skip, never scored).
- Code change: `apps/admin/src/pages/DigitalLibrary.tsx` — no-op "Open e-book" fixed (navigates to `/study-room`).
- Verified: admin `typecheck` clean, `lint` 0 errors (4 pre-existing warnings), `build` passes (428 modules), `test` 6/6 vitest pass; `contrast.py` exit 0; `parity.py` 85.2.
- Remaining deltas in `replica/diff-report.md` punch list: dark chrome one step lighter than reference (`#0f172a`/`#1e293b` vs `#020817`), S01 font (spec-mandated Roboto vs reference system-ui), Tiptap pending (textarea today), live Supabase wiring pending.

### Login page rebuilt against the owner's reference (2026-11-07)

- Owner confirmed they own `https://pws.schoolforschools.ai/login` (full licenses), so `apps/admin/src/pages/Login.tsx` was rebuilt to match it from live DOM/computed-style recon (reference bundle not copied; original code per project convention). Brand assets needed no work: `apps/admin/public/brand/{pws-logo.png,campus-1.jpg,campus-2.jpg}` are SHA256-identical to the reference's S3 assets.
- Matched: shrink-to-fit content column, 24/8/24px form gaps, labels 14px/600, foreground `#020817` (exact reference HSL token — Tailwind `slate-950` is `#020617`, 2 units off), `slate-200` input borders, seamless password field (`border-e-0` + `border-l-0` eye button, no focus ring), 24px eye icon in a 57px button, forgot-link olive + underline-only hover (reference never uses `--hover-primary` red), submit `hover:bg-brand-primary/90` (`#5a6638e6`) with `ring-1 ring-brand-ring`, `.pws-checkbox` custom blue `#2563eb` check mirroring the reference's `.form-checkbox`, crossfade retuned to the measured 12s cycle / ~6s per photo / 700ms blend (both layers animate; `campus-1.jpg` first), right glass card without `backdrop-blur-md`, dark mode to reference tokens (`#020817` panels/inputs, slate-400 borders/labels, slate-50 text), and the tab title `Login - Pacific world school - School for Schools` (restored on unmount). Clone-only features kept: demo picker, remembered-account card, notice/error states, `prefers-reduced-motion`.
- Verified: `typecheck` clean, `lint` 0 errors (4 pre-existing warnings), `build` passes (dist CSS contains `#020817`, `#5a6638e6`, 12s crossfade, `pws-checkbox`), `test` 6/6 pass; live DOM diff of `localhost:5173/login` vs the reference matches on every measured property (light and dark). Note for future recon: in this environment the browser window does not render frames, so `transition-colors` elements report their pre-change value — inject `transition:none` before reading computed styles.

### Dashboard + shared shell rebuilt against the owner's reference (2026-11-07)

- `apps/admin/src/components/AppShell.tsx` now matches the authenticated student shell: full-width olive sticky header, dual school marks, numeric notification badge, daylight/manual theme control, identity + account menu, `#FAFAFA` fixed 20% desktop sidebar, lucide student navigation in the observed order, Communications submenu, desktop collapse control, responsive mobile drawer, and fixed School For Schools footer. Clone-only demo reset/exit, role preview, notification actions, and role-aware staff navigation remain functional.
- The observed right-edge control opens a protected third-party assistant on the reference. The clone reproduces the affordance with a local fallback to Messages and deliberately embeds no vendor iframe, account JWT, or external assistant URL.
- `apps/admin/src/pages/Dashboard.tsx` now matches the student hero, time-of-day greeting, month/admission metadata, View Profile action, recent-actions empty state, and Upcoming Events card. `apps/admin/src/lib/dashboard.ts` expands a multi-day event into the four dated event rows (`07`, `09`, `10`, `11 Nov`) without changing seed data. Reference PII/profile photography remains excluded; the demo renders its anonymized name and initials.
- Shared dark chrome tokens now use the measured `#020817` background/card, `#1E293B` border, and `#94A3B8` muted foreground (`packages/shared/src/theme.ts`, `apps/admin/tailwind.config.cjs`, `apps/admin/src/index.css`). The reference intentionally keeps the event card light in dark mode; the clone does too.
- Verified: admin + shared typecheck clean; lint 0 errors / 4 pre-existing warnings; production build passes (2,472 modules); tests 7/7 including the multi-day event regression; `git diff --check` clean. Live DOM comparison at identical 1000×700 and 816×706 viewports matches shell/main/footer/hero/event geometry and computed light/dark surfaces. Student/admin/teacher runtime smoke checks pass, sidebar/footer reflow and all popovers work, browser console is clean, Lighthouse accessibility **100** and best practices **100** (SEO 67 from pre-existing missing meta description/robots.txt). Screenshot capture remains unavailable because the browser desktop window is not visible; verification used DOM/computed-style readback.
- Owner-requested cleanup: removed the non-functional "Switch student (parent)" placeholder card from `apps/admin/src/pages/Profile.tsx`. The `parent_links` schema is unchanged; a real parent context-switch remains unimplemented rather than presenting a dead control.

## Known gaps

0. **Functional audit (2026-11-05) — all defects FIXED:** every module was click-tested as admin/teacher/student. The first pass found 12 broken + 4 partial defects (Teaching Assignments stub, four desktop-hidden dialogs, students marking attendance, empty audit log, "View as" trap, Submissions roster, Subjects edit, per-student declarations, event/broadcast targeting). **All 15 were fixed and re-verified: 82 working / 0 broken / 0 partial / 11 notes across 93 runtime checks.** Details: `docs/audits/2026-11-05-functional-audit.md`.
0b. **Security audit (2026-11-05) — full Cloudflare `security-audit` skill, all findings FIXED:** the live Supabase RLS layer, Edge Function, client, deploy headers and CI were audited. Found **1 critical + 4 medium + 3 low** issues — the critical one let any signed-in user escalate themselves to admin via the `profiles_self` policy. All 8 are fixed in `supabase/migrations/0004_profiles_hardening.sql` (+ an Edge Function normalization fix), with new regression assertions in `verify_rls_local.py`. Report, traces and owner replay plan: `~/security-audit-skill/schoolerp/run-1/` (REPORT.md / FINDINGS-DETAIL.md / NEEDS-VALIDATION.md). **Migrations 0001–0004 have now been APPLIED to the live Supabase project (`ausnymdtnpewcfvdrpcu`) and verified empirically:** 32 tables all RLS-enabled; a live student self-escalation attempt returns `permission denied for table profiles`, while a legitimate self-service rename succeeds (role unchanged). Test data was cleaned up.
1. **Live Supabase wiring — Homeworks DONE** (`0006_homeworks_live.sql`, `homeworksLive.ts`, `useHomeworksData.ts`). Demo store (`appData.tsx`) remains the single source in demo mode; live mode routes through Supabase.
2. **Live Supabase wiring — Library DONE** (`0007_library_live.sql`, `libraryLive.ts`, `useLibraryData.ts`). Issue/reserve/return via SECURITY DEFINER RPCs; student-owned reads, staff-scoped writes.
3. **Live Supabase wiring — Fees DONE** (`0008_fees_live.sql`, `feesLive.ts`, `useFeesData.ts`). Payment recording and sibling links via RPCs; admin-owned writes, student-owned reads.
4. **Live Supabase wiring — Communications DONE** (`0009_communications_live.sql`, `communicationsLive.ts`, `useCommunicationsData.ts`). Declaration signing, poll voting, and message sending via RPCs; RLS-fixed submission forgery bug from 0006.
5. pgTAP suites (`supabase test db`) cannot run in this environment — no Docker and `pgserver` is not installable via pip. Test SQL files are ready for when Docker is available: `supabase/tests/rls_homeworks.sql` (23 assertions), `supabase/tests/rls_library.sql` (20 assertions), `supabase/tests/rls_approvals.sql` (18 assertions), `supabase/tests/rls_events.sql` (14 assertions), `supabase/tests/rls_course_progress.sql` (16 assertions), plus existing `rls_matrix.sql` and `rls_matrix_dashboard.sql`.
3. Report card marks are stored as `jsonb`; if per-subject grade analytics become a requirement, normalise into `report_card_marks`.
4. Mobile app Expo foundation DONE (2026-11-12): `apps/mobile` expo-router app with `(auth)` login + forced password change, `(tabs)` dashboard/assignments/messages/notices/profile, secure-store sessions, Supabase client factory from `@schoolerp/shared`, offline banner, account-deletion entry. Typecheck clean. Device/simulator run not possible in this sandbox.
5. Login plus authenticated student shell/dashboard are live-DOM reviewed against the owner's reference in light and dark mode. S04–S25 page internals still need the same owner-session review; screenshots remain unavailable because the browser desktop window is not visible.

## Next up

1. ~~Apply `0001`–`0004`~~ **Done** — applied to the live project and verified. pgTAP suites cannot run here (no Docker, `pgserver` not installable); test SQL files are ready for when Docker is available.
2. ~~Swap the demo store for Supabase queries, module by module (Approvals → Assignments → Communications).~~ **Homeworks, Library, Fees, Communications, Approvals, Events, Course Progress done** — Study Room → Digital Library → Gallery → Circulars → Declarations → Messages → Polls → Profile → Attendance → People → Classes → Subjects → Teaching Assignments → Enrollments → Audit Log next.
3. ~~Deploy `admin-users`; run `scripts/create-admin.mjs` for the first admin.~~ **Not yet done** — pending live Supabase project access.
4. ~~Mobile: login, assignments, approvals.~~ **Done** — Expo foundation committed on `milestone/e-mobile` (login, dashboard, assignments, messages, notices, profile; typecheck clean). Native iOS (`apps/ios`) also exists as a parallel client.
5. ~~Store readiness docs.~~ **Done** — `docs/store/` package + `eas.json` committed on `milestone/f-store-readiness`. Owner inputs still required (privacy contact, support URL, developer accounts, app identifiers, logo assets).
6. Milestone B schema + RLS **done** — `0005_pws_clone_tables.sql` (28 parity tables), `0006_storage_buckets.sql` (5 private buckets), `verify_rls_local.py` extended with 24 new RLS assertions. SQL parses cleanly with pglast; RLS assertions could not be executed (pgserver unavailable in sandbox) — run `python supabase/tests/verify_rls_local.py` when pgserver/Postgres is available.
7. Schema `0005`/`0006` not yet applied to the live Supabase project (`ausnymdtnpewcfvdrpcu`) — pending project access.
