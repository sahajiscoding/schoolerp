# Future Heritage UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the complete existing admin web application on `newui` into the approved Future Heritage interface without changing any route, authorization rule, data flow, or business behavior.

**Architecture:** Build the visual system from the bottom up: locally bundled typography and semantic tokens, focused shared presentation primitives, then shell/login/dashboard, then route groups. Existing contexts, handlers, route guards, and seeded data remain authoritative; page work replaces presentation structure around those unchanged behaviors.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 3.4, React Router 7, React Icons 5, Vitest 5, Testing Library, local `@fontsource-variable` fonts.

**Spec:** `docs/superpowers/specs/2026-11-12-future-heritage-ui-design.md`

## Global Constraints

- Work only on branch `newui`; never write to `main` or `newui2`.
- Preserve every existing route, role guard, action handler, localStorage key, demo boundary, and Supabase construction rule.
- Use only supplied media under `apps/admin/public/brand/`; do not invent branding, people, achievements, or live data.
- Admin academic-content permissions, teacher/student targeting, and demo isolation are behavior invariants.
- Use Forest `#173027`, Parchment `#ECE8DC`, Paper `#FCFAF4`, Heritage Gold `#E4CF83`, Moss `#6D7D42`, and Ink `#172219` in their specified semantic roles.
- All animation must be interruptible, transform/opacity based, and disabled when `prefers-reduced-motion: reduce` is active.
- WCAG AA contrast, visible keyboard focus, semantic landmarks, accessible names, and practical touch targets are required.
- Do not stage or modify the untracked `apps/ios/` directory or `.superpowers/` visual-companion workspace.

---

## File map

### Create

- `apps/admin/src/components/page.tsx` — page frame, editorial page header, section heading, empty state, and metric grid.
- `apps/admin/src/components/modal.tsx` — accessible dialog shell shared by all form/detail dialogs.
- `apps/admin/tests/theme-contract.test.ts` — exact Future Heritage token and reduced-motion contract.
- `apps/admin/tests/ui-system.test.tsx` — primitive, page-header, modal, and shell accessibility behavior.
- `apps/admin/tests/routes-ui.test.tsx` — role-aware smoke render for every existing route.

### Modify

- `apps/admin/package.json`, `package-lock.json` — local Newsreader and Manrope variable fonts.
- `apps/admin/src/main.tsx` — local font imports.
- `packages/shared/src/theme.ts` — Future Heritage semantic tokens.
- `apps/admin/tailwind.config.cjs` — semantic palette, fonts, shadows, radii, and keyframes.
- `apps/admin/src/index.css` — base canvas, focus, scrollbar, component utilities, motion, reduced motion, and print rules.
- `apps/admin/src/components/ui.tsx` — accessible semantic UI primitives while retaining compatible props.
- `apps/admin/src/components/AppShell.tsx` — Future Heritage responsive shell.
- `apps/admin/src/App.tsx` — branded authenticated loading state only; routing remains byte-for-byte equivalent in behavior.
- `apps/admin/src/pages/*.tsx` — all 19 route modules receive their mapped page archetype.
- `apps/admin/tests/demo.test.tsx`, `apps/admin/tests/live-login.test.tsx` — preserve auth/demo behavior while asserting new accessible structure.
- `PROJECT_STATUS.md` — exact completion and verification evidence.

---

### Task 1: Lock the Future Heritage foundation

**Files:**
- Create: `apps/admin/tests/theme-contract.test.ts`
- Modify: `apps/admin/package.json`
- Modify: `package-lock.json`
- Modify: `apps/admin/src/main.tsx`
- Modify: `packages/shared/src/theme.ts`
- Modify: `apps/admin/tailwind.config.cjs`
- Modify: `apps/admin/src/index.css`

**Interfaces:**
- Consumes: approved palette, typography, motion, and accessibility requirements from the spec.
- Produces: `theme.colors`, Tailwind classes, `font-display`, `font-sans`, `.surface-paper`, `.field-control`, `.focus-ring`, `.page-reveal`, and reduced-motion behavior used by every later task.

- [ ] **Step 1: Write the failing token and CSS contract test**

