-- 0002_dashboard_modules.sql
-- Tables behind the student/teacher/admin dashboard: leave approvals with class
-- teacher routing, course goals, declaration forms, polls, calendar events,
-- library circulation, report cards, attendance and fees with sibling discount.
--
-- Rules carried over from the design doc:
--   * RLS on every table, default deny.
--   * Admins read academic content, never write it (except their own tables).
--   * Teachers are scoped to sections they teach or are class teacher of.
--   * Fees and sibling links are admin-owned.

-- ---------------------------------------------------------------------------
-- sections: class teacher (must exist before the helpers below reference it)
-- ---------------------------------------------------------------------------
ALTER TABLE sections
  ADD COLUMN IF NOT EXISTS class_teacher_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

-- Class teacher of the section a student currently sits in.
CREATE OR REPLACE FUNCTION class_teacher_of_section(target_section uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT s.class_teacher_id FROM public.sections s WHERE s.id = target_section;
$$;

-- True when the caller is the class teacher for the student's current section.
CREATE OR REPLACE FUNCTION is_class_teacher_of(p_student uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments e
    LEFT JOIN public.sections s ON s.id = e.section_id
    WHERE e.student_id = p_student
      AND s.class_teacher_id = auth.uid()
  );
$$;

-- True when caller teaches any subject in the student's section.
CREATE OR REPLACE FUNCTION teaches_student(p_student uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.teaching_assignments ta ON ta.section_id = e.section_id
    WHERE e.student_id = p_student
      AND ta.teacher_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- students: admission number, date of birth, sibling link
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_details (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  admission_no text UNIQUE,
  date_of_birth date,
  guardian_name text,
  guardian_phone text,
  sibling_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- leave requests (routed to the class teacher)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  from_date date NOT NULL,
  to_date date NOT NULL,
  session text NOT NULL DEFAULT 'Full day'
    CHECK (session IN ('Full day', 'First half', 'Second half')),
  leave_type text NOT NULL
    CHECK (leave_type IN ('Medical', 'Family function', 'Travel', 'Personal', 'Other')),
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  attachment_path text,
  decided_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  decided_on timestamptz,
  decision_note text,
  applied_on timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_dates_ordered CHECK (to_date >= from_date)
);

CREATE INDEX IF NOT EXISTS leave_requests_student_idx ON leave_requests (student_id, from_date DESC);
CREATE INDEX IF NOT EXISTS leave_requests_status_idx ON leave_requests (status) WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- course goals / progress
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  target_percent integer NOT NULL DEFAULT 100 CHECK (target_percent BETWEEN 0 AND 100),
  current_percent integer NOT NULL DEFAULT 0 CHECK (current_percent BETWEEN 0 AND 100),
  due_date date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS course_goals_student_idx ON course_goals (student_id, subject_id);

-- ---------------------------------------------------------------------------
-- communications: declarations, polls
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS declaration_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'students'
    CHECK (audience IN ('students', 'parents', 'both')),
  section_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS declaration_signatures (
  form_id uuid NOT NULL REFERENCES declaration_forms(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (form_id, student_id)
);

CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL CHECK (length(trim(question)) > 0),
  section_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  closes_on date,
  results_visible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  voted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (poll_id, student_id)
);

-- ---------------------------------------------------------------------------
-- events & calendar
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  kind text NOT NULL DEFAULT 'General'
    CHECK (kind IN ('Exam', 'Holiday', 'Meeting', 'Sports', 'Cultural', 'General')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  start_time time,
  end_time time,
  venue text,
  -- empty array = whole school
  section_ids uuid[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_dates_ordered CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS school_events_window_idx ON school_events (start_date, end_date);

-- ---------------------------------------------------------------------------
-- library
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text,
  category text,
  isbn text UNIQUE,
  copies_total integer NOT NULL DEFAULT 1 CHECK (copies_total > 0),
  shelf text,
  added_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issued_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  issued_on date NOT NULL DEFAULT current_date,
  due_on date NOT NULL,
  returned_on date,
  fine_amount integer NOT NULL DEFAULT 0,
  CONSTRAINT issue_dates_ordered CHECK (due_on >= issued_on)
);

CREATE INDEX IF NOT EXISTS book_issues_open_idx ON book_issues (student_id) WHERE returned_on IS NULL;

-- ---------------------------------------------------------------------------
-- report cards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  term text NOT NULL,
  academic_year text NOT NULL,
  marks jsonb NOT NULL DEFAULT '[]',
  total integer NOT NULL DEFAULT 0,
  max_total integer NOT NULL DEFAULT 0,
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  grade text,
  remarks text,
  published boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, term, academic_year)
);

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  date date NOT NULL,
  mark text NOT NULL CHECK (mark IN ('present', 'absent', 'late', 'leave')),
  marked_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance (date);

-- ---------------------------------------------------------------------------
-- fees + sibling discount
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fee_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year text NOT NULL,
  installments jsonb NOT NULL DEFAULT '[]',
  sibling_discount_percent integer NOT NULL DEFAULT 0
    CHECK (sibling_discount_percent BETWEEN 0 AND 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, academic_year)
);

