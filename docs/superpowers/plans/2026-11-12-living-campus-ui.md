# Living Campus UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the complete existing admin web application on `newui2` into the approved Living Campus interface without changing any route, authorization rule, data flow, or business behavior.

**Architecture:** Establish locally bundled typography and semantic daylight tokens, create focused shared presentation primitives, then rebuild shell/login/dashboard before migrating route groups to community, action-workspace, daily-rhythm, resource, and administration archetypes. Existing contexts, handlers, guards, and data remain authoritative; only presentation structure changes.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind CSS 3.4, React Router 7, React Icons 5, Vitest 5, Testing Library, local `@fontsource-variable` fonts.

**Spec:** `docs/superpowers/specs/2026-11-12-living-campus-ui-design.md`

## Global Constraints

- Work only on branch `newui2`; never write to `main` or `newui`.
- Preserve every route, role guard, action handler, localStorage key, demo boundary, and Supabase construction rule.
- Use only supplied media under `apps/admin/public/brand/`; do not invent branding, people, achievements, events, or live data.
- Admin academic-content permissions, teacher/student targeting, and demo isolation are behavior invariants.
- Use Campus Olive `#586A36`, Deep Olive `#3F512A`, Young Leaf `#DCE6C4`, Daylight Canvas `#F7F2E8`, Paper `#FFFEFA`, Terracotta `#D97747`, Clay `#F1D5C3`, and Ink `#2F3D2A` in their specified semantic roles.
- Photography appears only on login, the dashboard story panel, gallery, or a contextually justified state; operational pages do not become photo collages.
- All animation must be interruptible, transform/opacity based, and disabled when `prefers-reduced-motion: reduce` is active.
- WCAG AA contrast, visible keyboard focus, semantic landmarks, accessible names, and practical touch targets are required.

---

## File map

### Create

- `apps/admin/src/components/page.tsx` — page frame, warm page header, section heading, empty state, and metric grid.
- `apps/admin/src/components/modal.tsx` — accessible dialog shell shared by form/detail dialogs.
- `apps/admin/tests/theme-contract.test.ts` — exact Living Campus token and reduced-motion contract.
- `apps/admin/tests/ui-system.test.tsx` — primitive, page-header, modal, and shell accessibility behavior.
- `apps/admin/tests/routes-ui.test.tsx` — role-aware smoke render for every existing route.

### Modify

- `apps/admin/package.json`, `package-lock.json` — local Fraunces and DM Sans variable fonts.
- `apps/admin/src/main.tsx` — local font imports.
- `packages/shared/src/theme.ts` — Living Campus semantic tokens.
- `apps/admin/tailwind.config.cjs` — semantic palette, fonts, shadows, radii, and keyframes.
- `apps/admin/src/index.css` — daylight canvas, focus, scrollbar, component utilities, motion, reduced motion, and print rules.
- `apps/admin/src/components/ui.tsx` — semantic primitives retaining compatible props.
- `apps/admin/src/components/AppShell.tsx` — olive masthead plus responsive contextual navigation.
- `apps/admin/src/App.tsx` — branded authenticated loading state only; routing remains behaviorally identical.
- `apps/admin/src/pages/*.tsx` — all 19 route modules receive their mapped page archetype.
- `apps/admin/tests/demo.test.tsx`, `apps/admin/tests/live-login.test.tsx` — preserve auth/demo behavior while asserting new structure.
- `PROJECT_STATUS.md` — exact completion and verification evidence.

---

### Task 1: Lock the Living Campus foundation

**Files:**
- Create: `apps/admin/tests/theme-contract.test.ts`
- Modify: `apps/admin/package.json`
- Modify: `package-lock.json`
- Modify: `apps/admin/src/main.tsx`
- Modify: `packages/shared/src/theme.ts`
- Modify: `apps/admin/tailwind.config.cjs`
- Modify: `apps/admin/src/index.css`

**Interfaces:**
- Consumes: approved Living Campus palette, typography, motion, and accessibility requirements.
- Produces: `theme.colors`, Tailwind classes, `font-display`, `font-sans`, `.surface-paper`, `.field-control`, `.focus-ring`, `.page-reveal`, and reduced-motion behavior used by every later task.

- [ ] **Step 1: Write the failing token and CSS contract test**

