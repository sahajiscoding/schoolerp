-- ============================================================================
-- 0007_library_live.sql
-- Secure live Library slice: typed book transactions, atomic issue/reserve/return
-- RPCs, student-owned reads, staff-scoped writes.
-- ============================================================================

BEGIN;

-- is_library_recipient: true when the caller is the student themselves, a
-- staff member (teacher/admin), or the student's class teacher.
CREATE OR REPLACE FUNCTION public.is_library_recipient(
  p_student_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_student_id
      AND p.role = 'student'
      AND p.is_active
      AND (
        p_student_id = auth.uid()
        OR public.is_admin()
        OR public.teaches_student(p_student_id)
        OR public.is_class_teacher_of(p_student_id)
      )
  );
$$;

-- Library book reads: everyone authenticated can read the catalogue.
DROP POLICY IF EXISTS library_books_read ON public.library_books;
CREATE POLICY library_books_read ON public.library_books
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Staff-only writes on the catalogue.
DROP POLICY IF EXISTS library_books_admin_write ON public.library_books;
CREATE POLICY library_books_admin_write ON public.library_books
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('admin', 'teacher')
        AND actor.is_active
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles actor
      WHERE actor.id = auth.uid()
        AND actor.role IN ('admin', 'teacher')
        AND actor.is_active
    )
  );

-- Library transaction reads: student reads own, staff read all.
DROP POLICY IF EXISTS library_tx_read ON public.library_book_transactions;
CREATE POLICY library_tx_read ON public.library_book_transactions
  FOR SELECT USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR public.teaches_student(student_id)
    OR public.is_class_teacher_of(student_id)
  );

-- Direct transaction writes are closed; the narrow functions below are the
-- only authenticated write surface.
REVOKE ALL ON public.library_book_transactions FROM authenticated;

-- Issue/reserve a book: staff only, book must exist and have copies available.
CREATE OR REPLACE FUNCTION public.library_issue_book(
  p_book_id uuid,
  p_student_id uuid,
  p_due_at timestamptz
) RETURNS public.library_book_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_transaction public.library_book_transactions;
BEGIN
  -- Only staff may issue/reserve books.
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor
      AND p.role IN ('admin', 'teacher')
      AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only staff may issue books'
      USING ERRCODE = '42501';
  END IF;

  -- Target must be an active student.
  IF NOT public.is_library_recipient(p_student_id) THEN
    RAISE EXCEPTION 'target is not an active student'
      USING ERRCODE = '42501';
  END IF;

  IF p_due_at IS NULL OR p_due_at <= now() THEN
    RAISE EXCEPTION 'due date must be in the future'
      USING ERRCODE = '22023';
  END IF;

  -- Book must exist and have copies available.
  IF NOT EXISTS (
    SELECT 1
    FROM public.library_books b
    WHERE b.id = p_book_id
      AND b.available_copies > 0
  ) THEN
    RAISE EXCEPTION 'book is not available for issue'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.library_book_transactions (
    book_id, student_id, issued_at, due_at, status
  ) VALUES (
    p_book_id, p_student_id, now(), p_due_at, 'issued'
  ) RETURNING * INTO v_transaction;

  UPDATE public.library_books
  SET available_copies = available_copies - 1
  WHERE id = p_book_id;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'issue-book', 'library_book_transactions', v_transaction.id);

  RETURN v_transaction;
END;
$$;

-- Return a book: student returns own, staff returns any.
CREATE OR REPLACE FUNCTION public.library_return_book(
  p_transaction_id uuid
) RETURNS public.library_book_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_transaction public.library_book_transactions;
BEGIN
  SELECT * INTO v_transaction
  FROM public.library_book_transactions
  WHERE id = p_transaction_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'transaction not found'
      USING ERRCODE = '42501';
  END IF;

  IF v_transaction.status <> 'issued' THEN
    RAISE EXCEPTION 'book is not currently issued'
      USING ERRCODE = '22023';
  END IF;

  -- Student can only return their own transaction; staff may return any.
  IF v_transaction.student_id <> v_actor THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = v_actor
        AND p.role IN ('admin', 'teacher')
        AND p.is_active
    ) THEN
      RAISE EXCEPTION 'not your transaction to return'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  UPDATE public.library_book_transactions
  SET status = 'returned', returned_at = now()
  WHERE id = p_transaction_id
  RETURNING * INTO v_transaction;

  UPDATE public.library_books
  SET available_copies = available_copies + 1
  WHERE id = v_transaction.book_id;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'return-book', 'library_book_transactions', v_transaction.id);

  RETURN v_transaction;
END;
$$;

-- Reserve a book: student reserves own, staff reserves any.
CREATE OR REPLACE FUNCTION public.library_reserve_book(
  p_book_id uuid,
  p_student_id uuid
) RETURNS public.library_book_transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_transaction public.library_book_transactions;
BEGIN
  -- Student can only reserve for themselves; staff may reserve for any student.
  IF p_student_id <> v_actor THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = v_actor
        AND p.role IN ('admin', 'teacher')
        AND p.is_active
    ) THEN
      RAISE EXCEPTION 'students may only reserve for themselves'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NOT public.is_library_recipient(p_student_id) THEN
    RAISE EXCEPTION 'target is not an active student'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.library_books b
    WHERE b.id = p_book_id
      AND b.available_copies > 0
  ) THEN
    RAISE EXCEPTION 'book is not available for reservation'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.library_book_transactions (
    book_id, student_id, issued_at, due_at, status
  ) VALUES (
    p_book_id, p_student_id, now(), now() + interval '14 days', 'reserved'
  ) RETURNING * INTO v_transaction;

  UPDATE public.library_books
  SET available_copies = available_copies - 1
  WHERE id = p_book_id;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'reserve-book', 'library_book_transactions', v_transaction.id);

  RETURN v_transaction;
END;
$$;

REVOKE ALL ON FUNCTION public.is_library_recipient(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.library_issue_book(uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.library_return_book(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.library_reserve_book(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_library_recipient(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.library_issue_book(uuid, uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.library_return_book(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.library_reserve_book(uuid, uuid) TO authenticated;

COMMIT;