import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { SchoolEvent } from './types';

type EventsClient = SupabaseClient<Database>;

type EventsRpcCall = (
  functionName: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

const eventsRpc = (client: EventsClient): EventsRpcCall =>
  client.rpc.bind(client) as unknown as EventsRpcCall;

export interface SchoolEventRow {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  section_ids: string[] | null;
  created_by: string;
  created_at: string;
}

export interface MappedEventsData {
  events: SchoolEvent[];
}

export function mapEventsData(
  rows: SchoolEventRow[],
): MappedEventsData {
  const events = rows.map<SchoolEvent>((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    type: r.kind as SchoolEvent['type'],
    start_date: r.start_date,
    end_date: r.end_date,
    audience: r.section_ids && r.section_ids.length > 0 ? 'Class only' : 'Whole school',
    section_label: undefined,
    created_by: r.created_by,
  }));

  return { events };
}

export async function loadEventsData(
  client: EventsClient,
): Promise<MappedEventsData> {
  const { data, error } = await client
    .from('school_events')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw new Error('Could not load events. Please try again.');
  return mapEventsData((data ?? []) as SchoolEventRow[]);
}

export interface PublishEventInput {
  title: string;
  description: string;
  kind: SchoolEvent['type'];
  start_date: string;
  end_date: string;
  section_ids: string[];
  audience: string;
}

export async function publishEvent(
  client: EventsClient,
  input: PublishEventInput,
): Promise<void> {
  const { error } = await eventsRpc(client)('event_publish', {
    p_title: input.title.trim(),
    p_description: input.description.trim() || null,
    p_start_date: input.start_date,
    p_end_date: input.end_date,
    p_kind: input.kind,
    p_section_ids: input.section_ids,
    p_audience: input.audience,
  });
  if (error) throw new Error('Could not publish the event. Please try again.');
}
