# Findings Detail — schoolerp run-1

All findings are `confirmed` via complete source traces (policy text + documented grants + absence
of guards). Live Postgres execution was not available (skill forbids installing dependencies); the
owner replay plan is in NEEDS-VALIDATION.md. Every finding below is **fixed** in this branch.

---

## 1. `rls-profiles-self-escalation` — CRITICAL (fixed)
**Any signed-in user can escalate themselves to admin.**

- **Root cause:** `profiles_self` is `FOR ALL USING (auth.uid() = id)` (`0001:238`). `FOR ALL` reuses
  `USING` as the implicit `WITH CHECK`, so it authorizes writing **every column** of the caller's own
  row — including `role`, `is_active`, `login_id`. No trigger or column grant protects them (the only
  write-guard triggers are on leave_requests/student_details/course_goals/fee_records). `authenticated`
  holds `UPDATE` (the project's `verify_rls_local.py:56` grants it, mirroring Supabase defaults).
- **Trace:** `profiles_self` (0001:238) → `profiles.role` (0001:8) → `is_admin()` (0001:197) reads the
  rewritten role and returns true, unlocking every admin policy + the admin Edge Function.
- **Reproduction (any student):**
  ```
  PATCH /rest/v1/profiles?id=eq.<own-uuid>
  Authorization: Bearer <student-token>
  Content-Type: application/json

  {"role":"admin"}
  ```
  The policy authorizes it (`auth.uid()=id`, no column guard). The caller is now admin.
- **Fix (0004):** two layers —
  1. Column grants: `REVOKE INSERT,DELETE,UPDATE ON profiles FROM anon,authenticated;`
     `GRANT UPDATE (full_name, avatar_path, must_change_password) TO authenticated;`
  2. `protect_profile_privileges` BEFORE UPDATE trigger (SECURITY INVOKER, `search_path=''`) that
     raises `permission denied` if a non-service-role/non-admin changes role/is_active/login_id.
     `profiles_self` narrowed to SELECT + a separate self-UPDATE policy.
  In production the column grant blocks the PATCH before the trigger; in the local verifier (which
  re-grants blanket UPDATE) the trigger blocks it. Both layers are asserted by new regression tests.

---

## 2. `rls-audit-log-insert-forgery` — MEDIUM (fixed)
**Any authenticated user can forge audit entries.**
- **Root cause:** `audit_log_service_insert FOR INSERT WITH CHECK (true)` (`0001:442`) applies to every
  role. Reads are admin-only, but writes are open, so a student can insert rows with any `actor_id`.
- **Reproduction:** `POST /rest/v1/audit_log {"actor_id":"<admin>","action":"create-admin","entity_type":"profile"}`.
- **Fix (0004):** `DROP POLICY audit_log_service_insert;` (service_role bypasses RLS, so the Edge
  Function keeps writing) + `audit_log_admin_insert WITH CHECK (is_admin())`.

## 3. `rls-attendance-cross-section-write` — MEDIUM (fixed)
**A teacher can mark attendance for students they don't teach.**
- **Root cause:** `attendance_teacher_write FOR ALL USING/WITH CHECK (auth.uid()=marked_by OR is_admin())`
  (`0002:425`) never calls `teaches_student(student_id)`, while `attendance_read` (`0002:421`) does.
- **Reproduction:** a teacher inserts an attendance row for another section's student with
  `marked_by` = own id.
- **Fix (0004):** teacher branch becomes `auth.uid()=marked_by AND teaches_student(student_id)` in both
  USING and WITH CHECK (admins unrestricted). Matches the read scope.

## 4. `rls-report-cards-cross-section-insert` — MEDIUM (fixed)
**A teacher can fabricate report cards for any student.**
- **Root cause:** `report_cards_teacher_write FOR INSERT WITH CHECK (auth.uid()=created_by AND
  (app_role()='teacher' OR is_admin()))` (`0002:412`) omits `teaches_student`, unlike
  `course_goals_teacher_write` (`0002:336`).
- **Fix (0004):** insert + update require `created_by` AND `(is_admin() OR teaches_student(student_id))`.

## 5. `rls-profiles-directory-overbroad-read` — MEDIUM (fixed)
**Any authenticated user can read every active profile (login ids + roles).**
- **Root cause:** `profiles_read_active FOR SELECT USING (is_active)` (`0001:241`) exposes all active
  profiles, contradicting the project's own `rls_matrix.sql:90` ("student_a cannot read student_b").
  Enables username/role enumeration against predictable DOB-derived passwords.
- **Reproduction:** `GET /rest/v1/profiles?select=login_id,role,full_name` as any user.
- **Fix (0004):** drop the blanket policy; add `profiles_teacher_read USING (teaches_student(id))`.
  Self read (`profiles_self`) and admin read (`profiles_admin_read`) remain. Students no longer get a
  directory; add an explicit minimal policy later only if a product requirement needs it.

## 6. `rls-events-update-scope-recheck` — LOW (fixed)
**Event UPDATE can retarget to other sections.**
- **Root cause:** `school_events_teacher_insert` requires `teaches_section` per section, but
  `school_events_owner_update` (`0002:390`) only checks `created_by`/admin.
- **Fix (0004):** UPDATE WITH CHECK re-verifies `teaches_section` for every `section_id` (admin bypass).

## 7. `rls-course-goals-update-scope-recheck` — LOW (fixed)
**Course-goal UPDATE skips the teaching re-check.**
- **Root cause:** `course_goals_teacher_update` (`0002:338`) checks only `teacher_id`; INSERT requires
  `teaches_student`. A teacher could keep editing after losing the teaching relationship.
- **Fix (0004):** UPDATE USING/WITH CHECK add `teaches_student(student_id)`.

## 8. `edge-create-admin-loginid-sanitization` — LOW (fixed)
**create-admin builds the auth email from an unsanitized login id.**
- **Root cause:** `create-admin` used `` `${loginId.toLowerCase()}@${ADMIN_DOMAIN}` `` while
  `authEmail()` (students) and client `toAuthEmail()` sanitize the local part. A special-character login
  id yields a malformed/inconsistent auth email vs. the sign-in lookup. Admin-only robustness issue.
- **Fix:** `email: authEmail(loginId)` (both domains are `pws.local`, so this matches `toAuthEmail`
  exactly); removed the now-unused `ADMIN_DOMAIN`.

---

## Regression coverage added
`supabase/tests/verify_rls_local.py` now applies **0004** and asserts:
- **Negative:** student cannot raise own role / flip is_active / rewrite login_id; student cannot forge
  audit_log; unrelated teacher cannot mark foreign attendance / author a foreign report card.
- **Positive:** student can update own full_name; teacher can mark own-student attendance and author an
  own-student report card.