```ts
// apps/admin/tests/theme-contract.test.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { theme } from '@schoolerp/shared';

const cssPath = fileURLToPath(new URL('../src/index.css', import.meta.url));

describe('Living Campus design contract', () => {
  it('exports the approved semantic palette', () => {
    expect(theme.colors).toMatchObject({
      olive: '#586A36',
      deepOlive: '#3F512A',
      leaf: '#DCE6C4',
      daylight: '#F7F2E8',
      paper: '#FFFEFA',
      terracotta: '#D97747',
      clay: '#F1D5C3',
      ink: '#2F3D2A',
    });
  });

  it('contains focus, reveal, and reduced-motion contracts', () => {
    const css = readFileSync(cssPath, 'utf8');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('.page-reveal');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `npm run test --workspace=apps/admin -- theme-contract.test.ts`

Expected: FAIL because the approved semantic tokens and CSS contracts do not exist.

- [ ] **Step 3: Install only the approved local fonts**

Run:

```powershell
npm install --workspace=apps/admin @fontsource-variable/fraunces @fontsource-variable/dm-sans
```

Expected: `apps/admin/package.json` and `package-lock.json` record both packages and no unrelated dependency.

- [ ] **Step 4: Import fonts and define the semantic theme**

```ts
// apps/admin/src/main.tsx — before index.css
import '@fontsource-variable/fraunces';
import '@fontsource-variable/dm-sans';
import './index.css';
```

```ts
// packages/shared/src/theme.ts
export const theme = {
  colors: {
    olive: '#586A36',
    deepOlive: '#3F512A',
    leaf: '#DCE6C4',
    daylight: '#F7F2E8',
    paper: '#FFFEFA',
    terracotta: '#D97747',
    clay: '#F1D5C3',
    ink: '#2F3D2A',
    muted: '#64705D',
    sand: '#F7F2E8',
    cream: '#FFFEFA',
    accent: '#D97747',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 14, lg: 22 },
} as const;
```

Configure Tailwind with matching roles, legacy aliases, `fontFamily.display`, `fontFamily.sans`, daylight shadows, radii, and gentle reveal keyframes. In `index.css`, implement the daylight body canvas, selection color, focus ring, scrollbar, reusable field/surface utilities, `.page-reveal`, image treatment, and a reduced-motion block that sets animation/transition durations to `0.01ms` and disables smooth scrolling.

- [ ] **Step 5: Run foundation checks**

Run:

```powershell
npm run test --workspace=apps/admin -- theme-contract.test.ts
npm run typecheck --workspace=apps/admin
```

Expected: PASS with no TypeScript error.

- [ ] **Step 6: Commit the foundation**

```powershell
git add apps/admin/package.json package-lock.json apps/admin/src/main.tsx apps/admin/src/index.css apps/admin/tailwind.config.cjs packages/shared/src/theme.ts apps/admin/tests/theme-contract.test.ts
git commit -m "feat(ui): establish Living Campus foundation"
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
- Produces: `Page`, `PageHeader`, `SectionHeading`, `EmptyState`, `MetricGrid`, `Modal`, `Button`, `Card`, `Badge`, `Table`, `StatCard`, `Breadcrumbs`, `NotificationsDropdown`, and `RoleSwitcher` for all route migrations.

- [ ] **Step 1: Write failing primitive accessibility tests**

```tsx
// apps/admin/tests/ui-system.test.tsx
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../src/components/ui';
import { EmptyState, PageHeader } from '../src/components/page';
import { Modal } from '../src/components/modal';

afterEach(cleanup);

it('renders the community page hierarchy and actionable empty state', () => {
  render(<><PageHeader eyebrow="Our school community" title="People" description="One connected campus" />
    <EmptyState title="No people found" action={<Button>Welcome someone</Button>} /></>);
  expect(screen.getByRole('heading', { level: 1, name: 'People' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Welcome someone' })).toBeTruthy();
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

`Modal` must generate title/description ids with `useId`, set `role="dialog"` and `aria-modal="true"`, focus the close control on mount, restore prior focus on unmount, and close on Escape. Update `ui.tsx` while preserving all existing prop names and keeping `olive`/`terracotta` variants as compatible semantic aliases.

- [ ] **Step 4: Run primitive and existing auth tests**

Run:

```powershell
npm run test --workspace=apps/admin -- ui-system.test.tsx demo.test.tsx live-login.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit the primitives**

