import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { ReportCard } from './types';

type ReportCardsClient = SupabaseClient<Database>;

export interface MappedReportCardsData {
  reportCards: ReportCard[];
}

export async function loadReportCardsData(client: ReportCardsClient): Promise<MappedReportCardsData> {
  const { data, error } = await (client.from('report_cards') as any).select('*').order('created_at', { ascending: false });
  if (error) throw new Error('Could not load report cards. Please try again.');
  return { reportCards: (data ?? []) as ReportCard[] };
}

export interface CreateReportCardInput {
  student_id: string;
  term: string;
  academic_year: string;
  class_label: string;
  section_label: string;
  subjects: { subject: string; marks: number; max_marks: number }[];
  total: number;
  max_total: number;
  percentage: number;
  grade: string;
}

export async function createReportCard(client: ReportCardsClient, input: CreateReportCardInput): Promise<void> {
  const { error } = await (client.from('report_cards') as any).insert({
    student_id: input.student_id,
    term: input.term,
    academic_year: input.academic_year,
    class_label: input.class_label,
    section_label: input.section_label,
    subjects: input.subjects,
    total: input.total,
    max_total: input.max_total,
    percentage: input.percentage,
    grade: input.grade,
    generated_at: new Date().toISOString(),
  });
  if (error) throw new Error('Could not create report card. Please try again.');
}
