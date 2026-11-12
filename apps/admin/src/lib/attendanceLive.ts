import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { AttendanceRecord } from './types';

type AttendanceClient = SupabaseClient<Database>;

export interface MappedAttendanceData {
  attendance: AttendanceRecord[];
}

export async function loadAttendanceData(client: AttendanceClient): Promise<MappedAttendanceData> {
  const { data, error } = await (client.from('attendance') as any).select('*').order('date', { ascending: false });
  if (error) throw new Error('Could not load attendance. Please try again.');
  return { attendance: (data ?? []) as AttendanceRecord[] };
}

export interface MarkAttendanceInput {
  student_id: string;
  section_id: string;
  date: string;
  status: AttendanceRecord['status'];
  note?: string;
}

export async function markAttendance(client: AttendanceClient, input: MarkAttendanceInput): Promise<void> {
  const { error } = await (client.from('attendance') as any).upsert(
    {
      student_id: input.student_id,
      section_id: input.section_id,
      date: input.date,
      status: input.status,
      note: input.note ?? null,
    },
    { onConflict: 'student_id,date' },
  );
  if (error) throw new Error('Could not mark attendance. Please try again.');
}
