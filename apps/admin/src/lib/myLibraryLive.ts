import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { BookIssue } from './types';

type MyLibraryClient = SupabaseClient<Database>;

export interface MappedMyLibraryData {
  issues: BookIssue[];
}

export async function loadMyLibraryData(client: MyLibraryClient, studentId: string): Promise<MappedMyLibraryData> {
  const { data, error } = await (client.from('library_book_transactions') as any).select('*').eq('student_id', studentId).order('issued_at', { ascending: false });
  if (error) throw new Error('Could not load library issues. Please try again.');
  return { issues: (data ?? []) as BookIssue[] };
}
