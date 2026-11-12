import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { BroadcastMessage } from './types';

type CircularsClient = SupabaseClient<Database>;

export interface MappedCircularsData {
  notices: BroadcastMessage[];
}

export async function loadCircularsData(client: CircularsClient): Promise<MappedCircularsData> {
  const { data, error } = await (client.from('circulars') as any).select('*').order('published_at', { ascending: false });
  if (error) throw new Error('Could not load circulars. Please try again.');
  return {
    notices: (data ?? []).map((entry: any) => ({
      id: entry.id,
      title: entry.title,
      body: entry.body,
      section_label: entry.audience,
      created_by: entry.published_by,
      created_at: entry.published_at,
    })),
  };
}

export interface CreateCircularInput {
  title: string;
  body: string;
  created_by: string;
}

export async function createCircular(client: CircularsClient, input: CreateCircularInput): Promise<void> {
  const { error } = await (client.from('circulars') as any).insert({
    title: input.title,
    body: input.body,
    audience: 'Whole school',
    published_by: input.created_by,
    published_at: new Date().toISOString(),
  });
  if (error) throw new Error('Could not create circular. Please try again.');
}
