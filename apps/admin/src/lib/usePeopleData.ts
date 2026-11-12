import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createPerson as createPersonLive,
  updatePerson as updatePersonLive,
  deletePerson as deletePersonLive,
  loadPeopleData,
  type MappedPeopleData,
  type UpdatePersonInput,
} from './peopleLive';
import type { Person } from './types';
import { supabase } from './supabase';

const EMPTY_PEOPLE_DATA: MappedPeopleData = { people: [] };

export function usePeopleData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedPeopleData>(EMPTY_PEOPLE_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadPeopleData(supabase, profile.role, profile.id);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load people.');
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

  const addPerson = useCallback(
    async (input: Omit<Person, 'id' | 'created_at'>) => {
      if (!liveEnabled || isDemoSession()) {
        demo.addPerson({
          full_name: input.full_name,
          login_id: input.login_id,
          role: input.role,
          dob: input.dob,
          class_label: input.class_label,
          section_label: input.section_label,
        });
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createPersonLive(supabase, {
        full_name: input.full_name,
        login_id: input.login_id,
        role: input.role,
        dob: input.dob,
        class_label: input.class_label,
        section_label: input.section_label,
      });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const updatePerson = useCallback(
    async (input: UpdatePersonInput) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await updatePersonLive(supabase, input);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const _deletePerson = useCallback(
    async (id: string) => {
      if (!liveEnabled || isDemoSession()) return;
      if (!supabase) throw new Error('Supabase not configured.');
      await deletePersonLive(supabase, id);
      await refresh();
    },
    [liveEnabled, supabase, refresh],
  );

  const people = useMemo(() => (liveEnabled ? liveData.people : demo.people), [
    liveEnabled,
    liveData.people,
    demo.people,
  ]);

  return {
    people,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addPerson,
    updatePerson,
    deletePerson: _deletePerson,
    refresh,
  };
}
