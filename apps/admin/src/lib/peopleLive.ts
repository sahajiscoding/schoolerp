import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { Person } from './types';

type PeopleClient = SupabaseClient<Database>;

export interface MappedPeopleData {
  people: Person[];
}

export async function loadPeopleData(
  client: PeopleClient,
  _role: 'admin' | 'teacher' | 'student',
  _studentId: string | null,
): Promise<MappedPeopleData> {
  const { data, error } = await (client.from('profiles') as any).select('*').order('full_name', { ascending: true });
  if (error) throw new Error('Could not load people. Please try again.');
  return { people: (data ?? []) as Person[] };
}

export interface CreatePersonInput {
  full_name: string;
  login_id: string;
  role: 'admin' | 'teacher' | 'student';
  dob?: string;
  class_label?: string;
  section_label?: string;
  admission_no?: string;
}

export async function createPerson(client: PeopleClient, input: CreatePersonInput): Promise<void> {
  const { error } = await (client.from('profiles') as any).insert({
    full_name: input.full_name,
    login_id: input.login_id,
    role: input.role,
    is_active: true,
    dob: input.dob ?? null,
    class_label: input.class_label ?? null,
    section_label: input.section_label ?? null,
    admission_no: input.admission_no ?? null,
  });
  if (error) throw new Error('Could not create person. Please try again.');
}

export interface UpdatePersonInput {
  id: string;
  full_name?: string;
  login_id?: string;
  role?: 'admin' | 'teacher' | 'student';
  is_active?: boolean;
  dob?: string | null;
  class_label?: string | null;
  section_label?: string | null;
}

export async function updatePerson(client: PeopleClient, input: UpdatePersonInput): Promise<void> {
  const { error } = await (client.from('profiles') as any).update(input).eq('id', input.id);
  if (error) throw new Error('Could not update person. Please try again.');
}

export async function deletePerson(client: PeopleClient, id: string): Promise<void> {
  const { error } = await (client.from('profiles') as any).delete().eq('id', id);
  if (error) throw new Error('Could not delete person. Please try again.');
}