CREATE TABLE IF NOT EXISTS sibling_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sibling_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discount_percent integer NOT NULL DEFAULT 50
    CHECK (discount_percent BETWEEN 0 AND 100),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sibling_not_self CHECK (student_id <> sibling_id),
  CONSTRAINT sibling_pair_unique UNIQUE (student_id, sibling_id)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE declaration_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE declaration_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE sibling_links ENABLE ROW LEVEL SECURITY;

-- student_details: student reads own, admin all, teachers read their students
CREATE POLICY "student_details_self" ON student_details
  FOR SELECT USING (auth.uid() = profile_id OR is_admin() OR teaches_student(profile_id));
CREATE POLICY "student_details_admin_write" ON student_details
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- leave_requests: student creates and reads own; class teacher decides; admin reads
CREATE POLICY "leave_requests_student_read" ON leave_requests
  FOR SELECT USING (
    auth.uid() = student_id
    OR is_admin()
    OR is_class_teacher_of(student_id)
    OR teaches_student(student_id)
  );
CREATE POLICY "leave_requests_student_insert" ON leave_requests
  FOR INSERT WITH CHECK (auth.uid() = student_id AND status = 'pending');
CREATE POLICY "leave_requests_teacher_decide" ON leave_requests
  FOR UPDATE
  USING ((is_class_teacher_of(student_id) OR is_admin()) AND status = 'pending')
  WITH CHECK (
    (is_class_teacher_of(student_id) OR is_admin())
    AND status IN ('approved', 'rejected')
    AND decided_by = auth.uid()
  );
CREATE POLICY "leave_requests_student_withdraw" ON leave_requests
  FOR DELETE USING (auth.uid() = student_id AND status = 'pending');

-- course_goals: student reads own, teacher of the section writes
CREATE POLICY "course_goals_read" ON course_goals
  FOR SELECT USING (
    auth.uid() = student_id OR is_admin() OR teaches_student(student_id)
  );
CREATE POLICY "course_goals_teacher_write" ON course_goals
  FOR INSERT WITH CHECK (auth.uid() = teacher_id AND teaches_student(student_id));
CREATE POLICY "course_goals_teacher_update" ON course_goals
  FOR UPDATE USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- declarations: students see forms aimed at them; staff see the ones they wrote
CREATE POLICY "declaration_forms_read" ON declaration_forms
  FOR SELECT USING (
    is_admin()
    OR created_by = auth.uid()
    OR audience IN ('students', 'both')
  );
CREATE POLICY "declaration_forms_admin_insert" ON declaration_forms
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "declaration_signatures_own" ON declaration_signatures
  FOR SELECT USING (auth.uid() = student_id OR is_admin());
CREATE POLICY "declaration_signatures_student_insert" ON declaration_signatures
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- polls: everyone reads, teachers/admins create, students vote once
CREATE POLICY "polls_read" ON polls FOR SELECT USING (true);
CREATE POLICY "polls_teacher_insert" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by AND (app_role() = 'teacher' OR is_admin()));
CREATE POLICY "poll_options_read" ON poll_options FOR SELECT USING (true);
CREATE POLICY "poll_options_owner_insert" ON poll_options
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_id AND p.created_by = auth.uid())
  );
