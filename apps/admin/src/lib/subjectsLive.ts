import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { Subject } from './types';

type SubjectsClient = SupabaseClient<Database>;

export interface MappedSubjectsData {
  subjects: Subject[];
}

export async function loadSubjectsData(client: SubjectsClient): Promise<MappedSubjectsData> {
  const { data, error } = await (client.from('subjects') as any).select('*').order('name', { ascending: true });
  if (error) throw new Error('Could not load subjects. Please try again.');
  return { subjects: (data ?? []) as Subject[] };
}

export interface CreateSubjectInput {
  name: string;
  code: string;
  color?: string;
}

export async function createSubject(client: SubjectsClient, input: CreateSubjectInput): Promise<void> {
  const { error } = await (client.from('subjects') as any).insert({
    name: input.name,
    code: input.code,
    color: input.color ?? '#4B5D2A',
  });
  if (error) throw new Error('Could not create subject. Please try again.');
}

export interface UpdateSubjectInput {
  id: string;
  name?: string;
  code?: string;
  color?: string;
}

export async function updateSubject(client: SubjectsClient, input: UpdateSubjectInput): Promise<void> {
  const { error } = await (client.from('subjects') as any).update(input).eq('id', input.id);
  if (error) throw new Error('Could not update subject. Please try again.');
}

export async function deleteSubject(client: SubjectsClient, id: string): Promise<void> {
  const { error } = await (client.from('subjects') as any).delete().eq('id', id);
  if (error) throw new Error('Could not delete subject. Please try again.');
}
