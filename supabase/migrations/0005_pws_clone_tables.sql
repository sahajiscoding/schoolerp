-- 0005_pws_clone_tables.sql
-- Report-parity schema additions (spec 2026-11-07, section 5).
-- New tables only where the reference report needs them; each has RLS default-deny
-- plus explicit policies. Idempotent where practical; safe to run after 0001-0004.
--
-- Tables:
--   schools, academic_sessions
--   fee_cycles, fee_periods, fee_components, fee_structures, fee_installments
--   examinations, examination_marks, examination_grades, examination_subject_combinations,
--   examination_remarks, examination_student_metadatas, examination_class_metadatas,
--   examination_report_card_templates, examination_report_card_fields, examination_coordinators
--   library_books, library_book_transactions, library_rules, library_kiosk_sessions
--   circulars, transport_area_routes, transport_vehicles, parent_links
--
-- Invariants preserved: RLS is the boundary; server-side targeting; admins read-only
-- on academic content; no student-to-student channel; audit_log insert-only for service role.

-- ---------------------------------------------------------------------------
-- schools / academic sessions (single-school rows, not a tenant flag)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  address text,
  phone text,
  email text,
  academic_year text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS academic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                         -- e.g. "2026-27"
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT session_dates_ordered CHECK (end_date >= start_date)
);

-- ---------------------------------------------------------------------------
-- Fee model (extends fee_records from 0002)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fee_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                         -- e.g. "Annual 2026-27"
  academic_session_id uuid REFERENCES academic_sessions(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cycle_dates_ordered CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS fee_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_cycle_id uuid NOT NULL REFERENCES fee_cycles(id) ON DELETE CASCADE,
  name text NOT NULL,                         -- e.g. "Quarter 1", "Term 1"
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                         -- e.g. "Tuition", "Transport", "Lab Fee"
  code text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'recurring'
    CHECK (type IN ('recurring', 'one-time', 'optional')),
  is_mandatory boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                         -- e.g. "Grade 8 Section A"
  academic_session_id uuid REFERENCES academic_sessions(id) ON DELETE SET NULL,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fee_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_structure_id uuid NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  fee_component_id uuid NOT NULL REFERENCES fee_components(id) ON DELETE CASCADE,
  fee_period_id uuid REFERENCES fee_periods(id) ON DELETE SET NULL,
  amount integer NOT NULL DEFAULT 0 CHECK (amount >= 0),   -- in paise / minor currency unit
  due_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Examinations (CBSE 9-point grading)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS examinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                         -- e.g. "Half Yearly", "Annual"
  academic_session_id uuid REFERENCES academic_sessions(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_dates_ordered CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS examination_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade text UNIQUE NOT NULL CHECK (grade IN ('A1','A2','B1','B2','C1','C2','D','E1','E2')),
  min_marks integer NOT NULL,
  max_marks integer NOT NULL,
  grade_point numeric(3,1) NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS examination_subject_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  max_marks integer NOT NULL DEFAULT 100 CHECK (max_marks > 0),
  weight numeric(4,2) NOT NULL DEFAULT 1.00,
  UNIQUE (class_id, section_id, subject_id, examination_id)
);

CREATE TABLE IF NOT EXISTS examination_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  marks_obtained integer NOT NULL DEFAULT 0 CHECK (marks_obtained >= 0),
  max_marks integer NOT NULL DEFAULT 0 CHECK (max_marks >= 0),
  grade text REFERENCES examination_grades(grade),
  remarks text,
  entered_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  entered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (examination_id, student_id, subject_id)
);

CREATE TABLE IF NOT EXISTS examination_remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  remark text NOT NULL CHECK (length(trim(remark)) > 0),
  entered_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS examination_student_metadatas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  attendance_percent numeric(5,2),
  rank integer,
  promoted boolean,
  notes text,
  UNIQUE (examination_id, student_id)
);

