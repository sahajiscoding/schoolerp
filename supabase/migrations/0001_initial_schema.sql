-- 0001_initial_schema.sql
-- Core tables per v1 design doc section 6

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  full_name text NOT NULL,
  login_id text UNIQUE NOT NULL,
  must_change_password boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  avatar_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  academic_year text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, name, academic_year)
);

CREATE TABLE subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teaching_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, section_id, subject_id)
);

CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  roll_no text,
  academic_year text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year),
  UNIQUE (section_id, roll_no, academic_year)
);

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text,
  due_at timestamptz,
  attachment_path text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE assignment_sections (
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, section_id)
);

CREATE TABLE assignment_students (
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (assignment_id, student_id)
);

CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text,
  file_path text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed')),
  reviewed_at timestamptz,
  UNIQUE (assignment_id, student_id),
  CONSTRAINT submission_has_content CHECK (body IS NOT NULL OR file_path IS NOT NULL)
);

CREATE TABLE threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  campaign_id uuid NOT NULL DEFAULT gen_random_uuid(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, student_id, campaign_id)
);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notice_recipients (
  notice_id uuid NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  read_at timestamptz,
  PRIMARY KEY (notice_id, user_id)
);

CREATE TABLE push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expo_token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (expo_token)
);

CREATE TABLE notification_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  entity_id uuid NOT NULL,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  idempotency_key text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  meta jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper functions
-- NOTE: `current_role` is a reserved SQL keyword; a function with that name
-- cannot be created or called, so the helper is `app_role()`. Migration 0002
-- also relies on this name.
CREATE OR REPLACE FUNCTION app_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role FROM public.profiles p WHERE p.id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role = 'admin' AND p.is_active FROM public.profiles p WHERE p.id = auth.uid();
$$;

-- NOTE: the parameter must NOT be named `section_id`. Inside the body a bare
-- `section_id` resolves to the parameter, so `ta.section_id = section_id` is a
-- tautology that returns true for every caller and every section. Verified on
-- Postgres 14. Parameters are prefixed p_ for this reason.
CREATE OR REPLACE FUNCTION teaches_section(p_section_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teaching_assignments ta
    WHERE ta.teacher_id = auth.uid()
      AND ta.section_id = p_section_id
  );
$$;

CREATE OR REPLACE FUNCTION is_enrolled(p_student_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id = p_student_id
      AND e.academic_year IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION is_thread_participant(p_thread_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.threads t
    WHERE t.id = p_thread_id
      AND (t.teacher_id = auth.uid() OR t.student_id = auth.uid())
  );
$$;

-- RLS policies: profiles
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "profiles_read_active" ON profiles
  FOR SELECT USING (is_active);

-- Admins read all profiles
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (is_admin());

-- RLS policies: classes (read all)
CREATE POLICY "classes_read_all" ON classes
  FOR SELECT USING (true);

-- RLS policies: sections (read all)
CREATE POLICY "sections_read_all" ON sections
  FOR SELECT USING (true);

-- RLS policies: subjects (read all)
CREATE POLICY "subjects_read_all" ON subjects
  FOR SELECT USING (true);

-- RLS policies: teaching_assignments
CREATE POLICY "teaching_assignments_own" ON teaching_assignments
  FOR SELECT USING (auth.uid() = teacher_id OR is_admin());

-- RLS policies: enrollments
CREATE POLICY "enrollments_own_or_teacher" ON enrollments
  FOR SELECT USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM teaching_assignments ta
      JOIN sections s ON s.id = ta.section_id
      WHERE ta.teacher_id = auth.uid() AND s.id = enrollments.section_id
    )
    OR is_admin()
  );

-- RLS policies: assignments
CREATE POLICY "assignments_read_targeted" ON assignments
  FOR SELECT USING (
    is_admin()
    OR auth.uid() = teacher_id
    OR EXISTS (
      SELECT 1 FROM assignment_students as2
      WHERE as2.assignment_id = assignments.id AND as2.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM assignment_sections ase
      JOIN sections s ON s.id = ase.section_id
      JOIN enrollments e ON e.section_id = s.id
      WHERE ase.assignment_id = assignments.id
        AND e.student_id = auth.uid()
        AND e.academic_year IS NOT NULL
    )
  );

CREATE POLICY "assignments_teacher_insert" ON assignments
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "assignments_teacher_update" ON assignments
  FOR UPDATE USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Admin read-only: no insert/update/delete on assignments
CREATE POLICY "assignments_admin_read_only" ON assignments
  FOR ALL USING (false);

-- RLS policies: assignment_sections
CREATE POLICY "assignment_sections_read" ON assignment_sections
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM assignments a WHERE a.id = assignment_sections.assignment_id AND a.teacher_id = auth.uid()
    )
  );

-- RLS policies: assignment_students
CREATE POLICY "assignment_students_read" ON assignment_students
  FOR SELECT USING (
    is_admin()
    OR auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM assignments a WHERE a.id = assignment_students.assignment_id AND a.teacher_id = auth.uid()
    )
  );

