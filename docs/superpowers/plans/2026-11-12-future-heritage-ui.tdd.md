# Future Heritage TDD Evidence

- **Source plan:** `docs/superpowers/plans/2026-11-12-future-heritage-ui.md`
- **Branch:** `newui`
- **Date:** 2026-11-12

## User journeys

1. School leadership can enter any demo role and see one coherent Future Heritage interface.
2. Admin, teacher, and student users retain their existing role-specific navigation and actions.
3. Keyboard and reduced-motion users can operate the forest shell, dialogs, and page controls.
4. Every existing route renders without page-level horizontal overflow.
5. Administrators retain read-only academic oversight while teachers author academic content.

## RED / GREEN evidence

| Area | RED evidence | GREEN evidence | Guarantee |
|---|---|---|---|
| Foundation, primitives, shell, login, dashboards, administration, academics | Test-first checkpoint commits precede their matching implementation commits in branch history | Matching GREEN commits plus full suite | Each major layer was introduced behind a focused UI or role contract |
| Community/resource workspaces | `npm run test --workspace=apps/admin` → 2 route tests failed because calendar and communication regions were absent | Same command → 5 files, 45 tests passed | Events and communication areas are semantically labelled; all resource routes render |
| Academic authorization | Route tests assert Admin cannot publish assignments, course progress, study PDFs, or report cards | Full route suite → PASS | Admin academic access remains read-only while Teacher controls remain available |
| Type safety | `npm run typecheck --workspace=apps/admin` after each recovered batch | Final command → PASS | Admin TypeScript graph compiles without errors |
| Static quality | `npm run lint --workspace=apps/admin` after GREEN | Final command → 0 errors, 3 pre-existing fast-refresh warnings | Redesign adds no lint error or new warning class |
| Production build | Full redesign built after all route work | `npm run build --workspace=apps/admin` → PASS, 426 modules | Vite output includes locally bundled Newsreader and Manrope fonts |

## Live browser evidence

The connected browser was run at 816×706 because screenshot capture was unavailable in this desktop session. DOM/computed-layout readback visited all 18 authenticated routes as Admin:

- Every route rendered exactly one level-one page heading.
- Every route reported `document.documentElement.scrollWidth <= innerWidth`.
- The browser console had no warnings or errors.
- Student checks showed no Administration navigation and no academic authoring controls.
- Teacher checks showed assignment and attendance authoring controls.
- Admin checks showed read-only report-card and study-room controls.

## Coverage and known gaps

The repository has no coverage script or configured threshold, so a numeric coverage claim was not fabricated. Behavioral coverage is provided by 45 Vitest tests plus live route readback. Screenshot-based pixel comparison at 375px, 768px, and 1440px remains unavailable in this browser session; responsive CSS, role tests, and the 816px layout readback were verified instead.
