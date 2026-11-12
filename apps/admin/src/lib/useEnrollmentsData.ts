import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createEnrollment as createEnrollmentLive,
  updateEnrollment as updateEnrollmentLive,
  deleteEnrollment as deleteEnrollmentLive,
  loadEnrollmentsData,
  type MappedEnrollmentsData,
  type UpdateEnrollmentInput,
} from './enrollmentsLive';
import type { Enrollment } from './enrollmentsLive';
import { supabase } from './supabase';

const EMPTY_ENROLLMENTS_DATA: MappedEnrollmentsData = { enrollments: [] };

export function useEnrollmentsData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedEnrollmentsData>(EMPTY_ENROLLMENTS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadEnrollmentsData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load enrollments.');
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

  const addEnrollment = useCallback(
    async (input: Omit<Enrollment, 'id' | 'created_at'>) => {
      if (!liveEnabled || isDemoSession()) {
        demo.notify('Enrollment is not available in demo mode.');
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createEnrollmentLive(supabase, {
        student_id: input.student_id,
        section_id: input.section_id,
        roll_no: input.roll_no,
        academic_year: input.academic_year,
      });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const updateEnrollment = useCallback(
    async (input: UpdateEnrollmentInput) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await updateEnrollmentLive(supabase, input);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const _deleteEnrollment = useCallback(
    async (id: string) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await deleteEnrollmentLive(supabase, id);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const enrollments = useMemo(
    () => (liveEnabled ? liveData.enrollments : []),
    [liveEnabled, liveData.enrollments],
  );

  const people = useMemo(() => (liveEnabled ? [] : demo.people), [liveEnabled, demo.people]);

  return {
    enrollments,
    people,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addEnrollment,
    updateEnrollment,
    deleteEnrollment: _deleteEnrollment,
    refresh,
  };
}
