import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isDemoSession } from './demoSession';
import { loadGalleryData, type MappedGalleryData } from './galleryLive';
import { supabase } from './supabase';

const EMPTY_GALLERY_DATA: MappedGalleryData = { albums: [] };

export function useGalleryData() {
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedGalleryData>(EMPTY_GALLERY_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadGalleryData(supabase);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load gallery.');
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

  const albums = useMemo(() => (liveEnabled ? liveData.albums : []), [
    liveEnabled,
    liveData.albums,
  ]);

  return {
    albums,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    refresh,
  };
}
