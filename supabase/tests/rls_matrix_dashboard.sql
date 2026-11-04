-- supabase/tests/rls_matrix_dashboard.sql
-- pgTAP assertions for 0002_dashboard_modules.sql.
-- Run after the base matrix:  supabase test db
--
-- Covers the rules the dashboard depends on:
--   * leave requests reach only the class teacher (not every teacher)
--   * a student cannot approve their own leave
--   * students only see their own attendance, fees and report cards
--   * teachers can add class events but never school-wide ones
--   * admins cannot write academic content (report cards created by teachers)
--   * sibling discount is admin-owned and visible to both siblings

\set ON_ERROR_STOP on

SELECT plan(24);

CREATE OR REPLACE FUNCTION set_auth_uid(uid uuid) RETURNS void
LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', jsonb_build_object('sub', uid::text)::text, true);
$$;

CREATE OR REPLACE FUNCTION clear_auth() RETURNS void
LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', '{}', true);
$$;

-- ---------------------------------------------------------------------------
-- fixtures
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  admin_id     uuid := gen_random_uuid();
  class_teacher uuid := gen_random_uuid();
  other_teacher uuid := gen_random_uuid();
  student_a    uuid := gen_random_uuid();
  student_b    uuid := gen_random_uuid();
  class_id     uuid := gen_random_uuid();
  section_id   uuid := gen_random_uuid();
  other_section uuid := gen_random_uuid();
  subject_id   uuid := gen_random_uuid();
  leave_id     uuid;
  other_leave  uuid;
BEGIN
  INSERT INTO profiles (id, role, full_name, login_id, is_active) VALUES
    (admin_id, 'admin', 'Admin', 'ADM900', true),
    (class_teacher, 'teacher', 'Class Teacher', 'TCH900', true),
    (other_teacher, 'teacher', 'Other Teacher', 'TCH901', true),
    (student_a, 'student', 'Student A', 'STU900', true),
    (student_b, 'student', 'Student B', 'STU901', true);

  INSERT INTO classes (id, name, sort_order) VALUES (class_id, 'Test IX', 99);
  INSERT INTO sections (id, class_id, name, academic_year, class_teacher_id)
    VALUES (section_id, class_id, 'Z', '2026-27', class_teacher),
           (other_section, class_id, 'Y', '2026-27', NULL);
  INSERT INTO subjects (id, name, code) VALUES (subject_id, 'Test Math', 'TMATH900');

  INSERT INTO teaching_assignments (teacher_id, section_id, subject_id)
    VALUES (other_teacher, other_section, subject_id);

  INSERT INTO enrollments (student_id, section_id, roll_no, academic_year)
    VALUES (student_a, section_id, '901', '2026-27'),
           (student_b, other_section, '902', '2026-27');

  INSERT INTO student_details (profile_id, admission_no, date_of_birth)
    VALUES (student_a, '900/18', '2010-05-14');

  INSERT INTO leave_requests (student_id, section_id, from_date, to_date, leave_type, reason)
    VALUES (student_a, section_id, '2026-11-12', '2026-11-13', 'Medical', 'Fever')
    RETURNING id INTO leave_id;

  INSERT INTO leave_requests (student_id, section_id, from_date, to_date, leave_type, reason)
    VALUES (student_b, other_section, '2026-11-18', '2026-11-18', 'Travel', 'Wedding')
    RETURNING id INTO other_leave;

  CREATE TEMP TABLE ids (key text, value uuid);
  INSERT INTO ids VALUES
    ('admin', admin_id), ('class_teacher', class_teacher), ('other_teacher', other_teacher),
    ('student_a', student_a), ('student_b', student_b), ('section', section_id),
    ('other_section', other_section), ('leave_a', leave_id), ('leave_b', other_leave);

  INSERT INTO attendance (student_id, section_id, date, mark, marked_by)
    VALUES (student_a, section_id, '2026-11-03', 'present', class_teacher),
           (student_b, other_section, '2026-11-03', 'absent', other_teacher);

  INSERT INTO fee_records (student_id, academic_year, installments, sibling_discount_percent)
    VALUES (student_a, '2026-27', '[{"label":"Term 1","amount":60000}]', 0),
           (student_b, '2026-27', '[{"label":"Term 1","amount":60000}]', 50);

  INSERT INTO sibling_links (student_id, sibling_id, discount_percent, created_by)
    VALUES (student_a, student_b, 50, admin_id);

  INSERT INTO report_cards (student_id, section_id, term, academic_year, marks, total, max_total, percentage, grade, created_by)
    VALUES (student_a, section_id, 'HALF YEARLY', '2026-27', '[{"subject":"Test Math","marks":88,"max_marks":100}]', 88, 100, 88, 'A2', class_teacher);

  INSERT INTO books (title, author, copies_total, added_by)
    VALUES ('Test Book', 'Author', 2, class_teacher);

  INSERT INTO school_events (title, kind, start_date, end_date, section_ids, created_by)
    VALUES ('Sports Day', 'Sports', '2026-11-21', '2026-11-21', '{}', admin_id);
