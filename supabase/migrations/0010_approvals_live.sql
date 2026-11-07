-- ============================================================================
-- 0010_approvals_live.sql
-- Secure live Leave Approvals slice: apply/review RPCs, student-owned reads,
-- teacher-scoped approval decisions.
-- ============================================================================

BEGIN;

-- is_leave_target: true when the caller is the student themselves or staff
-- who can review leaves for that student's section.
CREATE OR REPLACE FUNCTION public.is_leave_target(
  p_student_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_student_id
      AND p.role = 'student'
      AND p.is_active
      AND (
        p_student_id = auth.uid()
        OR public.is_admin()
        OR public.teaches_student(p_student_id)
        OR public.is_class_teacher_of(p_student_id)
      )
  );
$$;

-- Leave reads: student reads own, staff read section-scoped, admin reads all.
DROP POLICY IF EXISTS leave_requests_student_read ON public.leave_requests;
CREATE POLICY leave_requests_student_read ON public.leave_requests
  FOR SELECT USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR public.teaches_student(student_id)
    OR public.is_class_teacher_of(student_id)
  );

-- Direct leave writes are closed; the narrow functions below are the only
-- authenticated write surface.
REVOKE ALL ON public.leave_requests FROM authenticated;

-- Apply for leave: student applies for themselves only, must be pending.
CREATE OR REPLACE FUNCTION public.leave_apply(
  p_student_id uuid,
  p_section_id uuid,
  p_from_date date,
  p_to_date date,
  p_session text,
  p_leave_type text,
  p_reason text,
  p_attachment_path text DEFAULT NULL
) RETURNS public.leave_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_leave public.leave_requests;
BEGIN
  -- Only students may apply.
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_actor AND p.role = 'student' AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only students may apply for leave'
      USING ERRCODE = '42501';
  END IF;

  -- student_id must match the authenticated actor.
  IF p_student_id <> v_actor THEN
    RAISE EXCEPTION 'students may only apply for themselves'
      USING ERRCODE = '42501';
  END IF;

  -- Target must be an active student.
  IF NOT public.is_leave_target(p_student_id) THEN
    RAISE EXCEPTION 'target is not an active student'
      USING ERRCODE = '42501';
  END IF;

  IF p_from_date IS NULL OR p_to_date IS NULL OR p_to_date < p_from_date THEN
    RAISE EXCEPTION 'leave dates are invalid'
      USING ERRCODE = '22023';
  END IF;

  IF p_session IS NULL OR p_session NOT IN ('Full day', 'First half', 'Second half') THEN
    RAISE EXCEPTION 'leave session is invalid'
      USING ERRCODE = '22023';
  END IF;

  IF p_leave_type IS NULL OR p_leave_type NOT IN ('Medical', 'Family function', 'Travel', 'Personal', 'Other') THEN
    RAISE EXCEPTION 'leave type is invalid'
      USING ERRCODE = '22023';
  END IF;

  IF p_reason IS NULL OR NULLIF(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'leave reason is required'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.leave_requests (
    student_id, section_id, from_date, to_date, session, leave_type,
    reason, attachment_path, status, decided_by, decided_on, decision_note
  ) VALUES (
    p_student_id, p_section_id, p_from_date, p_to_date, p_session,
    p_leave_type, p_reason, p_attachment_path, 'pending', NULL, NULL, NULL
  ) RETURNING * INTO v_leave;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'apply-leave', 'leave_requests', v_leave.id);

  RETURN v_leave;
END;
$$;

-- Review leave: class teacher or admin decides pending leaves for their section.
CREATE OR REPLACE FUNCTION public.leave_review(
  p_leave_id uuid,
  p_status text,
  p_decision_note text DEFAULT NULL
) RETURNS public.leave_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_leave public.leave_requests;
BEGIN
  -- Only staff may review.
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_actor AND p.role IN ('admin', 'teacher') AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only staff may review leaves'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_leave
  FROM public.leave_requests
  WHERE id = p_leave_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'leave request not found'
      USING ERRCODE = '42501';
  END IF;

  IF v_leave.status <> 'pending' THEN
    RAISE EXCEPTION 'leave is already decided'
      USING ERRCODE = '22023';
  END IF;

  IF p_status IS NULL OR p_status NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'leave status must be approved or rejected'
      USING ERRCODE = '22023';
  END IF;

  -- Class teacher must own the student's section; admin may review any.
  IF NOT public.is_admin() THEN
    IF NOT public.is_class_teacher_of(v_leave.student_id) THEN
      RAISE EXCEPTION 'not the class teacher for this student'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.leave_requests
  SET status = p_status,
      decided_by = v_actor,
      decided_on = now(),
      decision_note = p_decision_note
  WHERE id = p_leave_id
  RETURNING * INTO v_leave;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, meta)
  VALUES (
    v_actor,
    CASE WHEN p_status = 'approved' THEN 'approve-leave' ELSE 'reject-leave' END,
    'leave_requests', v_leave.id,
    jsonb_build_object('status', p_status)
  );

  RETURN v_leave;
END;
$$;

REVOKE ALL ON FUNCTION public.is_leave_target(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_apply(uuid, uuid, date, date, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.leave_review(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_leave_target(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_apply(uuid, uuid, date, date, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_review(uuid, text, text) TO authenticated;

COMMIT;