import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { FeeInvoice } from './types';

type FeeCollectionsClient = SupabaseClient<Database>;

export interface MappedFeeCollectionsData {
  fees: FeeInvoice[];
}

export async function loadFeeCollectionsData(client: FeeCollectionsClient): Promise<MappedFeeCollectionsData> {
  const { data, error } = await (client.from('fee_installments') as any).select('*').order('student_id', { ascending: true });
  if (error) throw new Error('Could not load fee collections. Please try again.');
  return {
    fees: (data ?? []).map((entry: any) => ({
      id: entry.id,
      student_id: entry.student_id,
      term: entry.fee_period_id ?? '',
      academic_year: entry.academic_session,
      amount: Number(entry.amount),
      discount: Number(entry.discount_amount),
      paid: Number(entry.paid_amount),
      due_date: entry.due_date,
      status: entry.status as FeeInvoice['status'],
    })),
  };
}
