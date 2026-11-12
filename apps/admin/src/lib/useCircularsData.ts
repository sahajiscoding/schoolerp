import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createCircular,
  loadCircularsData,
  type MappedCircularsData,
} from './circularsLive';
import { supabase } from './supabase';

const EMPTY_CIRCULARS_DATA: MappedCircularsData = { notices: [] };

export function useCircularsData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedCircularsData>(EMPTY_CIRCULARS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadCircularsData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load circulars.');
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

  const addCircular = useCallback(
    async (input: { title: string; body: string; created_by: string }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.addDeclaration?.({
          name: input.title,
          description: input.body,
          type: 'Circular',
        });
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createCircular(supabase, {
        title: input.title,
        body: input.body,
        created_by: input.created_by,
      });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const notices = useMemo(() => (liveEnabled ? liveData.notices : demo.declarations), [
    liveEnabled,
    liveData.notices,
    demo.declarations,
  ]);

  return {
    notices,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addCircular,
    refresh,
  };
}