```powershell
git add apps/admin/src/components/ui.tsx apps/admin/src/components/page.tsx apps/admin/src/components/modal.tsx apps/admin/tests/ui-system.test.tsx
git commit -m "feat(ui): add Living Campus primitives"
```

---

### Task 3: Rebuild the masthead and contextual shell

**Files:**
- Modify: `apps/admin/src/components/AppShell.tsx`
- Modify: `apps/admin/src/App.tsx`
- Modify: `apps/admin/tests/demo.test.tsx`
- Modify: `apps/admin/tests/ui-system.test.tsx`

**Interfaces:**
- Consumes: unchanged `useAuth()`, `useAppData()`, navigation data, notification filtering, and Task 2 primitives.
- Produces: olive masthead, light contextual sidebar, daylight workspace, responsive drawer, demo banner, role switcher, and `<Outlet />` content surface.

- [ ] **Step 1: Extend the shell behavior tests**

Add after Admin demo entry:

```tsx
expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeTruthy();
expect(screen.getByRole('navigation', { name: 'School areas' })).toBeTruthy();
expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBe('page');
expect(screen.getByRole('banner')).toBeTruthy();
expect(screen.getByRole('main')).toBeTruthy();
```

Add a focused assertion that the mobile control is named `Open navigation` and exposes `aria-expanded`.

- [ ] **Step 2: Run the tests and verify new assertions fail**

Run: `npm run test --workspace=apps/admin -- demo.test.tsx ui-system.test.tsx`

Expected: FAIL because current shell landmarks are not fully labelled and there is no School areas navigation.

- [ ] **Step 3: Implement the shell without changing data behavior**

Keep navigation definitions, role filtering, leave badges, notification audience filtering, logout, demo reset, and demo exit intact. Recompose the return tree as:

```tsx
<div className="min-h-screen bg-daylight text-ink">
  <header role="banner">{/* olive school masthead and global actions */}</header>
  <div className="campus-shell">
    <aside>{/* role summary and labelled contextual navigation */}</aside>
    <div className="campus-workspace">
      {isDemoPath && <DemoBanner />}
      <main id="main-content" className="page-reveal"><Outlet /></main>
    </div>
  </div>
</div>
```

Use `aria-current`, `aria-expanded`, labelled navigation, Escape-to-close drawer behavior, a skip link, and 44px touch controls. High-level masthead areas may group links visually but must resolve to existing routes; do not introduce routes. Restyle only the `RequireAuth` loader in `App.tsx` and leave route declarations unchanged.

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
git commit -m "feat(ui): rebuild Living Campus shell"
```

---

### Task 4: Rebuild the daylight login experience

**Files:**
- Modify: `apps/admin/src/pages/Login.tsx`
- Modify: `apps/admin/tests/live-login.test.tsx`
- Modify: `apps/admin/tests/demo.test.tsx`

**Interfaces:**
- Consumes: unchanged live sign-in, demo sign-in, remembered-account storage, session restoration, and supplied school media.
- Produces: welcoming Living Campus login and isolated demo entry.

- [ ] **Step 1: Add behavior-preserving structural assertions**

```tsx
expect(screen.getByRole('main', { name: 'Pacific World School sign in' })).toBeTruthy();
expect(screen.getByRole('heading', { level: 1, name: /Welcome to your school day/i })).toBeTruthy();
expect(screen.getByRole('button', { name: 'Try a demo' })).toBeTruthy();
```

Retain the exact checks for disabled submit during restoration, Supabase password auth, demo role links, storage isolation, and no Supabase client inside `/demo`.

- [ ] **Step 2: Run login tests and verify the new structural assertions fail**

Run: `npm run test --workspace=apps/admin -- live-login.test.tsx demo.test.tsx`

Expected: FAIL on the new landmark or heading.

- [ ] **Step 3: Recompose login using only factual content**

Use one `<main aria-label="Pacific World School sign in">` with a daylight form area and one supplied campus-image story area. Keep ids, labels, button names, handlers, remembered account, demo roles, notices, and errors unchanged. Decorative campus imagery uses empty alt; the logo retains the school name. Remove the generic report-card marketing paragraph and use concise factual sign-in/demo copy.

- [ ] **Step 4: Run login and build checks**

Run:

```powershell
npm run test --workspace=apps/admin -- live-login.test.tsx demo.test.tsx
npm run build --workspace=apps/admin
```

Expected: PASS; fonts are locally bundled and no remote font request ships.

- [ ] **Step 5: Commit login**

```powershell
git add apps/admin/src/pages/Login.tsx apps/admin/tests/live-login.test.tsx apps/admin/tests/demo.test.tsx
git commit -m "feat(ui): redesign Living Campus login"
```

---

### Task 5: Build role-specific living dashboards

**Files:**
- Modify: `apps/admin/src/pages/Dashboard.tsx`
- Create: `apps/admin/tests/routes-ui.test.tsx`

**Interfaces:**
- Consumes: existing dashboard calculations, role helpers, event data, and page/UI primitives.
- Produces: Admin `Today at PWS`, Teacher `My class today`, and Student `My school day` compositions without fabricated metrics or events.

- [ ] **Step 1: Create the role smoke-test harness**

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
  ['admin', 'Today at PWS'],
  ['teacher', 'My class today'],
  ['student', 'My school day'],
])('renders the %s dashboard identity', async (role, heading) => {
  window.history.replaceState(null, '', `/demo/dashboard?role=${role}`);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
});
```

