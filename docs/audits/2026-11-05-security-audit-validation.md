# Needs Validation — schoolerp run-1

The findings in `findings.json` are all `confirmed` by **complete, deterministic source traces**.
What could **not** be done in this sandbox is **live Postgres execution** of the RLS policies. This
file records that boundary and gives the owner an exact replay plan. It does not downgrade the
findings: the policy text, the project's documented `authenticated` grants, and the absence of any
protecting trigger/column grant together make each result conclusive.

## Why live DB execution was not performed
- No local Postgres was available (`postgres`, `pg_ctl`, `initdb`, `psql` absent; `pgserver` not
  installed; no `.venv`).
- The skill's execution boundary forbids installing dependencies ("use only tools and dependencies
  already available locally"), so `pip install pgserver` / `apt-get postgres` were **not** run.
- No live/deployed Supabase project was probed (the skill prohibits touching deployed targets).

## Owner replay plan (local, dummy data only)
The repo already ships a local verifier; it now applies migration **0004** and includes new
regression assertions for every fix.

```bash
# one-time: create a venv and install the throwaway-Postgres helper
python3 -m venv .venv
.venv/bin/pip install pgserver

# run the RLS matrix through the `authenticated` role (boots a throwaway Postgres)
npm run verify:rls
# equivalently: .venv/bin/python supabase/tests/verify_rls_local.py
```

Expected: `RESULT: ALL PASS`, including the new rows:
- `student escalates own role to admin` → DENIED
- `student flips own is_active` → DENIED
- `student rewrites own login_id` → DENIED
- `student forges an audit_log entry` → DENIED
- `unrelated teacher marks foreign attendance` → DENIED / NO-ROWS
- `unrelated teacher authors foreign report card` → DENIED
- `student updates own full_name` → ALLOWED
- `teacher marks own-student attendance` → ALLOWED
- `teacher authors own-student report card` → ALLOWED

The canonical pgTAP suite (`supabase test db`, `supabase/tests/rls_matrix.sql`) also benefits: its
"student_a cannot read student_b profile" assertion, previously violated by `profiles_read_active`,
now passes with 0004.

## Staging / deployment checks (owner, on a non-production Supabase project)
1. Apply migrations 0001→0004 to a **staging** project.
2. As a seeded **student**, call `PATCH /rest/v1/profiles?id=eq.<self>` with `{"role":"admin"}` and
   confirm it is rejected (column grant → `permission denied for table profiles`).
3. As a seeded **teacher**, attempt to insert attendance / a report card for a student outside their
   teaching assignments and confirm rejection.
4. As any user, `GET /rest/v1/profiles?select=login_id,role` and confirm only self (plus, for teachers,
   their students) is returned.
5. Confirm the `admin-users` Edge Function still provisions admins/students (service_role bypasses RLS)
   and that a created admin can sign in with a special-character login id (F8 normalization).

## Notes / design decisions to confirm
- **Directory reads:** 0004 removes the blanket active-profile read. If students must see teacher or
  classmate names in live mode, add an explicit minimal directory policy (do not restore the blanket).
- **Class-teacher attendance:** attendance scope uses `teaches_student` (subject teachers). If class
  teachers must mark attendance, extend read **and** write with `is_class_teacher_of`.
- **Verifier grants:** `verify_rls_local.py` re-grants blanket UPDATE after migrations (mirroring
  Supabase defaults), so in the *local verifier* the **trigger** is the active protection for F1; in a
  real project the **column grant** is. Both are asserted.
