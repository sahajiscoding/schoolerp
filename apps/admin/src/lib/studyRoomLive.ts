import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { StudyMaterial } from './types';

type StudyRoomClient = SupabaseClient<Database>;

export interface MappedStudyRoomData {
  materials: StudyMaterial[];
}

export async function loadStudyRoomData(client: StudyRoomClient): Promise<MappedStudyRoomData> {
  const { data, error } = await (client.from('study_materials') as any).select('*').order('created_at', { ascending: false });
  if (error) throw new Error('Could not load study room materials. Please try again.');
  return { materials: (data ?? []) as StudyMaterial[] };
}

export interface CreateStudyMaterialInput {
  title: string;
  description: string;
  subject: string;
  section_label: string;
  file_name: string;
  file_size: string;
  type: string;
  uploaded_by: string;
}

export async function createStudyMaterial(client: StudyRoomClient, input: CreateStudyMaterialInput): Promise<void> {
  const { error } = await (client.from('study_materials') as any).insert({
    title: input.title,
    description: input.description,
    subject: input.subject,
    section_label: input.section_label,
    file_name: input.file_name,
    file_size: input.file_size,
    type: input.type,
    uploaded_by: input.uploaded_by,
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error('Could not add study material. Please try again.');
}
