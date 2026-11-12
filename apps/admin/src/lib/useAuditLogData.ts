import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import { loadAuditLogData, type MappedAuditLogData } from './auditLogLive';
import { supabase } from './supabase';

const EMPTY_AUDIT_LOG_DATA: MappedAuditLogData = { entries: [] };

export function useAuditLogData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedAuditLogData>(EMPTY_AUDIT_LOG_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadAuditLogData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load audit log.');
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

  const entries = useMemo(() => (liveEnabled ? liveData.entries : demo.audit), [
    liveEnabled,
    liveData.entries,
    demo.audit,
  ]);

  const people = useMemo(() => (liveEnabled ? [] : demo.people), [
    liveEnabled,
    demo.people,
  ]);

  return {
    entries,
    audit: entries,
    people,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    refresh,
  };
}
