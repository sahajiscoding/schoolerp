# Pacific World School ERP — Living Campus UI Design

- **Date:** 2026-11-12
- **Branch:** `newui2`
- **Status:** Approved in visual review; pending written-spec review
- **Scope:** Entire existing admin web application (`apps/admin`)
- **Behavior boundary:** Presentation-only redesign; existing workflows and authorization remain unchanged

## 1. Purpose

Create a complete alternative interface for Pacific World School that makes
school leadership feel the life of the campus immediately while remaining warm,
clear, and practical for daily administration.

The design concept is **Living Campus**: the ERP behaves like a window into the
school day rather than a conventional back-office dashboard. Supplied campus
photography, daylight surfaces, confident olive structure, warm terracotta
actions, editorial moments, and approachable operational layouts make the
system feel human and memorable.

This work exists only on `newui2`. `main` must remain unchanged. The other
approved concept, Future Heritage, belongs only to `newui`.

## 2. Goals

1. Redesign login, application shell, dashboard, shared primitives, and every
   existing route as one coherent visual system.
2. Create an immediate emotional connection for school leadership through real
   supplied campus imagery and human-centered language.
3. Keep tables, filters, forms, calendars, approvals, and audit records easy to
   scan and operate.
4. Preserve all routes, role guards, actions, demo behavior, and data semantics.
5. Provide intentionally composed desktop, tablet, and mobile layouts.
6. Meet WCAG AA contrast, keyboard, focus, reduced-motion, and touch-target
   requirements.

## 3. Non-goals

- No schema, migration, RLS, Supabase, authentication, or API changes.
- No new school workflow, role, permission, or route.
- No changes to seeded identities or business rules.
- No student-to-student communication.
- No mobile/Expo or native iOS redesign.
- No invented logo, crest, mascot, student imagery, or school achievement.
- No decorative photo collage on every page; photography must have purpose.
- No generic SaaS blue palette, excessive glass, or continuous decorative motion.

## 4. Branch isolation

- `newui2` starts from commit `9d47c2a`.
- `newui` starts independently from the same commit.
- No visual token or presentation component is inherited from Future Heritage.
- Domain behavior may remain structurally identical because behavior is
  deliberately unchanged, but all Living Campus presentation commits stay on
  `newui2`.
- `main` is never checked out for writes during this work.

## 5. Experience principles

### The school day is the hero

The interface foregrounds what is happening today: learning, attendance,
events, assignments, approvals, and community moments. It does not fabricate
realtime status when the underlying data is static.

### Warmth with operational discipline

Photography and warm surfaces establish emotion, but actions, tables, forms,
and statuses remain precise and predictable.

### People before abstractions

Headings and summaries use human language. Operational records remain factual;
labels are not rewritten in ways that obscure established school terminology.

### Familiar behavior

All working capabilities remain discoverable. Visual recomposition may improve
hierarchy but may not remove, hide, or materially alter an existing action.

## 6. Visual system

### Color roles

| Role | Value | Use |
|---|---:|---|
| Campus olive | `#586A36` | Masthead, navigation, primary structure |
| Deep olive | `#3F512A` | Hover, active depth, strong text accent |
| Young leaf | `#DCE6C4` | Positive data and highlighted panels |
| Daylight canvas | `#F7F2E8` | Main application background |
| Paper | `#FFFEFA` | Cards, tables, fields, dialogs |
| Campus terracotta | `#D97747` | Primary moments and selected actions |
| Clay tint | `#F1D5C3` | Warm secondary panels and warnings |
| Ink | `#2F3D2A` | Primary text |
| Muted ink | `#74806F` | Supporting text |
| Border | `rgba(54, 72, 47, 0.11)` | Quiet separation |

Success, warning, danger, and information retain distinct semantic treatment.
Color always has a text or icon signal alongside it.

### Typography

- **Display:** Fraunces Variable, bundled locally, with Georgia as fallback.
- **Interface:** DM Sans Variable, bundled locally, with system sans fallback.
- Display type is used for greetings, page titles, story moments, dates, and
  selected metrics. Navigation, tables, body text, and forms use the interface
  face.
- Copy remains concise; warmth comes from phrasing and composition, not long
  marketing paragraphs.

### Shape, border, and depth

- Cards use friendly 14–22px radii with clear grouping.
- Pills support tabs, filters, statuses, and compact actions.
- Daylight shadows are broad and faint; raised cards never look detached from
  the page.
- Terracotta is reserved for actions and notable moments, not used everywhere.

### School media

Only supplied assets under `apps/admin/public/brand/` are used. Campus images
appear on login, the dashboard story panel, gallery, and contextually justified
empty/story states. Operational pages rely on color and typography rather than
repeating photography. Overlays always preserve text contrast.

## 7. Application shell

### Desktop

- A 54–64px olive masthead carries the school identity, high-level areas,
  notifications, role preview when permitted, and account access.
- A light 184–216px contextual sidebar contains the role-aware route list and
  can group modules under Today, Academics, Community, and Administration.
- The daylight workspace uses a generous but efficient column grid.
- The active route uses a solid olive state with white text; supporting routes
  remain quiet and approachable.

### Tablet

- The masthead retains identity and global actions while high-level area tabs
  collapse into an accessible menu.
- The sidebar narrows to icon-first navigation or becomes a drawer based on
  available width.
- Story panels and operational summaries use two-column compositions.

### Mobile

- Navigation becomes a modal drawer with focus containment and an explicit
  close control.
- The masthead remains compact and sticky.
- Story imagery shortens so it does not push all actionable content below the
  fold.
