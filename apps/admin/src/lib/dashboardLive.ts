import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { LeaveRequest, Person, SchoolEvent } from './types';

type DashboardClient = SupabaseClient<Database>;

export interface MappedDashboardData {
  people: Person[];
  events: SchoolEvent[];
  leaves: LeaveRequest[];
  fees: { amount: number; paid: number; discount: number }[];
  stats: {
    students: number;
    teachers: number;
    pendingLeaves: number;
    collected: number;
    billed: number;
  };
}

export async function loadDashboardData(
  client: DashboardClient,
): Promise<MappedDashboardData> {
  const [peopleResult, eventsResult, leavesResult, feesResult] = await Promise.all([
    client.from('profiles').select('*').order('full_name'),
    client.from('school_events').select('*').order('start_date', { ascending: true }),
    client.from('leave_requests').select('*').order('applied_on', { ascending: false }),
    client.from('fee_records').select('*'),
  ]);

  if (
    peopleResult.error ||
    eventsResult.error ||
    leavesResult.error ||
    feesResult.error
  ) {
    throw new Error('Could not load dashboard data. Please try again.');
  }

  const people = (peopleResult.data ?? []) as Person[];
  const events = (eventsResult.data ?? []) as SchoolEvent[];
  const leaves = (leavesResult.data ?? []) as LeaveRequest[];
  const fees = (feesResult.data ?? []) as { amount: number; paid: number; discount: number }[];

  const students = people.filter((p) => p.role === 'student');
  const teachers = people.filter((p) => p.role === 'teacher');
  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const collected = fees.reduce((sum, f) => sum + f.paid, 0);
  const billed = fees.reduce((sum, f) => sum + f.amount - f.discount, 0);

  return {
    people,
    events,
    leaves,
    fees,
    stats: {
      students: students.length,
      teachers: teachers.length,
      pendingLeaves: pendingLeaves.length,
      collected,
      billed,
    },
  };
}
