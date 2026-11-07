-- Library live-wiring RLS/RPC regressions.
-- Run after migrations with: supabase test db
\set ON_ERROR_STOP on

BEGIN;
SELECT plan(20);

INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000000701'),
  ('00000000-0000-0000-0000-000000000702'),
  ('00000000-0000-0000-0000-000000000703'),
  ('00000000-0000-0000-0000-000000000704');

INSERT INTO profiles (id, role, full_name, login_id, is_active) VALUES
  ('00000000-0000-0000-0000-000000000701', 'admin', 'Library Admin', 'LIB_ADMIN_0007', true),
  ('00000000-0000-0000-0000-000000000702', 'teacher', 'Library Teacher', 'LIB_TEACHER_0007', true),
  ('00000000-0000-0000-0000-000000000703', 'student', 'Library Student A', 'LIB_STUDENT_A_0007', true),
  ('00000000-0000-0000-0000-000000000704', 'student', 'Library Student B', 'LIB_STUDENT_B_0007', true);

INSERT INTO classes (id, name, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000711', 'IX', 9);
INSERT INTO sections (id, class_id, name, academic_year, class_teacher_id) VALUES
  ('00000000-0000-0000-0000-000000000721', '00000000-0000-0000-0000-000000000711', 'A', '2026-27', '00000000-0000-0000-0000-000000000702'),
  ('00000000-0000-0000-0000-000000000722', '00000000-0000-0000-0000-000000000711', 'B', '2026-27', NULL);
INSERT INTO subjects (id, name, code) VALUES
  ('00000000-0000-0000-0000-000000000731', 'Library Math', 'LIB_MATH_0007');
INSERT INTO teaching_assignments (teacher_id, section_id, subject_id) VALUES
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000721', '00000000-0000-0000-0000-000000000731');
INSERT INTO enrollments (student_id, section_id, roll_no, academic_year) VALUES
  ('00000000-0000-0000-0000-000000000703', '00000000-0000-0000-0000-000000000721', 'LIB-A', '2026-27'),
  ('00000000-0000-0000-0000-000000000704', '00000000-0000-0000-0000-000000000722', 'LIB-B', '2026-27');

INSERT INTO library_books (id, title, author, accession_no, category, total_copies, available_copies) VALUES
  ('00000000-0000-0000-0000-000000000741', 'Test Book One', 'Author One', 'LIB-TEST-001', 'Fiction', 3, 3);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000702"}', true);

SELECT lives_ok(
  $$SELECT public.library_issue_book(
    '00000000-0000-0000-0000-000000000741',
    '00000000-0000-0000-0000-000000000703',
    (now() + interval '14 days')::timestamptz
  )$$,
  'teacher issues book to own section student'
);

SELECT is(
  (SELECT available_copies FROM library_books WHERE id = '00000000-0000-0000-0000-000000000741'),
  2,
  'book available_copies decremented after issue'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000704"}', true);
SELECT throws_ok(
  $$SELECT public.library_issue_book(
    '00000000-0000-0000-0000-000000000741',
    '00000000-0000-0000-0000-000000000703',
    (now() + interval '14 days')::timestamptz
  )$$,
  '42501', NULL, 'student cannot issue books'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000702"}', true);
SELECT lives_ok(
  $$SELECT public.library_return_book(
    (SELECT id FROM library_book_transactions
     WHERE book_id = '00000000-0000-0000-0000-000000000741'
       AND student_id = '00000000-0000-0000-0000-000000000703'
       AND status = 'issued'
     LIMIT 1)
  )$$,
  'staff returns issued book'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000703"}', true);
SELECT throws_ok(
  $$SELECT public.library_return_book(
    (SELECT id FROM library_book_transactions
     WHERE book_id = '00000000-0000-0000-0000-000000000741'
       AND student_id = '00000000-0000-0000-0000-000000000704'
       AND status = 'issued'
     LIMIT 1)
  )$$,
  '42501', NULL, 'student cannot return peer book'
);

SELECT throws_ok(
  $$SELECT public.library_issue_book(
    '00000000-0000-0000-0000-000000000741',
    '00000000-0000-0000-0000-000000000704',
    (now() + interval '14 days')::timestamptz
  )$$,
  '42501', NULL, 'teacher cannot issue to foreign section student'
);

RESET ROLE;
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000703"}', true);
SELECT is(
  (SELECT count(*)::integer FROM library_book_transactions WHERE student_id = '00000000-0000-0000-0000-000000000703'),
  1,
  'student reads own library transactions'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000704"}', true);
SELECT is(
  (SELECT count(*)::integer FROM library_book_transactions WHERE student_id = '00000000-0000-0000-0000-000000000703'),
  0,
  'student cannot read peer library transactions'
);

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000701"}', true);
SELECT is(
  (SELECT count(*)::integer FROM library_book_transactions),
  1,
  'admin reads all library transactions'
);

SELECT throws_ok(
  $$SELECT public.library_return_book(
    (SELECT id FROM library_book_transactions WHERE status = 'issued' LIMIT 1)
  )$$,
  '22023', NULL, 'cannot return already-returned book'
);

SELECT * FROM finish();
ROLLBACK;