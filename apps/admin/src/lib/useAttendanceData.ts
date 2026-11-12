import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  loadAttendanceData,
  markAttendance,
  type MappedAttendanceData,
} from './attendanceLive';
import type { AttendanceRecord } from './types';
import { supabase } from './supabase';

const EMPTY_ATTENDANCE_DATA: MappedAttendanceData = { attendance: [] };

export function useAttendanceData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedAttendanceData>(EMPTY_ATTENDANCE_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadAttendanceData(supabase);
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

  const markAttendanceRecord = useCallback(
    async (input: {
      student_id: string;
      section_id: string;
      date: string;
      status: AttendanceRecord['status'];
      note?: string;
    }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.saveAttendance?.([
          {
            student_id: input.student_id,
            date: input.date,
            status: input.status,
            note: input.note ?? '',
          },
        ]);
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await markAttendance(supabase, input);
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const attendance = useMemo(
    () => (liveEnabled ? liveData.attendance : demo.attendance),
    [liveEnabled, liveData.attendance, demo.attendance],
  );

  const people = useMemo(() => (liveEnabled ? [] : demo.people), [
    liveEnabled,
    demo.people,
  ]);

  const saveAttendance = useCallback(
    async (records: { student_id: string; section_id: string; date: string; status: AttendanceRecord['status']; note?: string }[]) => {
      for (const record of records) {
        await markAttendanceRecord(record);
      }
    },
    [markAttendanceRecord],
  );

  return {
    attendance,
    people,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    markAttendance: markAttendanceRecord,
    saveAttendance,
    refresh,
  };
}
