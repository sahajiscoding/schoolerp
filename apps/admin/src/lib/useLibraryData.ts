import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import { issueLibraryBook, loadLibraryData, reserveLibraryBook, returnLibraryBook, type MappedLibraryData } from './libraryLive';
import { supabase } from './supabase';
import type { Book, BookIssue } from './types';

const EMPTY_LIBRARY_DATA: MappedLibraryData = { books: [], issues: [] };

export interface IssueBookInput {
  book_id: string;
  student_id: string;
  due_at: string;
}

export function useLibraryData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedLibraryData>(EMPTY_LIBRARY_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const demoBooks = useMemo<Book[]>(() => {
    return demo.books;
  }, [demo.books, profile]);

  const demoIssues = useMemo<BookIssue[]>(() => {
    if (profile?.role === 'student') {
      return demo.bookIssues.filter((i) => i.student_id === profile.id);
    }
    return demo.bookIssues;
  }, [demo.bookIssues, profile]);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadLibraryData(supabase, profile.id, profile.role);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load library data.');
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

  const issueBook = useCallback(
    async (input: IssueBookInput) => {
      if (!liveEnabled || isDemoSession()) {
        demo.issueBook({
          book_id: input.book_id,
          student_id: input.student_id,
          due_at: input.due_at,
        });
        return;
      }
      if (!supabase || profile?.role !== 'teacher' && profile?.role !== 'admin') {
        throw new Error('Only staff may issue books.');
      }
      await issueLibraryBook(supabase, input.book_id, input.student_id, input.due_at);
      await refresh();
    },
    [demo, liveEnabled, profile?.role, refresh]
  );

  const returnBook = useCallback(
    async (transactionId: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.returnBook(transactionId);
        return;
      }
      if (!supabase) throw new Error('Live mode is not available.');
      await returnLibraryBook(supabase, transactionId);
      await refresh();
    },
    [demo, liveEnabled, refresh]
  );

  const reserveBook = useCallback(
    async (bookId: string, studentId: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.reserveBook(bookId, studentId);
        return;
      }
      if (!supabase) throw new Error('Live mode is not available.');
      await reserveLibraryBook(supabase, bookId, studentId);
      await refresh();
    },
    [demo, liveEnabled, refresh]
  );

  return {
    books: liveEnabled ? liveData.books : demoBooks,
    issues: liveEnabled ? liveData.issues : demoIssues,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    issueBook,
    returnBook,
    reserveBook,
    refresh,
  };
}
