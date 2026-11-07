-- Approvals live-wiring RLS/RPC regressions.
-- Run after migrations with: supabase test db
\set ON_ERROR_STOP on

BEGIN;
SELECT plan(18);

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000000801'),
  ('00000000-0000-0000-0000-000000000802'),
  ('00000000-0000-0000-0000-000000000803'),
  ('00000000-0000-0000-0000-000000000804');

INSERT INTO profiles (id, role, full_name, login_id, is_active) VALUES
  ('00000000-0000-0000-0000-000000000801', 'admin', 'Approvals Admin', 'APP_ADMIN_0008', true),
  ('00000000-0000-0000-0000-000000000802', 'teacher', 'Approvals Teacher', 'APP_TEACHER_0008', true),
  ('00000000-0000-0000-0000-000000000803', 'student', 'Approvals Student A', 'APP_STUDENT_A_0008', true),
  ('00000000-0000-0000-0000-000000000804', 'student', 'Approvals Student B', 'APP_STUDENT_B_0008', true);

INSERT INTO classes (id, name, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000811', 'IX', 9);
INSERT INTO sections (id, class_id, name, academic_year, class_teacher_id) VALUES
  ('00000000-0000-0000-0000-000000000821', '00000000-0000-0000-0000-000000000811', 'A', '2026-27', '00000000-0000-0000-0000-000000000802'),
  ('00000000-0000-0000-0000-000000000822', '00000000-0000-0000-0000-000000000811', 'B', '2026-27', NULL);
INSERT INTO subjects (id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000831', 'Approvals Math', 'APP_MATH_0008');
INSERT INTO teaching_assignments (teacher_id, section_id, subject_id) VALUES
  ('00000000-0000-0000-0000-000000000802', '00000000-0000-0000-0000-000000000821', '00000000-0000-0000-0000-000000000831');
INSERT INTO enrollments (student_id, section_id, roll_no, academic_year) VALUES
  ('00000000-0000-0000-0000-000000000803', '00000000-0000-0000-0000-000000000821', 'APP-A', '2026-27'),
  ('00000000-0000-0000-0000-000000000804', '00000000-0000-0000-0000-000000000822', 'APP-B', '2026-27');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000802"}', true);

SELECT lives_ok(
  $$SELECT public.leave_apply(
    '00000000-0000-0000-0000-000000000803',
    '00000000-0000-0000-0000-000000000821',
    '2026-11-12'::date,
    '2026-11-13'::date,
    'Full day',
    'Medical',
    'Fever and sore throat',
    NULL
  )$$,
  'student applies for own leave'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000804"}', true);
SELECT throws_ok(
  $$SELECT public.leave_apply(
    '00000000-0000-0000-0000-000000000803',
    '00000000-0000-0000-0000-000000000821',
    '2026-11-12'::date,
    '2026-11-13'::date,
    'Full day',
    'Medical',
    'Forged leave',
    NULL
  )$$,
  '42501', NULL, 'student cannot apply for peer leave'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000802"}', true);
SELECT lives_ok(
  $$SELECT public.leave_review(
    (SELECT id FROM leave_requests WHERE student_id = '00000000-0000-0000-0000-000000000803' AND status = 'pending' LIMIT 1),
    'approved',
    'Doctor advised rest'
  )$$,
  'class teacher approves own section leave'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000804"}', true);
SELECT throws_ok(
  $$SELECT public.leave_review(
    (SELECT id FROM leave_requests WHERE student_id = '00000000-0000-0000-0000-000000000803' AND status = 'pending' LIMIT 1),
    'approved',
    'Forged approval'
  )$$,
  '42501', NULL, 'student cannot review leave'
);

SELECT throws_ok(
  $$SELECT public.leave_review(
    (SELECT id FROM leave_requests WHERE student_id = '00000000-0000-0000-0000-000000000803' AND status = 'approved' LIMIT 1),
    'rejected',
    'Double-decide'
  )$$,
  '22023', NULL, 'cannot review already-decided leave'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000803"}', true);
SELECT is(
  (SELECT count(*)::integer FROM leave_requests WHERE student_id = '00000000-0000-0000-0000-000000000803'),
  1,
  'student reads own leave requests'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000804"}', true);
SELECT is(
  (SELECT count(*)::integer FROM leave_requests WHERE student_id = '00000000-0000-0000-0000-000000000803'),
  0,
  'student cannot read peer leave requests'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000801"}', true);
SELECT is(
  (SELECT count(*)::integer FROM leave_requests),
  1,
  'admin reads all leave requests'
);

SELECT throws_ok(
  $$SELECT public.leave_apply(
    '00000000-0000-0000-0000-000000000803',
    '00000000-0000-0000-0000-000000000822',
    '2026-11-14'::date,
    '2026-11-15'::date,
    'Full day',
    'Medical',
    'Wrong section',
    NULL
  )$$,
  '42501', NULL, 'student applies to foreign section blocked'
);

SELECT * FROM finish();
ROLLBACK;