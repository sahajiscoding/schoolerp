-- ============================================================================
-- 0005_authorization_hardening.sql
--
-- Consolidates the SQL remediation from
--   docs/audits/2026-11-06-application-security-audit.md
--
-- STATUS: PROPOSED — review before applying. Nothing here has been applied to
-- any project. Deliberately contains no BEGIN/COMMIT and no CREATE INDEX
-- CONCURRENTLY, so it can run either through `supabase db push` or by pasting
-- into the Supabase SQL Editor (which executes statements one at a time).
--
-- ORDER MATTERS for two reasons:
--   * Part 0 must run before everything else (helpers used by later policies).
--   * Part 3 REVOKEs table-level SELECT on student_details; anything that
--     currently does `select *` from student_details will start failing and
--     must be changed to name its columns.
--
-- WHERE TO APPLY: the live project already has 0001-0004 applied. Apply this to
-- a STAGING project first, run `python3 supabase/tests/verify_rls_local.py`
-- (update it to include this file), and only then to production.
--
-- SAFETY NOTE ON PART 4 (declaration signatures): it is a real behaviour change
-- for any student whose signature was inserted by an admin on their behalf
-- (for example a bulk "everyone signs the excursion form" action). Inspect the
-- existing rows before applying and decide whether to keep or delete them.
-- ============================================================================


-- ============================================================================
-- PART 0 — helper hardening (F-11, F-14)          [run first]
-- ============================================================================

-- app_role() was the only helper declared without qualified types, so its body
-- resolved `profiles` / `auth.uid()` through the caller's search_path at
-- creation time. Recreate it like the others.
CREATE OR REPLACE FUNCTION public.app_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role::text FROM public.profiles p WHERE p.id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.app_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated;

-- `is_enrolled(uuid)` was an unscoped existence oracle: it accepted ANY profile
-- id and never compared it to auth.uid(), so any role (anon included) could ask
-- "is this UUID an enrolled student?". No policy uses it.
REVOKE ALL ON FUNCTION public.is_enrolled(uuid) FROM PUBLIC, anon, authenticated;

-- Same for the section -> class-teacher lookup: it returned another section's
-- teacher to any caller.
REVOKE ALL ON FUNCTION public.class_teacher_of_section(uuid) FROM PUBLIC, anon, authenticated;

-- Recreate the privilege guard so the service-role bypass is explicit and
-- created_at is protected too, and so the admin path is checked BEFORE the
-- blanket role exemption.
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  -- Provisioning paths (Edge Function / bootstrap script / migrations).
  IF current_user IN ('service_role', 'postgres') THEN
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role        IS DISTINCT FROM OLD.role
  OR NEW.is_active   IS DISTINCT FROM OLD.is_active
  OR NEW.login_id    IS DISTINCT FROM OLD.login_id
  OR NEW.created_at  IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'permission denied: privileged profile columns are protected'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

-- Leave decisions: block self-decision on ANY transition (not just ->approved),
-- require decided_by to be the actor, and let the server set the timestamp.
CREATE OR REPLACE FUNCTION public.guard_leave_decision()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth.uid() = OLD.student_id THEN
      RAISE EXCEPTION 'a student cannot decide their own leave request'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.decided_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'decided_by must be the acting teacher'
        USING ERRCODE = '42501';
    END IF;
    NEW.decided_on := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leave_requests_no_self_approval ON public.leave_requests;
DROP TRIGGER IF EXISTS leave_requests_guard_decisions ON public.leave_requests;
CREATE TRIGGER leave_requests_guard_decisions
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.guard_leave_decision();

-- touch_updated_at had no pinned search_path.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_privileges() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_leave_decision()      FROM PUBLIC;
REVOKE ALL ON FUNCTION public.touch_updated_at()          FROM PUBLIC;


-- ============================================================================
-- PART 1 — F-01a: a zero-cost second factor for a deterministic password
-- ============================================================================
-- The school requires Student@DDMMYYYY, so the password cannot be the only
-- factor. These two tables make a classmate's guess insufficient without any
-- SMS/email cost (the design doc rules out SMS on cost grounds).

