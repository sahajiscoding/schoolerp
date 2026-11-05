-- ============================================================================
-- 0004_profiles_hardening.sql
-- Security fixes from the full-mode security audit (run-1). Each block maps to a
-- confirmed finding. Safe to run once after 0001-0003; idempotent where practical.
--
--   F1 (critical) rls-profiles-self-escalation        -> protect privileged columns
--   F5 (medium)   rls-profiles-directory-overbroad-read-> scoped directory reads
--   F2 (medium)   rls-audit-log-insert-forgery         -> close open audit INSERT
--   F3 (medium)   rls-attendance-cross-section-write   -> scope to teacher's students
--   F4 (medium)   rls-report-cards-cross-section-insert-> scope to teacher's students
--   F6 (low)      rls-events-update-scope-recheck      -> re-check sections on UPDATE
--   F7 (low)      rls-course-goals-update-scope-recheck-> re-check teaching on UPDATE
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- F1: A user must not be able to raise their own role / is_active / login_id.
-- Two independent layers:
--   (a) column-level grants: authenticated may UPDATE only non-privileged columns;
--   (b) a BEFORE UPDATE trigger as defense-in-depth (also covers any future grant).
-- service_role (Edge Functions / create-admin) keeps full access and bypasses RLS.
-- ---------------------------------------------------------------------------

-- (b) Trigger. SECURITY INVOKER so current_user reflects the calling role
--     (a SECURITY DEFINER function would mask it as the owner). search_path pinned.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- The service role and the database owner provision accounts; admins may manage
  -- other users. Everyone else is blocked from touching the privileged columns.
  IF current_user IN ('service_role', 'postgres') OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.login_id IS DISTINCT FROM OLD.login_id THEN
    RAISE EXCEPTION 'permission denied: role, is_active and login_id are protected'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_privileges ON public.profiles;
CREATE TRIGGER profiles_protect_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- Narrow the self policy from FOR ALL to read + update of own row only.
DROP POLICY IF EXISTS profiles_self ON public.profiles;
CREATE POLICY profiles_self ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- (a) Column grants. Profiles are provisioned by the service role, so anon/authenticated
--     do not need INSERT/DELETE, and may UPDATE only the safe self-service columns.
REVOKE INSERT, DELETE ON public.profiles FROM anon, authenticated;
REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (full_name, avatar_path, must_change_password) ON public.profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- F5: Replace the blanket "read every active profile" with scoped reads.
-- Matches supabase/tests/rls_matrix.sql: student reads self only; teacher reads the
-- students they teach; admin reads all (profiles_admin_read already exists).
-- If a product requirement later needs a broader directory, add it explicitly.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_read_active ON public.profiles;
CREATE POLICY profiles_teacher_read ON public.profiles
  FOR SELECT USING (public.teaches_student(id));

-- ---------------------------------------------------------------------------
-- F2: Audit trail integrity. service_role bypasses RLS, so the Edge Function keeps
-- writing without any policy. Remove the open INSERT; allow admins to append only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS audit_log_service_insert ON public.audit_log;
CREATE POLICY audit_log_admin_insert ON public.audit_log
  FOR INSERT WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- F3: Attendance writes must be scoped to the teacher's own students (the read
-- policy already does this). Admins remain unrestricted.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS attendance_teacher_write ON public.attendance;
CREATE POLICY attendance_teacher_write ON public.attendance
  FOR ALL USING (
    public.is_admin()
    OR (auth.uid() = marked_by AND public.teaches_student(student_id))
  ) WITH CHECK (
    public.is_admin()
    OR (auth.uid() = marked_by AND public.teaches_student(student_id))
  );

-- ---------------------------------------------------------------------------
-- F4: Report-card create/update must be scoped to the teacher's own students.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS report_cards_teacher_write ON public.report_cards;
CREATE POLICY report_cards_teacher_write ON public.report_cards
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND (public.is_admin() OR public.teaches_student(student_id))
  );
DROP POLICY IF EXISTS report_cards_teacher_update ON public.report_cards;
CREATE POLICY report_cards_teacher_update ON public.report_cards
  FOR UPDATE USING (
    auth.uid() = created_by
    AND (public.is_admin() OR public.teaches_student(student_id))
  ) WITH CHECK (
    auth.uid() = created_by
    AND (public.is_admin() OR public.teaches_student(student_id))
  );

-- ---------------------------------------------------------------------------
-- F6: Re-check section scope when a teacher updates their own event, so it cannot
-- be retargeted to sections they do not teach.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS school_events_owner_update ON public.school_events;
CREATE POLICY school_events_owner_update ON public.school_events
  FOR UPDATE USING (auth.uid() = created_by OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      auth.uid() = created_by
      AND NOT EXISTS (
        SELECT 1 FROM unnest(COALESCE(section_ids, ARRAY[]::uuid[])) AS s
        WHERE NOT public.teaches_section(s)
      )
    )
  );

-- ---------------------------------------------------------------------------
-- F7: Re-check the teaching relationship when a teacher updates a course goal.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS course_goals_teacher_update ON public.course_goals;
CREATE POLICY course_goals_teacher_update ON public.course_goals
  FOR UPDATE USING (auth.uid() = teacher_id AND public.teaches_student(student_id))
  WITH CHECK (auth.uid() = teacher_id AND public.teaches_student(student_id));

COMMIT;