-- RLS policies: submissions
CREATE POLICY "submissions_own_or_teacher_or_admin" ON submissions
  FOR SELECT USING (
    auth.uid() = student_id
    OR EXISTS (
      SELECT 1 FROM assignments a WHERE a.id = submissions.assignment_id AND a.teacher_id = auth.uid()
    )
    OR is_admin()
  );

CREATE POLICY "submissions_student_insert" ON submissions
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM assignment_students as2
      WHERE as2.assignment_id = submissions.assignment_id AND as2.student_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM assignment_sections ase
      JOIN sections s ON s.id = ase.section_id
      JOIN enrollments e ON e.section_id = s.id
      WHERE ase.assignment_id = submissions.assignment_id
        AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "submissions_teacher_update" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assignments a WHERE a.id = submissions.assignment_id AND a.teacher_id = auth.uid()
    )
  );

-- Admin read-only on submissions
CREATE POLICY "submissions_admin_read_only" ON submissions
  FOR ALL USING (false);

-- RLS policies: threads
CREATE POLICY "threads_participant" ON threads
  FOR SELECT USING (is_thread_participant(id) OR is_admin());

CREATE POLICY "threads_teacher_insert" ON threads
  FOR INSERT WITH CHECK (
    auth.uid() = teacher_id
    AND EXISTS (
      SELECT 1 FROM teaching_assignments ta
      JOIN enrollments e ON e.section_id = ta.section_id
      WHERE ta.teacher_id = auth.uid() AND e.student_id = student_id
    )
  );

CREATE POLICY "threads_admin_read_only" ON threads
  FOR ALL USING (false);

-- RLS policies: messages
CREATE POLICY "messages_participant" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM threads t WHERE t.id = messages.thread_id
        AND (t.teacher_id = auth.uid() OR t.student_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "messages_participant_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM threads t WHERE t.id = messages.thread_id
        AND (t.teacher_id = auth.uid() OR t.student_id = auth.uid())
    )
  );

-- Admin read-only on messages
CREATE POLICY "messages_admin_read_only" ON messages
  FOR ALL USING (false);

-- RLS policies: notices
CREATE POLICY "notices_read_addressed" ON notices
  FOR SELECT USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM notice_recipients nr
      WHERE nr.notice_id = notices.id AND nr.user_id = auth.uid()
    )
  );

CREATE POLICY "notices_admin_insert" ON notices
  FOR INSERT WITH CHECK (auth.uid() = created_by AND is_admin());

-- Admin read-only on notices (no update/delete)
CREATE POLICY "notices_admin_read_only" ON notices
  FOR ALL USING (false);

-- RLS policies: notice_recipients
CREATE POLICY "notice_recipients_own" ON notice_recipients
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "notice_recipients_own_update" ON notice_recipients
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies: push_tokens
CREATE POLICY "push_tokens_own" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies: notification_jobs
CREATE POLICY "notification_jobs_own" ON notification_jobs
  FOR SELECT USING (auth.uid() = recipient_id OR is_admin());

-- RLS policies: audit_log
CREATE POLICY "audit_log_admin_select" ON audit_log
  FOR SELECT USING (is_admin());

CREATE POLICY "audit_log_service_insert" ON audit_log
  FOR INSERT WITH CHECK (true);

-- Views
CREATE OR REPLACE VIEW assignment_recipients AS
WITH section_students AS (
  SELECT DISTINCT e.student_id
  FROM assignment_sections ase
  JOIN sections s ON s.id = ase.section_id
  JOIN enrollments e ON e.section_id = s.id
  JOIN profiles p ON p.id = e.student_id
  WHERE p.is_active
),
individual_students AS (
  SELECT DISTINCT student_id
  FROM assignment_students as2
  JOIN profiles p ON p.id = as2.student_id
  WHERE p.is_active
)
SELECT student_id FROM section_students
UNION
SELECT student_id FROM individual_students;

CREATE OR REPLACE VIEW unread_counts AS
SELECT
  u.id as user_id,
  COUNT(DISTINCT nr.notice_id) FILTER (WHERE nr.read_at IS NULL) as unread_notices,
  COUNT(DISTINCT m.id) FILTER (WHERE m.created_at > (
    SELECT max(m2.created_at) FROM messages m2
    JOIN threads t2 ON t2.id = m2.thread_id
    WHERE t2.id = m.thread_id AND (t2.teacher_id = u.id OR t2.student_id = u.id)
  )) as unread_messages
FROM profiles u
LEFT JOIN notice_recipients nr ON nr.user_id = u.id AND nr.read_at IS NULL
LEFT JOIN messages m ON TRUE
LEFT JOIN threads t ON t.id = m.thread_id AND (t.teacher_id = u.id OR t.student_id = u.id)
GROUP BY u.id;

ALTER VIEW assignment_recipients SET (security_invoker = true);
ALTER VIEW unread_counts SET (security_invoker = true);
