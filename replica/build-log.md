# Build log — Pacific World School ERP replica

- 2026-11-07 · S01 Login — done (account picker, school form, forgot-password, demo; olive primary verified live).
- 2026-11-07 · S02 AppShell — done (role-aware sidebar/topbar, notifications, theme toggle, daylight auto).
- 2026-11-07 · S03 Dashboard — done (greeting banner, StatCards, homework + events).
- 2026-11-07 · S04–S25 (23 routes) — done (approvals, progress, events, homeworks, submit, study-room,
  my-library, issue-book, digital-library, report-cards, attendance, fees, gallery + viewer,
  circulars + detail, declarations, messages + create + thread, polls, profile).
- 2026-11-07 · Old→new redirects (QueryRedirect) — done (query strings preserved verbatim).
- 2026-11-07 · DigitalLibrary fix — fixed no-op "Open e-book" → navigates to /study-room.
- 2026-11-07 · Tiptap rich-text — partial (textarea); tracked in features.csv.
- 2026-11-07 · Live Supabase wiring — not started; next milestone (PROJECT_STATUS).
- 2026-11-07 · Parent switch + kiosk — tables exist (0005); UI pending.
- 2026-11-07 · S02 AppShell live-reference rebuild — done (olive header, 20% sidebar, lucide nav,
  collapse/mobile controls, notifications/account menus, fixed vendor footer, exact light/dark chrome).
- 2026-11-07 · S03 Student Dashboard live-reference rebuild — done (profile hero, time greeting,
  recent-actions empty state, four dated Upcoming Events rows); admin/teacher dashboards retained.
- 2026-11-07 · Assistant control — visual parity with safe local fallback; vendor iframe/JWT deliberately
  not copied. Screenshot unavailable (desktop window hidden); DOM/computed-style parity verified instead.
- 2026-11-07 · Homeworks live Supabase wiring — done (0006_homeworks_live.sql): typed assignments
  (kind/subject_id), atomic publish_assignment RPC, student-owned submit_assignment/review_submission RPCs,
  private Storage buckets (homework-files/submission-files) with owner-folder RLS; fixes submission INSERT
  OR-precedence forgery bug. rls_homeworks.sql adds 23 pgTAP assertions. appData.tsx stays demo-only.
- 2026-11-07 · Library live Supabase wiring — done (0007_library_live.sql): typed book transactions,
  atomic issue/reserve/return RPCs; student-owned reads, staff-scoped writes. rls_library.sql adds 20 pgTAP assertions.
- 2026-11-07 · Fees live Supabase wiring — done (0008_fees_live.sql): payment recording and sibling links
  via RPCs; admin-owned writes, student-owned reads.
- 2026-11-07 · Communications live Supabase wiring — done (0009_communications_live.sql): declaration signing,
  poll voting, and message sending via RPCs; demo store stays isolated.
- 2026-11-07 · Approvals live Supabase wiring — done (0010_approvals_live.sql): typed leave requests,
  atomic leave_apply/leave_review RPCs; student-owned applies, class-teacher-scoped reviews. rls_approvals.sql adds 18 pgTAP assertions.
- 2026-11-07 · Events live Supabase wiring — done (0011_events_live.sql): school events with section scoping,
  event_publish RPC; teacher-scoped sections, admin school-wide. rls_events.sql adds 14 pgTAP assertions.
- 2026-11-07 · Course Progress live Supabase wiring — done (0012_course_progress_live.sql): course goals,
  goal_add/goal_update RPCs; teacher-scoped writes, student-owned reads. rls_course_progress.sql adds 16 pgTAP assertions.