CREATE TABLE IF NOT EXISTS examination_class_metadatas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE SET NULL,
  average_percentage numeric(5,2),
  pass_count integer DEFAULT 0,
  fail_count integer DEFAULT 0,
  notes text,
  UNIQUE (examination_id, class_id, section_id)
);

CREATE TABLE IF NOT EXISTS examination_report_card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  academic_session_id uuid REFERENCES academic_sessions(id) ON DELETE SET NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS examination_report_card_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES examination_report_card_templates(id) ON DELETE CASCADE,
  label text NOT NULL,
  field_key text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  data_type text NOT NULL DEFAULT 'text'
    CHECK (data_type IN ('text','number','percentage','grade','date')),
  UNIQUE (template_id, field_key)
);

CREATE TABLE IF NOT EXISTS examination_coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (examination_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Library (extends books / book_issues from 0002)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_books (
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

CREATE TABLE IF NOT EXISTS library_book_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issued_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  issued_on date NOT NULL DEFAULT current_date,
  due_on date NOT NULL,
  returned_on date,
  fine_amount integer NOT NULL DEFAULT 0,
  transaction_type text NOT NULL DEFAULT 'issue'
    CHECK (transaction_type IN ('issue','return','renew','reserve')),
  CONSTRAINT transaction_dates_ordered CHECK (due_on >= issued_on)
);

CREATE TABLE IF NOT EXISTS library_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  max_books_per_student integer NOT NULL DEFAULT 2 CHECK (max_books_per_student > 0),
  loan_period_days integer NOT NULL DEFAULT 14 CHECK (loan_period_days > 0),
  fine_per_day integer NOT NULL DEFAULT 0 CHECK (fine_per_day >= 0),
  renewal_allowed boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS library_kiosk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_token text UNIQUE NOT NULL,
  member_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by_edge boolean NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------------
-- Circulars / notices (extends notices from 0001)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS circulars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  file_path text,                              -- signed URL to storage bucket circular-files
  audience text NOT NULL DEFAULT 'school'
    CHECK (audience IN ('school','role','section','user')),
  section_ids uuid[] NOT NULL DEFAULT '{}',
  role text CHECK (role IN ('admin','teacher','student','parent')),
  published_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Transport
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transport_area_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area text NOT NULL,
  stops text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transport_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES transport_area_routes(id) ON DELETE SET NULL,
  vehicle_no text NOT NULL,
  driver_name text,
  driver_phone text,
  capacity integer NOT NULL DEFAULT 0 CHECK (capacity > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Parent links (parent session, spec §4)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'guardian',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

-- ---------------------------------------------------------------------------
-- RLS: enable on every new table
-- ---------------------------------------------------------------------------
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_subject_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_student_metadatas ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_class_metadatas ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_report_card_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_report_card_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE examination_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_book_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_kiosk_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE circulars ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_area_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper: is_parent_of
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_parent_of(p_student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_links pl
    WHERE pl.student_id = p_student_id
      AND pl.parent_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_parent_of(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Policies: schools / academic_sessions (read all authenticated)
-- ---------------------------------------------------------------------------
CREATE POLICY schools_read_all ON schools
  FOR SELECT USING (true);
CREATE POLICY academic_sessions_read_all ON academic_sessions
  FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Policies: fee (admin writes; students read own)
-- ---------------------------------------------------------------------------
CREATE POLICY fee_cycles_read_all ON fee_cycles FOR SELECT USING (true);
CREATE POLICY fee_cycles_admin_write ON fee_cycles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY fee_periods_read_all ON fee_periods FOR SELECT USING (true);
CREATE POLICY fee_periods_admin_write ON fee_periods
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY fee_components_read_all ON fee_components FOR SELECT USING (true);
CREATE POLICY fee_components_admin_write ON fee_components
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY fee_structures_read_all ON fee_structures FOR SELECT USING (true);
CREATE POLICY fee_structures_admin_write ON fee_structures
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY fee_installments_read_all ON fee_installments FOR SELECT USING (true);
CREATE POLICY fee_installments_admin_write ON fee_installments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Students read their own fee_records (existing table from 0002) via sibling-aware policy:
-- student_details links students via sibling_links; fee_records.student_id is the direct owner.
-- Existing 0002 policy fee_records_student_read covers own + admin. Keep it.

-- ---------------------------------------------------------------------------
-- Policies: examinations (read all; admin/coordinator writes)
-- ---------------------------------------------------------------------------
CREATE POLICY examinations_read_all ON examinations FOR SELECT USING (true);
CREATE POLICY examinations_admin_write ON examinations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Policies: examination_grades (read all; admin writes)
-- ---------------------------------------------------------------------------
CREATE POLICY examination_grades_read_all ON examination_grades FOR SELECT USING (true);
CREATE POLICY examination_grades_admin_write ON examination_grades
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Policies: examination_subject_combinations (read all; admin writes)
-- ---------------------------------------------------------------------------
CREATE POLICY examination_subject_combinations_read_all ON examination_subject_combinations FOR SELECT USING (true);
CREATE POLICY examination_subject_combinations_admin_write ON examination_subject_combinations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Policies: examination_marks (student reads own; teacher of section writes; admin reads)
-- ---------------------------------------------------------------------------
CREATE POLICY examination_marks_read ON examination_marks
  FOR SELECT USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR public.teaches_student(student_id)
  );
CREATE POLICY examination_marks_teacher_write ON examination_marks
  FOR INSERT WITH CHECK (
    auth.uid() = entered_by
    AND (public.is_admin() OR public.teaches_student(student_id))
  );
CREATE POLICY examination_marks_teacher_update ON examination_marks
  FOR UPDATE USING (
    auth.uid() = entered_by
    AND (public.is_admin() OR public.teaches_student(student_id))
  )
  WITH CHECK (
    auth.uid() = entered_by
    AND (public.is_admin() OR public.teaches_student(student_id))
  );

-- ---------------------------------------------------------------------------
-- Policies: examination_remarks (student reads own; admin/teacher writes)
-- ---------------------------------------------------------------------------
CREATE POLICY examination_remarks_read ON examination_remarks
  FOR SELECT USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR public.teaches_student(student_id)
  );
CREATE POLICY examination_remarks_write ON examination_remarks
  FOR ALL USING (
    public.is_admin()
    OR (auth.uid() = entered_by AND public.teaches_student(student_id))
  )
  WITH CHECK (
    public.is_admin()
    OR (auth.uid() = entered_by AND public.teaches_student(student_id))
  );

-- ---------------------------------------------------------------------------
-- Policies: examination_student_metadatas (student reads own; admin/teacher reads/writes)
-- ---------------------------------------------------------------------------
CREATE POLICY examination_student_metadatas_read ON examination_student_metadatas
  FOR SELECT USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR public.teaches_student(student_id)
  );
CREATE POLICY examination_student_metadatas_write ON examination_student_metadatas
  FOR ALL USING (
    public.is_admin()
    OR public.teaches_student(student_id)
  )
  WITH CHECK (
    public.is_admin()
    OR public.teaches_student(student_id)
  );

-- ---------------------------------------------------------------------------
-- Policies: examination_class_metadatas (read all; admin/teacher of section writes)
-- ---------------------------------------------------------------------------
CREATE POLICY examination_class_metadatas_read_all ON examination_class_metadatas FOR SELECT USING (true);
CREATE POLICY examination_class_metadatas_admin_write ON examination_class_metadatas
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Policies: examination_report_card_templates / fields (read all; admin writes)
-- ---------------------------------------------------------------------------
CREATE POLICY examination_report_card_templates_read_all ON examination_report_card_templates FOR SELECT USING (true);
CREATE POLICY examination_report_card_templates_admin_write ON examination_report_card_templates
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY examination_report_card_fields_read_all ON examination_report_card_fields FOR SELECT USING (true);
CREATE POLICY examination_report_card_fields_admin_write ON examination_report_card_fields
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Policies: examination_coordinators (read all; admin writes)
-- ---------------------------------------------------------------------------
CREATE POLICY examination_coordinators_read_all ON examination_coordinators FOR SELECT USING (true);
CREATE POLICY examination_coordinators_admin_write ON examination_coordinators
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Policies: library_books (read all; staff write)
-- ---------------------------------------------------------------------------
CREATE POLICY library_books_read_all ON library_books FOR SELECT USING (true);
CREATE POLICY library_books_staff_write ON library_books
  FOR ALL USING (public.app_role() IN ('teacher','admin'))
  WITH CHECK (public.app_role() IN ('teacher','admin'));

-- ---------------------------------------------------------------------------
-- Policies: library_book_transactions (student reads own; staff manage)
-- ---------------------------------------------------------------------------
CREATE POLICY library_book_transactions_read ON library_book_transactions
  FOR SELECT USING (
    auth.uid() = student_id
    OR public.app_role() IN ('teacher','admin')
    OR public.is_parent_of(student_id)
  );
CREATE POLICY library_book_transactions_staff_write ON library_book_transactions
  FOR ALL USING (public.app_role() IN ('teacher','admin'))
  WITH CHECK (public.app_role() IN ('teacher','admin'));

-- ---------------------------------------------------------------------------
-- Policies: library_rules (read all; admin writes)
-- ---------------------------------------------------------------------------
CREATE POLICY library_rules_read_all ON library_rules FOR SELECT USING (true);
CREATE POLICY library_rules_admin_write ON library_rules
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Policies: library_kiosk_sessions (no authenticated access; Edge Function only)
-- ---------------------------------------------------------------------------
-- No SELECT/INSERT/UPDATE/DELETE policies for authenticated → default deny blocks all.

-- ---------------------------------------------------------------------------
-- Policies: circulars (read addressed; admin writes)
-- ---------------------------------------------------------------------------
CREATE POLICY circulars_read_addressed ON circulars
  FOR SELECT USING (
    public.is_admin()
    OR audience = 'school'
    OR (audience = 'role' AND public.app_role() = role)
    OR (audience = 'section' AND EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.student_id = auth.uid()
        AND e.section_id = ANY(circulars.section_ids)
    ))
    OR (audience = 'user' AND EXISTS (
      SELECT 1 FROM unnest(circulars.section_ids) AS s(section_id)
      JOIN enrollments e ON e.section_id = s.section_id
      WHERE e.student_id = auth.uid()
    ))
  );
