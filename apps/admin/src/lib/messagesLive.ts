import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { ChatMessage, ChatThread } from './types';

type MessagesClient = SupabaseClient<Database>;

export interface MappedMessagesData {
  threads: ChatThread[];
  messages: ChatMessage[];
}

export async function loadMessagesData(client: MessagesClient): Promise<MappedMessagesData> {
  const [threadsResult, messagesResult] = await Promise.all([
    (client.from('threads') as any).select('*').order('last_message_at', { ascending: false }),
    (client.from('messages') as any).select('*').order('created_at', { ascending: true }),
  ]);
  if (threadsResult.error || messagesResult.error) {
    throw new Error('Could not load messages. Please try again.');
  }
  return {
    threads: (threadsResult.data ?? []) as ChatThread[],
    messages: (messagesResult.data ?? []) as ChatMessage[],
  };
}

export interface SendMessageInput {
  thread_id: string;
  sender_id: string;
  body: string;
}

export async function sendLiveMessage(client: MessagesClient, input: SendMessageInput): Promise<void> {
  const { error } = await (client.from('messages') as any).insert({
    thread_id: input.thread_id,
    sender_id: input.sender_id,
    body: input.body,
    created_at: new Date().toISOString(),
  });
  if (error) throw new Error('Could not send message. Please try again.');
  const { error: updateError } = await (client.from('threads') as any).update({ last_message_at: new Date().toISOString() }).eq('id', input.thread_id);
  if (updateError) throw new Error('Could not update thread. Please try again.');
}

export interface CreateThreadInput {
  teacher_id: string;
  student_id: string;
  subject: string;
  body: string;
}

export async function createLiveThread(client: MessagesClient, input: CreateThreadInput): Promise<string> {
  const { data, error } = await (client.from('threads') as any).insert({
    teacher_id: input.teacher_id,
    student_id: input.student_id,
    subject: input.subject,
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }).select('id').single();
  if (error || !data) throw new Error('Could not create thread. Please try again.');
  await sendLiveMessage(client, {
    thread_id: data.id,
    sender_id: input.teacher_id,
    body: input.body,
  });
  return data.id;
}
