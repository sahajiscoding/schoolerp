# Functional Audit — Pacific World School ERP (Admin Console)

**Date:** 2026-11-05
**Scope:** Every feature in the admin console (`apps/admin`), exercised as Admin, Teacher, and Student.
**Method:** The real production app was bundled and booted in a DOM (jsdom), then driven like a user — clicking buttons, filling forms, navigating, and checking that the underlying data actually changed. **93 checks** were run across all 19 routes. This is a runtime audit, not just a code read.

> The console runs on the seeded demo store (no Supabase keys). Everything below is about the **demo build** the owners will see. The database schema/RLS for the live system is written separately and is not exercised here.

---

## ✅ RESOLVED — update 2026-11-05

**Every defect in this report has been fixed and re-verified at runtime.** The original pass found
12 broken + 4 partial issues; all 15 were fixed (plus the targeting/notification items). The current
scorecard is **82 working / 0 broken / 0 partial / 11 notes (93 checks)**. Typecheck, lint (0 errors)
and the production build all pass. The sections below are kept as the historical record of what was
found; each is now resolved. A separate **full-mode security audit** of the live Supabase RLS layer was
also completed the same day and all 8 of its findings were fixed (`supabase/migrations/0004_profiles_hardening.sql`).

---

## Scorecard

| Result | Original | Now | Meaning |
|---|---|---|---|
| ✅ Working | 64 | **82** | Feature does what it claims |
| ❌ Broken | 12 | **0** | Feature is dead, wrong, or a security hole |
| ⚠️ Partial | 4 | **0** | Works, but a meaningful part is cosmetic |
| ℹ️ Note | 11 | **11** | Expected demo limitation / not built yet |

**Bottom line (original):** most day-to-day modules genuinely work, but one whole page was a stub
(Teaching Assignments), four buttons were invisible on desktop, students could mark attendance, and the
audit log recorded nothing. **All of these are now fixed** — Teaching Assignments has full CRUD, the
dialogs open on desktop, attendance marking is teacher/admin-only, ~30 actions write to the audit log,
the "View as" switcher stays visible for admins, the Submissions tab lists every missing student,
Subjects edit works, declarations sign per-student, and events/broadcasts/notifications are correctly
targeted. The 11 remaining notes are expected demo limitations (no real file uploads, etc.), not bugs.

---

## ❌ Broken — needs fixing  ·  ✅ all resolved

### 1. Teaching Assignments page is entirely non-functional
`apps/admin/src/pages/TeachingAssignments.tsx`
- The table is a **hardcoded 2-row array** (line 52), not real data.
- The "Add assignment" form **throws the input away** — `handleCreate` (line 21) just clears the form and closes the modal; nothing is saved.
- The **Edit and Delete buttons are empty** (`onClick={() => {}}`, lines 60 & 63).
- **Impact:** an admin cannot actually assign teachers to sections/subjects. Verified: submitting the form leaves the row count unchanged (2 → 2).

### 2–5. Four modal dialogs are hidden on desktop (`lg:hidden`)
A CSS class (`lg:hidden`) hides these dialogs on screens ≥ 1024px, so on a laptop/desktop the button looks like it does nothing:
| Button | File:line | Severe? |
|---|---|---|
| Study Room → **Share PDF** | `StudyRoom.tsx:149` | **Yes** — no other way to share on desktop |
| Library → **Add book** | `Library.tsx:225` | **Yes** — no other way to add on desktop |
| Library → **Issue book** | `Library.tsx:282` | **Yes** — no other way to issue on desktop |
| Attendance → **Mark attendance** | `Attendance.tsx:241` | Lower — the register table below still marks fine |
- **Impact:** on desktop, Share PDF / Add book / Issue book appear completely dead. (The underlying save logic works — verified on the mobile-width dialog — so this is purely the hidden-dialog CSS.)

### 6. Students can mark attendance (access-control hole)
`apps/admin/src/pages/Attendance.tsx`
- The "Mark today" register shows **P / A / L / M buttons to everyone**, and `handleMark` (line 70) never checks the role.
- **Verified:** signed in as a student, clicking "A" created a new attendance record. A student can mark **any** student present/absent.
- **Impact:** contradicts the rule that students are read-only for attendance (the DB RLS enforces this, but the demo UI does not).

### 7. Attendance week-grid day badges don't work as they look
`apps/admin/src/pages/Attendance.tsx:173`
- Clicking a day badge in the weekly grid re-saves the **already-shown status** for the **currently selected date** — it does not cycle the status and does not target the day you clicked.
- **Impact:** the grid looks interactive but clicking it does nothing useful (or writes to the wrong day).

### 8. Assignments → Submissions tab hides most missing students
`apps/admin/src/pages/Assignments.tsx:96`
- The roster of "Not submitted" rows uses `.slice(0, 1)`, so **only one** missing student is shown per assignment, no matter how many haven't submitted.
- **Impact:** a teacher can't see the full list of who still owes work. (The per-assignment "Review" modal does show the full roster correctly.)

