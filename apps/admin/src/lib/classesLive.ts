import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { SchoolClass } from './types';

type ClassesClient = SupabaseClient<Database>;

export interface MappedClassesData {
  classes: SchoolClass[];
}

export async function loadClassesData(client: ClassesClient): Promise<MappedClassesData> {
  const { data, error } = await (client.from('classes') as any).select('*').order('sort_order', { ascending: true });
  if (error) throw new Error('Could not load classes. Please try again.');
  return {
    classes: (data ?? []).map((entry) => ({
      id: entry.id,
      name: entry.name,
      sortOrder: entry.sort_order,
      sections: [],
    })),
  };
}

export interface CreateClassInput {
  name: string;
  sort_order?: number;
}

export async function createClass(client: ClassesClient, input: CreateClassInput): Promise<void> {
  const { error } = await (client.from('classes') as any).insert({
    name: input.name,
    sort_order: input.sort_order ?? 0,
  });
  if (error) throw new Error('Could not create class. Please try again.');
}

export interface UpdateClassInput {
  id: string;
  name?: string;
  sort_order?: number;
}

export async function updateClass(client: ClassesClient, input: UpdateClassInput): Promise<void> {
  const { error } = await (client.from('classes') as any).update(input).eq('id', input.id);
  if (error) throw new Error('Could not update class. Please try again.');
}

export async function deleteClass(client: ClassesClient, id: string): Promise<void> {
  const { error } = await (client.from('classes') as any).delete().eq('id', id);
  if (error) throw new Error('Could not delete class. Please try again.');
}