-- Self-chosen 6-digit PIN, Argon2id-hashed by the Edge Function. Never sent to
-- the client, never in a JWT.
CREATE TABLE IF NOT EXISTS public.student_pin (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pin_hash   text NOT NULL,
  set_at     timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_pin ENABLE ROW LEVEL SECURITY;
-- Nobody reads this table through PostgREST, not even the owner of the row:
-- verification happens in the Edge Function with the service role.
REVOKE ALL ON TABLE public.student_pin FROM anon, authenticated;

-- Devices a profile has signed in from. A new device needs an approval from
-- the class teacher or an admin (the console's /approvals page is the natural
-- place for that queue).
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,   -- sha256(first-party random cookie + UA)
  label              text,
  approved_by        uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at        timestamptz,
  last_seen_at       timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS trusted_devices_pending_idx
  ON public.trusted_devices (created_at)
  WHERE approved_at IS NULL;

ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trusted_devices_self_read ON public.trusted_devices;
CREATE POLICY trusted_devices_self_read ON public.trusted_devices
  FOR SELECT TO authenticated
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS trusted_devices_staff_approve ON public.trusted_devices;
CREATE POLICY trusted_devices_staff_approve ON public.trusted_devices
  FOR UPDATE TO authenticated
  USING (
    (public.is_admin() OR public.is_class_teacher_of(profile_id))
    AND approved_at IS NULL
  )
  WITH CHECK (
    (public.is_admin() OR public.is_class_teacher_of(profile_id))
    AND approved_at IS NOT NULL
    AND approved_by = auth.uid()
  );

-- No INSERT/DELETE by any browser role; rows are written by the Edge Function
-- (service_role) and by the approval policy above.
REVOKE INSERT, DELETE ON TABLE public.trusted_devices FROM anon, authenticated;
GRANT UPDATE (approved_by, approved_at) ON TABLE public.trusted_devices TO authenticated;


-- ============================================================================
-- PART 2 — F-01c: make guessing visible and expensive
-- ============================================================================
-- A ~5,500-value password space is only dangerous because it is silent and
-- unlimited. This table is what lets you answer "is someone enumerating?".

CREATE TABLE IF NOT EXISTS public.login_events (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id   text,
  succeeded  boolean NOT NULL,
  reason     text,        -- never the submitted password
  ip_hash    text,        -- sha256(ip || server-side salt), never the raw IP
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_events_burst_idx
  ON public.login_events (created_at)
  WHERE succeeded = false;

CREATE INDEX IF NOT EXISTS login_events_login_idx
  ON public.login_events (login_id, created_at);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS login_events_admin_read ON public.login_events;
CREATE POLICY login_events_admin_read ON public.login_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

REVOKE INSERT, UPDATE, DELETE ON TABLE public.login_events FROM anon, authenticated;
-- Writes arrive from the Edge Function / auth webhook with service_role.

-- Suggested detection (run as a scheduled job, alert to the DPO + IT):
--
--   SELECT login_id, count(*) AS failures, min(created_at), max(created_at)
--   FROM public.login_events
--   WHERE NOT succeeded AND created_at > now() - interval '10 minutes'
--   GROUP BY login_id
--   HAVING count(*) >= 5;
--
--   SELECT ip_hash, count(*) FROM public.login_events
--   WHERE NOT succeeded AND created_at > now() - interval '10 minutes'
--   GROUP BY ip_hash HAVING count(*) >= 20;


-- ============================================================================
-- PART 3 — F-01b: assurance tiers (defend the data, since login is guessable)
-- ============================================================================

-- True when the session carries a step-up factor (MFA, verified PIN or an
-- approved device) stamped into the JWT by a Supabase access-token hook.
-- Because it reads the signed claims, a client cannot fake it.
CREATE OR REPLACE FUNCTION public.has_step_up() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb
       -> 'app_metadata' ->> 'amr') = 'mfa',
    false
  );
$$;

REVOKE ALL ON FUNCTION public.has_step_up() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_step_up() TO authenticated;

-- Medical / safeguarding: not readable on a password-only session, not even by
-- the student whose record it is. Teachers and admins keep their existing access.
DROP POLICY IF EXISTS leave_requests_student_read ON public.leave_requests;
CREATE POLICY leave_requests_student_read ON public.leave_requests
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = student_id AND public.has_step_up())
    OR public.is_class_teacher_of(student_id)
    OR (public.teaches_student(student_id) AND public.has_step_up())
    OR public.is_admin()
  );

