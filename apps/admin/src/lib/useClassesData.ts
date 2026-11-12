import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createClass as createClassLive,
  updateClass as updateClassLive,
  deleteClass as deleteClassLive,
  loadClassesData,
  type MappedClassesData,
  type UpdateClassInput,
} from './classesLive';
import type { SchoolClass } from './types';
import { supabase } from './supabase';

const EMPTY_CLASSES_DATA: MappedClassesData = { classes: [] };

export function useClassesData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedClassesData>(EMPTY_CLASSES_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadClassesData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load classes.');
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

  const addClass = useCallback(
    async (input: Omit<SchoolClass, 'id'>) => {
      if (!liveEnabled || isDemoSession()) {
        demo.notify('Class creation is not available in demo mode.');
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createClassLive(supabase, { name: input.name, sort_order: input.sortOrder });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const updateClass = useCallback(
    async (input: UpdateClassInput) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await updateClassLive(supabase, input);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const _deleteClass = useCallback(
    async (id: string) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await deleteClassLive(supabase, id);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const classes = useMemo(() => (liveEnabled ? liveData.classes : demo.classes), [
    liveEnabled,
    liveData.classes,
    demo.classes,
  ]);

  const people = useMemo(() => (liveEnabled ? [] : demo.people), [liveEnabled, demo.people]);

  return {
    classes,
    people,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addClass,
    updateClass,
    removeClass: _deleteClass,
    deleteClass: _deleteClass,
    refresh,
  };
}