- [ ] **Step 2: Run the role test and verify it fails**

Run: `npm run test --workspace=apps/admin -- routes-ui.test.tsx`

Expected: FAIL because the approved role-specific headings do not exist.

- [ ] **Step 3: Recompose dashboards around real existing data**

Keep `stats`, `myAssignments`, `recentLeaves`, `upcoming`, `mySection`, and every route destination. Split only presentation into role-specific functions. The campus story panel must derive its title/date from the first existing upcoming event; if no event exists, render a factual welcome/empty state rather than a fictional campus moment.

```tsx
const leadEvent = upcoming[0];
return leadEvent
  ? <CampusStory title={leadEvent.title} date={leadEvent.start_date} />
  : <EmptyState title="A clear day ahead" description="No upcoming events are scheduled." />;
```

- [ ] **Step 4: Run role, auth, type, and lint checks**

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
git commit -m "feat(ui): compose Living Campus dashboards"
```

---

### Task 6: Convert community and administration indexes

**Files:**
- Modify: `apps/admin/src/pages/People.tsx`
- Modify: `apps/admin/src/pages/Classes.tsx`
- Modify: `apps/admin/src/pages/Subjects.tsx`
- Modify: `apps/admin/src/pages/TeachingAssignments.tsx`
- Modify: `apps/admin/src/pages/Enrollments.tsx`
- Modify: `apps/admin/src/pages/AuditLog.tsx`
- Modify: `apps/admin/tests/routes-ui.test.tsx`

**Interfaces:**
- Consumes: existing CRUD handlers, CSV behavior, admin guards, tables, and shared page/modal primitives.
- Produces: warm community headers, compact totals, search/filter rows, responsive records, and accessible dialogs.

- [ ] **Step 1: Add administration routes to the smoke matrix**

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

For each path, enter the Admin demo, render, and assert a level-one heading plus the existing primary action where authorized.

- [ ] **Step 2: Run route tests and verify heading contracts fail**

Run: `npm run test --workspace=apps/admin -- routes-ui.test.tsx`

Expected: FAIL until new page hierarchy is implemented.

- [ ] **Step 3: Apply the community-index structure**

```tsx
<Page>
  <PageHeader eyebrow="Our school community" title="…" description="…" actions={existingAction} />
  <MetricGrid>{existingDerivedTotals}</MetricGrid>
  <Card padded={false}>{existingFiltersAndTable}</Card>
  {existingDialogState && <Modal title="…" onClose={existingClose}>{existingForm}</Modal>}