-- Money: same tier.
DROP POLICY IF EXISTS fee_records_student_read ON public.fee_records;
CREATE POLICY fee_records_student_read ON public.fee_records
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = student_id AND public.has_step_up())
    OR public.is_admin()
  );

-- Guardian contact + DOB: remove from routine table reads entirely, and
-- expose the contact fields through a narrow, audited function instead.
REVOKE SELECT ON TABLE public.student_details FROM anon, authenticated;
GRANT SELECT (profile_id, admission_no) ON TABLE public.student_details TO authenticated;

DROP FUNCTION IF EXISTS public.student_contact(uuid);
CREATE FUNCTION public.student_contact(p_student_id uuid)
RETURNS TABLE (guardian_name text, guardian_phone text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT sd.guardian_name, sd.guardian_phone
  FROM public.student_details sd
  WHERE sd.profile_id = p_student_id
    AND (
      public.is_admin()
      OR public.is_class_teacher_of(p_student_id)
      OR public.teaches_student(p_student_id)
    );
$$;

REVOKE ALL ON FUNCTION public.student_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_contact(uuid) TO authenticated;

-- NOTE: existing app code that does `select('*')` on student_details will now
-- fail with "permission denied for table student_details". Change those call
-- sites to name the columns they need.


-- ============================================================================
-- PART 4 — F-02: declaration signatures need a relationship check (CRITICAL)
-- ============================================================================

DROP POLICY IF EXISTS declaration_signatures_student_insert ON public.declaration_signatures;
CREATE POLICY declaration_signatures_student_insert ON public.declaration_signatures
  FOR INSERT TO authenticated
  WITH CHECK (
    -- 1. You may only sign as yourself.
    auth.uid() = student_id
    -- 2. Only students sign.
    AND public.app_role() = 'student'
    -- 3. The form must be addressed to you, and still open.
    AND EXISTS (
      SELECT 1
      FROM public.declaration_forms f
      WHERE f.id = declaration_signatures.form_id
        AND f.audience IN ('students', 'both')
        AND (f.due_date IS NULL OR f.due_date >= current_date)
        AND (
          cardinality(f.section_ids) = 0
          OR EXISTS (
            SELECT 1
            FROM public.enrollments e
            WHERE e.student_id = auth.uid()
              AND e.section_id = ANY (f.section_ids)
          )
        )
    )
  );

-- Signatures are append-only evidence.
REVOKE UPDATE, DELETE ON TABLE public.declaration_signatures FROM anon, authenticated;

-- Keep the read scope consistent with the write scope.
DROP POLICY IF EXISTS declaration_forms_read ON public.declaration_forms;
CREATE POLICY declaration_forms_read ON public.declaration_forms
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR created_by = auth.uid()
    OR (
      audience IN ('students', 'both')
      AND (
        cardinality(section_ids) = 0
        OR EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.student_id = auth.uid() AND e.section_id = ANY (declaration_forms.section_ids)
        )
      )
    )
  );


-- ============================================================================
-- PART 5 — F-03: poll injection + school-wide broadcast by any teacher
-- ============================================================================

DROP POLICY IF EXISTS polls_teacher_insert ON public.polls;
CREATE POLICY polls_teacher_insert ON public.polls
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND (public.is_admin() OR public.app_role() = 'teacher')
    -- Only an admin may address the whole school.
    AND (public.is_admin() OR cardinality(section_ids) > 0)
    -- Everyone else is limited to their own sections.
    AND NOT EXISTS (
      SELECT 1 FROM unnest(section_ids) AS s(section_id)
      WHERE NOT public.teaches_section(s.section_id)
    )
  );

DROP POLICY IF EXISTS polls_read ON public.polls;
CREATE POLICY polls_read ON public.polls
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR created_by = auth.uid()
    OR cardinality(section_ids) = 0
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = auth.uid() AND e.section_id = ANY (polls.section_ids)
    )
  );

DROP POLICY IF EXISTS poll_options_owner_insert ON public.poll_options;
CREATE POLICY poll_options_owner_insert ON public.poll_options
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_options.poll_id
        AND p.created_by = auth.uid()
        AND (p.closes_on IS NULL OR p.closes_on >= current_date)
    )
  );

