import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { StudyMaterial } from './types';

type DigitalLibraryClient = SupabaseClient<Database>;

export interface MappedDigitalLibraryData {
  materials: StudyMaterial[];
}

export async function loadDigitalLibraryData(client: DigitalLibraryClient): Promise<MappedDigitalLibraryData> {
  const { data, error } = await (client.from('study_materials') as any).select('*').order('created_at', { ascending: false });
  if (error) throw new Error('Could not load digital library. Please try again.');
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

export async function createStudyMaterial(client: DigitalLibraryClient, input: CreateStudyMaterialInput): Promise<void> {
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
