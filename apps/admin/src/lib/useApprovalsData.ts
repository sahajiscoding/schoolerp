import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import { applyLeave, loadApprovalsData, type MappedApprovalsData } from './approvalsLive';
import { supabase } from './supabase';
import type { LeaveRequest } from './types';

const EMPTY_APPROVALS_DATA: MappedApprovalsData = { leaves: [] };

export interface LeaveSummary {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export function useApprovalsData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedApprovalsData>(EMPTY_APPROVALS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const demoLeaves = useMemo<LeaveRequest[]>(() => {
    if (profile?.role === 'student') {
      return demo.leaves.filter((l) => l.student_id === profile.id);
    }
    return demo.leaves;
  }, [demo.leaves, profile]);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadApprovalsData(supabase, profile.role, profile.id);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load leave requests.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchLiveData, liveEnabled]);

  const refresh = useCallback(async () => {
    const next = await fetchLiveData();
    if (next) setLiveData(next);
  }, [fetchLiveData]);

  const applyForLeave = useCallback(
    async (input: {
      student_id: string;
      section_id: string;
      from_date: string;
      to_date: string;
      session: string;
      leave_type: string;
      reason: string;
    }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.applyLeave({
          student_id: input.student_id,
          start_date: input.from_date,
          end_date: input.to_date,
          leave_type: input.leave_type as LeaveRequest['leave_type'],
          reason: input.reason,
        });
        return;
      }
      if (!supabase || profile?.role !== 'student') {
        throw new Error('Only students may apply for leave.');
      }
      await applyLeave(supabase, {
        student_id: profile.id,
        section_id: input.section_id,
        from_date: input.from_date,
        to_date: input.to_date,
        session: input.session,
        leave_type: input.leave_type,
        reason: input.reason,
      });
      await refresh();
    },
    [demo, liveEnabled, profile?.role, refresh]
  );

  const reviewLeave = useCallback(
    async (input: { leave_id: string; status: 'approved' | 'rejected'; decision_note?: string }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.reviewLeave(input.leave_id, input.status, profile?.id ?? '', input.decision_note);
        return;
      }
      if (!supabase || (profile?.role !== 'admin' && profile?.role !== 'teacher')) {
        throw new Error('Only staff may review leaves.');
      }
      const { error } = await (supabase.rpc as any)('leave_review', {
        p_leave_id: input.leave_id,
        p_status: input.status,
        p_decision_note: input.decision_note ?? null,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [demo, liveEnabled, profile?.role, refresh, supabase]
  );

  const leaves = useMemo(() => (liveEnabled ? liveData.leaves : demoLeaves), [
    liveEnabled,
    liveData.leaves,
    demoLeaves,
  ]);

  const summary = useMemo<LeaveSummary>(() => {
    const pending = leaves.filter((l) => l.status === 'pending').length;
    const approved = leaves.filter((l) => l.status === 'approved').length;
    const rejected = leaves.filter((l) => l.status === 'rejected').length;
    return { pending, approved, rejected, total: leaves.length };
  }, [leaves]);

  return {
    leaves,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    applyForLeave,
    reviewLeave,
    refresh,
    summary,
  };
}
