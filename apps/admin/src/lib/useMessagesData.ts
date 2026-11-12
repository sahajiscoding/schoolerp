import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createLiveThread,
  loadMessagesData,
  sendLiveMessage,
  type MappedMessagesData,
} from './messagesLive';
import type { ChatMessage, ChatThread, Person } from './types';
import { supabase } from './supabase';

const EMPTY_MESSAGES_DATA: MappedMessagesData = { threads: [], messages: [] };

export interface UseMessagesDataReturn {
  threads: ChatThread[];
  messages: ChatMessage[];
  people: Person[];
  loading: boolean;
  error: string | null;
  isLive: boolean;
  notify: (message: string) => void;
  sendMessage: (threadId: string, senderId: string, body: string) => Promise<void>;
  createThread: (teacherId: string, studentId: string, subject: string, body: string) => Promise<string>;
  refresh: () => Promise<void>;
}

export function useMessagesData(): UseMessagesDataReturn {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);
  const [liveData, setLiveData] = useState<MappedMessagesData>(EMPTY_MESSAGES_DATA);
  const [loading, setLoading] = useState(liveEnabled);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadMessagesData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load messages.');
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

  const sendMessage = useCallback(
    async (threadId: string, senderId: string, body: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.sendMessage(threadId, senderId, body);
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await sendLiveMessage(supabase, { thread_id: threadId, sender_id: senderId, body });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const createThread = useCallback(
    async (teacherId: string, studentId: string, subject: string, body: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.createThread({
          subject,
          participant_ids: [teacherId, studentId],
          sender_id: teacherId,
          body,
        });
        return '';
      }
      if (!supabase) throw new Error('Supabase not configured.');
      return createLiveThread(supabase, { teacher_id: teacherId, student_id: studentId, subject, body });
    },
    [demo, liveEnabled, supabase],
  );

  const threads = useMemo(() => (liveEnabled ? liveData.threads : demo.threads), [
    liveEnabled,
    liveData.threads,
    demo.threads,
  ]);

  const messages = useMemo(() => (liveEnabled ? liveData.messages : []), [liveEnabled, liveData.messages]);

  const people = useMemo(() => (liveEnabled ? [] : demo.people), [liveEnabled, demo.people]);

  return {
    threads,
    messages,
    people,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    sendMessage,
    createThread,
    refresh,
  };
}
