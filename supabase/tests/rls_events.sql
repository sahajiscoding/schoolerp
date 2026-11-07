-- Events live-wiring RLS/RPC regressions.
-- Run after migrations with: supabase test db
\set ON_ERROR_STOP on

BEGIN;
SELECT plan(14);

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000000901'),
  ('00000000-0000-0000-0000-000000000902'),
  ('00000000-0000-0000-0000-000000000903'),
  ('00000000-0000-0000-0000-000000000904');

INSERT INTO profiles (id, role, full_name, login_id, is_active) VALUES
  ('00000000-0000-0000-0000-000000000901', 'admin', 'Events Admin', 'EVT_ADMIN_0009', true),
  ('00000000-0000-0000-0000-000000000902', 'teacher', 'Events Teacher', 'EVT_TEACHER_0009', true),
  ('00000000-0000-0000-0000-000000000903', 'student', 'Events Student A', 'EVT_STUDENT_A_0009', true),
  ('00000000-0000-0000-0000-000000000904', 'student', 'Events Student B', 'EVT_STUDENT_B_0009', true);

INSERT INTO classes (id, name, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000911', 'IX', 9);
INSERT INTO sections (id, class_id, name, academic_year, class_teacher_id) VALUES
  ('00000000-0000-0000-0000-000000000921', '00000000-0000-0000-0000-000000000911', 'A', '2026-27', '00000000-0000-0000-0000-000000000902'),
  ('00000000-0000-0000-0000-000000000922', '00000000-0000-0000-0000-000000000911', 'B', '2026-27', NULL);
INSERT INTO subjects (id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000931', 'Events Math', 'EVT_MATH_0009');
INSERT INTO teaching_assignments (teacher_id, section_id, subject_id) VALUES
  ('00000000-0000-0000-0000-000000000902', '00000000-0000-0000-0000-000000000921', '00000000-0000-0000-0000-000000000931');
INSERT INTO enrollments (student_id, section_id, roll_no, academic_year) VALUES
  ('00000000-0000-0000-0000-000000000903', '00000000-0000-0000-0000-000000000921', 'EVT-A', '2026-27'),
  ('00000000-0000-0000-0000-000000000904', '00000000-0000-0000-0000-000000000922', 'EVT-B', '2026-27');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000902"}', true);

SELECT lives_ok(
  $$SELECT public.event_publish(
    'Half-Yearly Exams',
    'Year 9 half-yearly examinations',
    '2026-11-14'::date,
    '2026-11-14'::date,
    'Exam',
    ARRAY['00000000-0000-0000-0000-000000000921'::uuid],
    'Class only'
  )$$,
  'teacher publishes class event to taught section'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000904"}', true);
SELECT throws_ok(
  $$SELECT public.event_publish(
    'Forged Event',
    'Should not be allowed',
    '2026-11-15'::date,
    '2026-11-15'::date,
    'Exam',
    ARRAY['00000000-0000-0000-0000-000000000921'::uuid],
    'Class only'
  )$$,
  '42501', NULL, 'student cannot publish events'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000903"}', true);
SELECT is(
  (SELECT count(*)::integer FROM school_events WHERE title = 'Half-Yearly Exams'),
  1,
  'targeted student reads class event'
);

SELECT is(
  (SELECT count(*)::integer FROM school_events WHERE title = 'Half-Yearly Exams' AND section_ids @> ARRAY['00000000-0000-0000-0000-000000000922'::uuid]),
  0,
  'student outside section does not see event'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000901"}', true);
SELECT lives_ok(
  $$SELECT public.event_publish(
    'Sports Day',
    'Annual sports day for all students',
    '2026-11-21'::date,
    '2026-11-21'::date,
    'Sports',
    NULL,
    'Whole school'
  )$$,
  'admin publishes whole-school event'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000904"}', true);
SELECT is(
  (SELECT count(*)::integer FROM school_events WHERE title = 'Sports Day'),
  1,
  'any student reads whole-school event'
);

SELECT throws_ok(
  $$SELECT public.event_publish(
    'Admin Event',
    'Admin should not publish academic events',
    '2026-11-15'::date,
    '2026-11-15'::date,
    'Exam',
    ARRAY['00000000-0000-0000-0000-000000000921'::uuid],
    'Class only'
  )$$,
  '42501', NULL, 'admin cannot publish class-scoped academic event'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;