```ts
// apps/admin/tests/theme-contract.test.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { theme } from '@schoolerp/shared';

const cssPath = fileURLToPath(new URL('../src/index.css', import.meta.url));

describe('Future Heritage design contract', () => {
  it('exports the approved semantic palette', () => {
    expect(theme.colors).toMatchObject({
      forest: '#173027',
      parchment: '#ECE8DC',
      paper: '#FCFAF4',
      gold: '#E4CF83',
      moss: '#6D7D42',
      ink: '#172219',
    });
  });

  it('contains a global focus treatment and reduced-motion override', () => {
    const css = readFileSync(cssPath, 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('.page-reveal');
  });
});
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `npm run test --workspace=apps/admin -- theme-contract.test.ts`

Expected: FAIL because `theme.colors.forest` and the new CSS contract do not exist.

- [ ] **Step 3: Install only the approved local fonts**

Run:

```powershell
npm install --workspace=apps/admin @fontsource-variable/newsreader @fontsource-variable/manrope
```

Expected: `apps/admin/package.json` and `package-lock.json` record both packages; no other dependency is added.

- [ ] **Step 4: Import fonts and define the semantic theme**

```ts
// apps/admin/src/main.tsx — before index.css
import '@fontsource-variable/newsreader';
import '@fontsource-variable/manrope';
import './index.css';
```

```ts
// packages/shared/src/theme.ts
export const theme = {
  colors: {
    forest950: '#0D1E17',
    forest900: '#12271E',
    forest: '#173027',
    parchment: '#ECE8DC',
    paper: '#FCFAF4',
    gold: '#E4CF83',
    moss: '#6D7D42',
    ink: '#172219',
    muted: '#5E6B62',
    olive: '#6D7D42',
    terracotta: '#A94F36',
    sand: '#ECE8DC',
    cream: '#FCFAF4',
    accent: '#E4CF83',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 14, lg: 20 },
} as const;
```

Configure Tailwind with matching `forest`, `parchment`, `paper`, `gold`, `moss`, legacy aliases, `fontFamily.display`, `fontFamily.sans`, `boxShadow.lift`, and reveal keyframes. In `index.css`, implement the body canvas, selection color, focus ring, scrollbar, reusable field/surface utilities, `.page-reveal`, and a reduced-motion block that sets animation/transition durations to `0.01ms` and disables smooth scrolling.

- [ ] **Step 5: Run the foundation checks**

Run:

```powershell
npm run test --workspace=apps/admin -- theme-contract.test.ts
npm run typecheck --workspace=apps/admin
```

Expected: PASS with no TypeScript error.

- [ ] **Step 6: Commit the foundation**

```powershell
git add apps/admin/package.json package-lock.json apps/admin/src/main.tsx apps/admin/src/index.css apps/admin/tailwind.config.cjs packages/shared/src/theme.ts apps/admin/tests/theme-contract.test.ts
git commit -m "feat(ui): establish Future Heritage foundation"
```

---

### Task 2: Build accessible shared presentation primitives

**Files:**
- Create: `apps/admin/src/components/page.tsx`
- Create: `apps/admin/src/components/modal.tsx`
- Create: `apps/admin/tests/ui-system.test.tsx`
- Modify: `apps/admin/src/components/ui.tsx`

**Interfaces:**
- Consumes: Tailwind tokens and CSS utilities from Task 1.
- Produces: `Page`, `PageHeader`, `SectionHeading`, `EmptyState`, `MetricGrid`, `Modal`, `Button`, `Card`, `Badge`, `Table`, `StatCard`, `Breadcrumbs`, `NotificationsDropdown`, and `RoleSwitcher` for all page tasks.

- [ ] **Step 1: Write failing primitive accessibility tests**

```tsx
// apps/admin/tests/ui-system.test.tsx
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/components/ui';
import { PageHeader, EmptyState } from '../src/components/page';
import { Modal } from '../src/components/modal';

afterEach(cleanup);

it('renders the shared page hierarchy and actionable empty state', () => {
  render(<><PageHeader eyebrow="Administration" title="People" description="School community" />
    <EmptyState title="No people found" action={<Button>Add person</Button>} /></>);
  expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Add person' })).toBeTruthy();
});

