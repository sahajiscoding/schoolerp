# Living Campus TDD Evidence

- **Source plan:** `docs/superpowers/plans/2026-11-12-living-campus-ui.md`
- **Branch:** `newui2`
- **Date:** 2026-11-12

## User journeys

1. School leadership can enter any demo role and see one coherent Living Campus interface.
2. Admin, teacher, and student users retain their existing role-specific navigation and actions.
3. Keyboard and reduced-motion users can operate the shell, dialogs, and page controls.
4. Every existing route renders without page-level horizontal overflow.
5. Admin academic-content access remains read-only for assignments and report cards.

## RED / GREEN evidence

| Area | RED evidence | GREEN evidence | Guarantee |
|---|---|---|---|
| Academic workspaces | `npm run test --workspace=apps/admin -- routes-ui.test.tsx` → 5 failed / 10 passed because labelled workspaces were absent | Same command → 16 passed | Five academic routes expose semantic workspaces; students cannot mark attendance; admins cannot publish/review assignments |
| Community/resource workspaces | Same route suite → 6 failed / 16 passed because labelled workspaces were absent | Same command → 22 passed | Communications, events, study room, library, fees, and gallery expose semantic route regions |
| Complete regression suite | Existing and new UI tests run after each route group | `npm run test --workspace=apps/admin` → 5 files, 36 tests passed | Auth, demo isolation, design tokens, primitives, dashboards, admin routes, academic routes, and community routes remain green |
| Type safety | Production changes were checked after each batch | `npm run typecheck --workspace=apps/admin` → PASS | Admin TypeScript graph compiles without errors |
| Static quality | Route groups checked after GREEN | `npm run lint --workspace=apps/admin` → 0 errors, 3 pre-existing fast-refresh warnings | Redesign adds no lint error or new warning class |
| Production build | Full redesign built after route completion | `npm run build --workspace=apps/admin` → PASS, 426 modules | Vite production output includes local fonts and compiles all routes |

## Live browser evidence

The connected browser was run at 816×706 because screenshot capture was not available in this desktop session. DOM/computed-layout readback visited all 18 authenticated routes as Admin:

- Every route rendered exactly one level-one page heading.
- Every route reported `document.documentElement.scrollWidth <= innerWidth`.
- The browser console had no warnings or errors.
- Student checks showed no Administration navigation and no attendance-write controls.
- Teacher checks showed assignment and attendance authoring controls.
- Admin checks showed read-only assignment/report-card controls.

## Coverage and known gaps

The repository has no coverage script or configured threshold, so a numeric coverage claim was not fabricated. Behavioral coverage is provided by 36 Vitest tests plus live route readback. Screenshot-based pixel comparison at 375px, 768px, and 1440px remains unavailable in this browser session; responsive CSS, route tests, and the 816px layout readback were verified instead.
