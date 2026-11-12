import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createDeclarationForm,
  signDeclaration,
  loadDeclarationFormsData,
  type MappedDeclarationFormsData,
} from './declarationFormsLive';
import { supabase } from './supabase';

const EMPTY_DECLARATION_FORMS_DATA: MappedDeclarationFormsData = { declarations: [] };

export function useDeclarationFormsData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedDeclarationFormsData>(EMPTY_DECLARATION_FORMS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadDeclarationFormsData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load declaration forms.');
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

  const addDeclarationForm = useCallback(
    async (input: { name: string; description: string; type: string }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.addDeclaration?.({
          name: input.name,
          description: input.description,
          type: input.type,
        });
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createDeclarationForm(supabase, {
        name: input.name,
        description: input.description,
        type: input.type,
      });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const declarations = useMemo(
    () => (liveEnabled ? liveData.declarations : demo.declarations),
    [liveEnabled, liveData.declarations, demo.declarations],
  );

  const signDeclarationRecord = useCallback(
    async (id: string, studentId: string) => {
      if (!liveEnabled || isDemoSession()) {
        demo.signDeclaration(id, studentId);
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await signDeclaration(supabase, { id, student_id: studentId });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  return {
    declarations,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addDeclarationForm,
    signDeclaration: signDeclarationRecord,
    refresh,
  };
}
