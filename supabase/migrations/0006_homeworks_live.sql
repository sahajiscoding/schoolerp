-- ==========================================================================
-- 0006_homeworks_live.sql
-- Secure live Homeworks slice: typed assignments, atomic server-side targeting,
-- student-owned submissions, and private Storage policies.
-- ==========================================================================

BEGIN;

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'HOMEWORK',
  ADD COLUMN IF NOT EXISTS subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assignments_kind_check'
      AND conrelid = 'public.assignments'::regclass
  ) THEN
    ALTER TABLE public.assignments
      ADD CONSTRAINT assignments_kind_check CHECK (kind IN ('HOMEWORK', 'ASSIGNMENT'));
  END IF;
END;
$$;

ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submission_has_content;
ALTER TABLE public.submissions
  ADD CONSTRAINT submission_has_content
  CHECK (NULLIF(btrim(body), '') IS NOT NULL OR file_path IS NOT NULL);

-- SECURITY DEFINER avoids recursive RLS while policies check target membership.
-- The function returns only a boolean and requires an active student profile.
CREATE OR REPLACE FUNCTION public.is_assignment_recipient(
  p_assignment_id uuid,
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
        EXISTS (
          SELECT 1
          FROM public.assignment_students ast
          WHERE ast.assignment_id = p_assignment_id
            AND ast.student_id = p_student_id
        )
        OR EXISTS (
          SELECT 1
          FROM public.assignment_sections ase
          JOIN public.enrollments e ON e.section_id = ase.section_id
          WHERE ase.assignment_id = p_assignment_id
            AND e.student_id = p_student_id
            AND e.academic_year IS NOT NULL
        )
      )
  );
$$;

