-- ============================================================================
-- 0012_course_progress_live.sql
-- Secure live Course Progress slice: typed course goals with teacher-scoped
-- writes. Students read their own goals; teachers write goals for their
-- sections; admins read all.
-- ============================================================================

BEGIN;

-- is_goal_target: true when the caller is the student whose goal this is, or
-- staff who teach that student.
CREATE OR REPLACE FUNCTION public.is_goal_target(
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

-- Course goal reads: student reads own, staff read their students, admin reads all.
DROP POLICY IF EXISTS course_goals_read ON public.course_goals;
CREATE POLICY course_goals_read ON public.course_goals
  FOR SELECT USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR public.teaches_student(student_id)
    OR public.is_class_teacher_of(student_id)
  );

-- Direct goal writes are closed; the narrow functions below are the only
-- authenticated write surface.
REVOKE ALL ON public.course_goals FROM authenticated;

-- Add goal: teacher adds a goal for a student in their section; admin adds any.
CREATE OR REPLACE FUNCTION public.goal_add(
  p_student_id uuid,
  p_subject_id uuid,
  p_title text,
  p_description text DEFAULT NULL,
  p_percent integer DEFAULT 0,
  p_grade text DEFAULT NULL,
  p_remarks text DEFAULT NULL,
  p_due_date date DEFAULT NULL
) RETURNS public.course_goals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_goal public.course_goals;
BEGIN
  -- Only teachers and admins may add goals.
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor
      AND p.role IN ('admin', 'teacher')
      AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only staff may add course goals'
      USING ERRCODE = '42501';
  END IF;

  -- Target must be an active student.
  IF NOT public.is_goal_target(p_student_id) THEN
    RAISE EXCEPTION 'target is not an active student'
      USING ERRCODE = '42501';
  END IF;

  -- Teachers may only add goals for students in their sections.
  IF NOT public.is_admin() THEN
    IF NOT public.teaches_student(p_student_id) THEN
      RAISE EXCEPTION 'student is outside the teacher scope'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_percent IS NULL OR p_percent < 0 OR p_percent > 100 THEN
    RAISE EXCEPTION 'percent must be between 0 and 100'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.course_goals (
    student_id, subject_id, teacher_id, section_id, title, description,
    target_percent, current_percent, grade, remarks, due_date
  ) VALUES (
    p_student_id, p_subject_id, v_actor,
    (SELECT section_id FROM public.enrollments e
     WHERE e.student_id = p_student_id AND e.academic_year IS NOT NULL
     LIMIT 1),
    btrim(p_title), NULLIF(btrim(p_description), ''),
    100, p_percent, p_grade, p_remarks, p_due_date
  ) RETURNING * INTO v_goal;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'add-course-goal', 'course_goals', v_goal.id);

  RETURN v_goal;
END;
$$;

-- Update goal: teacher updates goals for their students; admin updates any.
CREATE OR REPLACE FUNCTION public.goal_update(
  p_goal_id uuid,
  p_current_percent integer DEFAULT NULL,
  p_grade text DEFAULT NULL,
  p_remarks text DEFAULT NULL
) RETURNS public.course_goals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_goal public.course_goals;
BEGIN
  -- Only staff may update goals.
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor
      AND p.role IN ('admin', 'teacher')
      AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only staff may update course goals'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_goal
  FROM public.course_goals
  WHERE id = p_goal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'course goal not found'
      USING ERRCODE = '42501';
  END IF;

  -- Teachers may only update goals for their students.
  IF NOT public.is_admin() THEN
    IF NOT public.teaches_student(v_goal.student_id) THEN
      RAISE EXCEPTION 'student is outside the teacher scope'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_current_percent IS NOT NULL AND (p_current_percent < 0 OR p_current_percent > 100) THEN
    RAISE EXCEPTION 'percent must be between 0 and 100'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.course_goals
  SET current_percent = COALESCE(p_current_percent, current_percent),
      grade = COALESCE(p_grade, grade),
      remarks = COALESCE(p_remarks, remarks),
      updated_at = now()
  WHERE id = p_goal_id
  RETURNING * INTO v_goal;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'update-course-goal', 'course_goals', v_goal.id);

  RETURN v_goal;
END;
$$;

REVOKE ALL ON FUNCTION public.is_goal_target(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.goal_add(uuid, uuid, text, text, integer, text, text, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.goal_update(uuid, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_goal_target(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.goal_add(uuid, uuid, text, text, integer, text, text, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.goal_update(uuid, integer, text, text) TO authenticated;

COMMIT;