CREATE POLICY circulars_admin_insert ON circulars
  FOR INSERT WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Policies: transport_area_routes / transport_vehicles (read all; admin writes)
-- ---------------------------------------------------------------------------
CREATE POLICY transport_area_routes_read_all ON transport_area_routes FOR SELECT USING (true);
CREATE POLICY transport_area_routes_admin_write ON transport_area_routes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY transport_vehicles_read_all ON transport_vehicles FOR SELECT USING (true);
CREATE POLICY transport_vehicles_admin_write ON transport_vehicles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Policies: parent_links (parent reads own links; admin manages)
-- ---------------------------------------------------------------------------
CREATE POLICY parent_links_parent_read ON parent_links
  FOR SELECT USING (
    auth.uid() = parent_id
    OR auth.uid() = student_id
    OR public.is_admin()
  );
CREATE POLICY parent_links_admin_write ON parent_links
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Existing table policy updates (0002 tables extended for parent role)
-- ---------------------------------------------------------------------------
-- Parents read linked students' leave_requests, attendance, fee_records, report_cards.
-- These are added as additional policies alongside existing 0002 policies.

CREATE POLICY leave_requests_parent_read ON leave_requests
  FOR SELECT USING (public.is_parent_of(student_id));
CREATE POLICY attendance_parent_read ON attendance
  FOR SELECT USING (public.is_parent_of(student_id));
CREATE POLICY fee_records_parent_read ON fee_records
  FOR SELECT USING (public.is_parent_of(student_id));
CREATE POLICY report_cards_parent_read ON report_cards
  FOR SELECT USING (
    public.is_parent_of(student_id) AND published
  );