-- Assignment reads stay RLS-bound. Deactivated teachers/students resolve to no
-- rows; admins retain read-only oversight.
DROP POLICY IF EXISTS assignments_read_targeted ON public.assignments;
CREATE POLICY assignments_read_targeted ON public.assignments
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.profiles actor
      WHERE actor.id = auth.uid()
        AND actor.is_active
        AND (
          assignments.teacher_id = auth.uid()
          OR public.is_assignment_recipient(assignments.id, auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS assignment_sections_read ON public.assignment_sections;
CREATE POLICY assignment_sections_read ON public.assignment_sections
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.profiles actor ON actor.id = auth.uid() AND actor.is_active
      WHERE a.id = assignment_sections.assignment_id
        AND (
          a.teacher_id = auth.uid()
          OR public.is_assignment_recipient(a.id, auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS assignment_students_read ON public.assignment_students;
CREATE POLICY assignment_students_read ON public.assignment_students
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.profiles actor ON actor.id = auth.uid() AND actor.is_active
      WHERE a.id = assignment_students.assignment_id
        AND (
          a.teacher_id = auth.uid()
          OR assignment_students.student_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS submissions_own_or_teacher_or_admin ON public.submissions;
CREATE POLICY submissions_own_or_teacher_or_admin ON public.submissions
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.profiles actor
      WHERE actor.id = auth.uid()
        AND actor.is_active
        AND (
          submissions.student_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = submissions.assignment_id
              AND a.teacher_id = auth.uid()
          )
        )
    )
  );

-- Fixes the original OR-precedence bug: auth.uid() = student_id now applies
-- to both individual and section targeting paths.
DROP POLICY IF EXISTS submissions_student_insert ON public.submissions;
CREATE POLICY submissions_student_insert ON public.submissions
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
    AND public.is_assignment_recipient(assignment_id, auth.uid())
  );

DROP POLICY IF EXISTS submissions_student_update ON public.submissions;
CREATE POLICY submissions_student_update ON public.submissions
  FOR UPDATE USING (auth.uid() = student_id)
  WITH CHECK (
    auth.uid() = student_id
    AND public.is_assignment_recipient(assignment_id, auth.uid())
  );

-- Publishing must create the assignment and every target atomically. The
-- client never receives permission to write target join tables directly.
CREATE OR REPLACE FUNCTION public.publish_assignment(
  p_title text,
  p_instructions text,
  p_due_at timestamptz,
  p_kind text,
  p_subject_id uuid,
  p_section_ids uuid[],
  p_student_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_attachment_path text DEFAULT NULL
) RETURNS public.assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_assignment public.assignments;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_actor AND p.role = 'teacher' AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only an active teacher may publish assignments'
      USING ERRCODE = '42501';
  END IF;

  IF NULLIF(btrim(p_title), '') IS NULL OR char_length(btrim(p_title)) > 200 THEN
    RAISE EXCEPTION 'assignment title must contain 1 to 200 characters'
      USING ERRCODE = '22023';
  END IF;
  IF p_instructions IS NOT NULL AND char_length(p_instructions) > 10000 THEN
    RAISE EXCEPTION 'assignment instructions are too long'
      USING ERRCODE = '22023';
  END IF;
  IF p_due_at IS NULL THEN
    RAISE EXCEPTION 'assignment due date is required'
      USING ERRCODE = '22023';
  END IF;
  IF p_kind NOT IN ('HOMEWORK', 'ASSIGNMENT') THEN
    RAISE EXCEPTION 'invalid assignment kind'
      USING ERRCODE = '22023';
  END IF;
  IF p_subject_id IS NULL THEN
    RAISE EXCEPTION 'assignment subject is required'
      USING ERRCODE = '22023';
  END IF;
  IF cardinality(COALESCE(p_section_ids, ARRAY[]::uuid[])) = 0
     AND cardinality(COALESCE(p_student_ids, ARRAY[]::uuid[])) = 0 THEN
    RAISE EXCEPTION 'at least one assignment target is required'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p_section_ids, ARRAY[]::uuid[])) target(section_id)
    WHERE target.section_id IS NULL
       OR NOT EXISTS (
         SELECT 1
         FROM public.teaching_assignments ta
         WHERE ta.teacher_id = v_actor
           AND ta.section_id = target.section_id
           AND ta.subject_id = p_subject_id
       )
  ) THEN
    RAISE EXCEPTION 'one or more sections are outside the teacher subject scope'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(COALESCE(p_student_ids, ARRAY[]::uuid[])) target(student_id)
    WHERE target.student_id IS NULL
       OR NOT EXISTS (
         SELECT 1
         FROM public.enrollments e
         JOIN public.profiles p ON p.id = e.student_id AND p.is_active
         JOIN public.teaching_assignments ta
           ON ta.section_id = e.section_id
          AND ta.teacher_id = v_actor
          AND ta.subject_id = p_subject_id
         WHERE e.student_id = target.student_id
       )
  ) THEN
    RAISE EXCEPTION 'one or more students are outside the teacher subject scope'
      USING ERRCODE = '42501';
  END IF;

  IF p_attachment_path IS NOT NULL THEN
    IF split_part(p_attachment_path, '/', 1) <> v_actor::text
       OR NOT EXISTS (
         SELECT 1 FROM storage.objects o
         WHERE o.bucket_id = 'homework-files' AND o.name = p_attachment_path
       ) THEN
      RAISE EXCEPTION 'assignment attachment path is invalid'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  INSERT INTO public.assignments (
    teacher_id, title, instructions, due_at, attachment_path, kind, subject_id
  ) VALUES (
    v_actor, btrim(p_title), NULLIF(btrim(p_instructions), ''), p_due_at,
    p_attachment_path, p_kind, p_subject_id
  ) RETURNING * INTO v_assignment;

  INSERT INTO public.assignment_sections (assignment_id, section_id)
  SELECT v_assignment.id, target.section_id
  FROM (
    SELECT DISTINCT unnest(COALESCE(p_section_ids, ARRAY[]::uuid[])) AS section_id
  ) target;

  INSERT INTO public.assignment_students (assignment_id, student_id)
  SELECT v_assignment.id, target.student_id
  FROM (
    SELECT DISTINCT unnest(COALESCE(p_student_ids, ARRAY[]::uuid[])) AS student_id
  ) target;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, meta)
  VALUES (
    v_actor,
    'publish-assignment',
    'assignment',
    v_assignment.id,
    jsonb_build_object(
      'section_count', cardinality(COALESCE(p_section_ids, ARRAY[]::uuid[])),
      'student_count', cardinality(COALESCE(p_student_ids, ARRAY[]::uuid[]))
    )
  );

  RETURN v_assignment;
END;
$$;