- Tables become prioritized record cards or concise summaries with details in
  an existing page/dialog pattern.

## 8. Login experience

- The login pairs a welcoming daylight form with one supplied campus image and
  the supplied school identity.
- The composition communicates a living school day without invented claims or
  synthetic student imagery.
- Remembered-account, password visibility, forgot-password notice,
  session-restoration, and demo entry remain unchanged behaviorally.
- Demo roles remain explicit sample-data entry points and are visually distinct
  from the live school login.

## 9. Dashboard experience

### Shared structure

- A warm greeting and current date establish context.
- One campus story/moment can lead the page when supported by existing event
  data; it must not claim an event that does not exist.
- The first viewport shows role-specific metrics and actions using varied but
  coordinated card tones.
- Existing counts and calculations remain the sole source of truth.

### Admin

- Whole-community summary, attendance, approvals, fee status, and upcoming
  events lead.
- The dashboard reads as an overview of school life, not only a control panel.

### Teacher

- Class identity, students, pending approvals, assignments, and today's events
  lead.
- Content feels centered on the teacher's class and teaching responsibilities.

### Student

- Attendance, assignments, fee status, notifications, and upcoming events lead.
- Progress is encouraging but never gamified or competitive by default.

## 10. Page archetypes

Every route maps to one of these reusable structures:

1. **Community index:** People, Classes, Subjects, Enrollments, Audit Log.
   Warm heading, compact community totals, search/filter row, approachable table.
2. **Action workspace:** Approvals, Assignments, Communications, Library, Fees.
   Priority summary, segmented views, task cards, and focused dialogs/forms.
3. **Daily rhythm:** Events, Attendance, Course Progress.
   Calendar/progress visual, readable list fallback, and clear legends.
4. **Resources and stories:** Study Room, Report Card, Gallery.
   Purposeful media/preview areas, metadata, and obvious safe actions.
5. **Administration:** Teaching Assignments and configuration forms.
   Guidance, validated fields, and explicit save/cancel hierarchy.

No route is complete if it only receives new colors while preserving visibly
inconsistent spacing, forms, tables, or empty states.

## 11. Component system

The branch establishes or refines shared primitives for:

- Button and icon button
- Text field, select, textarea, checkbox, and field message
- Card, story panel, statistic, and action tile
- Badge/status marker
- Table, responsive record list, pagination/filter row
- Modal/dialog and mobile sheet
- Tabs/segmented control
- Breadcrumbs and page header
- Notifications and role switcher
- Empty, loading, error, and no-results states
- Progress bar, calendar cell, timeline item, and avatar

Primitives expose semantic variants rather than direct palette names where
practical. Existing handlers and state remain attached during migration.

## 12. Motion

- Page content uses a short, gentle reveal capped at roughly 500ms.
- Story imagery may use a very subtle scale or crossfade, limited to login and
  the dashboard.
- Cards use small responsive elevation on hover; no continuous floating.
- Drawers, popovers, dialogs, and menus transition in 160–240ms.
- Progress and metric reveals occur once and never delay interaction.
- `prefers-reduced-motion: reduce` removes non-essential transforms, staggers,
  parallax, and crossfades.

## 13. Data flow and behavior preservation

- `AuthContext`, `AppDataProvider`, route guards, demo routing, localStorage keys,
  Supabase construction rules, and all action functions remain behaviorally
  unchanged.
- Components receive the same values and invoke the same handlers.
- No targeting, role, fee, attendance, approval, assignment, or communication
  rule moves into visual components.
- Existing links preserve destinations and query behavior.
- Story language is derived only from existing data; no fabricated live status
  or event is shown.

## 14. Errors, loading, and empty states

- Existing validation and backend/auth copy remains truthful.
- Inline field errors remain attached to fields; page failures use a concise
  alert and an existing recovery action when available.
- Loading skeletons appear only for real asynchronous waits.
- Empty states use warm but direct language and offer only actions authorized for
  the current role.
- Demo and configuration notices remain visually distinct from errors.

## 15. Accessibility and performance

- WCAG AA contrast for text and controls.
- Visible `:focus-visible` treatment for every interactive element.
- Semantic headings, landmarks, labels, tables, and button names.
- Keyboard-operable menus, drawers, dialogs, tabs, and notifications.
- Minimum practical touch target around 44px on touch layouts.
- Images declare dimensions to prevent layout shift.
- Animation uses transform/opacity rather than repeated layout changes.
- Fonts are locally bundled and limited to required weights/subsets.
- Existing campus images are reused; no generated decorative media is added.

## 16. Verification and acceptance criteria

The redesign is complete only when:

1. Login, shell, dashboard, and all 19 routes visibly belong to Living Campus at
   desktop, tablet, and mobile widths.
2. Admin, teacher, and student navigation and content remain role-correct.
3. Existing demo entry, reset, exit, remembered account, role preview,
   notifications, and sign-out flows still work.
4. Forms, dialogs, tables, calendars, and responsive records do not clip or
   overflow under seeded data.
5. Story panels never display fabricated data or unauthorized actions.
6. Reduced-motion mode removes non-essential movement.
7. Typecheck, lint, tests, production build, and `git diff --check` pass.
8. A secret/environment-name scan finds no prohibited client variable.
9. `PROJECT_STATUS.md` records changed files, checks, and remaining gaps.

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

Living Campus is intentionally not a recolor of the original console. It is a
complete presentation system with an olive masthead, daylight workspace,
purposeful campus storytelling, warm operational surfaces, and restrained
cinematic motion. Its success is measured equally by human connection and daily
clarity.
