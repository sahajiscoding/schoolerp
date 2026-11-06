# PWS Supabase Clone — v1 Design (report parity, in-place)

- **Date:** 2026-11-07
- **Status:** Approved §§1–4, pending written-spec review
- **Owner:** Sahaj Chugh
- **School:** Pacific World School
- **Source report:** `C:\Users\kids\Downloads\REVERSE_ENGINEERING_REPORT_PWS.md` (reverse-engineering of `https://pws.schoolforschools.ai/`, 2026-11)
- **Target:** Evolve the existing monorepo in place (Approach A) to a Supabase-only frontend/backend that looks, feels, and functions like the report, with byte-identical URLs.
- **Milestone note:** Owner approved re-scope on 2026-11-07. This expands beyond Milestone 3 (dashboard modules → Supabase wiring). `PROJECT_STATUS.md` and the v1 decision log record the expansion; no implementation until the writing-plans step.

---

## 1. Scope & approach

**Approach A — evolve in place (approved).** Keep the monorepo (`apps/admin` React+Vite+Tailwind, `apps/ios`, Supabase Postgres/Auth/Storage/Realtime/Edge Functions, `packages/shared`), existing RLS, and the browser-only demo session. Reskin + add the report's missing routes/tables. Alternatives considered: (B) greenfield clone in a new folder duplicating schema — rejected: drift with existing migrations/RLS; (C) UI-only on the demo store — rejected: fails the Supabase-only requirement.

**In scope (report parity):** 28 report routes (Section 5), Roboto typography, Pacific Navy/blue tokens, Radix/shadcn + lucide icons, light/dark daylight schedule (05:00–18:00 auto, manual override), exam/fees/LMS/library/gallery/circulars/declarations/messages/polls/profile flows, parent switch + library kiosk, Supabase Storage/Realtime equivalents for S3/Mongo/SSE.

**Out of scope:** Copying report PII (names such as SAHAJ CHUGH, PEN/APAAR numbers, DOBs, mobiles, emails, S3 URLs) into seeds or screenshots — demo identities stay anonymized (`Teacher`/`Student`, login-derived `@pws.local` emails per 2026-11-06). No public self-signup. No student-to-student channel (AGENTS.md §5). Admins never write academic content (AGENTS.md §4).

## 2. Canonical URLs (byte-identical to report)

Canonical set (query strings preserved exactly):

| Route | Purpose |
|---|---|
| `/` | Redirect to `/dashboard` or `/login` (existing behaviour, kept) |
| `/login` | Account picker + school login (+ Try a demo) |
| `/dashboard` | Student executive summary + upcoming events |
| `/approvals?page=1&limit=10` | Leave status + approvals table |
| `/course-progress` | Syllabus + chapter progress |
| `/events` | Academic calendar |
| `/homeworks` | Assignment hub + worksheets |
| `/homeworks/:id/submit` | Two-tab submission + rich-text editor |
| `/study-room` | Study materials & booklets |
| `/my-library?page=1&limit=10` | Borrowed-books ledger + fines |
| `/issue-book?member_able_type=students` | Book catalog + reservation |
| `/digital-library` | Digital e-books catalog |
| `/examination-report-cards?page=1&limit=10` | Report-card PDFs + marksheets |
| `/my-attendance` | Attendance matrix + radial gauge + Apply Leave dialog |
| `/fee-collections/create?student=:id` | Fee dashboard + payment ledger |
| `/school-gallery?page=1` | Albums + galleries |
| `/school-gallery/:albumId/:mediaId` | Album viewer |
| `/circulars?page=1&limit=10` | Notices + circulars |
| `/circulars/:id` | Circular detail + download |
| `/declaration-forms?page=1&limit=10` | Legal undertakings + consents |
| `/messages?box=inbox&page=1&limit=10` | Inbox/sent |
| `/messages/create` | Compose to teachers/admins |
| `/messages/:id` | Thread detail + reply |
| `/polls` | Active surveys |
| `/profile` | 7-tab dossier + change password |

**Redirects (old → new, same URLs, no `/demo` prefix):** `/assignments` → `/homeworks`; `/library` → `/my-library`; `/report-card` → `/examination-report-cards`; `/attendance` → `/my-attendance`; `/fees` → `/fee-collections/create`; `/gallery` → `/school-gallery`; `/communications` → `/messages` (decl/polls/circulars split by tab); `/people` `/classes` `/subjects` `/teaching-assignments` `/enrollments` `/audit-log` → closest report admin surface or `/dashboard` with an in-app notice (no dead end). Query parameters (`page`, `limit`, `box`, `member_able_type`, `student`) are carried through verbatim. Deep links to old URLs must land on the new page, not 404.

