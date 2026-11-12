# Pacific World School ERP — Future Heritage UI Design

- **Date:** 2026-11-12
- **Branch:** `newui`
- **Status:** Approved in visual review; pending written-spec review
- **Scope:** Entire existing admin web application (`apps/admin`)
- **Behavior boundary:** Presentation-only redesign; existing workflows and authorization remain unchanged

## 1. Purpose

Create a complete alternative interface for Pacific World School that feels
prestigious, distinctive, and contemporary enough to astonish school
leadership without becoming theatrical or difficult to operate every day.

The design concept is **Future Heritage**: the confidence of an established
institution expressed through a modern operating cockpit. Deep forest surfaces,
parchment workspaces, restrained gold accents, editorial typography, and
carefully staged data create a memorable first impression while preserving the
clarity required for school administration.

This work exists only on `newui`. `main` must remain unchanged. The second
approved concept, Living Campus, belongs only to `newui2`.

## 2. Goals

1. Redesign login, application shell, dashboard, shared primitives, and every
   existing route as one coherent visual system.
2. Make the first thirty seconds compelling enough for a school-leadership
   presentation.
3. Keep dense operational work—tables, forms, calendars, approvals, fees, and
   audit records—fast and legible.
4. Preserve all existing routes, role guards, actions, demo behavior, and data
   semantics.
5. Deliver intentional desktop, tablet, and mobile layouts rather than a
   desktop layout that merely shrinks.
6. Meet WCAG AA contrast, keyboard, focus, reduced-motion, and touch-target
   requirements.

## 3. Non-goals

- No schema, migration, RLS, Supabase, authentication, or API changes.
- No new school workflow, role, permission, or route.
- No changes to seeded identities or business rules.
- No student-to-student communication.
- No mobile/Expo or native iOS redesign.
- No invented logo, crest, mascot, or unapproved school claim.
- No generic glassmorphism layer, neon dashboard aesthetic, or decorative
  animation that competes with school work.

## 4. Branch isolation

- `newui` starts from commit `9d47c2a`.
- `newui2` starts independently from the same commit.
- No visual component or token is cherry-picked between the two concepts.
- Shared domain code may remain structurally identical because behavior is
  deliberately unchanged, but presentation changes are committed only to their
  named branch.
- `main` is never checked out for writes during this work.

## 5. Experience principles

### Quiet prestige

The interface earns attention through proportion, typography, depth, and
composition—not through visual noise. Gold is an accent, never a page fill.

### A school in motion

The dashboard reveals the live rhythm of the school: attendance, work awaiting
attention, upcoming moments, and academic activity. Information should feel
current without pretending to be realtime when the data is not realtime.

### Editorial clarity

Strong titles and generous grouping explain where the user is. Dense data is
handled like a carefully designed ledger with clear alignment and hierarchy.

### Familiar behavior

Every existing user action stays where users can discover it. The redesign may
recompose a page, but it may not hide, rename beyond recognition, or remove a
working capability.

## 6. Visual system

### Color roles

| Role | Value | Use |
|---|---:|---|
| Forest 950 | `#0D1E17` | Deepest shell and overlays |
| Forest 900 | `#12271E` | Navigation rail |
| Forest 800 | `#173027` | Primary actions and command surfaces |
| Parchment | `#ECE8DC` | Main application canvas |
| Paper | `#FCFAF4` | Cards, fields, and raised work areas |
| Heritage gold | `#E4CF83` | Active state, emphasis, focus details |
| Moss | `#6D7D42` | Secondary academic accent and charts |
| Ink | `#172219` | Primary text on light surfaces |
| Muted ink | `#69756D` | Supporting text |
| Border | `rgba(28, 43, 32, 0.12)` | Quiet structural separation |

Semantic success, warning, danger, and information colors retain their meaning
and are tuned for contrast on both forest and parchment surfaces. Color is
never the only status signal.

### Typography