-- BEFORE applying the next constraint, check for duplicates introduced by the
-- old open policy:
--   SELECT poll_id, position, count(*) FROM public.poll_options
--   GROUP BY 1,2 HAVING count(*) > 1;
-- and renumber the extras if any exist.
ALTER TABLE public.poll_options
  DROP CONSTRAINT IF EXISTS poll_options_position_unique;
ALTER TABLE public.poll_options
  ADD CONSTRAINT poll_options_position_unique UNIQUE (poll_id, position);


-- ============================================================================
-- PART 6 — F-08: poll votes must reference an option of the same poll,
--          from an open poll, addressed to the voter
-- ============================================================================

ALTER TABLE public.poll_options
  DROP CONSTRAINT IF EXISTS poll_options_poll_id_id_key;
ALTER TABLE public.poll_options
  ADD CONSTRAINT poll_options_poll_id_id_key UNIQUE (poll_id, id);

ALTER TABLE public.poll_votes
  DROP CONSTRAINT IF EXISTS poll_votes_option_in_poll;
ALTER TABLE public.poll_votes
  ADD CONSTRAINT poll_votes_option_in_poll
  FOREIGN KEY (poll_id, option_id)
  REFERENCES public.poll_options (poll_id, id)
  ON DELETE CASCADE;

DROP POLICY IF EXISTS poll_votes_student_insert ON public.poll_votes;
CREATE POLICY poll_votes_student_insert ON public.poll_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = student_id
    AND public.app_role() = 'student'
    AND EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_votes.poll_id
        AND (p.closes_on IS NULL OR p.closes_on >= current_date)
        AND (
          cardinality(p.section_ids) = 0
          OR EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.student_id = auth.uid() AND e.section_id = ANY (p.section_ids)
          )
        )
    )
  );


-- ============================================================================
-- PART 7 — F-10: read receipts are evidence; make them one-way
-- ============================================================================

DROP POLICY IF EXISTS notice_recipients_own_update ON public.notice_recipients;
REVOKE UPDATE ON TABLE public.notice_recipients FROM anon, authenticated;
GRANT UPDATE (read_at) ON TABLE public.notice_recipients TO authenticated;

CREATE POLICY notice_recipients_mark_read ON public.notice_recipients
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND read_at IS NULL)      -- one way only
  WITH CHECK (auth.uid() = user_id AND read_at IS NOT NULL);


-- ============================================================================
-- PART 8 — F-09: audit trail integrity
-- ============================================================================

-- Non-service inserts must be attributable to the caller.
DROP POLICY IF EXISTS audit_log_admin_insert ON public.audit_log;
CREATE POLICY audit_log_admin_insert ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND actor_id = auth.uid());

DROP POLICY IF EXISTS audit_log_admin_select ON public.audit_log;
CREATE POLICY audit_log_admin_select ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin());

REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.audit_log FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.audit_log_immutable()
RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (attempted %)', TG_OP
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.audit_log_immutable() FROM PUBLIC;

DROP TRIGGER IF EXISTS audit_log_no_mutation ON public.audit_log;
CREATE TRIGGER audit_log_no_mutation
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

ALTER TABLE public.audit_log ALTER COLUMN created_at SET DEFAULT now();


-- ============================================================================
-- PART 9 — F-12: library circulation is admin-(or librarian-)only and bound
--           to the acting user
-- ============================================================================

DROP POLICY IF EXISTS books_staff_write ON public.books;
DROP POLICY IF EXISTS books_admin_write ON public.books;
CREATE POLICY books_admin_write ON public.books
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS books_read ON public.books;
CREATE POLICY books_read ON public.books
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS book_issues_staff_write ON public.book_issues;
DROP POLICY IF EXISTS book_issues_librarian_insert ON public.book_issues;
CREATE POLICY book_issues_librarian_insert ON public.book_issues
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND issued_by = auth.uid());

DROP POLICY IF EXISTS book_issues_librarian_return ON public.book_issues;
CREATE POLICY book_issues_librarian_return ON public.book_issues
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND issued_by = auth.uid())
  WITH CHECK (public.is_admin() AND issued_by = auth.uid());

-- No DELETE policy: returns are recorded, never erased.
REVOKE DELETE ON TABLE public.book_issues FROM anon, authenticated;

-- If staff other than admins must run circulation, add a librarian flag in a
-- NEW table (not in profiles, whose privileged columns are protected) and
-- extend these three policies. Do not widen them back to app_role() IN (...).
