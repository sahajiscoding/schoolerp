import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { GalleryAlbum } from './types';

type GalleryClient = SupabaseClient<Database>;

export interface MappedGalleryData {
  albums: GalleryAlbum[];
}

export async function loadGalleryData(client: GalleryClient): Promise<MappedGalleryData> {
  const { data, error } = await (client.from('gallery_albums') as any).select('*').order('created_at', { ascending: false });
  if (error) throw new Error('Could not load gallery. Please try again.');
  return { albums: (data ?? []) as GalleryAlbum[] };
}