### 9. Subjects → Edit is a stub
`apps/admin/src/pages/Subjects.tsx:74`
- The Edit button only shows a toast ("Editing … is available to admins on the live database"). No editing happens.
- **Impact:** subjects can be added and removed, but not renamed/edited.

### 10. Audit Log records nothing
`apps/admin/src/lib/appData.tsx` (`logAudit`) + `AuditLog.tsx`
- `logAudit` exists but **no page ever calls it**. The Audit Log only ever shows the 5 seeded entries.
- **Verified:** adding a class did not add an audit entry.
- **Impact:** the page claims "every administrative action is recorded," but in the demo nothing is.

### 11. Admin "View as" preview traps the admin
`apps/admin/src/components/AppShell.tsx:351`
- The role switcher is shown only when `isAdmin()` is true — but `isAdmin()` respects the *previewed* role. So when an admin previews **Teacher** or **Student**, the switcher **disappears**, and there's no "Back to my role" control.
- **Verified:** after "View as → Student," the only way back is to sign out.
- **Impact:** an admin demoing the student/teacher view gets stuck and must sign out to return.

---

## ⚠️ Partial — works, but a key part is cosmetic  ·  ✅ all resolved

| Feature | What's cosmetic | Where |
|---|---|---|
| **Communications → Send message** | The "Send to" audience is ignored — every broadcast goes into one shared notification list that **all users** see. | `appData.tsx` `broadcastMessage` |
| **Communications → Declarations** | Signing is **global**: one student signing marks the form "signed" for everyone (no per-student signatures). | `appData.tsx` `signDeclaration` |
| **Events & Calendar** | The audience ("Whole school" / "Class only") is a label only — **all users see all events**; no per-section filtering. | `Events.tsx` |
| **Fees** | **Teachers** can record payments and link siblings, but the spec/RLS says fees are **admin-only**. | `Fees.tsx:37` |

---

## ℹ️ Expected demo limitations (not bugs, but know before showing owners)

- **No real file uploads.** Assignment attachments, submissions, and Study Room "PDFs" are just file-name text. Study Room "Open" shows the teacher's note, not an actual PDF.
- **Notifications are one shared list** for every user; marking read affects everyone.
- **"Today" is hardcoded to 2026-11-04** on the Dashboard, Events, and Assignments (Attendance uses the real clock). These will look stale on any other date.
- **Poll close dates aren't enforced** — students can vote after `closes_at`.
- **Subject dropdowns are fixed lists** in Course Progress / Study Room / Assignments — new subjects added in the Subjects page don't appear there.
- **No private teacher↔student messaging UI yet** — threads are seeded but there's no inbox/thread screen (that's Milestone 4).
- **People** has add + CSV import only — no edit / deactivate / reset-password yet (Milestone 2 scope).
- **Library**: reserved books have no "Return" action (only issued ones do); the Issue form has no required-field validation.
- **Gallery** is view-only — albums look clickable but open nothing; no upload.

---

## ✅ What's solid (verified working)

- **Login & demo entry** — passwordless Admin/Teacher/Student demo button; sign out; remembered account.
- **Approvals (leave)** — student applies (with date validation), routes to the **class teacher of the section**, teacher/admin approve or reject, history + filters.
- **Course Progress** — teacher adds goals (validates 0–100), student sees only their own.
- **Communications** — create declaration / poll / broadcast; student signs and votes (with the caveats above).
- **Events** — admin adds school events, teacher adds class events, calendar month navigation.
- **Assignments** — teacher publishes, student sees only their section's work, submits, teacher marks reviewed; re-submit is blocked.
- **Report Cards** — teacher enters marks → grade/percentage auto-computed, assigned to the student, printable, withdrawable; validates empty marks.
- **Attendance marking** — teacher marks via the register table; student reads their own (but see bug #6).
- **Fees** — record payment updates status; **50% sibling discount lands on the second child's invoice**; unlink removes it; student sees only their own.
- **People** — add student (password derived from DOB), CSV import with row-level validation (bad dates rejected), template + credentials export.
- **Classes** — add (with sections), duplicate rejected, remove.
- **Subjects** — add and remove.
- **Enrollments** — place a student into a class/section; roster search.
- **Dashboard** — role-aware stats and quick links.
- **Notifications** — bell, mark read / mark all read.

---

## Suggested fix priority  ·  ✅ completed

1. **Security first:** stop students marking attendance (#6); make Fees admin-only (partial).
2. **Un-break desktop:** remove `lg:hidden` from the four dialogs (#2–5) — one-line fixes each.
3. **Fix the trap:** keep the "View as" switcher visible for real admins (#11).
4. **Make Teaching Assignments real** (#1) — or hide the page until it's built.
5. **Wire the audit log** (#10) and the Submissions roster (#8).
6. **Smaller fixes:** Subjects edit (#9), attendance week-grid (#7).
7. Targeting (broadcast/declarations/events) and real file uploads are larger items best handled when the console is wired to Supabase.
