import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { CourseProgressEntry } from './types';

type CourseProgressClient = SupabaseClient<Database>;

type CourseProgressRpcCall = (
  functionName: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

const courseProgressRpc = (client: CourseProgressClient): CourseProgressRpcCall =>
  client.rpc.bind(client) as unknown as CourseProgressRpcCall;

export interface CourseProgressRow {
  id: string;
  student_id: string;
  subject_id: string;
  teacher_id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  target_percent: number;
  current_percent: number;
  grade: string | null;
  remarks: string | null;
  due_date: string | null;
  updated_at: string;
  created_at: string;
}

export interface MappedCourseProgressData {
  entries: CourseProgressEntry[];
}

export function mapCourseProgressData(
  rows: CourseProgressRow[],
): MappedCourseProgressData {
  const entries = rows.map<CourseProgressEntry>((r) => ({
    id: r.id,
    student_id: r.student_id,
    subject: r.subject_id,
    title: r.title,
    percent: r.current_percent,
    grade: r.grade ?? '',
    remarks: r.remarks ?? '',
    teacher_id: r.teacher_id,
    updated_at: r.updated_at,
  }));

  return { entries };
}

export async function loadCourseProgressData(
  client: CourseProgressClient,
  studentId: string | null,
  role: 'admin' | 'teacher' | 'student',
): Promise<MappedCourseProgressData> {
  if (role === 'student' && studentId) {
    const { data, error } = await client
      .from('course_goals')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error('Could not load course progress. Please try again.');
    return mapCourseProgressData((data ?? []) as CourseProgressRow[]);
  }

  const { data, error } = await client
    .from('course_goals')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error('Could not load course progress. Please try again.');
  return mapCourseProgressData((data ?? []) as CourseProgressRow[]);
}

export interface AddCourseGoalInput {
  student_id: string;
  subject_id: string;
  title: string;
  description: string | null;
  percent: number;
  grade: string | null;
  remarks: string | null;
  due_date: string | null;
}

export async function addCourseGoal(
  client: CourseProgressClient,
  input: AddCourseGoalInput,
): Promise<void> {
  const { error } = await courseProgressRpc(client)('goal_add', {
    p_student_id: input.student_id,
    p_subject_id: input.subject_id,
    p_title: input.title.trim(),
    p_description: input.description,
    p_percent: input.percent,
    p_grade: input.grade,
    p_remarks: input.remarks,
    p_due_date: input.due_date,
  });
  if (error) throw new Error('Could not add the course goal. Please try again.');
}

export interface UpdateCourseGoalInput {
  goal_id: string;
  current_percent: number | null;
  grade: string | null;
  remarks: string | null;
}

export async function updateCourseGoal(
  client: CourseProgressClient,
  input: UpdateCourseGoalInput,
): Promise<void> {
  const { error } = await courseProgressRpc(client)('goal_update', {
    p_goal_id: input.goal_id,
    p_current_percent: input.current_percent,
    p_grade: input.grade,
    p_remarks: input.remarks,
  });
  if (error) throw new Error('Could not update the course goal. Please try again.');
}
