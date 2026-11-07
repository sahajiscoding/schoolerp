-- ============================================================================
-- 0009_communications_live.sql
-- Secure live Communications slice: declaration forms + signatures, polls +
-- votes, and message threads via RPCs. Admin writes declarations/polls;
-- students vote/sign; teachers write polls for sections they teach.
-- ============================================================================

BEGIN;

-- is_communication_target: true when the caller is the student themselves or
-- staff, scoped to a section when provided.
CREATE OR REPLACE FUNCTION public.is_communication_target(
  p_student_id uuid,
  p_section_ids uuid[] DEFAULT NULL
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
      AND (
        p_section_ids IS NULL
        OR cardinality(p_section_ids) = 0
        OR EXISTS (
          SELECT 1
          FROM public.enrollments e
          WHERE e.student_id = p_student_id
            AND e.section_id = ANY(p_section_ids)
            AND e.academic_year IS NOT NULL
        )
      )
  );
$$;

-- Declaration form reads: students see forms aimed at them; staff see all.
DROP POLICY IF EXISTS declaration_forms_read ON public.declaration_forms;
CREATE POLICY declaration_forms_read ON public.declaration_forms
  FOR SELECT USING (
    public.is_admin()
    OR created_by = auth.uid()
    OR audience = 'both'
    OR (
      audience = 'students'
      AND public.is_communication_target(auth.uid())
    )
  );

-- Declaration form writes: admin only.
DROP POLICY IF EXISTS declaration_forms_admin_insert ON public.declaration_forms;
CREATE POLICY declaration_forms_admin_insert ON public.declaration_forms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid()
        AND actor.role = 'admin'
        AND actor.is_active
    )
  );

-- Declaration signature reads: student reads own signatures; staff read all.
DROP POLICY IF EXISTS declaration_signatures_own ON public.declaration_signatures;
CREATE POLICY declaration_signatures_own ON public.declaration_signatures
  FOR SELECT USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR public.teaches_student(student_id)
    OR public.is_class_teacher_of(student_id)
  );

-- Direct signature writes are closed; the RPC below is the only surface.
REVOKE ALL ON public.declaration_signatures FROM authenticated;

-- Sign a declaration: student signs for themselves only.
CREATE OR REPLACE FUNCTION public.declarations_sign(
  p_form_id uuid
) RETURNS public.declaration_signatures
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_signature public.declaration_signatures;
BEGIN
  -- Form must exist.
  IF NOT EXISTS (
    SELECT 1 FROM public.declaration_forms WHERE id = p_form_id
  ) THEN
    RAISE EXCEPTION 'declaration form not found'
      USING ERRCODE = '42501';
  END IF;

  -- Only students may sign.
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_actor AND p.role = 'student' AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only students may sign declarations'
      USING ERRCODE = '42501';
  END IF;

  -- Student must be targeted by this form's audience/sections.
  IF NOT public.is_communication_target(v_actor) THEN
    RAISE EXCEPTION 'student is not targeted by this declaration'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.declaration_signatures (form_id, student_id)
  VALUES (p_form_id, v_actor)
  ON CONFLICT (form_id, student_id) DO NOTHING
  RETURNING * INTO v_signature;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'signature already exists'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'sign-declaration', 'declaration_signatures', p_form_id);

  RETURN v_signature;
END;
$$;

-- Poll reads: everyone authenticated can read.
DROP POLICY IF EXISTS polls_read ON public.polls;
CREATE POLICY polls_read ON public.polls
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Poll writes: admin or teacher of the section.
DROP POLICY IF EXISTS polls_teacher_insert ON public.polls;
CREATE POLICY polls_teacher_insert ON public.polls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('admin', 'teacher')
        AND actor.is_active
    )
  );

-- Direct poll option/vote writes are closed; RPCs below are the surface.
REVOKE ALL ON public.poll_options FROM authenticated;
REVOKE ALL ON public.poll_votes FROM authenticated;