> `AGENTS.md` (§8, layout/done) and the v1 design's route table are updated by this spec; the old 19-route list is retained only as redirect sources.

## 3. Design system (from report §4, via shared tokens)

Do **not** invent branding beyond the school-supplied logo/crest (AGENTS.md §7). The owner-approved change replaces the current olive/terracotta tokens in `packages/shared/src/theme.ts` with the report tokens so admin + mobile cannot drift:

- **Font:** Roboto (100–900) — replaces Inter. Loaded once, with system fallback.
- **Background:** light `#f8fafc`/`#ffffff` (cards `border-slate-200`); dark `#0f172a`/`#1e293b` (cards `border-slate-800`).
- **Primary:** Pacific Navy `hsl(222.2, 47.4%, 11.2%)` / `#1e3a8a`. **Accent:** `#2563eb` (blue-600) / `#3b82f6` (blue-500).
- **Status:** Present `emerald #10b981`; Absent `rose #ef4444`; Leave/L/ML/LL `amber #f59e0b`; Holiday/Sunday `indigo #6366f1`; Pending `orange #f97316`; Approved/Paid `emerald #059669`.
- **Theme mode:** time-aware auto (05:00–18:00 light, else dark) with manual override, stored in `localStorage` (`dps-theme-preference`/`dps-theme-mode` keys are kept for parity; the demo store keeps its own `pws.demo.data.v5` key). `document.documentElement.classList.toggle('dark', …)` + `colorScheme`.
- **Primitives:** shadcn/ui layout (Radix headless + Tailwind) for Dialog/DropdownMenu/Avatar/Tabs/Button/Table; `lucide-react` for icons; `recharts` for attendance/fee gauges; `@tanstack/react-query` for caching; `react-hook-form`+`zod` for forms; Tiptap for homework rich text.

Tokens live in `packages/shared/src/theme.ts` and are consumed by Tailwind (admin) and NativeWind/iOS config so the apps cannot drift.

## 4. Auth (Supabase Auth, school rule + additions)

School rule stays primary (AGENTS.md/design §8): login ID = admission number (student) / staff ID, password = `Student@DDMMYYYY` derived from DOB; CSV roster import; forced change on first login; no public signup. `toAuthEmail(loginId)` mapping and the `admin-users` Edge Function contract are unchanged.

