import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { Poll } from './types';

type PollsClient = SupabaseClient<Database>;

export interface MappedPollsData {
  polls: Poll[];
}

export async function loadPollsData(client: PollsClient): Promise<MappedPollsData> {
  const { data, error } = await (client.from('polls') as any).select('*').order('created_at', { ascending: false });
  if (error) throw new Error('Could not load polls. Please try again.');
  return { polls: (data ?? []) as Poll[] };
}

export interface CreatePollInput {
  question: string;
  section_ids: string[];
  created_by: string;
  closes_on?: string;
}

export async function createPoll(client: PollsClient, input: CreatePollInput): Promise<void> {
  const { error } = await (client.from('polls') as any).insert({
    question: input.question,
    section_ids: input.section_ids,
    created_by: input.created_by,
    closes_on: input.closes_on ?? null,
    results_visible: false,
  });
  if (error) throw new Error('Could not create poll. Please try again.');
}