-- Students submit through a narrow RPC. student_id always comes from auth.uid;
-- callers cannot forge it, set reviewed status, or target another assignment.
CREATE OR REPLACE FUNCTION public.submit_assignment(
  p_assignment_id uuid,
  p_body text DEFAULT NULL,
  p_file_path text DEFAULT NULL
) RETURNS public.submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_body text := NULLIF(btrim(p_body), '');
  v_existing_file text;
  v_submission public.submissions;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_actor AND p.role = 'student' AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only an active student may submit assignments'
      USING ERRCODE = '42501';
  END IF;
  IF NOT public.is_assignment_recipient(p_assignment_id, v_actor) THEN
    RAISE EXCEPTION 'student is not targeted by this assignment'
      USING ERRCODE = '42501';
  END IF;
  IF v_body IS NOT NULL AND char_length(v_body) > 50000 THEN
    RAISE EXCEPTION 'submission body is too long'
      USING ERRCODE = '22023';
  END IF;

  SELECT s.file_path INTO v_existing_file
  FROM public.submissions s
  WHERE s.assignment_id = p_assignment_id AND s.student_id = v_actor;

  IF p_file_path IS NOT NULL THEN
    IF split_part(p_file_path, '/', 1) <> v_actor::text
       OR NOT EXISTS (
         SELECT 1 FROM storage.objects o
         WHERE o.bucket_id = 'submission-files' AND o.name = p_file_path
       ) THEN
      RAISE EXCEPTION 'submission file path is invalid'
        USING ERRCODE = '22023';
    END IF;
  END IF;

  IF v_body IS NULL AND p_file_path IS NULL AND v_existing_file IS NULL THEN
    RAISE EXCEPTION 'submission requires text or a file'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.submissions (
    assignment_id, student_id, body, file_path, submitted_at, status, reviewed_at
  ) VALUES (
    p_assignment_id, v_actor, v_body, COALESCE(p_file_path, v_existing_file),
    now(), 'submitted', NULL
  )
  ON CONFLICT (assignment_id, student_id) DO UPDATE SET
    body = EXCLUDED.body,
    file_path = EXCLUDED.file_path,
    submitted_at = now(),
    status = 'submitted',
    reviewed_at = NULL
  RETURNING * INTO v_submission;

  RETURN v_submission;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_submission(
  p_submission_id uuid
) RETURNS public.submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_submission public.submissions;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    JOIN public.profiles p ON p.id = v_actor AND p.role = 'teacher' AND p.is_active
    WHERE s.id = p_submission_id AND a.teacher_id = v_actor
  ) THEN
    RAISE EXCEPTION 'teacher cannot review this submission'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.submissions
  SET status = 'reviewed', reviewed_at = now()
  WHERE id = p_submission_id
  RETURNING * INTO v_submission;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'review-submission', 'submission', v_submission.id);

  RETURN v_submission;
END;
$$;

-- Direct target/submission writes are closed; the narrow functions above are
-- the only authenticated write surface.
REVOKE INSERT, UPDATE, DELETE ON public.assignments FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.assignment_sections FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.assignment_students FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.submissions FROM authenticated;

REVOKE ALL ON FUNCTION public.is_assignment_recipient(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_assignment(text, text, timestamptz, text, uuid, uuid[], uuid[], text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_assignment(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_submission(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_assignment_recipient(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_assignment(text, text, timestamptz, text, uuid, uuid[], uuid[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_assignment(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_submission(uuid) TO authenticated;

-- Bucket-level limits are enforced in addition to client-side validation.
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
WHERE id IN ('homework-files', 'submission-files');

DROP POLICY IF EXISTS homework_files_insert ON storage.objects;
CREATE POLICY homework_files_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'homework-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.role = 'teacher' AND actor.is_active
    )
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS homework_files_select ON storage.objects;
CREATE POLICY homework_files_select ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'homework-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.is_active
    )
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.attachment_path = storage.objects.name
          AND public.is_assignment_recipient(a.id, auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS homework_files_update ON storage.objects;
CREATE POLICY homework_files_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'homework-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.role = 'teacher' AND actor.is_active
    )
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'homework-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.role = 'teacher' AND actor.is_active
    )
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS homework_files_delete ON storage.objects;
CREATE POLICY homework_files_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'homework-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.role = 'teacher' AND actor.is_active
    )
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS submission_files_insert ON storage.objects;
CREATE POLICY submission_files_insert ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.role = 'student' AND actor.is_active
    )
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS submission_files_select ON storage.objects;
CREATE POLICY submission_files_select ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.is_active
    )
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.file_path = storage.objects.name
          AND a.teacher_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS submission_files_update ON storage.objects;
CREATE POLICY submission_files_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.role = 'student' AND actor.is_active
    )
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.role = 'student' AND actor.is_active
    )
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS submission_files_delete ON storage.objects;
CREATE POLICY submission_files_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'submission-files'
    AND EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid() AND actor.role = 'student' AND actor.is_active
    )
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;
