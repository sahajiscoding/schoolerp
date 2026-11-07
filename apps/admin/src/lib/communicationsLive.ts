import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { DeclarationForm, Poll, ChatThread } from './types';

type CommsClient = SupabaseClient<Database>;

type CommsRpcCall = (
  functionName: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

const commsRpc = (client: CommsClient): CommsRpcCall =>
  client.rpc.bind(client) as unknown as CommsRpcCall;

export interface DeclarationFormRow {
  id: string;
  title: string;
  body: string;
  audience: string;
  section_ids: string[];
  created_by: string;
  due_date: string | null;
  created_at: string;
}

export interface DeclarationSignatureRow {
  form_id: string;
  student_id: string;
  signed_at: string;
}

export interface PollRow {
  id: string;
  question: string;
  section_ids: string[];
  created_by: string;
  closes_on: string;
  results_visible: boolean;
  created_at: string;
}

export interface PollOptionRow {
  id: string;
  poll_id: string;
  label: string;
  position: number;
}

export interface PollVoteRow {
  poll_id: string;
  option_id: string;
  student_id: string;
  voted_at: string;
}

export interface ThreadRow {
  id: string;
  teacher_id: string;
  student_id: string;
  subject: string;
  campaign_id: string;
  last_message_at: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface MappedCommsData {
  declarations: DeclarationForm[];
  polls: Poll[];
  threads: ChatThread[];
}

export function mapCommsData(
  declarations: DeclarationFormRow[],
  signatures: DeclarationSignatureRow[],
  polls: PollRow[],
  options: PollOptionRow[],
  votes: PollVoteRow[],
  threads: ThreadRow[],
  messages: MessageRow[],
): MappedCommsData {
  const declarationMap = new Map<string, DeclarationForm>();
  for (const d of declarations) {
    declarationMap.set(d.id, {
      id: d.id,
      name: d.title,
      description: d.body,
      type: d.audience,
      status: 'pending',
      signed_at: undefined,
      signed_by: [],
    });
  }
  for (const s of signatures) {
    const existing = declarationMap.get(s.form_id);
    if (existing) {
      existing.status = 'signed';
      existing.signed_at = s.signed_at;
      existing.signed_by = [...(existing.signed_by ?? []), s.student_id];
    }
  }

  const pollMap = new Map<string, Poll>();
  for (const p of polls) {
    pollMap.set(p.id, {
      id: p.id,
      question: p.question,
      audience: p.section_ids.join(', ') || 'Whole school',
      created_by: p.created_by,
      created_at: p.created_at,
      closes_at: p.closes_on,
      options: [],
      votes: {},
    });
  }
  for (const o of options) {
    const poll = pollMap.get(o.poll_id);
    if (poll) {
      poll.options.push({ id: o.id, label: o.label });
    }
  }
  for (const v of votes) {
    const poll = pollMap.get(v.poll_id);
    if (poll) {
      poll.votes[v.student_id] = v.option_id;
    }
  }

  const threadMap = new Map<string, ChatThread>();
  for (const t of threads) {
    threadMap.set(t.id, {
      id: t.id,
      subject: t.subject,
      participant_ids: [t.teacher_id, t.student_id],
      messages: [],
      created_at: t.created_at,
    });
  }
  for (const m of messages) {
    const thread = threadMap.get(m.thread_id);
    if (thread) {
      thread.messages.push({
        id: m.id,
        sender_id: m.sender_id,
        body: m.body,
        created_at: m.created_at,
      });
    }
  }

  return {
    declarations: Array.from(declarationMap.values()),
    polls: Array.from(pollMap.values()),
    threads: Array.from(threadMap.values()),
  };
}

export async function loadCommsData(client: CommsClient): Promise<MappedCommsData> {
  const [
    declarationsResult,
    signaturesResult,
    pollsResult,
    optionsResult,
    votesResult,
    threadsResult,
    messagesResult,
  ] = await Promise.all([
    client.from('declaration_forms').select('*').order('created_at', { ascending: false }),
    client.from('declaration_signatures').select('*'),
    client.from('polls').select('*').order('created_at', { ascending: false }),
    client.from('poll_options').select('*').order('position', { ascending: true }),
    client.from('poll_votes').select('*'),
    client.from('threads').select('*').order('last_message_at', { ascending: false }),
    client.from('messages').select('*').order('created_at', { ascending: true }),
  ]);

  if (
    declarationsResult.error ||
    signaturesResult.error ||
    pollsResult.error ||
    optionsResult.error ||
    votesResult.error ||
    threadsResult.error ||
    messagesResult.error
  ) {
    throw new Error('Could not load communications data. Please try again.');
  }

  return mapCommsData(
    (declarationsResult.data ?? []) as DeclarationFormRow[],
    (signaturesResult.data ?? []) as DeclarationSignatureRow[],
    (pollsResult.data ?? []) as PollRow[],
    (optionsResult.data ?? []) as PollOptionRow[],
    (votesResult.data ?? []) as PollVoteRow[],
    (threadsResult.data ?? []) as ThreadRow[],
    (messagesResult.data ?? []) as MessageRow[],
  );
}

export async function signDeclarationForm(
  client: CommsClient,
  formId: string
): Promise<void> {
  const { error } = await commsRpc(client)('declarations_sign', {
    p_form_id: formId,
  });
  if (error) throw new Error('Could not sign the declaration. Please try again.');
}

export async function createPollOptions(
  client: CommsClient,
  pollId: string,
  labels: string[]
): Promise<void> {
  const { error } = await commsRpc(client)('polls_create_options', {
    p_poll_id: pollId,
    p_labels: labels,
  });
  if (error) throw new Error('Could not add poll options. Please try again.');
}

export async function voteOnPoll(
  client: CommsClient,
  pollId: string,
  optionId: string
): Promise<void> {
  const { error } = await commsRpc(client)('polls_vote', {
    p_poll_id: pollId,
    p_option_id: optionId,
  });
  if (error) throw new Error('Could not record your vote. Please try again.');
}

export async function sendMessage(
  client: CommsClient,
  threadId: string,
  body: string
): Promise<void> {
  const { error } = await commsRpc(client)('messages_send', {
    p_thread_id: threadId,
    p_body: body,
  });
  if (error) throw new Error('Could not send the message. Please try again.');
}
