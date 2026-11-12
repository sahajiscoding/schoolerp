import { useCallback, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import { loadDashboardData, type MappedDashboardData } from './dashboardLive';
import { supabase } from './supabase';
import type { LeaveRequest, Person, SchoolEvent } from './types';

const EMPTY_DASHBOARD: MappedDashboardData = {
  people: [],
  events: [],
  leaves: [],
  fees: [],
  stats: { students: 0, teachers: 0, pendingLeaves: 0, collected: 0, billed: 0 },
};

export function useDashboardData(): {
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
  loading: boolean;
  error: string | null;
  isLive: boolean;
  refresh: () => Promise<void>;
} {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);
  const [liveData, setLiveData] = useState<MappedDashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(liveEnabled);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadDashboardData(supabase);
  }, [liveEnabled, profile]);

  useMemo(() => {
    if (!liveEnabled) return;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load dashboard.');
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

  return {
    people: liveEnabled ? liveData.people : demo.people,
    events: liveEnabled ? liveData.events : demo.events,
    leaves: liveEnabled ? liveData.leaves : demo.leaves,
    fees: liveEnabled ? liveData.fees : demo.fees,
    stats: liveEnabled ? liveData.stats : {
      students: demo.people.filter((p) => p.role === 'student').length,
      teachers: demo.people.filter((p) => p.role === 'teacher').length,
      pendingLeaves: demo.leaves.filter((l) => l.status === 'pending').length,
      collected: demo.fees.reduce((sum, f) => sum + f.paid, 0),
      billed: demo.fees.reduce((sum, f) => sum + f.amount - f.discount, 0),
    },
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    refresh,
  };
}