-- Create poll options: author of the poll only.
CREATE OR REPLACE FUNCTION public.polls_create_options(
  p_poll_id uuid,
  p_labels text[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = p_poll_id AND p.created_by = v_actor
  ) THEN
    RAISE EXCEPTION 'not the poll author'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.poll_options (poll_id, label, position)
  SELECT p_poll_id, label, idx
  FROM unnest(p_labels) WITH ORDINALITY AS t(label, idx)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Vote on a poll: student votes once per poll, must be targeted.
CREATE OR REPLACE FUNCTION public.polls_vote(
  p_poll_id uuid,
  p_option_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_poll public.polls;
  v_student_section_ids uuid[];
BEGIN
  -- Poll must exist.
  SELECT * INTO v_poll
  FROM public.polls
  WHERE id = p_poll_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'poll not found'
      USING ERRCODE = '42501';
  END IF;

  -- Only students may vote.
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_actor AND p.role = 'student' AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only students may vote'
      USING ERRCODE = '42501';
  END IF;

  -- Option must belong to this poll.
  IF NOT EXISTS (
    SELECT 1 FROM public.poll_options
    WHERE id = p_option_id AND poll_id = p_poll_id
  ) THEN
    RAISE EXCEPTION 'option does not belong to this poll'
      USING ERRCODE = '42501';
  END IF;

  -- Student must be targeted by the poll's audience/sections.
  SELECT array_agg(DISTINCT section_id)
  INTO v_student_section_ids
  FROM public.enrollments e
  WHERE e.student_id = v_actor AND e.academic_year IS NOT NULL;

  IF NOT public.is_communication_target(v_actor, v_poll.section_ids) THEN
    RAISE EXCEPTION 'student is not targeted by this poll'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.poll_votes (poll_id, option_id, student_id)
  VALUES (p_poll_id, p_option_id, v_actor)
  ON CONFLICT (poll_id, student_id) DO UPDATE
  SET option_id = EXCLUDED.option_id, voted_at = now();

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'vote-poll', 'poll_votes', p_poll_id);
END;
$$;

-- Thread reads: participants read their own threads; staff read all.
DROP POLICY IF EXISTS threads_participant ON public.threads;
CREATE POLICY threads_participant ON public.threads
  FOR SELECT USING (
    public.is_thread_participant(id)
    OR public.is_admin()
    OR public.teaches_student(
      (SELECT student_id FROM public.threads t WHERE t.id = threads.id)
    )
  );

-- Thread writes: teacher creates threads for their students; admin creates any.
DROP POLICY IF EXISTS threads_teacher_insert ON public.threads;
CREATE POLICY threads_teacher_insert ON public.threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('admin', 'teacher')
        AND actor.is_active
    )
    AND public.is_communication_target(
      threads.student_id
    )
  );

-- Direct message writes are closed; RPC below is the surface.
REVOKE ALL ON public.messages FROM authenticated;

-- Send a message: participant of the thread only.
CREATE OR REPLACE FUNCTION public.messages_send(
  p_thread_id uuid,
  p_body text
) RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_message public.messages;
BEGIN
  -- Thread must exist and caller must be a participant.
  IF NOT EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = p_thread_id
      AND (t.teacher_id = v_actor OR t.student_id = v_actor)
  ) THEN
    RAISE EXCEPTION 'not a participant in this thread'
      USING ERRCODE = '42501';
  END IF;

  IF p_body IS NULL OR NULLIF(btrim(p_body), '') IS NULL THEN
    RAISE EXCEPTION 'message body is required'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.messages (thread_id, sender_id, body)
  VALUES (p_thread_id, v_actor, NULLIF(btrim(p_body), ''))
  RETURNING * INTO v_message;

  UPDATE public.threads
  SET last_message_at = now()
  WHERE id = p_thread_id;

  RETURN v_message;
END;
$$;

REVOKE ALL ON FUNCTION public.is_communication_target(uuid, uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.declarations_sign(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.polls_create_options(uuid, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.polls_vote(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.messages_send(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_communication_target(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.declarations_sign(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.polls_create_options(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.polls_vote(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.messages_send(uuid, text) TO authenticated;

COMMIT;