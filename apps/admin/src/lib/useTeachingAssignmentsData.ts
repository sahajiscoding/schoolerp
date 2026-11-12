import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createTeachingAssignment as createTeachingAssignmentLive,
  deleteTeachingAssignment as deleteTeachingAssignmentLive,
  loadTeachingAssignmentsData,
  type MappedTeachingAssignmentsData,
  type UpdateTeachingAssignmentInput,
} from './teachingAssignmentsLive';
import type { TeachingAssignment } from './types';
import { supabase } from './supabase';

const EMPTY_TEACHING_ASSIGNMENTS_DATA: MappedTeachingAssignmentsData = { assignments: [] };

export function useTeachingAssignmentsData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedTeachingAssignmentsData>(EMPTY_TEACHING_ASSIGNMENTS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadTeachingAssignmentsData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load teaching assignments.');
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

  const addTeachingAssignment = useCallback(
    async (input: Omit<TeachingAssignment, 'id'>) => {
      if (!liveEnabled || isDemoSession()) {
        demo.notify('Teaching assignment creation is not available in demo mode.');
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createTeachingAssignmentLive(supabase, {
        teacher_id: input.teacher_id,
        section_id: input.section_label,
        subject_id: input.subject,
      });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const updateTeachingAssignment = useCallback(
    async (input: UpdateTeachingAssignmentInput) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await createTeachingAssignmentLive(supabase, input as any);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const _deleteTeachingAssignment = useCallback(
    async (id: string) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await deleteTeachingAssignmentLive(supabase, id);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const assignments = useMemo(
    () => (liveEnabled ? liveData.assignments : demo.teachingAssignments),
    [liveEnabled, liveData.assignments, demo.teachingAssignments],
  );

  return {
    assignments,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addTeachingAssignment,
    updateTeachingAssignment,
    deleteTeachingAssignment: _deleteTeachingAssignment,
    refresh,
  };
}
