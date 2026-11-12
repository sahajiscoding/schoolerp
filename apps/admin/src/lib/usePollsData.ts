import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import { createPoll, loadPollsData, type MappedPollsData } from './pollsLive';
import { supabase } from './supabase';

const EMPTY_POLLS_DATA: MappedPollsData = { polls: [] };

export function usePollsData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedPollsData>(EMPTY_POLLS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadPollsData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load polls.');
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

  const addPoll = useCallback(
    async (input: { question: string; section_ids: string[]; created_by: string; closes_on?: string }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.createPoll({
          question: input.question,
          audience: input.section_ids.join(', '),
          created_by: input.created_by,
          closes_at: input.closes_on ?? '',
          options: [],
        });
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createPoll(supabase, {
        question: input.question,
        section_ids: input.section_ids,
        created_by: input.created_by,
        closes_on: input.closes_on,
      });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const polls = useMemo(() => (liveEnabled ? liveData.polls : demo.polls), [
    liveEnabled,
    liveData.polls,
    demo.polls,
  ]);

  return {
    polls,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addPoll,
    refresh,
  };
}
