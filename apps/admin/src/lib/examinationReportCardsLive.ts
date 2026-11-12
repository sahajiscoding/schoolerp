import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';

type ExaminationReportCardsClient = SupabaseClient<Database>;

export interface MappedExaminationReportCardsData {
  examinations: Examination[];
  marks: ExaminationMark[];
}

export interface Examination {
  id: string;
  name: string;
  term: string;
  academic_session: string;
  created_at: string;
}

export interface ExaminationMark {
  id: string;
  examination_id: string;
  student_id: string;
  subject_id: string;
  marks: number;
  max_marks: number;
  grade: string | null;
}

export async function loadExaminationReportCardsData(client: ExaminationReportCardsClient): Promise<MappedExaminationReportCardsData> {
  const [examsResult, marksResult] = await Promise.all([
    (client.from('examinations') as any).select('*').order('created_at', { ascending: false }),
    (client.from('examination_marks') as any).select('*'),
  ]);
  if (examsResult.error || marksResult.error) {
    throw new Error('Could not load examination report cards. Please try again.');
  }
  return {
    examinations: (examsResult.data ?? []) as Examination[],
    marks: (marksResult.data ?? []) as ExaminationMark[],
  };
}
