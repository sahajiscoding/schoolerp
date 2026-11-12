import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { TeachingAssignment } from './types';

type TeachingAssignmentsClient = SupabaseClient<Database>;

export interface MappedTeachingAssignmentsData {
  assignments: TeachingAssignment[];
}

export async function loadTeachingAssignmentsData(client: TeachingAssignmentsClient): Promise<MappedTeachingAssignmentsData> {
  const { data, error } = await (client.from('teaching_assignments') as any).select('*').order('teacher_id', { ascending: true });
  if (error) throw new Error('Could not load teaching assignments. Please try again.');
  return { assignments: (data ?? []) as TeachingAssignment[] };
}

export interface CreateTeachingAssignmentInput {
  teacher_id: string;
  section_id: string;
  subject_id: string;
}

export async function createTeachingAssignment(client: TeachingAssignmentsClient, input: CreateTeachingAssignmentInput): Promise<void> {
  const { error } = await (client.from('teaching_assignments') as any).insert({
    teacher_id: input.teacher_id,
    section_id: input.section_id,
    subject_id: input.subject_id,
  });
  if (error) throw new Error('Could not create teaching assignment. Please try again.');
}

export interface UpdateTeachingAssignmentInput {
  id: string;
  teacher_id?: string;
  section_id?: string;
  subject_id?: string;
}

export async function updateTeachingAssignment(client: TeachingAssignmentsClient, input: UpdateTeachingAssignmentInput): Promise<void> {
  const { error } = await (client.from('teaching_assignments') as any).update(input).eq('id', input.id);
  if (error) throw new Error('Could not update teaching assignment. Please try again.');
}

export async function deleteTeachingAssignment(client: TeachingAssignmentsClient, id: string): Promise<void> {
  const { error } = await (client.from('teaching_assignments') as any).delete().eq('id', id);
  if (error) throw new Error('Could not delete teaching assignment. Please try again.');
}
