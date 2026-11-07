-- ============================================================================
-- 0011_events_live.sql
-- Secure live Events slice: typed school events with section scoping.
-- Teachers may only publish to sections they teach; admins own the calendar.
-- ============================================================================

BEGIN;

-- is_event_target: true when the caller can see this event (student sees
-- whole-school events plus their own class's "Class only" events).
CREATE OR REPLACE FUNCTION public.is_event_target(
  p_student_id uuid,
  p_section_ids uuid[]
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

-- School events reads: students see targeted events; staff see all.
DROP POLICY IF EXISTS school_events_read ON public.school_events;
CREATE POLICY school_events_read ON public.school_events
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.profiles actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('admin', 'teacher')
        AND actor.is_active
    )
    OR public.is_event_target(auth.uid(), section_ids)
  );

-- Direct event writes are closed; the publish function is the only surface.
REVOKE ALL ON public.school_events FROM authenticated;

-- Publish event: teacher publishes to sections they teach; admin publishes any.
CREATE OR REPLACE FUNCTION public.event_publish(
  p_title text,
  p_description text,
  p_start_date date,
  p_end_date date,
  p_kind text,
  p_section_ids uuid[] DEFAULT NULL,
  p_audience text DEFAULT 'Whole school'
) RETURNS public.school_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_event public.school_events;
BEGIN
  -- Only teachers and admins may publish events.
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor
      AND p.role IN ('admin', 'teacher')
      AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only staff may publish events'
      USING ERRCODE = '42501';
  END IF;

  IF NULLIF(btrim(p_title), '') IS NULL THEN
    RAISE EXCEPTION 'event title is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'start date is required'
      USING ERRCODE = '22023';
  END IF;

  IF p_end_date IS NULL OR p_end_date < p_start_date THEN
    RAISE EXCEPTION 'end date must be on or after start date'
      USING ERRCODE = '22023';
  END IF;

  IF p_kind IS NULL OR p_kind NOT IN ('Exam', 'Holiday', 'Meeting', 'Sports', 'Cultural', 'General') THEN
    RAISE EXCEPTION 'invalid event kind'
      USING ERRCODE = '22023';
  END IF;

  -- Teachers may only publish to sections they teach.
  IF NOT public.is_admin() THEN
    IF EXISTS (
      SELECT 1
      FROM unnest(COALESCE(p_section_ids, ARRAY[]::uuid[])) AS s(section_id)
      WHERE NOT public.teaches_section(s.section_id)
    ) THEN
      RAISE EXCEPTION 'one or more sections are outside the teacher scope'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.school_events (
    title, description, kind, start_date, end_date, section_ids, created_by
  ) VALUES (
    btrim(p_title), NULLIF(btrim(p_description), ''), p_kind,
    p_start_date, p_end_date, p_section_ids, v_actor
  ) RETURNING * INTO v_event;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'publish-event', 'school_events', v_event.id);

  RETURN v_event;
END;
$$;

REVOKE ALL ON FUNCTION public.is_event_target(uuid, uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.event_publish(text, text, date, date, text, uuid[], text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_event_target(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.event_publish(text, text, date, date, text, uuid[], text) TO authenticated;

COMMIT;