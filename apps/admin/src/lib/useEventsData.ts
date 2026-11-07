import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import { loadEventsData, type MappedEventsData } from './eventsLive';
import { supabase } from './supabase';
import type { SchoolEvent } from './types';

const EMPTY_EVENTS_DATA: MappedEventsData = { events: [] };

export function useEventsData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedEventsData>(EMPTY_EVENTS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const demoEvents = useMemo<SchoolEvent[]>(() => demo.events, [demo.events]);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !supabase) return null;
    return loadEventsData(supabase);
  }, [liveEnabled]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load events.');
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

  const publishEvent = useCallback(
    async (input: {
      title: string;
      description: string;
      kind: SchoolEvent['type'];
      start_date: string;
      end_date: string;
      section_ids: string[];
      audience: string;
    }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.addEvent({
          title: input.title,
          description: input.description,
          type: input.kind,
          start_date: input.start_date,
          end_date: input.end_date,
          audience: input.audience,
          created_by: profile?.id ?? '',
        });
        return;
      }
      if (!supabase || (profile?.role !== 'admin' && profile?.role !== 'teacher')) {
        throw new Error('Only staff may publish events.');
      }
      const { error } = await (supabase.rpc as any)('event_publish', {
        p_title: input.title,
        p_description: input.description,
        p_start_date: input.start_date,
        p_end_date: input.end_date,
        p_kind: input.kind,
        p_section_ids: input.section_ids,
        p_audience: input.audience,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [demo, liveEnabled, profile?.role, refresh, supabase]
  );

  const events = useMemo(() => (liveEnabled ? liveData.events : demoEvents), [
    liveEnabled,
    liveData.events,
    demoEvents,
  ]);

  return {
    events,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    publishEvent,
    refresh,
  };
}
