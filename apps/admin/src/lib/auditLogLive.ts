import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { AuditEntry } from './types';

type AuditLogClient = SupabaseClient<Database>;

export interface MappedAuditLogData {
  entries: AuditEntry[];
}

export async function loadAuditLogData(client: AuditLogClient): Promise<MappedAuditLogData> {
  const { data, error } = await (client.from('audit_log') as any).select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw new Error('Could not load audit log. Please try again.');
  return {
    entries: (data ?? []).map((entry: any) => ({
      id: entry.id,
      actorId: entry.actor_id,
      action: entry.action,
      target: entry.target ?? '',
      at: entry.created_at,
    })),
  };
}
