import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isDemoSession } from './demoSession';
import {
  loadExaminationReportCardsData,
  type MappedExaminationReportCardsData,
} from './examinationReportCardsLive';
import { supabase } from './supabase';

const EMPTY_EXAMINATION_REPORT_CARDS_DATA: MappedExaminationReportCardsData = {
  examinations: [],
  marks: [],
};

export function useExaminationReportCardsData() {
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedExaminationReportCardsData>(EMPTY_EXAMINATION_REPORT_CARDS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadExaminationReportCardsData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load examinations.');
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

  const examinations = useMemo(
    () => (liveEnabled ? liveData.examinations : []),
    [liveEnabled, liveData.examinations],
  );

  const marks = useMemo(() => (liveEnabled ? liveData.marks : []), [liveEnabled, liveData.marks]);

  return {
    examinations,
    marks,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    refresh,
  };
}