</Page>
```

Use `.field-control` for existing inputs/selects and preserve every submit callback, validation, CSV flow, and table datum. On narrow screens, hide only secondary columns and repeat those values as supporting text in the primary person/entity cell. Do not add photography to these operational pages.

- [ ] **Step 4: Run administration regression checks**

Run:

```powershell
npm run test --workspace=apps/admin -- routes-ui.test.tsx demo.test.tsx
npm run typecheck --workspace=apps/admin
npm run lint --workspace=apps/admin
```

Expected: PASS with no action or route behavior changed.

- [ ] **Step 5: Commit administration routes**

```powershell
git add apps/admin/src/pages/People.tsx apps/admin/src/pages/Classes.tsx apps/admin/src/pages/Subjects.tsx apps/admin/src/pages/TeachingAssignments.tsx apps/admin/src/pages/Enrollments.tsx apps/admin/src/pages/AuditLog.tsx apps/admin/tests/routes-ui.test.tsx
git commit -m "feat(ui): redesign Living Campus administration"
```

---

### Task 7: Convert academic workflows to daily action spaces

**Files:**
- Modify: `apps/admin/src/pages/Approvals.tsx`
- Modify: `apps/admin/src/pages/Assignments.tsx`
- Modify: `apps/admin/src/pages/CourseProgress.tsx`
- Modify: `apps/admin/src/pages/Attendance.tsx`
- Modify: `apps/admin/src/pages/ReportCard.tsx`
- Modify: `apps/admin/tests/routes-ui.test.tsx`

**Interfaces:**
- Consumes: existing role checks, leave decisions, assignment submit/review, course progress, attendance writes, report generation, and print behavior.
- Produces: Living Campus workflow summaries, action cards, tables, and responsive records.

- [ ] **Step 1: Add academic routes and role assertions**

```tsx
const academicRoutes = [
  ['/approvals', /Leave approvals|My leaves/i],
  ['/assignments', /Assignments/i],
  ['/course-progress', /Course progress|My progress/i],
  ['/attendance', /Attendance/i],
  ['/report-card', /Report cards|My report card/i],
] as const;
```

Add one Student assertion that attendance mutation controls are absent and one Admin assertion that assignment content remains read-only.

- [ ] **Step 2: Run tests and verify new structure fails while existing permissions stay green**

Run: `npm run test --workspace=apps/admin -- routes-ui.test.tsx`

Expected: FAIL only for missing approved headings/regions, not because a prohibited action appears.

- [ ] **Step 3: Apply the daily-action archetype**

Use `PageHeader`, warm summary panels, labelled segmented views, `Card` work areas, `EmptyState`, and `Modal`. Keep all handlers and derived values. Progress can use leaf/olive accents; warning and rejected states retain semantic colors. Report-card print markup keeps all data and receives a dedicated daylight print rule under `@media print`.

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
git commit -m "feat(ui): redesign Living Campus academics"
```

---

### Task 8: Convert community, calendar, resource, and finance routes

**Files:**
- Modify: `apps/admin/src/pages/Communications.tsx`
- Modify: `apps/admin/src/pages/Events.tsx`
- Modify: `apps/admin/src/pages/StudyRoom.tsx`
- Modify: `apps/admin/src/pages/Library.tsx`
- Modify: `apps/admin/src/pages/Fees.tsx`
- Modify: `apps/admin/src/pages/Gallery.tsx`
- Modify: `apps/admin/tests/routes-ui.test.tsx`

**Interfaces:**
- Consumes: declarations, polls, broadcasts, events, materials, library operations, fees/siblings, and gallery seed data.
- Produces: Living Campus daily-rhythm, action-workspace, and resource/story route archetypes.

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

Assert Events exposes a labelled calendar region, Fees retains sibling-discount language, and Communications exposes declarations, polls, and messages as labelled sections.

- [ ] **Step 2: Run the route suite and verify structural failures**

Run: `npm run test --workspace=apps/admin -- routes-ui.test.tsx`

Expected: FAIL on missing labelled regions before migration.

- [ ] **Step 3: Apply Living Campus archetypes**

