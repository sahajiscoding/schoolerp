import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isDemoSession } from './demoSession';
import { loadMyAttendanceData, type MappedMyAttendanceData } from './myAttendanceLive';
import { supabase } from './supabase';

const EMPTY_MY_ATTENDANCE_DATA: MappedMyAttendanceData = { attendance: [] };

export function useMyAttendanceData() {
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedMyAttendanceData>(EMPTY_MY_ATTENDANCE_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadMyAttendanceData(supabase, profile.id);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load attendance.');
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

  const attendance = useMemo(
    () => (liveEnabled ? liveData.attendance : []),
    [liveEnabled, liveData.attendance],
  );

  return {
    attendance,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    refresh,
  };
}
