import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createSubject as createSubjectLive,
  updateSubject as updateSubjectLive,
  deleteSubject as deleteSubjectLive,
  loadSubjectsData,
  type MappedSubjectsData,
  type UpdateSubjectInput,
} from './subjectsLive';
import type { Subject } from './types';
import { supabase } from './supabase';

const EMPTY_SUBJECTS_DATA: MappedSubjectsData = { subjects: [] };

export function useSubjectsData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedSubjectsData>(EMPTY_SUBJECTS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadSubjectsData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load subjects.');
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

  const addSubject = useCallback(
    async (input: Omit<Subject, 'id'>) => {
      if (!liveEnabled || isDemoSession()) {
        demo.addSubject({ name: input.name, code: input.code, color: input.color });
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createSubjectLive(supabase, { name: input.name, code: input.code, color: input.color });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const updateSubject = useCallback(
    async (input: UpdateSubjectInput) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await updateSubjectLive(supabase, input);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const _deleteSubject = useCallback(
    async (id: string) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await deleteSubjectLive(supabase, id);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const subjects = useMemo(() => (liveEnabled ? liveData.subjects : demo.subjects), [
    liveEnabled,
    liveData.subjects,
    demo.subjects,
  ]);

  return {
    subjects,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addSubject,
    updateSubject,
    deleteSubject: _deleteSubject,
    refresh,
  };
}
