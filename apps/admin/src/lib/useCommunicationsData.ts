import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createPollOptions,
  loadCommsData,
  sendMessage,
  signDeclarationForm,
  voteOnPoll,
  type MappedCommsData,
} from './communicationsLive';
import { supabase } from './supabase';
import type {
  DeclarationForm,
  Poll,
  ChatThread,
} from './types';

const EMPTY_COMMS_DATA: MappedCommsData = {
  declarations: [],
  polls: [],
  threads: [],
};

export function useCommunicationsData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedCommsData>(EMPTY_COMMS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const demoDeclarations = useMemo<DeclarationForm[]>(() => demo.declarations, [
    demo.declarations,
  ]);
  const demoPolls = useMemo<Poll[]>(() => demo.polls, [demo.polls]);
  const demoThreads = useMemo<ChatThread[]>(() => demo.threads, [demo.threads]);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !supabase) return null;
    return loadCommsData(supabase);
  }, [liveEnabled]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : 'Could not load communications.');
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

  const signDeclaration = useCallback(
    async (id: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.signDeclaration(id, profile?.id ?? '');
        return;
      }
      if (!supabase) throw new Error('Live mode is not available.');
      await signDeclarationForm(supabase, id);
      await refresh();
    },
    [demo, liveEnabled, profile?.id, refresh]
  );

  const createPoll = useCallback(
    async (input: {
      question: string;
      audience: string;
      created_by: string;
      closes_at: string;
      options: string[];
    }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.createPoll({
          question: input.question,
          audience: input.audience,
          created_by: input.created_by,
          closes_at: input.closes_at,
          options: input.options,
        });
        return;
      }
      if (!supabase || !profile) throw new Error('Live mode is not available.');
      const { data: pollData, error: pollError } = await (
        supabase.from('polls') as any
      )
        .insert({
          question: input.question,
          section_ids: input.audience ? [input.audience] : [],
          created_by: input.created_by,
          closes_on: input.closes_at,
          results_visible: false,
        })
        .select('id')
        .single();
      if (pollError || !pollData?.id) {
        throw new Error('Could not create the poll. Please try again.');
      }
      await createPollOptions(supabase, pollData.id, input.options);
      await refresh();
    },
    [demo, liveEnabled, profile, refresh, createPollOptions, supabase]
  );

  const votePoll = useCallback(
    async (pollId: string, optionId: string, studentId: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.votePoll(pollId, optionId, studentId);
        return;
      }
      if (!supabase) throw new Error('Live mode is not available.');
      await voteOnPoll(supabase, pollId, optionId);
      await refresh();
    },
    [demo, liveEnabled, refresh, supabase]
  );

  const sendCommsMessage = useCallback(
    async (threadId: string, senderId: string, body: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.sendMessage(threadId, senderId, body);
        return;
      }
      if (!supabase) throw new Error('Live mode is not available.');
      await sendMessage(supabase, threadId, body);
      await refresh();
    },
    [demo, liveEnabled, refresh, supabase]
  );

  return {
    declarations: liveEnabled ? liveData.declarations : demoDeclarations,
    polls: liveEnabled ? liveData.polls : demoPolls,
    threads: liveEnabled ? liveData.threads : demoThreads,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    signDeclaration,
    createPoll,
    votePoll,
    sendMessage: sendCommsMessage,
    refresh,
  };
}
