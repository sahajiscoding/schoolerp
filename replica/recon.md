# Recon map: Pacific World School ERP (web) — replica

Scope: 1:1 functional + visual copy of the reference ERP at `https://pws.schoolforschools.ai`,
against the live clone at `https://schoolerp-desktop.vercel.app/login`.
For: Pacific World School (single-school ERP, teachers + students + admin).
Date: 2026-11-07
Method: replica-recon (clean-room: public pages + Marion's own account only;
no scraping behind login, no others' accounts). Dashboard is login-gated —
everything behind `/login` is marked **guess** below.

## OLIVE LOCK — owner decision (2026-11-07)

User decision: **USE THE OLIVE ONE.** `replica/design/tokens.json` and the Tailwind
mapping lock these roles from the reference's authenticated DOM
(`documentElement` inline style, measured 2026-11-07 during dark mode):

- accent/primary (`--primary`, `--main`, `--sidebar-primary`): **hsl(76, 29%, 31%)** = `#5A6638`
- accent-2 (`--accent`): **hsl(76, 29%, 43%)** = `#7C8D4E`
- ring / sidebar-ring (`--ring`, `--sidebar-ring`): **hsl(76, 29%, 36%)** = `#687641`
- hover-primary (`--hover-primary`): **hsl(0, 99%, 54%)** = `#FE1616` (sidebar hover text `#FE1616`)
- on-accent (`--primary-foreground`, `--main-foreground`): **white**

Do NOT use the `#0f172a` navy token. The `#0f172a` value seen in old public CSS is a
stale cached stylesheet; live DOM inline style is authoritative. The accent-fix agent
implements this in `packages/shared/src/theme.ts` / `apps/admin/tailwind.config.cjs` —
this recon aligns with it and does not fight it.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | reference app (public) | https://pws.schoolforschools.ai/login | measured live 2026-11-07 via browser DOM evaluation |
| 2 | live clone | https://schoolerp-desktop.vercel.app/login | title "Pacific World School ERP - Admin"; light bg `rgb(248,250,252)` = `#f8fafc` |
| 3 | alternate host | https://school-erp.vercel.app/login | title "React App" — NOT the clone; not live (see host finding below) |
| 4 | owner design spec | docs/superpowers/specs/2026-11-07-pws-clone-design.md | 28 canonical routes, tokens, demo isolation |
| 5 | v1 design | docs/superpowers/specs/2026-11-03-school-erp-design.md | auth rule, RLS, targeting, screens |
| 6 | project status | PROJECT_STATUS.md | Phase 1 shipped: 28 routes, theme, 0005 tables |
| 7 | replica-skill | https://github.com/Jakeschincariol/replica-skill | recon/design/build/test/diff workflow |
| 8 | rea | https://github.com/morluto/rea | method cross-check only (see rea-notes.md) |

### Host finding (2026-11-07)

- `https://schoolerp-desktop.vercel.app/login` — **is the live clone** (correct
  `<title>`, correct light background `#f8fafc`, Roboto).
- `https://school-erp.vercel.app/login` (SCHOOL-ERP.VERCEL.APP) — returns "React App";
  **not the clone**. Do not use for parity checks.

## Core loop

A teacher distributes homework, a student submits it, and the school office tracks
attendance, fees, leave, and notices around that daily academic loop — one school,
role-gated (admin / teacher / student), demo-isolated in the clone.

## Screens

Legend: **[measured]** = read live via DOM, **[spec]** = from owner specs,
**[guess]** = behind login, inferred, NOT scraped. Dashboard is login-gated — all
S02+ layout details are guesses until Marion's own account is observed.

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Login | `/login` **[measured]** | account picker + school form | identity button, login form, password toggle, "I forgot my password" link, remembered account | filled (dark mode), empty **[guess]**, error **[guess]** |
| S02 | AppShell | sidebar/topbar on every authed page **[spec+guess]** | role-aware nav, notifications, profile menu, mobile drawer | sidebar nav, topbar, notification badge, avatar dropdown, theme toggle | filled **[guess]**, mobile drawer **[guess]** |
| S03 | Dashboard | `/dashboard` **[guess]** | student executive summary + upcoming events | greeting banner, StatCards, homework list, events list | filled, empty **[guess]** |
| S04 | Approvals | `/approvals?page=1&limit=10` **[spec]** | leave status + approvals table | table w/ pagination, approve/reject | filled, empty **[guess]** |
| S05 | Course Progress | `/course-progress` **[spec]** | syllabus + chapter progress | progress bars, goal list | filled, empty **[guess]** |
| S06 | Events | `/events` **[spec]** | academic calendar | month calendar, event list | filled, empty **[guess]** |
| S07 | Homeworks | `/homeworks` **[spec]** | assignment hub + worksheets | hub cards, worksheets filter | filled, empty **[guess]** |
| S08 | Homework Submit | `/homeworks/:id/submit` **[spec]** | two-tab submission + rich-text editor | tabs, Tiptap editor, file attach | filled, error **[guess]** |
| S09 | Study Room | `/study-room` **[spec]** | study materials & booklets | material list, share PDF | filled, empty **[guess]** |
| S10 | My Library | `/my-library?page=1&limit=10` **[spec]** | borrowed-books ledger + fines | ledger table, fine badges | filled, empty **[guess]** |
| S11 | Issue Book | `/issue-book?member_able_type=students` **[spec]** | book catalog + reservation | search, reserve | filled, empty **[guess]** |
| S12 | Digital Library | `/digital-library` **[spec]** | digital e-books catalog | search + e-book cards | filled, empty **[guess]** |
| S13 | Report Cards | `/examination-report-cards?page=1&limit=10` **[spec]** | report-card PDFs + marksheets | table, PDF links, grade badges | filled, empty **[guess]** |
| S14 | Attendance | `/my-attendance` **[spec]** | attendance matrix + gauge + Apply Leave | matrix, radial gauge, dialog | filled **[guess]** |
| S15 | Fees | `/fee-collections/create?student=:id` **[spec]** | fee dashboard + payment ledger | ledger, pay actions, sibling discount | filled **[guess]** |
| S16 | Gallery | `/school-gallery?page=1` **[spec]** | albums + galleries | album grid, pagination | filled, empty **[guess]** |
| S17 | Album viewer | `/school-gallery/:albumId/:mediaId` **[spec]** | single media viewer | large media, prev/next | filled **[guess]** |
| S18 | Circulars | `/circulars?page=1&limit=10` **[spec]** | notices + circulars | list w/ pagination | filled **[guess]** |
| S19 | Circular detail | `/circulars/:id` **[spec]** | detail + download | body, download | filled **[guess]** |
| S20 | Declaration forms | `/declaration-forms?page=1&limit=10` **[spec]** | legal undertakings + consents | sign flow | filled **[guess]** |
| S21 | Messages inbox | `/messages?box=inbox&page=1&limit=10` **[spec]** | inbox/sent | thread list | filled, empty **[guess]** |
| S22 | Message create | `/messages/create` **[spec]** | compose to teachers/admins | recipient picker, body | filled, error **[guess]** |
| S23 | Message thread | `/messages/:id` **[spec]** | thread detail + reply | thread, reply box | filled **[guess]** |
| S24 | Polls | `/polls` **[spec]** | active surveys | vote cards | filled, empty **[guess]** |
| S25 | Profile | `/profile` **[spec]** | 7-tab dossier + change password | tabs, password form | filled **[guess]** |
| S26 | Demo banner | persistent in demo sessions **[spec]** | "sample data only" notice + Reset/Exit | banner, reset | demo only |

Counts: 26 screens (S01 measured; S02–S26 spec-scoped with guess-marked internals).

## Flows

```
F01 Sign in (school account)
    S01 login form -> S03 dashboard
    happy path clicks: 2 (submit, auth redirect)
    edge: wrong password, unknown login ID, session expired [guess]

F02 Student submits homework
    S03 dashboard homework list -> S07 hub -> S08 submit -> S07 (submitted state)
    happy path clicks: 3
    edge: file too large (10 MB), wrong MIME, past due date [guess]

F03 Teacher distributes homework
    S07 hub -> composer -> S07 (published)
    happy path clicks: 4+
    edge: targeting a section not taught (must reject, never silent-filter) [spec]

F04 Leave apply -> approve
    S14 Apply Leave dialog -> S04 approvals (teacher approves/rejects)
    happy path clicks: 4
    edge: ≥9 days or Medical -> principal + attachment mandatory [spec]

F05 Library: borrow -> return
    S11 issue/reserve -> S10 ledger -> return
    happy path clicks: 3
    edge: overdue fine, book already issued [guess]

F06 Message teacher <-> student
    S22 compose -> S21 inbox -> S23 thread/reply
    happy path clicks: 3
    edge: student-to-student channel must not exist; admin read-only [spec]

F07 Fee payment (sibling discount)
    S15 ledger -> pay -> S15 (paid state)
    happy path clicks: 3
    edge: 50% discount = second child only, admin-owned [spec]
```

Flows: 7 total.

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Button | primary (olive), secondary, ghost, danger | default, hover (red `#FE1616`), focus (ring `#687641`), disabled, loading | all |
| StatCard | count + label + trend | default, loading skeleton | S03 |
| Data table | dense rows, pagination | filled, empty, loading | S04, S10, S13, S15, S18, S20, S21 |
| Dialog | modal form | open, validation error | S14, S08 |
| Tabs | underline / pill | active, disabled | S08, S25 |
| Avatar + dropdown | initials, role label | open, closed | S02 |
| Notification badge | unread count | none, dot, count | S02 |
| Toast | success, error | info, warning | all |
| Calendar | month grid | filled, empty | S06 |
| Rich-text editor | Tiptap | default, error | S08 |
| E-book card | title, subject, open action | default, empty | S12 |
| Album card | cover, title, count | default, empty | S16 |
| Progress / gauge | bar, radial | default | S05, S14 |

## Inferred data model

```
profiles      id, role (admin|teacher|student), login_id, full_name, class/section [spec]
              evidence: S01, S25
              confidence: high
homework      id, teacher_id, title, instructions, section/due_at, attachments [spec]
              evidence: S07, S08
              confidence: high
submissions   homework_id, student_id, body, file_path, status, submitted_at [spec]
              evidence: S08
              confidence: high
leaves        student_id, type, from/to, reason, status, decided_by [spec]
              evidence: S04, S14
              confidence: medium (fields inferred from routing rule)
library_books / transactions / rules / kiosk_sessions
              evidence: S10, S11, S12
              confidence: medium
examination family (9 tables; CBSE 9-point)
              evidence: S13
              confidence: medium
fee chain     fee_cycles -> installments; sibling 50% = 2nd child [spec]
              evidence: S15
              confidence: high
circulars / gallery / polls / messages (teacher<->student only)
              evidence: S16-S24
              confidence: medium
parent_links, transport_area_routes, transport_vehicles
              evidence: spec §5 only
              confidence: guess
```

Relationships: student 1-n submissions; teacher 1-n homework; homework 1-n submissions;
section 1-n students; student 1-n leaves; student 1-n fees; album 1-n media.
ALL of S02+ internals are **guesses** (login-gated).

## Feature matrix

See `features.csv`. Counts: must 22, should 9, could 4, skip 3.

## Out of scope (cannot or should not be cloned)

- Reference PII (names, PEN/APAAR, DOBs, mobiles, emails, S3 URLs) — never copied into seeds/screenshots.
- Logos, photos, illustrations, trademarks — school-supplied assets only; fresh copy throughout.
- Private APIs / network calls / JS bundles — not read, not replicated.
- Behind-login data — not scraped; guesses are marked as such.
- Multi-school tenancy, student-to-student channel (AGENTS.md §5 forbids it).

## Size

Screens 26, flows 7, entities ~30 (existing 32 tables + 0005 clone tables).
Hard parts: login-gated reference (guesses dominate S02+), RLS-first auth (never client-trusted),
demo isolation (`sessionStorage` flag + `pws.demo.data.v5`), parent switch + kiosk flows.
Size: **M** (few weeks) — Phase 1 UI + tables are already shipped; remainder is
live-Supabase wiring module by module.