Use daily rhythm for Events, action workspaces for Communications/Library/Fees, resource layout for Study Room, and purposeful media layout for Gallery. Only Events/Gallery may feature contextual imagery, and only from supplied assets or existing seeded gallery references. Preserve all callbacks, authorization checks, fee math, sibling discount, date logic, and safe preview/print behavior.

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
git commit -m "feat(ui): complete Living Campus routes"
```

---

### Task 9: Perform responsive, motion, and accessibility convergence

**Files:**
- Modify: `apps/admin/src/index.css`
- Modify: `apps/admin/src/components/AppShell.tsx`
- Modify: any page file with an observed overflow/accessibility defect
- Modify: `apps/admin/tests/theme-contract.test.ts`
- Modify: `apps/admin/tests/ui-system.test.tsx`

**Interfaces:**
- Consumes: complete Living Campus UI from Tasks 1–8.
- Produces: verified 375px, 768px, and 1440px compositions; reduced-motion equivalence; keyboard-visible interactions; bounded photography.

- [ ] **Step 1: Expand automated convergence contracts**

```ts
expect(css).toContain('min-height: 44px');
expect(css).toContain('scrollbar-gutter: stable');
expect(css).not.toContain('transition: all');
```

Add shell assertions for `aria-expanded`, named close control, active-route `aria-current`, and keyboard-operable high-level navigation.

- [ ] **Step 2: Run tests and verify missing contracts fail**

Run: `npm run test --workspace=apps/admin -- theme-contract.test.ts ui-system.test.tsx`

Expected: FAIL until all convergence contracts are present.

- [ ] **Step 3: Verify and fix all three viewport classes**

Run:

```powershell
npm run dev --workspace=apps/admin -- --host 127.0.0.1
```

At 375×812, 768×1024, and 1440×900, open Admin, Teacher, and Student demos. Visit every route and verify no page overflow, short mobile story imagery, keyboard drawer/menu operation, visible focus, dialog containment, readable records, and correct action priority. Fix observed defects using responsive CSS classes rather than JS viewport branching.

- [ ] **Step 4: Verify reduced motion, image restraint, and browser errors**

Emulate reduced motion and navigate login → dashboard → assignments → events → people. Confirm no non-essential image scale, crossfade, or stagger runs. Confirm campus photography appears only in approved contexts and the browser console has no redesign-caused error or warning.

- [ ] **Step 5: Run the full admin gate**

Run:

```powershell
npm run test --workspace=apps/admin
npm run typecheck --workspace=apps/admin
npm run lint --workspace=apps/admin
npm run build --workspace=apps/admin
git diff --check
```

Expected: all commands succeed; any existing warning is documented and no new warning is introduced.

- [ ] **Step 6: Commit convergence fixes**

```powershell
git add apps/admin/src apps/admin/tests
git commit -m "fix(ui): polish Living Campus responsiveness"
```

---

### Task 10: Record proof and finalize the branch

**Files:**
- Modify: `PROJECT_STATUS.md`
- Modify: `docs/superpowers/specs/2026-11-12-living-campus-ui-design.md`

**Interfaces:**
- Consumes: final checks, browser verification, and changed-file inventory.
- Produces: truthful branch status, final spec state, clean history, and pushed `newui2` branch.

- [ ] **Step 1: Run client-secret and environment-name guards**

Run:

```powershell
rg -n "(SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|SUPABASE_JWT_SECRET|POSTGRES_PASSWORD|EXPO_PUBLIC_.*(SECRET|SERVICE|PRIVATE|JWT|POSTGRES|DATABASE|PASSWORD|TOKEN)|VITE_.*(SECRET|SERVICE|PRIVATE|JWT|POSTGRES|DATABASE|PASSWORD|TOKEN))" apps
```

Expected: no prohibited client secret or secret-like public variable; approved publishable-key names are allowed.

- [ ] **Step 2: Update project truth**

Change the Living Campus spec status to `Implemented and verified`. In `PROJECT_STATUS.md`, replace “implementation has not started” with a factual summary naming the shell, primitives, route groups, exact checks and results, and any remaining visual gap.

- [ ] **Step 3: Run final repository checks**

Run:

```powershell
git diff --check
git status --short
git log --oneline -12
```

Expected: only intended documentation changes remain unstaged and the worktree is otherwise clean.

- [ ] **Step 4: Commit documentation**

```powershell
git add PROJECT_STATUS.md docs/superpowers/specs/2026-11-12-living-campus-ui-design.md
git commit -m "docs: record Living Campus verification"
```

- [ ] **Step 5: Push only `newui2`**

```powershell
git push origin newui2
```

Expected: `origin/newui2` advances; `origin/main` and `origin/newui` remain unchanged by this push.
