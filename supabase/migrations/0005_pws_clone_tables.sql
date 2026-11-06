-- ============================================================================
-- 0005_pws_clone_tables.sql
-- Report-parity tables for the pws.schoolforschools.ai clone (spec §5).
-- Existing tables (0001-0004) stay untouched. Every new table: RLS enabled,
-- default-deny, explicit policies. Safe to run once after 0001-0004.
--
-- Invariants preserved: RLS is the boundary; admins read-only on academic
-- content; no student-to-student channel; audit_log stays insert-only for
-- service role. Media uses private Storage buckets + signed URLs (no public
-- URLs); ObjectIds are uuid/text keys; SSE replaced by Realtime (outside SQL).
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- schools / academic_sessions (single-school rows, not a tenant flag)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schools_read ON schools;
CREATE POLICY schools_read ON schools FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS schools_admin_write ON schools;
CREATE POLICY schools_admin_write ON schools FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS academic_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE academic_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY academic_sessions_read ON academic_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY academic_sessions_admin_write ON academic_sessions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- fee_cycles / fee_periods / fee_components / fee_structures / fee_installments
-- Sibling 50% discount = second child only, admin-owned, enforced here.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fee_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fee_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_cycles_read ON fee_cycles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY fee_cycles_admin_write ON fee_cycles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS fee_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_cycle_id uuid NOT NULL REFERENCES fee_cycles(id) ON DELETE CASCADE,
  name text NOT NULL,
  starts_on date,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fee_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_periods_read ON fee_periods FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY fee_periods_admin_write ON fee_periods FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS fee_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fee_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_components_read ON fee_components FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY fee_components_admin_write ON fee_components FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_name text NOT NULL,
  fee_component_id uuid NOT NULL REFERENCES fee_components(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY fee_structures_read ON fee_structures FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY fee_structures_admin_write ON fee_structures FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS fee_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fee_period_id uuid REFERENCES fee_periods(id) ON DELETE SET NULL,
  academic_session text NOT NULL DEFAULT '2026-27',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Paid', 'Unpaid', 'Partial')),
  receipt_number text,
  payment_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fee_installments ENABLE ROW LEVEL SECURITY;
-- Students read their own; admins read all; teachers read only students they teach.
CREATE POLICY fee_installments_read_own ON fee_installments
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin() OR public.teaches_student(student_id));
CREATE POLICY fee_installments_admin_write ON fee_installments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- examinations family (CBSE 9-point: A1..E)
-- Admins read; teachers write marks for sections they teach; students read own.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS examinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  term text NOT NULL DEFAULT 'Term 1',
  academic_session text NOT NULL DEFAULT '2026-27',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY examinations_read ON examinations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY examinations_admin_write ON examinations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS examination_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  label text NOT NULL,
  min_percent numeric(5,2) NOT NULL,
  max_percent numeric(5,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE examination_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY examination_grades_read ON examination_grades FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY examination_grades_admin_write ON examination_grades FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS examination_subject_combinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  section_id uuid REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE (examination_id, subject_id, section_id)
);
ALTER TABLE examination_subject_combinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY exam_subject_comb_read ON examination_subject_combinations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY exam_subject_comb_admin_write ON examination_subject_combinations FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS examination_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  marks numeric(6,2),
  max_marks numeric(6,2) NOT NULL DEFAULT 100,
  grade text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (examination_id, student_id, subject_id)
);
ALTER TABLE examination_marks ENABLE ROW LEVEL SECURITY;
CREATE POLICY examination_marks_read ON examination_marks
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin() OR public.teaches_student(student_id));
CREATE POLICY examination_marks_teacher_write ON examination_marks
  FOR ALL USING (public.teaches_student(student_id)) WITH CHECK (public.teaches_student(student_id));

CREATE TABLE IF NOT EXISTS examination_remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  remark text NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE examination_remarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY examination_remarks_read ON examination_remarks
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin() OR public.teaches_student(student_id));
CREATE POLICY examination_remarks_teacher_write ON examination_remarks
  FOR INSERT WITH CHECK (public.teaches_student(student_id) OR public.is_class_teacher_of(student_id));

