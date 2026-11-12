import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { AttendanceRecord } from './types';

type MyAttendanceClient = SupabaseClient<Database>;

export interface MappedMyAttendanceData {
  attendance: AttendanceRecord[];
}

export async function loadMyAttendanceData(client: MyAttendanceClient, studentId: string): Promise<MappedMyAttendanceData> {
  const { data, error } = await (client.from('attendance') as any).select('*').eq('student_id', studentId).order('date', { ascending: false });
  if (error) throw new Error('Could not load attendance. Please try again.');
  return { attendance: (data ?? []) as AttendanceRecord[] };
}