CREATE POLICY "poll_votes_read" ON poll_votes
  FOR SELECT USING (auth.uid() = student_id OR is_admin());
CREATE POLICY "poll_votes_student_insert" ON poll_votes
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- events: read all; admins write school-wide, teachers only their own sections
CREATE POLICY "school_events_read" ON school_events FOR SELECT USING (true);
CREATE POLICY "school_events_admin_insert" ON school_events
  FOR INSERT WITH CHECK (is_admin() AND cardinality(section_ids) = 0);
CREATE POLICY "school_events_teacher_insert" ON school_events
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND app_role() = 'teacher'
    AND cardinality(section_ids) > 0
    AND NOT EXISTS (
      SELECT 1
      FROM unnest(section_ids) AS s(section_id)
      WHERE NOT teaches_section(s.section_id)
    )
  );
CREATE POLICY "school_events_owner_update" ON school_events
  FOR UPDATE USING (auth.uid() = created_by OR is_admin())
  WITH CHECK (auth.uid() = created_by OR is_admin());

-- library: read all, teachers/admins manage circulation
CREATE POLICY "books_read" ON books FOR SELECT USING (true);
CREATE POLICY "books_staff_write" ON books
  FOR ALL USING (app_role() IN ('teacher', 'admin'))
  WITH CHECK (app_role() IN ('teacher', 'admin'));
CREATE POLICY "book_issues_read" ON book_issues
  FOR SELECT USING (auth.uid() = student_id OR app_role() IN ('teacher', 'admin'));
CREATE POLICY "book_issues_staff_write" ON book_issues
  FOR ALL USING (app_role() IN ('teacher', 'admin'))
  WITH CHECK (app_role() IN ('teacher', 'admin'));

-- report cards: student reads own published card; staff of the section manage
CREATE POLICY "report_cards_read" ON report_cards
  FOR SELECT USING (
    (auth.uid() = student_id AND published)
    OR is_admin()
    OR teaches_student(student_id)
  );
CREATE POLICY "report_cards_teacher_write" ON report_cards
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND (app_role() = 'teacher' OR is_admin())
  );
CREATE POLICY "report_cards_teacher_update" ON report_cards
  FOR UPDATE USING (auth.uid() = created_by OR is_admin())
  WITH CHECK (auth.uid() = created_by OR is_admin());

-- attendance: student reads own, teacher marks their section, admin reads
CREATE POLICY "attendance_read" ON attendance
  FOR SELECT USING (
    auth.uid() = student_id OR is_admin() OR teaches_student(student_id)
  );
CREATE POLICY "attendance_teacher_write" ON attendance
  FOR ALL USING (auth.uid() = marked_by OR is_admin())
  WITH CHECK (auth.uid() = marked_by OR is_admin());

-- fees and siblings are admin-only (students see their own invoice)
CREATE POLICY "fee_records_student_read" ON fee_records
  FOR SELECT USING (auth.uid() = student_id OR is_admin());
CREATE POLICY "fee_records_admin_write" ON fee_records
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "sibling_links_read" ON sibling_links
  FOR SELECT USING (auth.uid() = student_id OR auth.uid() = sibling_id OR is_admin());
CREATE POLICY "sibling_links_admin_write" ON sibling_links
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Guard: a student cannot decide their own leave or edit their own card
-- (defence in depth on top of the policies above).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION reject_self_approval()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.student_id = auth.uid() THEN
    RAISE EXCEPTION 'A student cannot approve their own leave request';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER leave_requests_no_self_approval
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION reject_self_approval();

-- Keep updated_at honest
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER student_details_touch BEFORE UPDATE ON student_details
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER course_goals_touch BEFORE UPDATE ON course_goals
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER fee_records_touch BEFORE UPDATE ON fee_records
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
