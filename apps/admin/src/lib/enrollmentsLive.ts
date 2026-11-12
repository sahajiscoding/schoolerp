import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';

type EnrollmentsClient = SupabaseClient<Database>;

export interface MappedEnrollmentsData {
  enrollments: Enrollment[];
}

export interface Enrollment {
  id: string;
  student_id: string;
  section_id: string;
  roll_no: string | null;
  academic_year: string;
  created_at: string;
}

export async function loadEnrollmentsData(client: EnrollmentsClient): Promise<MappedEnrollmentsData> {
  const { data, error } = await (client.from('enrollments') as any).select('*').order('student_id', { ascending: true });
  if (error) throw new Error('Could not load enrollments. Please try again.');
  return { enrollments: (data ?? []) as Enrollment[] };
}

export interface CreateEnrollmentInput {
  student_id: string;
  section_id: string;
  roll_no?: string;
  academic_year: string;
}

export async function createEnrollment(client: EnrollmentsClient, input: CreateEnrollmentInput): Promise<void> {
  const { error } = await (client.from('enrollments') as any).insert({
    student_id: input.student_id,
    section_id: input.section_id,
    roll_no: input.roll_no ?? null,
    academic_year: input.academic_year,
  });
  if (error) throw new Error('Could not create enrollment. Please try again.');
}

export interface UpdateEnrollmentInput {
  id: string;
  student_id?: string;
  section_id?: string;
  roll_no?: string | null;
  academic_year?: string;
}

export async function updateEnrollment(client: EnrollmentsClient, input: UpdateEnrollmentInput): Promise<void> {
  const { error } = await (client.from('enrollments') as any).update(input).eq('id', input.id);
  if (error) throw new Error('Could not update enrollment. Please try again.');
}

export async function deleteEnrollment(client: EnrollmentsClient, id: string): Promise<void> {
  const { error } = await (client.from('enrollments') as any).delete().eq('id', id);
  if (error) throw new Error('Could not delete enrollment. Please try again.');
}
