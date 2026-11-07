-- ============================================================================
-- 0008_fees_live.sql
-- Secure live Fees slice: sibling links via RPC, payment recording via RPC,
-- student-owned reads, admin-owned writes.
-- ============================================================================

BEGIN;

-- is_fee_recipient: true when the caller is the student themselves or staff.
CREATE OR REPLACE FUNCTION public.is_fee_recipient(
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

-- Fee installment reads: student reads own, staff read all.
DROP POLICY IF EXISTS fee_installments_read_own ON public.fee_installments;
CREATE POLICY fee_installments_read_own ON public.fee_installments
  FOR SELECT USING (
    auth.uid() = student_id
    OR public.is_admin()
    OR public.teaches_student(student_id)
    OR public.is_class_teacher_of(student_id)
  );

-- Direct installment writes are closed; the narrow functions below are the
-- only authenticated write surface.
REVOKE ALL ON public.fee_installments FROM authenticated;

-- Record a payment: admin only.
CREATE OR REPLACE FUNCTION public.fees_record_payment(
  p_installment_id uuid,
  p_amount numeric(12,2)
) RETURNS public.fee_installments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_installment public.fee_installments;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor AND p.role = 'admin' AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only an admin may record payments'
      USING ERRCODE = '42501';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'payment amount must be positive'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.fee_installments
  SET paid_amount = LEAST(amount - discount_amount, paid_amount + p_amount),
      status = CASE
        WHEN LEAST(amount - discount_amount, paid_amount + p_amount) >= amount - discount_amount THEN 'Paid'
        WHEN LEAST(amount - discount_amount, paid_amount + p_amount) > 0 THEN 'Partial'
        ELSE 'Unpaid'
      END,
      payment_date = CURRENT_DATE
  WHERE id = p_installment_id
  RETURNING * INTO v_installment;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'installment not found'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, meta)
  VALUES (
    v_actor, 'record-payment', 'fee_installments', v_installment.id,
    jsonb_build_object('amount', p_amount)
  );

  RETURN v_installment;
END;
$$;

-- Link siblings (50% discount on second child): admin only.
CREATE OR REPLACE FUNCTION public.fees_link_sibling(
  p_first_child_id uuid,
  p_second_child_id uuid,
  p_discount_percent integer DEFAULT 50
) RETURNS public.sibling_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_link public.sibling_links;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor AND p.role = 'admin' AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only an admin may link siblings'
      USING ERRCODE = '42501';
  END IF;

  IF p_first_child_id = p_second_child_id THEN
    RAISE EXCEPTION 'a student cannot be their own sibling'
      USING ERRCODE = '22023';
  END IF;

  IF p_discount_percent < 0 OR p_discount_percent > 100 THEN
    RAISE EXCEPTION 'discount percent must be between 0 and 100'
      USING ERRCODE = '22023';
  END IF;

  -- Both must be active students.
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_first_child_id AND p.role = 'student' AND p.is_active
  ) OR NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_second_child_id AND p.role = 'student' AND p.is_active
  ) THEN
    RAISE EXCEPTION 'both students must be active'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.sibling_links (
    student_id, sibling_id, discount_percent, created_by
  ) VALUES (
    p_first_child_id, p_second_child_id, p_discount_percent, v_actor
  ) RETURNING * INTO v_link;

  -- Apply discount to the second child's unpaid installments.
  UPDATE public.fee_installments
  SET discount_amount = LEAST(amount, amount * p_discount_percent / 100.0)
  WHERE student_id = p_second_child_id
    AND status <> 'Paid';

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, meta)
  VALUES (
    v_actor, 'link-sibling', 'sibling_links', v_link.id,
    jsonb_build_object('discount_percent', p_discount_percent)
  );

  RETURN v_link;
END;
$$;

-- Unlink siblings: admin only.
CREATE OR REPLACE FUNCTION public.fees_unlink_sibling(
  p_link_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_link public.sibling_links;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_actor AND p.role = 'admin' AND p.is_active
  ) THEN
    RAISE EXCEPTION 'only an admin may unlink siblings'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_link
  FROM public.sibling_links
  WHERE id = p_link_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'sibling link not found'
      USING ERRCODE = '42501';
  END IF;

  -- Remove discount from the second child's unpaid installments.
  UPDATE public.fee_installments
  SET discount_amount = 0
  WHERE student_id = v_link.sibling_id
    AND status <> 'Paid';

  DELETE FROM public.sibling_links WHERE id = p_link_id;

  INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id)
  VALUES (v_actor, 'unlink-sibling', 'sibling_links', p_link_id);
END;
$$;

REVOKE ALL ON FUNCTION public.is_fee_recipient(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fees_record_payment(uuid, numeric(12,2)) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fees_link_sibling(uuid, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fees_unlink_sibling(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_fee_recipient(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fees_record_payment(uuid, numeric(12,2)) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fees_link_sibling(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fees_unlink_sibling(uuid) TO authenticated;

COMMIT;