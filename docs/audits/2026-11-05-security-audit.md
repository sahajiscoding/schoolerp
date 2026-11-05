# Security Audit Report — Pacific World School ERP

- **Target:** `sahajiscoding/schoolerp` @ `828e6ec` (branch `arena/284700ba-schoolerp`, incl. uncommitted functional fixes)
- **Date:** 2026-11-05 · **Mode:** full audit (Cloudflare `security-audit` skill, six phases)
- **Scope:** `apps/admin`, `packages/shared`, `supabase` (schema/RLS + Edge Function), `scripts`, `.github/workflows`, `vercel.json`. `apps/mobile` is an unimplemented stub → out of scope.
- **Validators:** `validate-findings.cjs` → **PASS (8 findings)** · `validate-coverage-ledger.cjs` → **PASS (15 units)**.

## Executive summary
The live authorization boundary is **Supabase Row-Level Security** (the admin console runs on a
single-principal `localStorage` demo store unless Supabase env is present; demo-only gaps are
self-impact and are not security findings). The audit found **one critical privilege-escalation
flaw and several teacher-scoping / integrity gaps in the RLS layer**, plus a minor Edge Function
normalization inconsistency. **All 8 confirmed findings have been fixed** in this branch
(`supabase/migrations/0004_profiles_hardening.sql`, an Edge Function change, and new regression
assertions). The client, deploy headers, secret handling, and CI/supply-chain were reviewed and
found sound.

## Findings (all confirmed, all fixed)
| # | Fingerprint | Severity | Title | Fix |
|---|-------------|----------|-------|-----|
| 1 | `rls-profiles-self-escalation` | **Critical** | Any signed-in user can escalate themselves to admin via `profiles_self` | 0004: column grants + `protect_profile_privileges` trigger + narrowed self policy |
| 2 | `rls-audit-log-insert-forgery` | Medium | Any authenticated user can forge `audit_log` entries | 0004: drop open INSERT; admin-only insert |
| 3 | `rls-attendance-cross-section-write` | Medium | Teacher can mark attendance for students they don't teach | 0004: `teaches_student(student_id)` in write policy |
| 4 | `rls-report-cards-cross-section-insert` | Medium | Teacher can fabricate report cards for any student | 0004: `teaches_student(student_id)` in insert/update |
| 5 | `rls-profiles-directory-overbroad-read` | Medium | Any user can read every active profile (login ids, roles) | 0004: scoped reads (self / teaches_student / admin) |
| 6 | `rls-events-update-scope-recheck` | Low | Event UPDATE can retarget to other sections | 0004: re-check `teaches_section` on UPDATE |
| 7 | `rls-course-goals-update-scope-recheck` | Low | Course-goal UPDATE skips teaching re-check | 0004: re-check `teaches_student` on UPDATE |
| 8 | `edge-create-admin-loginid-sanitization` | Low | create-admin builds auth email from unsanitized login id | Edge Function now uses `authEmail(loginId)` |

The critical finding is a **full administrative takeover**: because `profiles_self` was
`FOR ALL USING (auth.uid() = id)` with no column guard, and `authenticated` holds `UPDATE`, any
student could `PATCH profiles SET role='admin'` on their own row and pass every `is_admin()` gate
(all data, user provisioning, fees). See FINDINGS-DETAIL.md for traces and reproduction.

## Reviewed and cleared (no finding)
- **Client XSS:** `printHtml` and every caller (`ReportCard`, `StudyRoom`) escape all interpolations; no `dangerouslySetInnerHTML`/unsanitized `innerHTML`.
- **Demo auth gating:** `signInAsDemo` refuses whenever a Supabase client exists; live identity comes only from `supabase.auth`.
- **Secret handling:** client/shared use publishable/anon keys only; `vite.config.ts` inlines only URL + publishable key; CI greps block secret-like public vars; `create-admin.mjs` reads the service key from env and prompts for the password.
- **Edge Function authorization:** caller JWT verified + `role='admin' && is_active` re-check; service key stays in function env; 200-row import cap; rollback; audit writes.
- **Deploy headers:** restrictive CSP (`script-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`), X-Frame-Options DENY, nosniff, HSTS, Referrer-Policy, Permissions-Policy.
- **RLS helpers:** all `SECURITY DEFINER` with `search_path=''`; 0003 narrows EXECUTE to `authenticated`; both views `security_invoker=true`.
- **Other RLS:** messaging/threads/submissions/fees/leaves/declarations are principal/section-scoped; `poll_votes` has `PRIMARY KEY(poll_id, student_id)` (no double-vote).
- **Supply chain:** CI `permissions: contents:read`, actions pinned to full SHAs; dependencies are current majors.

## Validation method & limitations (disclosed)
- **Single-agent adaptation:** no Task/sub-agent tool is available here, so reconnaissance, hunting,
  and validation were performed sequentially by one agent. Independence is therefore weaker than a
  multi-agent run; this is disclosed rather than hidden.
- **RLS confirmed by complete source traces, not live DB execution.** No local Postgres was available
  and the skill forbids installing dependencies, so each RLS finding is grounded in the exact policy
  text + the project's documented `authenticated` grants + the absence of any protecting trigger/column
  grant, cross-checked against the project's own `rls_matrix.sql`. Empirical replay is handed to the
  owner in NEEDS-VALIDATION.md (`npm run verify:rls` now applies 0004 and asserts the new rules).
- Both zero-dependency Node validators were run and pass.

## Residual recommendations (not findings)
- **Directory design:** 0004 narrows profile reads to the isolation spec. If the product later needs
  students to see teacher/classmate names, add an explicit, minimal directory policy rather than
  restoring the blanket read.
- **Class-teacher attendance:** attendance read/write scope uses `teaches_student` (subject teachers).
  If class teachers must mark attendance, extend both read and write with `is_class_teacher_of`.
- **Privileged writes stay server-side:** role/is_active/login_id changes must go through the
  service-role Edge Function (the column grants now enforce this).
- **GitGuardian:** historical commits still contain the old password literals; purge/rotate via the
  GitGuardian dashboard (code is already clean).
- **Dev-only:** `vite allowedHosts:true` is a dev/preview convenience, not deployed; acceptable.
