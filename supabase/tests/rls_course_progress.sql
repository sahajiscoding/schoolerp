-- Course progress live-wiring RLS/RPC regressions.
-- Run after migrations with: supabase test db
\set ON_ERROR_STOP on

BEGIN;
SELECT plan(16);

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000000A01'),
  ('00000000-0000-0000-0000-000000000A02'),
  ('00000000-0000-0000-0000-000000000A03'),
  ('00000000-0000-0000-0000-000000000A04');

INSERT INTO profiles (id, role, full_name, login_id, is_active) VALUES
  ('00000000-0000-0000-0000-000000000A01', 'admin', 'Course Admin', 'CRS_ADMIN_000A', true),
  ('00000000-0000-0000-0000-000000000A02', 'teacher', 'Course Teacher', 'CRS_TEACHER_000A', true),
  ('00000000-0000-0000-0000-000000000A03', 'student', 'Course Student A', 'CRS_STUDENT_A_000A', true),
  ('00000000-0000-0000-0000-000000000A04', 'student', 'Course Student B', 'CRS_STUDENT_B_000A', true);

INSERT INTO classes (id, name, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000A11', 'IX', 9);
INSERT INTO sections (id, class_id, name, academic_year, class_teacher_id) VALUES
  ('00000000-0000-0000-0000-000000000A21', '00000000-0000-0000-0000-000000000A11', 'A', '2026-27', '00000000-0000-0000-0000-000000000A02'),
  ('00000000-0000-0000-0000-000000000A22', '00000000-0000-0000-0000-000000000A11', 'B', '2026-27', NULL);
INSERT INTO subjects (id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000A31', 'Course Math', 'CRS_MATH_000A');
INSERT INTO teaching_assignments (teacher_id, section_id, subject_id) VALUES
  ('00000000-0000-0000-0000-000000000A02', '00000000-0000-0000-0000-000000000A21', '00000000-0000-0000-0000-000000000A31');
INSERT INTO enrollments (student_id, section_id, roll_no, academic_year) VALUES
  ('00000000-0000-0000-0000-000000000A03', '00000000-0000-0000-0000-000000000A21', 'CRS-A', '2026-27'),
  ('00000000-0000-0000-0000-000000000A04', '00000000-0000-0000-0000-000000000A22', 'CRS-B', '2026-27');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000A02"}', true);

SELECT lives_ok(
  $$SELECT public.goal_add(
    '00000000-0000-0000-0000-000000000A03',
    '00000000-0000-0000-0000-000000000A31',
    'Polynomials and quadratic equations',
    'Strong problem-solving. Keep practising word problems.',
    85,
    'A1',
    NULL,
    NULL
  )$$,
  'teacher adds course goal for own section student'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000A04"}', true);
SELECT throws_ok(
  $$SELECT public.goal_add(
    '00000000-0000-0000-0000-000000000A03',
    '00000000-0000-0000-0000-000000000A31',
    'Forged goal',
    'Should not be allowed',
    50,
    'B',
    NULL,
    NULL
  )$$,
  '42501', NULL, 'teacher cannot add goal for foreign section student'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000A03"}', true);
SELECT is(
  (SELECT count(*)::integer FROM course_goals WHERE student_id = '00000000-0000-0000-0000-000000000A03'),
  1,
  'student reads own course goals'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000A04"}', true);
SELECT is(
  (SELECT count(*)::integer FROM course_goals WHERE student_id = '00000000-0000-0000-0000-000000000A03'),
  0,
  'student cannot read peer course goals'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000A02"}', true);
SELECT lives_ok(
  $$SELECT public.goal_update(
    (SELECT id FROM course_goals WHERE student_id = '00000000-0000-0000-0000-000000000A03' LIMIT 1),
    90,
    'A1',
    'Excellent progress'
  )$$,
  'teacher updates own section student goal'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000A04"}', true);
SELECT throws_ok(
  $$SELECT public.goal_update(
    (SELECT id FROM course_goals WHERE student_id = '00000000-0000-0000-0000-000000000A03' LIMIT 1),
    30,
    'F',
    'Forged update'
  )$$,
  '42501', NULL, 'teacher cannot update foreign section student goal'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;