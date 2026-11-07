-- Homeworks live-wiring RLS/RPC regressions.
-- Run after migrations with: supabase test db
\set ON_ERROR_STOP on

BEGIN;
SELECT plan(23);

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000000601'),
  ('00000000-0000-0000-0000-000000000602'),
  ('00000000-0000-0000-0000-000000000603'),
  ('00000000-0000-0000-0000-000000000604');

INSERT INTO profiles (id, role, full_name, login_id, is_active) VALUES
  ('00000000-0000-0000-0000-000000000601', 'admin', 'Homework Admin', 'HW_ADMIN_0006', true),
  ('00000000-0000-0000-0000-000000000602', 'teacher', 'Homework Teacher', 'HW_TEACHER_0006', true),
  ('00000000-0000-0000-0000-000000000603', 'student', 'Homework Student A', 'HW_STUDENT_A_0006', true),
  ('00000000-0000-0000-0000-000000000604', 'student', 'Homework Student B', 'HW_STUDENT_B_0006', true);

INSERT INTO classes (id, name, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000611', 'IX', 9);
INSERT INTO sections (id, class_id, name, academic_year) VALUES
  ('00000000-0000-0000-0000-000000000621', '00000000-0000-0000-0000-000000000611', 'A', '2026-27'),
  ('00000000-0000-0000-0000-000000000622', '00000000-0000-0000-0000-000000000611', 'B', '2026-27');
INSERT INTO subjects (id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000631', 'Homework Mathematics', 'HW_MATH_0006');
INSERT INTO teaching_assignments (teacher_id, section_id, subject_id) VALUES
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000621', '00000000-0000-0000-0000-000000000631');
INSERT INTO enrollments (student_id, section_id, roll_no, academic_year) VALUES
  ('00000000-0000-0000-0000-000000000603', '00000000-0000-0000-0000-000000000621', 'HW-A', '2026-27'),
  ('00000000-0000-0000-0000-000000000604', '00000000-0000-0000-0000-000000000622', 'HW-B', '2026-27');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000602"}', true);

SELECT lives_ok(
  $$SELECT public.publish_assignment(
    'Fractions worksheet',
    'Complete questions 1-10.',
    '2026-11-12T12:00:00Z'::timestamptz,
    'HOMEWORK',
    '00000000-0000-0000-0000-000000000631'::uuid,
    ARRAY['00000000-0000-0000-0000-000000000621'::uuid],
    ARRAY[]::uuid[],
    NULL
  )$$,
  'teacher publishes atomically to a taught section'
);

RESET ROLE;
SELECT is(
  (SELECT kind || ':' || subject_id::text FROM assignments WHERE title = 'Fractions worksheet'),
  'HOMEWORK:00000000-0000-0000-0000-000000000631',
  'published assignment stores kind and subject'
);
SELECT is(
  (SELECT count(*)::integer FROM assignment_sections ase JOIN assignments a ON a.id = ase.assignment_id WHERE a.title = 'Fractions worksheet'),
  1,
  'publish RPC creates its section target in the same transaction'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000602"}', true);
SELECT throws_ok(
  $$SELECT public.publish_assignment(
    'Foreign target', NULL, '2026-11-12T12:00:00Z'::timestamptz, 'HOMEWORK',
    '00000000-0000-0000-0000-000000000631'::uuid,
    ARRAY['00000000-0000-0000-0000-000000000622'::uuid], ARRAY[]::uuid[], NULL
  )$$,
  '42501', NULL, 'teacher cannot target a section they do not teach'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000601"}', true);
SELECT throws_ok(
  $$SELECT public.publish_assignment(
    'Admin authored', NULL, '2026-11-12T12:00:00Z'::timestamptz, 'HOMEWORK',
    '00000000-0000-0000-0000-000000000631'::uuid,
    ARRAY['00000000-0000-0000-0000-000000000621'::uuid], ARRAY[]::uuid[], NULL
  )$$,
  '42501', NULL, 'admin remains read-only on academic assignments'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000603"}', true);
SELECT is(
  (SELECT count(*)::integer FROM assignments WHERE title = 'Fractions worksheet'),
  1,
  'targeted student reads the assignment'
);
SELECT is(
  (SELECT count(*)::integer FROM assignment_sections ase JOIN assignments a ON a.id = ase.assignment_id WHERE a.title = 'Fractions worksheet'),
  1,
  'targeted student reads the assignment section label'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000604"}', true);
SELECT is(
  (SELECT count(*)::integer FROM assignments WHERE title = 'Fractions worksheet'),
  0,
  'student outside the target section cannot read the assignment'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000603"}', true);
SELECT lives_ok(
  $$SELECT public.submit_assignment(
    (SELECT id FROM assignments WHERE title = 'Fractions worksheet'),
    'First answer', NULL
  )$$,
  'targeted student submits their own work'
);

RESET ROLE;
SELECT is(
  (SELECT student_id::text FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.title = 'Fractions worksheet'),
  '00000000-0000-0000-0000-000000000603',
  'submission RPC always derives student_id from auth.uid()'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000603"}', true);
SELECT lives_ok(
  $$SELECT public.submit_assignment(
    (SELECT id FROM assignments WHERE title = 'Fractions worksheet'),
    'Revised answer', NULL
  )$$,
  'student can update their existing submission through the RPC'
);

RESET ROLE;
SELECT is(
  (SELECT count(*)::integer FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.title = 'Fractions worksheet' AND s.body = 'Revised answer'),
  1,
  'submission update keeps one row and saves the revised body'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000604"}', true);
SELECT throws_ok(
  $$SELECT public.submit_assignment(
    (SELECT id FROM assignments WHERE title = 'Fractions worksheet'), 'Forged', NULL
  )$$,
  '42501', NULL, 'student outside the target cannot submit'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000601"}', true);
SELECT throws_ok(
  $$SELECT public.submit_assignment(
    (SELECT id FROM assignments WHERE title = 'Fractions worksheet'), 'Admin answer', NULL
  )$$,
  '42501', NULL, 'admin cannot submit academic work'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000603"}', true);
SELECT throws_ok(
  $$INSERT INTO submissions (assignment_id, student_id, body)
    SELECT id, '00000000-0000-0000-0000-000000000604'::uuid, 'Forged peer row'
    FROM assignments WHERE title = 'Fractions worksheet'$$,
  '42501', NULL, 'direct writes cannot forge another student submission'
);
SELECT throws_ok(
  $$SELECT public.submit_assignment(
    (SELECT id FROM assignments WHERE title = 'Fractions worksheet'), '   ', NULL
  )$$,
  '22023', NULL, 'blank submission content is rejected'
);
SELECT throws_ok(
  $$SELECT public.submit_assignment(
    (SELECT id FROM assignments WHERE title = 'Fractions worksheet'), NULL,
    '00000000-0000-0000-0000-000000000604/forged.pdf'
  )$$,
  '22023', NULL, 'submission file path must belong to the authenticated student folder'
);

SELECT lives_ok(
  $$INSERT INTO storage.objects (bucket_id, name)
    VALUES ('submission-files', '00000000-0000-0000-0000-000000000603/answer.pdf')$$,
  'student uploads into their own private submission folder'
);
SELECT throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name)
    VALUES ('submission-files', '00000000-0000-0000-0000-000000000604/forged.pdf')$$,
  '42501', NULL, 'student cannot upload into another student folder'
);
SELECT throws_ok(
  $$INSERT INTO storage.objects (bucket_id, name)
    VALUES ('homework-files', '00000000-0000-0000-0000-000000000603/forged.pdf')$$,
  '42501', NULL, 'student cannot upload homework source files'
);
SELECT lives_ok(
  $$SELECT public.submit_assignment(
    (SELECT id FROM assignments WHERE title = 'Fractions worksheet'),
    'Answer with file',
    '00000000-0000-0000-0000-000000000603/answer.pdf'
  )$$,
  'student attaches an uploaded owner-scoped file'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000602"}', true);
SELECT lives_ok(
  $$INSERT INTO storage.objects (bucket_id, name)
    VALUES ('homework-files', '00000000-0000-0000-0000-000000000602/source.pdf')$$,
  'teacher uploads into their own private homework folder'
);
SELECT is(
  (SELECT count(*)::integer FROM storage.objects
   WHERE bucket_id = 'submission-files'
     AND name = '00000000-0000-0000-0000-000000000603/answer.pdf'),
  1,
  'assignment teacher can read the submitted private file'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
