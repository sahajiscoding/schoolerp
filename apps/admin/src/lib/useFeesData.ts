import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import { linkFeeSibling, loadFeesData, recordFeePayment, unlinkFeeSibling, type MappedFeesData } from './feesLive';
import { supabase } from './supabase';
import type { FeeInvoice, SiblingLink } from './types';

const EMPTY_FEES_DATA: MappedFeesData = { fees: [], siblings: [] };

export interface RecordPaymentInput {
  invoice_id: string;
  amount: number;
}

export interface LinkSiblingInput {
  student_id: string;
  sibling_id: string;
  discount_percent: number;
}

export function useFeesData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedFeesData>(EMPTY_FEES_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const demoFees = useMemo<FeeInvoice[]>(() => {
    if (profile?.role === 'student') {
      return demo.fees.filter((f) => f.student_id === profile.id);
    }
    return demo.fees;
  }, [demo.fees, profile]);

  const demoSiblings = useMemo<SiblingLink[]>(() => demo.siblings, [demo.siblings]);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !supabase) return null;
    return loadFeesData(supabase);
  }, [liveEnabled]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load fees.');
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

  const recordPayment = useCallback(
    async (input: RecordPaymentInput) => {
      if (!liveEnabled || isDemoSession()) {
        demo.recordPayment(input.invoice_id, input.amount);
        return;
      }
      if (!supabase || profile?.role !== 'admin') {
        throw new Error('Only an admin may record payments.');
      }
      await recordFeePayment(supabase, input.invoice_id, input.amount);
      await refresh();
    },
    [demo, liveEnabled, profile?.role, refresh]
  );

  const linkSibling = useCallback(
    async (input: LinkSiblingInput) => {
      if (!liveEnabled || isDemoSession()) {
        demo.linkSibling(
          input.student_id,
          input.sibling_id,
          input.discount_percent,
        );
        return;
      }
      if (!supabase || profile?.role !== 'admin') {
        throw new Error('Only an admin may link siblings.');
      }
      await linkFeeSibling(
        supabase,
        input.student_id,
        input.sibling_id,
        input.discount_percent,
      );
      await refresh();
    },
    [demo, liveEnabled, profile?.role, refresh]
  );

  const unlinkSibling = useCallback(
    async (linkId: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.unlinkSibling(linkId);
        return;
      }
      if (!supabase || profile?.role !== 'admin') {
        throw new Error('Only an admin may unlink siblings.');
      }
      await unlinkFeeSibling(supabase, linkId);
      await refresh();
    },
    [demo, liveEnabled, refresh]
  );

  const people = useMemo(() => (liveEnabled ? [] : demo.people), [liveEnabled, demo.people]);

  return {
    fees: liveEnabled ? liveData.fees : demoFees,
    siblings: liveEnabled ? liveData.siblings : demoSiblings,
    people,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    recordPayment,
    linkSibling,
    unlinkSibling,
    refresh,
  };
}
