# Store readiness package — Pacific World School ERP

- **Status:** Preparation only. No EAS build, no App Store Connect upload, no Google Play upload, and no store-console submission has been performed.
- **Prepared:** 2026-11-12
- **Branch:** `milestone/f-store-readiness`
- **Scope:** Milestone F (store compliance, design doc §16) and the safeguarding statements in §8.
- **Applies to:** the Expo mobile app in `apps/mobile` (teachers and students) and, for reviewer context, the React admin console in `apps/admin`.

This folder is the single source for the store submission package. It is deliberately factual: anything not yet implemented is marked **required before submission**, not described as live.

## Documents

| File | Purpose | Audience |
|---|---|---|
| [`privacy-policy.md`](./privacy-policy.md) | Public privacy policy written to be published at a URL and entered in both stores | School owner, legal reviewer, store reviewer |
| [`data-safety.md`](./data-safety.md) | Google Play Data Safety and Apple App Privacy answers mapped to the actual schema | Whoever fills the store consoles |
| [`store-listing.md`](./store-listing.md) | Name, descriptions, category, age rating rationale, keywords, URL fields | Store listing owner |
| [`review-notes.md`](./review-notes.md) | Reviewer instructions, demo identities, and paths through each core flow | Store reviewer, submission owner |
| [`account-deletion.md`](./account-deletion.md) | In-app deletion path, backend queue/action, deleted-vs-retained matrix, timeline | Engineering, school admin, store reviewer |
| [`release-checklist.md`](./release-checklist.md) | EAS profiles, build/submit steps, client env allowlist, versioning, rollout, rollback | Release engineer |
| [`screenshots-checklist.md`](./screenshots-checklist.md) | Required device sizes and exact screens per role, plus the canonical admin-route capture set | Designer / QA |
| [`eas.json`](../../eas.json) | Starter EAS config at the repo root (see location note below) | Release engineer |

## EAS config location

`eas.json` is committed at the **repository root** so this milestone does not touch `apps/mobile/**` (Milestone E owns that directory). EAS CLI looks for `eas.json` in the Expo project root, which is `apps/mobile` because `apps/mobile/app.json` is the app config.

**Integrator action:** when Milestone E lands and `apps/mobile/app.json` is the real app config, move `eas.json` to `apps/mobile/eas.json` (or pass `--config` if the chosen EAS CLI version supports it) and delete the root copy. Do not duplicate the file. Until then, no build command in this package should be run.

## Owner inputs still required

The package cannot be published as-is. These values are intentionally placeholders.

| # | Input | Used in | Notes |
|---|---|---|---|
| 1 | School legal entity name and registered address | Privacy policy, store developer contact | Do not guess; use the name on the school's registration |
| 2 | Privacy contact name, email, phone | Privacy policy, store listing | A monitored mailbox, not a personal teacher address |
| 3 | Grievance / Data Protection Officer name and contact | Privacy policy | Required for Indian DPDP grievances if applicable |
| 4 | Public privacy-policy URL | Both store consoles | Publish `privacy-policy.md` at a stable HTTPS URL |
| 5 | Support URL and support email | Store listing, app config | Must resolve without login |
| 6 | Marketing URL (optional) | Store listing | May be the school website |
| 7 | Apple Developer team ID, App Store Connect app ID, Apple ID | EAS submit profile | Owner-held; never commit credentials |
| 8 | Google Play service-account JSON | EAS submit profile | Store outside the repo; path only in config |
| 9 | Android application ID and iOS bundle identifier | `app.json` (Milestone E) | Must be permanent and school-owned |
| 10 | Final app display name | `app.json`, listing | Suggested: `Pacific World School`; owner confirms |
| 11 | School logo, app icon, splash, feature graphic | Listing, build | Supplied by school only; no invented branding |
| 12 | Sample roster CSV and demo teacher/student accounts | Reviewer notes, screenshots | Anonymized identities only; never real students |
| 13 | Age-rating decision and content-rating questionnaire answers | Both stores | Recommendation and rationale in `store-listing.md` |
| 14 | Confirmation of student-data consent process at admission | Privacy policy | School's DPDP/guardian-consent position |
| 15 | Retention schedule approved by the school | Privacy policy, deletion doc | Academic year, fee/audit retention, legal holds |

## Publication sequence

1. Fill every `{{PLACEHOLDER}}` in `privacy-policy.md`; have the school's legal reviewer approve it.
2. Publish the policy at the final HTTPS URL, confirm it loads without login, and record the URL.
3. Fill `store-listing.md` and `review-notes.md`; create reviewer accounts in a non-production or dedicated review tenant.
4. Complete `release-checklist.md` gates. Do not build until the mobile app passes its own Milestone E acceptance checks.
5. Move `eas.json` into `apps/mobile` as described above, then run the EAS commands listed in `release-checklist.md`.
6. Capture screenshots from the release candidate using `screenshots-checklist.md`.
7. Enter Data Safety / App Privacy answers from `data-safety.md`.
8. Submit. This package does not claim that any of these steps has happened.

## Cross-check basis

The data inventory was checked against:

- `supabase/migrations/0001_initial_schema.sql` — profiles, classes, sections, subjects, teaching assignments, enrollments, assignments, submissions, threads, messages, notices, push tokens, notification jobs, audit log.
- `supabase/migrations/0002_dashboard_modules.sql` — student details (admission number, DOB, guardian fields), leave requests, course goals, declarations, polls, events, library, report cards, attendance, fee records, sibling links.
- `supabase/migrations/0003_function_hardening.sql` and `0004_profiles_hardening.sql` — helper hardening, profile column protection, scoped directory reads, audit-log insert restriction, attendance/report-card scope.
- `supabase/migrations/0005_pws_clone_tables.sql` through `0012_course_progress_live.sql` — fee installments, examinations, library transactions, circulars, parent links, and the live RPC slices.
- `docs/superpowers/specs/2026-11-03-school-erp-design.md` §§8, 9, 15, 16.
- `docs/superpowers/specs/2026-11-07-pws-clone-design.md` §§2, 4, 5, 7.
- `docs/security/environment-variables.md`.

Unresolved mismatches are listed in `data-safety.md` §9 and in the milestone status note. The most important are: no account-deletion queue exists yet, no thread archival column exists, the schema stores an optional guardian phone although the v1 design says no phone numbers, and admin thread **reads** are not audited even though the design requires it.

## Handling rules

- Never place a server-only credential in this folder or in any client build. The only client-visible Supabase values are `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the legacy `..._ANON_KEY` alias is accepted; use one family, not both).
- Never copy real student names, admission numbers, dates of birth, guardian phone numbers, or message bodies into screenshots, seeds, review notes, or this package.
- The school name is used because it is the product owner. No logo, crest, address, or contact detail is invented here.
