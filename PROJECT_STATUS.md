# Project Status — Pacific World School ERP

**Last updated:** 2026-11-03
**Current milestone:** Design complete. Implementation not started.
**Next milestone:** 0 — Foundation

This file is the single source of truth for project state. Every agent must read it before starting work and update it before finishing. Keep it short, factual, and linked to files. Do not record intentions as completed work.

---

## What exists

| Item | Path | State |
|---|---|---|
| Approved v1 design | `docs/superpowers/specs/2026-11-03-school-erp-design.md` | Written, awaiting owner review |
| Agent contract | `AGENTS.md` | Written |
| Status document | `PROJECT_STATUS.md` | This file |

No application code, database migrations, or configuration exist yet.

## In progress

Nothing. Awaiting spec review.

## Next up

Milestone 0 — Foundation:

1. Initialize npm workspaces monorepo (`apps/mobile`, `apps/admin`, `packages/shared`).
2. Scaffold Expo app with expo-router and NativeWind.
3. Scaffold React + Vite + Tailwind admin app.
4. Initialize Supabase locally; add `supabase/config.toml`.
5. Add lint, format, typecheck, and CI.
6. Add `.env.example` files for both apps and document the public/secret split.
7. Add the CI guard against `EXPO_PUBLIC_.*(SECRET|SERVICE|PRIVATE)`.

Then Milestone 1 — schema and RLS, whose definition of done is the RLS test matrix passing.

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
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Secret (Supabase Edge Functions only):**
- `SUPABASE_SERVICE_ROLE_KEY`
- `EXPO_ACCESS_TOKEN`
- Future payment, SMS, email, and AI provider keys

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
