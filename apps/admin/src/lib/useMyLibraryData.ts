import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isDemoSession } from './demoSession';
import { loadMyLibraryData, type MappedMyLibraryData } from './myLibraryLive';
import { supabase } from './supabase';

const EMPTY_MY_LIBRARY_DATA: MappedMyLibraryData = { issues: [] };

export function useMyLibraryData() {
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedMyLibraryData>(EMPTY_MY_LIBRARY_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadMyLibraryData(supabase, profile.id);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load library issues.');
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

  const issues = useMemo(
    () => (liveEnabled ? liveData.issues : []),
    [liveEnabled, liveData.issues],
  );

  return {
    issues,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    refresh,
  };
}
