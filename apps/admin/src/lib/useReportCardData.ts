import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createReportCard,
  loadReportCardsData,
  type MappedReportCardsData,
} from './reportCardLive';
import type { ReportCard } from './types';
import { supabase } from './supabase';

const EMPTY_REPORT_CARDS_DATA: MappedReportCardsData = { reportCards: [] };

export function useReportCardData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedReportCardsData>(EMPTY_REPORT_CARDS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadReportCardsData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load report cards.');
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

  const addReportCard = useCallback(
    async (input: Omit<ReportCard, 'id' | 'generated_at'>) => {
      if (!liveEnabled || isDemoSession()) {
        demo.addReportCard?.({
          student_id: input.student_id,
          term: input.term,
          academic_year: input.academic_year,
          class_label: input.class_label,
          section_label: input.section_label,
          subjects: input.subjects,
          total: input.total,
          max_total: input.max_total,
          percentage: input.percentage,
          grade: input.grade,
        });
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createReportCard(supabase, {
        student_id: input.student_id,
        term: input.term,
        academic_year: input.academic_year,
        class_label: input.class_label,
        section_label: input.section_label,
        subjects: input.subjects,
        total: input.total,
        max_total: input.max_total,
        percentage: input.percentage,
        grade: input.grade,
      });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const reportCards = useMemo(
    () => (liveEnabled ? liveData.reportCards : demo.reportCards),
    [liveEnabled, liveData.reportCards, demo.reportCards],
  );

  const people = useMemo(() => (liveEnabled ? [] : demo.people), [liveEnabled, demo.people]);

  const removeReportCard = useCallback(
    async (id: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.removeReportCard(id);
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      const { error } = await (supabase as any).from('report_cards').delete().eq('id', id);
      if (error) throw new Error('Could not remove report card. Please try again.');
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  return {
    reportCards,
    people,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addReportCard,
    removeReportCard,
    refresh,
  };
}