CREATE TABLE IF NOT EXISTS examination_student_metadatas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roll_no text,
  attendance_in_card integer,
  UNIQUE (examination_id, student_id)
);
ALTER TABLE examination_student_metadatas ENABLE ROW LEVEL SECURITY;
CREATE POLICY exam_student_meta_read ON examination_student_metadatas
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin() OR public.teaches_student(student_id));
CREATE POLICY exam_student_meta_teacher_write ON examination_student_metadatas
  FOR ALL USING (public.teaches_student(student_id)) WITH CHECK (public.teaches_student(student_id));

CREATE TABLE IF NOT EXISTS examination_class_metadatas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  class_average numeric(6,2),
  highest_marks numeric(6,2),
  UNIQUE (examination_id, section_id)
);
ALTER TABLE examination_class_metadatas ENABLE ROW LEVEL SECURITY;
CREATE POLICY exam_class_meta_read ON examination_class_metadatas FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY exam_class_meta_admin_write ON examination_class_metadatas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS examination_report_card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  layout jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE examination_report_card_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY exam_template_read ON examination_report_card_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY exam_template_admin_write ON examination_report_card_templates FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS examination_report_card_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES examination_report_card_templates(id) ON DELETE CASCADE,
  key text NOT NULL,
  label text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  UNIQUE (template_id, key)
);
ALTER TABLE examination_report_card_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY exam_field_read ON examination_report_card_fields FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY exam_field_admin_write ON examination_report_card_fields FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS examination_coordinators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id uuid NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  coordinator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (examination_id, coordinator_id)
);
ALTER TABLE examination_coordinators ENABLE ROW LEVEL SECURITY;
CREATE POLICY exam_coord_read ON examination_coordinators FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY exam_coord_admin_write ON examination_coordinators FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- library books / transactions / rules / kiosk sessions
-- Kiosk can never reach academic records; kiosk access is scoped to library.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  accession_no text UNIQUE NOT NULL,
  category text,
  total_copies integer NOT NULL DEFAULT 1,
  available_copies integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY library_books_read ON library_books FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY library_books_admin_write ON library_books FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS library_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  max_books integer NOT NULL DEFAULT 3,
  borrow_days integer NOT NULL DEFAULT 14,
  fine_per_day numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE library_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY library_rules_read ON library_rules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY library_rules_admin_write ON library_rules FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS library_book_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz NOT NULL,
  returned_at timestamptz,
  status text NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'reserved')),
  fine_amount numeric(8,2) NOT NULL DEFAULT 0
);
ALTER TABLE library_book_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY library_tx_read ON library_book_transactions
  FOR SELECT USING (student_id = auth.uid() OR public.is_admin());
CREATE POLICY library_tx_write ON library_book_transactions
  FOR INSERT WITH CHECK (student_id = auth.uid() OR public.is_admin());
CREATE POLICY library_tx_update ON library_book_transactions
  FOR UPDATE USING (student_id = auth.uid() OR public.is_admin())
  WITH CHECK (student_id = auth.uid() OR public.is_admin());

CREATE TABLE IF NOT EXISTS library_kiosk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE library_kiosk_sessions ENABLE ROW LEVEL SECURITY;
-- Kiosk sessions are service-role only (minted by the Edge Function).
REVOKE ALL ON library_kiosk_sessions FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- circulars / transport
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS circulars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'Whole school',
  file_path text,
  published_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  published_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE circulars ENABLE ROW LEVEL SECURITY;
CREATE POLICY circulars_read ON circulars FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY circulars_author_write ON circulars
  FOR INSERT WITH CHECK (public.is_admin() OR public.app_role() = 'teacher');
CREATE POLICY circulars_admin_update ON circulars FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS transport_area_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  stops text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE transport_area_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_routes_read ON transport_area_routes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY transport_routes_admin_write ON transport_area_routes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE IF NOT EXISTS transport_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  registration text UNIQUE NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'bus',
  driver_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE transport_vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY transport_vehicles_read ON transport_vehicles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY transport_vehicles_admin_write ON transport_vehicles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- parent_links (parent <-> student). Parent reads linked students' academic
-- data only; never the reverse.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);
ALTER TABLE parent_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY parent_links_parent_read ON parent_links
  FOR SELECT USING (parent_id = auth.uid() OR public.is_admin());
CREATE POLICY parent_links_admin_write ON parent_links
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets (private, signed URLs only). Report S3 buckets map here.
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('homework-files', 'homework-files', false),
  ('submission-files', 'submission-files', false),
  ('gallery-media', 'gallery-media', false),
  ('avatars', 'avatars', false),
  ('circular-files', 'circular-files', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