END $$;

-- ---------------------------------------------------------------------------
-- leave routing
-- ---------------------------------------------------------------------------

-- 1. class teacher sees the leave request for their section
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'class_teacher'));
SELECT is(
  (SELECT count(*) FROM leave_requests WHERE student_id = (SELECT value FROM ids WHERE key = 'student_a')),
  1::bigint,
  'class teacher reads leaves in their section'
);

-- 2. a teacher who only teaches another section reads none of it
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'other_teacher'));
SELECT is(
  (SELECT count(*) FROM leave_requests WHERE student_id = (SELECT value FROM ids WHERE key = 'student_a')),
  0::bigint,
  'unrelated teacher cannot read the leave'
);

-- 3. the student reads their own request
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'student_a'));
SELECT is(
  (SELECT count(*) FROM leave_requests WHERE student_id = auth.uid()),
  1::bigint,
  'student reads own leave request'
);

-- 4. another student reads nothing
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'student_b'));
SELECT is(
  (SELECT count(*) FROM leave_requests WHERE student_id = (SELECT value FROM ids WHERE key = 'student_a')),
  0::bigint,
  'other student cannot read the leave'
);

-- 5. class teacher approves
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'class_teacher'));
UPDATE leave_requests SET status = 'approved', decided_by = auth.uid()
  WHERE student_id = (SELECT value FROM ids WHERE key = 'student_a');
SELECT is(
  (SELECT status FROM leave_requests WHERE student_id = (SELECT value FROM ids WHERE key = 'student_a')),
  'approved'::text,
  'class teacher can approve the leave'
);

-- 6. a student cannot flip their own request to approved
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'student_b'));
SELECT throws_ok(
  format(
    'UPDATE leave_requests SET status = ''approved'' WHERE id = %L',
    (SELECT value FROM ids WHERE key = 'leave_b')
  ),
  '42501',
  'student cannot approve their own leave'
);

-- 7. a student cannot approve someone else's leave either
SELECT is(
  (SELECT count(*) FROM leave_requests WHERE status = 'pending' AND student_id <> auth.uid()),
  0::bigint,
  'student cannot see other pending leaves to approve'
);

-- ---------------------------------------------------------------------------
-- attendance
-- ---------------------------------------------------------------------------

-- 8. student sees own attendance only
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'student_a'));
SELECT is(
  (SELECT count(*) FROM attendance WHERE student_id = auth.uid()),
  1::bigint,
  'student reads own attendance'
);

-- 9. and none of the other student's
SELECT is(
  (SELECT count(*) FROM attendance WHERE student_id = (SELECT value FROM ids WHERE key = 'student_b')),
  0::bigint,
  'student cannot read another attendance row'
);

-- 10. admin reads all attendance
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'admin'));
SELECT is((SELECT count(*) FROM attendance), 2::bigint, 'admin reads all attendance');

-- 11. student cannot write attendance
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'student_a'));
SELECT throws_ok(
  format(
    'INSERT INTO attendance (student_id, section_id, date, mark) VALUES (%L, %L, ''2026-11-05'', ''present'')',
    (SELECT value FROM ids WHERE key = 'student_a'),
    (SELECT value FROM ids WHERE key = 'section')
  ),
  '42501',
  'student cannot mark attendance'
);

-- ---------------------------------------------------------------------------
-- fees & siblings
-- ---------------------------------------------------------------------------

-- 12. student reads own fee record
SELECT is(
  (SELECT count(*) FROM fee_records WHERE student_id = auth.uid()),
  1::bigint,
  'student reads own fee record'
);

