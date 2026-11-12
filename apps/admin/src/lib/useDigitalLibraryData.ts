import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createStudyMaterial,
  loadDigitalLibraryData,
  type MappedDigitalLibraryData,
} from './digitalLibraryLive';
import type { StudyMaterial } from './types';
import { supabase } from './supabase';

const EMPTY_DIGITAL_LIBRARY_DATA: MappedDigitalLibraryData = { materials: [] };

export function useDigitalLibraryData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedDigitalLibraryData>(EMPTY_DIGITAL_LIBRARY_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadDigitalLibraryData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load digital library.');
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

  const addStudyMaterial = useCallback(
    async (input: Omit<StudyMaterial, 'id' | 'created_at'>) => {
      if (!liveEnabled || isDemoSession()) {
        demo.addStudyMaterial?.({
          title: input.title,
          description: input.description,
          subject: input.subject,
          section_label: input.section_label,
          file_name: input.file_name,
          file_size: input.file_size,
          type: input.type,
          uploaded_by: input.uploaded_by,
        });
        return;
      }
      if (!supabase) throw new Error('Supabase not configured.');
      await createStudyMaterial(supabase, {
        title: input.title,
        description: input.description,
        subject: input.subject,
        section_label: input.section_label,
        file_name: input.file_name,
        file_size: input.file_size,
        type: input.type,
        uploaded_by: input.uploaded_by,
      });
      await refresh();
    },
    [demo, liveEnabled, supabase, refresh],
  );

  const materials = useMemo(
    () => (liveEnabled ? liveData.materials : demo.studyMaterials),
    [liveEnabled, liveData.materials, demo.studyMaterials],
  );

  return {
    materials,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addStudyMaterial,
    refresh,
  };
}
