import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { LeaveRequest } from './types';

type ApprovalsClient = SupabaseClient<Database>;

type ApprovalsRpcCall = (
  functionName: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

const approvalsRpc = (client: ApprovalsClient): ApprovalsRpcCall =>
  client.rpc.bind(client) as unknown as ApprovalsRpcCall;

export interface LeaveRequestRow {
  id: string;
  student_id: string;
  section_id: string | null;
  from_date: string;
  to_date: string;
  session: string;
  leave_type: string;
  reason: string;
  attachment_path: string | null;
  status: 'pending' | 'approved' | 'rejected';
  decided_by: string | null;
  decided_on: string | null;
  decision_note: string | null;
  applied_on: string;
}

export interface MappedApprovalsData {
  leaves: LeaveRequest[];
}

export function mapApprovalsData(
  rows: LeaveRequestRow[],
): MappedApprovalsData {
  const leaves = rows.map<LeaveRequest>((r) => ({
    id: r.id,
    student_id: r.student_id,
    section_id: r.section_id ?? '',
    start_date: r.from_date,
    end_date: r.to_date,
    leave_type: r.leave_type as LeaveRequest['leave_type'],
    reason: r.reason,
    status: r.status,
    attachment_name: r.attachment_path ?? undefined,
    reviewed_by: r.decided_by ?? undefined,
    reviewed_at: r.decided_on ?? undefined,
    review_note: r.decision_note ?? undefined,
    created_at: r.applied_on,
  }));

  return { leaves };
}

export async function loadApprovalsData(
  client: ApprovalsClient,
  role: 'admin' | 'teacher' | 'student',
  studentId: string | null,
): Promise<MappedApprovalsData> {
  if (role === 'student' && studentId) {
    const { data, error } = await client
      .from('leave_requests')
      .select('*')
      .eq('student_id', studentId)
      .order('applied_on', { ascending: false });
    if (error) throw new Error('Could not load leave requests. Please try again.');
    return mapApprovalsData((data ?? []) as LeaveRequestRow[]);
  }

  const { data, error } = await client
    .from('leave_requests')
    .select('*')
    .order('applied_on', { ascending: false });
  if (error) throw new Error('Could not load leave requests. Please try again.');
  return mapApprovalsData((data ?? []) as LeaveRequestRow[]);
}

export interface ApplyLeaveInput {
  student_id: string;
  section_id: string;
  from_date: string;
  to_date: string;
  session: string;
  leave_type: string;
  reason: string;
  attachment_path?: string;
}

export async function applyLeave(
  client: ApprovalsClient,
  input: ApplyLeaveInput,
): Promise<void> {
  const { error } = await approvalsRpc(client)('leave_apply', {
    p_student_id: input.student_id,
    p_section_id: input.section_id,
    p_from_date: input.from_date,
    p_to_date: input.to_date,
    p_session: input.session,
    p_leave_type: input.leave_type,
    p_reason: input.reason,
    p_attachment_path: input.attachment_path ?? null,
  });
  if (error) throw new Error('Could not apply for leave. Please try again.');
}

export interface ReviewLeaveInput {
  leave_id: string;
  status: 'approved' | 'rejected';
  decision_note?: string;
}

export async function reviewLeave(
  client: ApprovalsClient,
  input: ReviewLeaveInput,
): Promise<void> {
  const { error } = await approvalsRpc(client)('leave_review', {
    p_leave_id: input.leave_id,
    p_status: input.status,
    p_decision_note: input.decision_note ?? null,
  });
  if (error) throw new Error('Could not review the leave. Please try again.');
}