- **Display:** Newsreader Variable, bundled locally, with Georgia as fallback.
- **Interface:** Manrope Variable, bundled locally, with system sans fallback.
- Display type is reserved for page titles, major metrics, dates, and selected
  editorial labels. Forms, tables, navigation, and body copy use the interface
  face.
- Uppercase labels use restrained tracking and remain short.

### Shape, border, and depth

- Cards use 14–20px radii based on prominence.
- Pills are reserved for filters, statuses, and compact actions.
- Borders carry most grouping; shadows are soft and used only for elevation.
- Dark surfaces may use a faint radial seal or line motif, but never an invented
  emblem.

### School media

Only supplied assets under `apps/admin/public/brand/` are used. Campus imagery
appears as a purposeful story tile or login composition, not as a repeated card
background. Images receive readable overlays and meaningful alt treatment.

## 7. Application shell

### Desktop

- A fixed 230–248px forest navigation rail holds the school identity, grouped
  role-aware navigation, demo status, and account summary.
- The parchment workspace contains a slim command row with breadcrumbs, a
  search affordance, role preview when allowed, and notifications.
- Page titles sit inside the workspace rather than in a generic top bar.
- The current route uses a gold active state with dark text; inactive routes use
  subdued light text and a precise hover treatment.

### Tablet

- The rail collapses to an icon-first strip with accessible labels on focus,
  hover, and expansion.
- Filters and page actions wrap into a dedicated action row.
- Large bento layouts reduce to two columns without reordering task priority.

### Mobile

- Navigation becomes a modal drawer with focus containment and an explicit
  close action.
- The command row remains compact and sticky.
- Tables become prioritized record cards or three-column summaries with details
  disclosed in an existing page/dialog pattern.
- Primary actions remain visible without covering content.

## 8. Login experience

- The login is a cinematic two-part composition using forest, parchment, the
  supplied crest/logo, and one supplied campus image.
- The credential form remains the visual priority and retains remembered-account,
  password visibility, forgot-password notice, session-restoration, and demo
  entry behavior.
- Demo roles remain explicit sample-data entry points and never resemble a live
  authenticated session.
- The layout uses a dignified editorial statement rather than invented marketing
  claims.

## 9. Dashboard experience

### Shared structure

- A greeting and date establish context.
- The first viewport shows the most important role-specific status, one upcoming
  school moment, and only the actions relevant to that role.
- Large metrics are typographic, not enclosed in repetitive identical cards.
- Existing counts and calculations remain the source of truth.

### Admin

- School pulse, attendance, students/teachers, approvals, fees, and upcoming
  events appear in an asymmetric bento composition.
- Items requiring attention use clear language and navigation targets.

### Teacher

- Class context, leave approvals, assignments, and upcoming events lead.
- The screen feels focused on the teacher's class rather than a reduced admin
  dashboard.

### Student

- Attendance, assignments, fee status, notifications, and upcoming events lead.
- Student identity and admission context remain private and role-appropriate.

## 10. Page archetypes

Every route maps to one of these reusable structures:

1. **Operational index:** People, Classes, Subjects, Enrollments, Audit Log.
   Editorial heading, compact metrics, search/filter row, ledger table, actions.
2. **Workflow board:** Approvals, Assignments, Communications, Library, Fees.
   Priority summary, segmented views, task cards, and focused dialogs/forms.
3. **Time and progress:** Events, Attendance, Course Progress.
   Calendar/progress visual with a readable list fallback and clear status legend.
4. **Document and media:** Study Room, Report Card, Gallery.
   Purposeful preview surfaces, metadata, and safe primary actions.
5. **Configuration:** Teaching Assignments and administrative forms.
   Compact guidance, validated fields, explicit save/cancel hierarchy.

No route is considered redesigned if it merely inherits new colors while
retaining visibly inconsistent spacing, form, table, or empty-state patterns.

## 11. Component system

The branch establishes or refines shared primitives for:

- Button and icon button
- Text field, select, textarea, checkbox, and field message
- Card, editorial panel, statistic, and action tile
- Badge/status marker
- Table, responsive record list, pagination/filter row
- Modal/dialog and mobile sheet
- Tabs/segmented control
- Breadcrumbs and page header
- Notifications and role switcher
- Empty, loading, error, and no-results states
- Progress bar, calendar cell, timeline item, and avatar

Primitives expose semantic variants rather than raw color names wherever
practical. Existing call sites migrate incrementally without changing handlers.

## 12. Motion

- Initial page content reveals in a short stagger, capped at roughly 500ms.
- Hover depth is subtle and uses transform plus shadow; cards do not wobble or
  continuously float.
- Drawers, popovers, dialogs, and menus use 160–240ms transitions.
- Progress and metric reveals occur once and never block interaction.
- Campus imagery may use very subtle scale or crossfade on login only.
- `prefers-reduced-motion: reduce` removes non-essential transforms, staggers,
  parallax, and crossfades.

## 13. Data flow and behavior preservation

- `AuthContext`, `AppDataProvider`, route guards, demo routing, localStorage keys,
  Supabase construction rules, and all action functions remain behaviorally
  unchanged.
- Components continue to receive the same values and invoke the same handlers.
- No recipient targeting, role determination, fee calculation, attendance rule,
  or assignment behavior moves into presentation code.
- Existing links preserve their destinations and query behavior.

## 14. Errors, loading, and empty states

- Existing validation copy and backend/auth errors remain truthful.
- Inline field errors sit with their controls; page-level failures use a concise
  alert with a recovery action when one already exists.
- Loading indicators use skeletons only where asynchronous waiting exists; demo
  data must not simulate network loading.
- Empty states explain what is absent and offer only actions the current role is
  authorized to perform.
- Demo and configuration warnings remain visually distinct from errors.

## 15. Accessibility and performance

- WCAG AA contrast for text and controls.
- Visible `:focus-visible` treatment on every interactive element.
- Semantic headings, landmarks, labels, tables, and button names.
- Keyboard-operable menus, drawers, dialogs, tabs, and notifications.
- Minimum practical touch target around 44px on touch layouts.
- Images use dimensions to prevent layout shift.
- Animation avoids layout-triggering properties on repeated elements.
- Fonts are locally bundled and limited to required weights/subsets.
- Existing campus images are reused; no generated decorative media is added.

## 16. Verification and acceptance criteria

The redesign is complete only when:

1. Login, shell, dashboard, and all 19 existing routes visibly belong to Future
   Heritage at desktop, tablet, and mobile widths.
2. Admin, teacher, and student navigation and content remain role-correct.
3. Existing demo entry, reset, exit, remembered account, role preview,
   notifications, and sign-out flows still work.
4. Forms, dialogs, tables, calendars, and responsive records do not clip or
   overflow under seeded data.
5. Reduced-motion mode removes non-essential movement.
6. Typecheck, lint, tests, production build, and `git diff --check` pass.
7. A secret/environment-name scan finds no prohibited client variable.
8. `PROJECT_STATUS.md` records changed files, checks, and remaining gaps.

## 17. Expected code surfaces

- `apps/admin/src/components/AppShell.tsx`
- `apps/admin/src/components/ui.tsx`
- `apps/admin/src/pages/Login.tsx`
- `apps/admin/src/pages/Dashboard.tsx`
- All existing route pages under `apps/admin/src/pages/`
- `apps/admin/src/index.css`
- `apps/admin/tailwind.config.cjs`
- `packages/shared/src/theme.ts`
- `apps/admin/package.json` and lockfile only if local font packages are added
- Admin tests and `PROJECT_STATUS.md`

## 18. Decision summary

Future Heritage is intentionally not a recolor of the original console. It is a
complete presentation system with a dark institutional rail, parchment work
surface, editorial data hierarchy, and restrained cinematic motion. Its success
is measured equally by leadership impact and daily operational clarity.