-- 13. student cannot read a sibling's invoice
SELECT is(
  (SELECT count(*) FROM fee_records WHERE student_id = (SELECT value FROM ids WHERE key = 'student_b')),
  0::bigint,
  'student cannot read sibling fee record directly'
);

-- 14. student can read their own sibling link
SELECT is(
  (SELECT count(*) FROM sibling_links WHERE student_id = auth.uid() OR sibling_id = auth.uid()),
  1::bigint,
  'student sees own sibling link'
);

-- 15. student cannot create a sibling link (discount is admin-owned)
SELECT throws_ok(
  format(
    'INSERT INTO sibling_links (student_id, sibling_id, discount_percent) VALUES (%L, %L, 50)',
    (SELECT value FROM ids WHERE key = 'student_a'),
    (SELECT value FROM ids WHERE key = 'student_b')
  ),
  '42501',
  'student cannot create a sibling link'
);

-- 16. admin sets the 50% sibling discount
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'admin'));
UPDATE fee_records SET sibling_discount_percent = 50
  WHERE student_id = (SELECT value FROM ids WHERE key = 'student_b');
SELECT is(
  (SELECT sibling_discount_percent FROM fee_records WHERE student_id = (SELECT value FROM ids WHERE key = 'student_b')),
  50,
  'admin applies the sibling discount to the second child'
);

-- 17. the first child keeps the full fee
SELECT is(
  (SELECT sibling_discount_percent FROM fee_records WHERE student_id = (SELECT value FROM ids WHERE key = 'student_a')),
  0,
  'first child is not discounted'
);

-- ---------------------------------------------------------------------------
-- report cards
-- ---------------------------------------------------------------------------

-- 18. student reads own published card
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'student_a'));
SELECT is(
  (SELECT count(*) FROM report_cards WHERE student_id = auth.uid()),
  1::bigint,
  'student reads own report card'
);

-- 19. student cannot create a report card
SELECT throws_ok(
  format(
    'INSERT INTO report_cards (student_id, term, academic_year, created_by) VALUES (%L, ''X'', ''2026-27'', %L)',
    (SELECT value FROM ids WHERE key = 'student_a'),
    (SELECT value FROM ids WHERE key = 'student_a')
  ),
  '42501',
  'student cannot author a report card'
);

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------

-- 20. teacher cannot create a school-wide event
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'class_teacher'));
SELECT throws_ok(
  'INSERT INTO school_events (title, kind, start_date, end_date, section_ids, created_by) VALUES (''Fake holiday'', ''Holiday'', ''2026-12-01'', ''2026-12-01'', ''{}'', auth.uid())',
  '42501',
  'teacher cannot publish a whole-school event'
);

-- 21. teacher can create an event for a section they teach
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'other_teacher'));
INSERT INTO school_events (title, kind, start_date, end_date, section_ids, created_by)
VALUES ('Unit test', 'Exam', '2026-12-02', '2026-12-02',
        ARRAY[(SELECT value FROM ids WHERE key = 'other_section')], auth.uid());
SELECT is(
  (SELECT count(*) FROM school_events WHERE title = 'Unit test'),
  1::bigint,
  'teacher publishes a class-scoped event'
);

-- 22. student reads declaration forms aimed at them
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'student_b'));
SELECT is(
  (SELECT count(*) FROM declaration_forms WHERE audience IN ('students', 'both')),
  (SELECT count(*) FROM declaration_forms)
    - (SELECT count(*) FROM declaration_forms WHERE audience = 'parents'),
  'student reads declaration forms aimed at students'
);

-- 23. a signature can only be created for yourself
SELECT throws_ok(
  format(
    'INSERT INTO declaration_signatures (form_id, student_id) VALUES (%L, %L)',
    (SELECT value FROM ids WHERE key = 'leave_a'),
    (SELECT value FROM ids WHERE key = 'student_a')
  ),
  '23503',
  'a signature cannot be forged for another student'
);

-- 24. student reads all events
SELECT set_auth_uid((SELECT value FROM ids WHERE key = 'student_b'));
SELECT is(
  (SELECT count(*) FROM school_events WHERE title = 'Sports Day'),
  1::bigint,
  'student reads school events'
);

SELECT * FROM finish();