it('labels the shared modal and closes it with Escape', async () => {
  const onClose = vi.fn();
  render(<Modal title="Add person" description="Create a school profile" onClose={onClose}>Form</Modal>);
  expect(screen.getByRole('dialog', { name: 'Add person' }).getAttribute('aria-modal')).toBe('true');
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run the primitive test and verify it fails**

Run: `npm run test --workspace=apps/admin -- ui-system.test.tsx`

Expected: FAIL because `page.tsx` and `modal.tsx` do not exist.

- [ ] **Step 3: Implement the focused component APIs**

```tsx
// apps/admin/src/components/page.tsx — public API
export function Page(props: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element;
export function PageHeader(props: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}): React.JSX.Element;
export function SectionHeading(props: { title: string; description?: string; action?: React.ReactNode }): React.JSX.Element;
export function EmptyState(props: { title: string; description?: string; icon?: React.ElementType; action?: React.ReactNode }): React.JSX.Element;
export function MetricGrid(props: { children: React.ReactNode; className?: string }): React.JSX.Element;
```

```tsx
// apps/admin/src/components/modal.tsx — public API
export type ModalProps = {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
};
export function Modal(props: ModalProps): React.JSX.Element;
```

`Modal` must generate title/description ids with `useId`, set `role="dialog"` and `aria-modal="true"`, focus the close button on mount, restore prior focus on unmount, and close on Escape. Update `ui.tsx` while preserving every existing prop name and legacy `olive`/`terracotta` variants as aliases for semantic primary/secondary styling.

- [ ] **Step 4: Run primitive tests and existing auth tests**

Run:

```powershell
npm run test --workspace=apps/admin -- ui-system.test.tsx demo.test.tsx live-login.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the primitives**

```powershell
git add apps/admin/src/components/ui.tsx apps/admin/src/components/page.tsx apps/admin/src/components/modal.tsx apps/admin/tests/ui-system.test.tsx
git commit -m "feat(ui): add Future Heritage primitives"
```

---

### Task 3: Rebuild the authenticated shell

**Files:**
- Modify: `apps/admin/src/components/AppShell.tsx`
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/tests/demo.test.tsx`
- Modify: `apps/admin/tests/ui-system.test.tsx`

**Interfaces:**
- Consumes: unchanged `useAuth()`, `useAppData()`, navigation definitions, notifications, and Task 2 primitives.
- Produces: responsive forest rail, parchment workspace, command row, mobile drawer, demo banner, role switcher, and `<Outlet />` content surface.

- [ ] **Step 1: Extend the shell test before changing markup**

Add these assertions after entering the Admin demo in `demo.test.tsx`:

```tsx
expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeTruthy();
expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBe('page');
expect(screen.getByRole('banner')).toBeTruthy();
expect(screen.getByRole('main')).toBeTruthy();
```

Add a focused test in `ui-system.test.tsx` confirming the mobile menu button has the accessible name `Open navigation`.

- [ ] **Step 2: Run the tests and verify the new assertions fail**

Run: `npm run test --workspace=apps/admin -- demo.test.tsx ui-system.test.tsx`

Expected: FAIL because the current navigation and landmarks are not fully labelled.

- [ ] **Step 3: Implement the shell without changing its data logic**

Keep `NAV`, role filtering, badge calculations, notification filtering, logout, reset, and demo links intact. Recompose the return tree as:

```tsx
<div className="min-h-screen bg-parchment text-ink">
  <aside>{/* forest identity, labelled nav groups, account and demo card */}</aside>
  <div className="app-workspace">
    <header role="banner">{/* breadcrumb context, search affordance, role, notifications */}</header>
    {isDemoPath && <DemoBanner />}
    <main id="main-content" className="page-reveal"><Outlet /></main>
  </div>
</div>
```

Use `aria-current="page"`, `aria-expanded`, labelled navigation, Escape-to-close mobile drawer behavior, a skip link to `#main-content`, and 44px mobile targets. Restyle the `RequireAuth` spinner in `App.tsx` with forest/parchment tokens only; do not alter route declarations.

- [ ] **Step 4: Run shell, auth, type, and lint checks**

Run:

```powershell
npm run test --workspace=apps/admin -- demo.test.tsx live-login.test.tsx ui-system.test.tsx
npm run typecheck --workspace=apps/admin
npm run lint --workspace=apps/admin
```

Expected: tests PASS; lint has no new error.

- [ ] **Step 5: Commit the shell**

```powershell
git add apps/admin/src/components/AppShell.tsx apps/admin/src/App.tsx apps/admin/tests/demo.test.tsx apps/admin/tests/ui-system.test.tsx
git commit -m "feat(ui): rebuild Future Heritage shell"
```

---

### Task 4: Rebuild login while preserving auth and demo isolation

**Files:**
- Modify: `apps/admin/src/pages/Login.tsx`
- Modify: `apps/admin/tests/live-login.test.tsx`
- Modify: `apps/admin/tests/demo.test.tsx`

**Interfaces:**
- Consumes: unchanged `signIn`, `signInAsDemo`, remembered-account storage, `isDemoPath`, and supplied logo/campus images.
- Produces: cinematic Future Heritage credential and demo-entry experience.

- [ ] **Step 1: Add behavior-preserving structural assertions**

```tsx
// live-login.test.tsx
expect(screen.getByRole('main', { name: 'Pacific World School sign in' })).toBeTruthy();
expect(screen.getByRole('heading', { level: 1, name: /Welcome back/ })).toBeTruthy();
expect(screen.getByRole('button', { name: 'Try a demo' })).toBeTruthy();
```

In `demo.test.tsx`, retain exact role button, `Demo mode`, sign-out, storage-isolation, and no-Supabase assertions.

- [ ] **Step 2: Run login tests and verify the structural assertions fail**

Run: `npm run test --workspace=apps/admin -- live-login.test.tsx demo.test.tsx`

Expected: FAIL on the new main landmark/name or heading.

- [ ] **Step 3: Recompose the login presentation**

Use one `<main aria-label="Pacific World School sign in">` with a forest editorial panel and a paper credential panel. Keep input ids/labels, button names, handlers, remembered-account controls, role links, notices, and errors unchanged. Use `/brand/pws-logo.png` and one campus image with an empty alt when decorative. Keep all school claims factual and omit the existing generic report-card marketing paragraph.

- [ ] **Step 4: Run login and build checks**

Run:

```powershell
npm run test --workspace=apps/admin -- live-login.test.tsx demo.test.tsx
npm run build --workspace=apps/admin
```

Expected: PASS; production assets contain both local fonts and no remote font request.

- [ ] **Step 5: Commit login**

```powershell
git add apps/admin/src/pages/Login.tsx apps/admin/tests/live-login.test.tsx apps/admin/tests/demo.test.tsx
git commit -m "feat(ui): redesign Future Heritage login"
```

---

### Task 5: Build role-specific editorial dashboards

**Files:**
- Modify: `apps/admin/src/pages/Dashboard.tsx`
- Modify: `apps/admin/tests/routes-ui.test.tsx`

**Interfaces:**
- Consumes: all existing calculations in `Dashboard.tsx`, `useAuth()`, `useAppData()`, and page/UI primitives.
- Produces: admin, teacher, and student Future Heritage dashboard compositions with unchanged metric values and destinations.

- [ ] **Step 1: Create the route and role smoke-test harness**

```tsx
// apps/admin/tests/routes-ui.test.tsx
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.hoisted(() => window.history.replaceState(null, '', '/demo/dashboard?role=admin'));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => { throw new Error('demo isolation'); }) }));
import App from '../src/App';

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(cleanup);

it.each([
  ['admin', 'School pulse'],
  ['teacher', 'Class pulse'],
  ['student', 'My day'],
])('renders the %s dashboard identity', async (role, heading) => {
  window.history.replaceState(null, '', `/demo/dashboard?role=${role}`);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: new RegExp(heading, 'i') })).toBeTruthy();
});
```

- [ ] **Step 2: Run the role test and verify it fails**

Run: `npm run test --workspace=apps/admin -- routes-ui.test.tsx`

Expected: FAIL because the approved role-specific page headings do not exist.

- [ ] **Step 3: Recompose dashboards around unchanged calculations**

Keep `stats`, `myAssignments`, `recentLeaves`, `upcoming`, `mySection`, and every link destination. Split only presentation inside the file into `AdminDashboard`, `TeacherDashboard`, and `StudentDashboard` functions receiving already-calculated values. Use `PageHeader`, an asymmetric metric/story grid, role-specific attention list, and quick actions. Do not hardcode new counts or events.

- [ ] **Step 4: Run route, auth, type, and lint checks**

Run:

```powershell
npm run test --workspace=apps/admin -- routes-ui.test.tsx demo.test.tsx
npm run typecheck --workspace=apps/admin
npm run lint --workspace=apps/admin
```

Expected: PASS with no new lint error.

- [ ] **Step 5: Commit dashboards**

```powershell
git add apps/admin/src/pages/Dashboard.tsx apps/admin/tests/routes-ui.test.tsx
git commit -m "feat(ui): compose Future Heritage dashboards"
```

---

### Task 6: Convert administration routes to the editorial ledger archetype

**Files:**
- Modify: `apps/admin/src/pages/People.tsx`
- Modify: `apps/admin/src/pages/Classes.tsx`
- Modify: `apps/admin/src/pages/Subjects.tsx`
- Modify: `apps/admin/src/pages/TeachingAssignments.tsx`
- Modify: `apps/admin/src/pages/Enrollments.tsx`
- Modify: `apps/admin/src/pages/AuditLog.tsx`
- Modify: `apps/admin/tests/routes-ui.test.tsx`

**Interfaces:**
- Consumes: existing CRUD handlers, CSV behavior, admin guards, tables, Task 2 page/modal primitives.
- Produces: consistent administration headers, metrics, filters, responsive ledger tables, and accessible dialogs.

- [ ] **Step 1: Add all administration routes to the smoke matrix**

```tsx
const adminRoutes = [
  ['/people', /People & profiles/i],
  ['/classes', /Classes & sections/i],
  ['/subjects', /Subjects/i],
  ['/teaching-assignments', /Teaching assignments/i],
  ['/enrollments', /Enrollments/i],
  ['/audit-log', /Audit log/i],
] as const;
```

For each path, set the URL under `/demo`, seed `pws.showcase.role=admin`, render, and assert one level-one heading plus the existing primary action when the route has one.

- [ ] **Step 2: Run route tests and verify new heading contracts fail**

Run: `npm run test --workspace=apps/admin -- routes-ui.test.tsx`

Expected: FAIL on at least the People heading contract.

- [ ] **Step 3: Migrate the six routes without changing handlers**

Apply this exact structural pattern per file:

```tsx
<Page>
  <PageHeader eyebrow="Administration" title="…" description="…" actions={existingAction} />
  <MetricGrid>{existingDerivedTotals}</MetricGrid>
  <Card padded={false}>{existingFilterAndTable}</Card>
  {existingDialogState && <Modal title="…" onClose={existingClose}>{existingForm}</Modal>}
</Page>
```

Replace duplicated fixed overlays with `Modal`, use `.field-control` on existing inputs/selects, preserve every submit callback and validation branch, and keep all table columns available on desktop. On narrow screens hide only secondary columns and expose their data in the first cell's supporting text.

- [ ] **Step 4: Run administration and regression checks**

Run:

```powershell
npm run test --workspace=apps/admin -- routes-ui.test.tsx demo.test.tsx
npm run typecheck --workspace=apps/admin
npm run lint --workspace=apps/admin
```

Expected: PASS; no action name or admin route changed.

- [ ] **Step 5: Commit administration routes**

```powershell
git add apps/admin/src/pages/People.tsx apps/admin/src/pages/Classes.tsx apps/admin/src/pages/Subjects.tsx apps/admin/src/pages/TeachingAssignments.tsx apps/admin/src/pages/Enrollments.tsx apps/admin/src/pages/AuditLog.tsx apps/admin/tests/routes-ui.test.tsx
git commit -m "feat(ui): redesign Future Heritage administration"
```

---

### Task 7: Convert academic workflows to focused workspaces

**Files:**
- Modify: `apps/admin/src/pages/Approvals.tsx`
- Modify: `apps/admin/src/pages/Assignments.tsx`
- Modify: `apps/admin/src/pages/CourseProgress.tsx`
- Modify: `apps/admin/src/pages/Attendance.tsx`
- Modify: `apps/admin/src/pages/ReportCard.tsx`
- Modify: `apps/admin/tests/routes-ui.test.tsx`

**Interfaces:**
- Consumes: existing role checks, leave decisions, assignment submit/review, progress writes, attendance writes, report generation/print behavior.
- Produces: Future Heritage workflow boards and responsive records with no permission or action change.

- [ ] **Step 1: Add academic routes and role expectations to the smoke matrix**

```tsx
const academicRoutes = [
  ['/approvals', /Leave approvals|My leaves/i],
  ['/assignments', /Assignments/i],
  ['/course-progress', /Course progress|My progress/i],
  ['/attendance', /Attendance/i],
  ['/report-card', /Report cards|My report card/i],
] as const;
```

Add one student assertion that no attendance mutation button is rendered and one admin assertion that assignment content is read-only.

- [ ] **Step 2: Run tests and verify the new structural/role assertions fail where expected**

Run: `npm run test --workspace=apps/admin -- routes-ui.test.tsx`

Expected: FAIL until headings and labelled workflow regions are implemented; existing permission behavior must continue to pass.

- [ ] **Step 3: Apply the workflow archetype**

For each file use `PageHeader`, a role-aware summary band, labelled segmented controls, `Card` work areas, `EmptyState`, and `Modal`. Preserve all existing data derivations and action handlers. Keep print-specific report-card markup semantically stable and add Future Heritage print overrides under `@media print` rather than hiding data.

```tsx
<section aria-labelledby="workflow-title" className="surface-paper">
  <SectionHeading title="…" description="…" action={authorizedAction} />
  {existingContent.length ? existingContent : <EmptyState title="…" />}
</section>
```

- [ ] **Step 4: Run academic, auth, type, and lint checks**

Run:

```powershell
npm run test --workspace=apps/admin -- routes-ui.test.tsx demo.test.tsx live-login.test.tsx
npm run typecheck --workspace=apps/admin
npm run lint --workspace=apps/admin
```

Expected: PASS; role behavior remains unchanged.

- [ ] **Step 5: Commit academic workflows**

```powershell
git add apps/admin/src/pages/Approvals.tsx apps/admin/src/pages/Assignments.tsx apps/admin/src/pages/CourseProgress.tsx apps/admin/src/pages/Attendance.tsx apps/admin/src/pages/ReportCard.tsx apps/admin/tests/routes-ui.test.tsx apps/admin/src/index.css
git commit -m "feat(ui): redesign Future Heritage academics"
```

---

### Task 8: Convert community, calendar, resources, and finance routes

**Files:**
- Modify: `apps/admin/src/pages/Communications.tsx`
- Modify: `apps/admin/src/pages/Events.tsx`
- Modify: `apps/admin/src/pages/StudyRoom.tsx`
- Modify: `apps/admin/src/pages/Library.tsx`
- Modify: `apps/admin/src/pages/Fees.tsx`
- Modify: `apps/admin/src/pages/Gallery.tsx`
- Modify: `apps/admin/tests/routes-ui.test.tsx`

**Interfaces:**
- Consumes: existing declarations, polls, broadcasts, events, materials, library operations, fee/sibling logic, and gallery seed data.
- Produces: editorial community/resource archetypes with existing behavior intact.

- [ ] **Step 1: Complete the route smoke matrix**

```tsx
const communityRoutes = [
  ['/communications', /Communications|Inbox/i],
  ['/events', /Events & calendars/i],
  ['/study-room', /Study room/i],
  ['/library', /Library/i],
  ['/fees', /Fee collection|My fee/i],
  ['/gallery', /School gallery/i],
] as const;
```

Assert the Events calendar has an accessible region name, Fees retains the sibling discount text, and Communications exposes declarations, polls, and recent messages as labelled sections.

- [ ] **Step 2: Run the route suite and verify structural failures**

Run: `npm run test --workspace=apps/admin -- routes-ui.test.tsx`

Expected: FAIL on the newly required labelled regions before the redesign.

- [ ] **Step 3: Apply Future Heritage route archetypes**

Use the approved page structures: calendar/progress for Events, workflow board for Communications/Library/Fees, document resource layout for Study Room, and media layout for Gallery. Reuse `Modal`, `PageHeader`, `SectionHeading`, `EmptyState`, tables, and fields. Preserve every callback, authorization check, discount calculation, event date calculation, and safe document preview/print behavior.

- [ ] **Step 4: Run complete route and unit tests**

Run:

```powershell
npm run test --workspace=apps/admin
npm run typecheck --workspace=apps/admin
npm run lint --workspace=apps/admin
```

Expected: all tests PASS; lint has zero errors.

- [ ] **Step 5: Commit remaining routes**

```powershell
git add apps/admin/src/pages/Communications.tsx apps/admin/src/pages/Events.tsx apps/admin/src/pages/StudyRoom.tsx apps/admin/src/pages/Library.tsx apps/admin/src/pages/Fees.tsx apps/admin/src/pages/Gallery.tsx apps/admin/tests/routes-ui.test.tsx
git commit -m "feat(ui): complete Future Heritage routes"
```

---

### Task 9: Perform responsive, motion, and accessibility convergence

**Files:**
- Modify: `apps/admin/src/index.css`
- Modify: `apps/admin/src/components/AppShell.tsx`
- Modify: any page file with a verified overflow or accessibility defect
- Modify: `apps/admin/tests/theme-contract.test.ts`
- Modify: `apps/admin/tests/ui-system.test.tsx`

**Interfaces:**
- Consumes: complete Future Heritage UI from Tasks 1–8.
- Produces: verified 375px, 768px, and 1440px layouts; reduced-motion equivalence; keyboard-visible interactions.

- [ ] **Step 1: Expand automated accessibility contracts**

```ts
// theme-contract.test.ts additions
expect(css).toContain('min-height: 44px');
expect(css).toContain('scrollbar-gutter: stable');
expect(css).not.toContain('transition: all');
```

Add tests that the mobile drawer button exposes `aria-expanded`, the close button is named, and the active route exposes `aria-current="page"`.

- [ ] **Step 2: Run tests and verify any missing contracts fail**

Run: `npm run test --workspace=apps/admin -- theme-contract.test.ts ui-system.test.tsx`

Expected: FAIL until all convergence rules are present.

- [ ] **Step 3: Verify and fix the three viewport classes**

Run the dev server:

```powershell
npm run dev --workspace=apps/admin -- --host 127.0.0.1
```

At 375×812, 768×1024, and 1440×900, open Admin, Teacher, and Student demos. For every route, verify no horizontal page overflow, drawer/menu keyboard operation, visible focus, dialog containment, readable data, and correct primary action priority. Fix only observed defects; use explicit responsive classes rather than JS viewport branching.

- [ ] **Step 4: Verify reduced motion and browser errors**

Emulate `prefers-reduced-motion: reduce`; navigate login → dashboard → assignments → events → people, open and close a dialog, and confirm no non-essential transform/crossfade runs. Confirm the browser console has no error or warning caused by the redesign.

- [ ] **Step 5: Run the full admin gate**

Run:

```powershell
npm run test --workspace=apps/admin
npm run typecheck --workspace=apps/admin
npm run lint --workspace=apps/admin
npm run build --workspace=apps/admin
git diff --check
```

Expected: all commands succeed; any existing lint warning is documented and no new warning is introduced.

- [ ] **Step 6: Commit convergence fixes**

```powershell
git add apps/admin/src apps/admin/tests
git commit -m "fix(ui): polish Future Heritage responsiveness"
```

---

### Task 10: Record proof and finalize the branch

**Files:**
- Modify: `PROJECT_STATUS.md`
- Modify: `docs/superpowers/specs/2026-11-12-future-heritage-ui-design.md`

**Interfaces:**
- Consumes: final verification output and changed-file inventory.
- Produces: truthful branch status, final spec state, clean commit history, and pushed `newui` branch.

- [ ] **Step 1: Run client-secret and environment-name guards**

Run:

```powershell
rg -n "(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|SUPABASE_JWT_SECRET|POSTGRES_PASSWORD|EXPO_PUBLIC_.*(SECRET|SERVICE|PRIVATE|JWT|POSTGRES|DATABASE|PASSWORD|TOKEN)|VITE_.*(SECRET|SERVICE|PRIVATE|JWT|POSTGRES|DATABASE|PASSWORD|TOKEN))" apps
```

Expected: no prohibited client secret or public secret-like variable; the approved publishable-key names are allowed.

- [ ] **Step 2: Update project truth**

Change the Future Heritage spec status to `Implemented and verified`. In `PROJECT_STATUS.md`, replace “implementation has not started” with a factual summary naming the shell, UI primitives, all route groups, tests, exact commands, pass/fail results, and any remaining visual gap.

- [ ] **Step 3: Run final repository checks**

Run:

```powershell
git diff --check
git status --short
git log --oneline -12
```

Expected: only intended documentation changes remain unstaged; `.superpowers/` and `apps/ios/` remain untracked and unmodified.

- [ ] **Step 4: Commit documentation**

```powershell
git add PROJECT_STATUS.md docs/superpowers/specs/2026-11-12-future-heritage-ui-design.md
git commit -m "docs: record Future Heritage verification"
```

- [ ] **Step 5: Push only `newui`**

```powershell
git push origin newui
```

Expected: `origin/newui` advances; `origin/main` and `origin/newui2` remain unchanged by this push.