- **Parent session (add):** `/v1/auth/parent/students` → `auth.getUser()` + `parent_links` (RLS: parent reads linked students' assignments/fees/attendance only); `switch-student` / `switch-back` swap the active `profiles.id` context in UI state (never sudo a different Supabase user). No parent passwords stored client-side.
- **Library kiosk (add):** `kiosk/member-login` barcode scan mints a short-lived kiosk JWT via an Edge Function; `kiosk_token`/`kiosk_member` in `localStorage` scope search/issue/return/renew RPCs. Kiosk can never reach academic records.
- **Env names (AGENTS-compliant, not the prompt's shorthand):** client reads `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` (Vercel names; `VITE_` aliases accepted). **One key family only** — do not add `VITE_SUPABASE_ANON_KEY` alongside the publishable family. Secret/service-role/JWT/Postgres values stay server-side. Demo entry stays passwordless and browser-only (see §7).

## 5. Data model (Supabase Postgres, RLS-first)

Existing tables (migrations `0001`–`0004`, 32 tables, default-deny) stay. New tables are added only where the report needs them, each with a migration + RLS tests (AGENTS.md §3):

- `schools`, `academic_sessions` (one multi-tenant → single-school rows; single-school product, not a tenant flag)
- `fee_cycles`, `fee_periods`, `fee_components`, `fee_structures`, `fee_installments` (report's `fee_installments` extends the current invoice shape; sibling 50% discount = second child only, admin-owned, enforced in RLS)
- `examinations`, `examination_marks`, `examination_grades` (CBSE 9-point), `examination_subject_combinations`, `examination_remarks`, `examination_student_metadatas`, `examination_class_metadatas`, `examination_report_card_templates/fields`, `examination_coordinators`
- `library_books`, `library_book_transactions`, `library_rules` (+ `library_kiosk_sessions`)
- `circulars`, `transport_area_routes`, `transport_vehicles`
- `parent_links` (parent ↔ student)
- Media: report S3 + Mongo `ObjectId`s → private Supabase Storage buckets (`homework-files`, `submission-files`, `gallery-media`, `avatars`, `circular-files`) with signed URLs; ObjectIds → `uuid`/`text` keys. SSE/Socket.io → Supabase Realtime (`notifications` + broadcast channels); no MongoDB, no raw S3 client URLs.

**Invariants preserved:** RLS is the boundary; server-side targeting (never trust a client recipient list); admins read-only on assignments/submissions/threads/messages (audited); no student-to-student channel; `audit_log` insert-only for service role.

## 6. Components & data flow

- **AppShell:** sidebar/topbar (nav mirrors canonical URLs), notifications (SSE→Realtime badge), profile menu (switch student for parents, change password, sign out), mobile drawer. Role-aware labels (student "My Leaves" etc.).
- **Login:** account picker, school login form, Try a demo (Admin/Teacher/Student) — browser-only session, Reset/Exit demo. Demo banner: "Demo mode — sample data only. Changes stay in this browser and never write to Supabase."
- **Dashboard / Approvals / Course Progress / Events:** dense tables + calendar; leave routing enforced server-side (report rule `<9d → class teacher`; `≥9d` or Medical → principal, attachment mandatory).
- **Homeworks + /submit:** hub + two-tab rich-text editor (Tiptap), attachments via Storage signed uploads; review queue for teachers.
- **Library trio + kiosk:** borrow ledger, catalog search, e-books; kiosk touch search/issue/return/renew.
- **Report cards / Attendance / Fees / Gallery / Circulars / Declarations / Messages / Polls / Profile:** report flows wired through `react-query` hooks to `supabase.from(...).select/insert/update` (or RPCs/Edge Functions where RLS cannot express the operation, e.g. user creation, bulk import, push fan-out via `notify`). Audit-logged management mutations via the existing `pushAudit` trail, extended to Supabase `audit_log` on the live build.

## 7. Demo isolation (preserved verbatim)

Demo = `sessionStorage` flag (`lib/demoSession.ts`) + `localStorage` store (`lib/appData.tsx`, `pws.demo.data.v5`). While demo is active: `lib/supabase.ts` returns a null client, `AuthContext` never calls `getSession`/`signIn`/`signOut` (or any `from()`), and every mutation writes browser-only. ESLint forbids `**/supabase*` imports in `appData.tsx`/`seed.ts`. Exit demo clears the flag and returns to real sign-in. This holds on the live build with Supabase configured.

## 8. Error handling, responsive, testing

- **Errors:** Zod-validated forms; RLS rejections surface as explicit errors (never silent filtering); offline banner disables writes (no background queue, per design §12); storage upload limits 10 MB + MIME allowlist (PDF/JPEG/PNG/DOCX).
- **Responsive:** dense desktop → single-column + drawer nav on tablet/mobile; WCAG AA contrast for navy/blue tokens; reduced-motion respect.
- **Testing:** typecheck + lint + build green; RLS pgTAP + `supabase/tests/verify_rls_local.py` cover every new table (student/teacher/admin/parent/kiosk matrix incl. self-escalation, audit forgery, cross-section writes); route-smoke for all 28 canonical URLs + every old→new redirect + query strings across roles; storage signed-URL checks (no public URLs).

## 9. Decision log (to append to the v1 design)

| Date | Decision | Reason |
|---|---|---|
| 2026-11-07 | In-place Supabase clone of the report (Approach A) with byte-identical URLs; old routes redirect | Owner approved re-scope beyond Milestone 3; keeps RLS, demo isolation, and school auth rule while matching the vendor UI |
| 2026-11-07 | Supabase-only backend; S3→Storage, Mongo→UUID/text, SSE→Realtime | Owner requirement; avoids new external services per AGENTS.md |
| 2026-11-07 | Keep admission-no+DOB auth; add parent switch + kiosk | School rule stays primary; parent/kiosk are additive, audited flows |
| 2026-11-07 | Navy/Roboto/Radix replaces olive/terracotta in shared tokens | Owner-approved complete UI change; logos still school-supplied only |
