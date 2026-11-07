import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { FeeInvoice, SiblingLink } from './types';

type FeesClient = SupabaseClient<Database>;

type FeesRpcCall = (
  functionName: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

const feesRpc = (client: FeesClient): FeesRpcCall =>
  client.rpc.bind(client) as unknown as FeesRpcCall;

export interface FeeInstallmentRow {
  id: string;
  student_id: string;
  fee_period_id: string | null;
  academic_session: string;
  amount: number;
  discount_amount: number;
  paid_amount: number;
  status: 'Paid' | 'Unpaid' | 'Partial';
  receipt_number: string | null;
  payment_date: string | null;
  created_at: string;
}

export interface SiblingLinkRow {
  id: string;
  student_id: string;
  sibling_id: string;
  discount_percent: number;
  created_by: string;
  created_at: string;
}

export interface MappedFeesData {
  fees: FeeInvoice[];
  siblings: SiblingLink[];
}

export function mapFeesData(
  installments: FeeInstallmentRow[],
  links: SiblingLinkRow[],
): MappedFeesData {
  const fees = installments.map<FeeInvoice>((f) => ({
    id: f.id,
    student_id: f.student_id,
    term: f.fee_period_id ?? f.academic_session,
    academic_year: f.academic_session,
    amount: f.amount,
    discount: f.discount_amount,
    paid: f.paid_amount,
    due_date: f.payment_date ?? f.created_at.slice(0, 10),
    status: f.status.toLowerCase() as 'paid' | 'partial' | 'unpaid',
    sibling_of: undefined,
  }));

  const siblings = links.map<SiblingLink>((l) => ({
    id: l.id,
    student_id: l.student_id,
    sibling_id: l.sibling_id,
    discount_percent: l.discount_percent,
  }));

  return { fees, siblings };
}

export async function loadFeesData(client: FeesClient): Promise<MappedFeesData> {
  const [installmentsResult, linksResult] = await Promise.all([
    client.from('fee_installments').select('*').order('created_at', { ascending: false }),
    client.from('sibling_links').select('*').order('created_at', { ascending: false }),
  ]);

  if (installmentsResult.error || linksResult.error) {
    throw new Error('Could not load fees. Please try again.');
  }

  return mapFeesData(
    (installmentsResult.data ?? []) as FeeInstallmentRow[],
    (linksResult.data ?? []) as SiblingLinkRow[],
  );
}

export async function recordFeePayment(
  client: FeesClient,
  installmentId: string,
  amount: number
): Promise<void> {
  const { error } = await feesRpc(client)('fees_record_payment', {
    p_installment_id: installmentId,
    p_amount: amount,
  });
  if (error) throw new Error('Could not record the payment. Please try again.');
}

export async function linkFeeSibling(
  client: FeesClient,
  firstChildId: string,
  secondChildId: string,
  discountPercent: number
): Promise<void> {
  const { error } = await feesRpc(client)('fees_link_sibling', {
    p_first_child_id: firstChildId,
    p_second_child_id: secondChildId,
    p_discount_percent: discountPercent,
  });
  if (error) throw new Error('Could not link the siblings. Please try again.');
}

export async function unlinkFeeSibling(
  client: FeesClient,
  linkId: string
): Promise<void> {
  const { error } = await feesRpc(client)('fees_unlink_sibling', {
    p_link_id: linkId,
  });
  if (error) throw new Error('Could not unlink the siblings. Please try again.');
}
