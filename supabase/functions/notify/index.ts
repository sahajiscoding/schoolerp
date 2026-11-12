// supabase/functions/notify/index.ts
//
// Push fan-out Edge Function. Deployed with `supabase functions deploy notify`.
// The Expo access token lives only in the function's environment.
//
// POST body:
//   { kind: 'assignment' | 'thread' | 'notice', entity_id, actor_id }
//   The recipient list is expanded server-side; it is never accepted from the client.
//
// Every request must carry a valid JWT. The caller must be the author of the
// referenced entity (or an admin for notices).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  // Fail closed: the function is not configured.
  console.error('Notify function missing required env vars');
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendExpoPush(tokens: string[], title: string, body: string, data: Record<string, string>) {
  if (!EXPO_ACCESS_TOKEN) {
    console.error('EXPO_ACCESS_TOKEN not set; push notifications disabled');
    return { sent: 0, failed: tokens.length };
  }

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
    ttl: 86400,
    priority: 'high',
  }));

  // Expo allows up to 100 messages per batch.
  const batches: string[][] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    batches.push(tokens.slice(i, i + 100));
  }

  let sent = 0;
  let failed = 0;

  for (const batch of batches) {
    try {
      const resp = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${EXPO_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(batch),
      });
      const result = await resp.json();
      if (result.data) {
        for (const item of result.data) {
          if (item.status === 'ok') sent += 1;
          else failed += 1;
        }
      } else {
        failed += batch.length;
      }
    } catch {
      failed += batch.length;
    }
  }

  return { sent, failed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
    return json({ error: 'Function is not configured' }, 500);
  }

  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, 401);
  }

  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });

  // 1. Verify the caller.
  const { data: userData, error: userError } = await anonClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: 'Invalid session' }, 401);
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: callerProfile } = await adminClient
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', userData.user.id)
    .single();

  if (!callerProfile || !callerProfile.is_active) {
    return json({ error: 'Profile not found or inactive' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const kind = String(body.kind ?? '');
  const entityId = String(body.entity_id ?? '');
  const actorId = String(body.actor_id ?? '');

  if (!kind || !entityId || !actorId) {
    return json({ error: 'kind, entity_id and actor_id are required' }, 400);
  }

  if (!['assignment', 'thread', 'notice'].includes(kind)) {
    return json({ error: 'kind must be assignment, thread, or notice' }, 400);
  }

  // 2. Authorize: caller must be the author (or admin for notices).
  let recipientQuery: string;
  let title: string;
  let bodyText: string;
  let deepLink: string;

  if (kind === 'notice') {
    if (callerProfile.role !== 'admin') {
      return json({ error: 'Only admins can publish notices' }, 403);
    }
    const { data: notice } = await adminClient
      .from('notices')
      .select('title, body')
      .eq('id', entityId)
      .single();
    if (!notice) return json({ error: 'Notice not found' }, 404);
    title = notice.title;
    bodyText = notice.body;
    recipientQuery = 'user_id';
    deepLink = `/notices/${entityId}`;
  } else if (kind === 'thread') {
    const { data: thread } = await adminClient
      .from('threads')
      .select('subject, student_id, teacher_id')
      .eq('id', entityId)
      .single();
    if (!thread) return json({ error: 'Thread not found' }, 404);
    if (callerProfile.role === 'student' && thread.student_id !== userData.user.id) {
      return json({ error: 'Not a participant in this thread' }, 403);
    }
    if (callerProfile.role === 'teacher' && thread.teacher_id !== userData.user.id) {
      return json({ error: 'Not a participant in this thread' }, 403);
    }
    title = thread.subject;
    bodyText = 'New message';
    recipientQuery = 'user_id';
    deepLink = `/messages/${entityId}`;
  } else {
    // assignment
    const { data: assignment } = await adminClient
      .from('assignments')
      .select('title, teacher_id')
      .eq('id', entityId)
      .single();
    if (!assignment) return json({ error: 'Assignment not found' }, 404);
    if (assignment.teacher_id !== userData.user.id && callerProfile.role !== 'admin') {
      return json({ error: 'Not the author of this assignment' }, 403);
    }
    title = assignment.title;
    bodyText = 'New assignment';
    recipientQuery = 'user_id';
    deepLink = `/homeworks/${entityId}`;
  }

  // 3. Expand recipients server-side — never trust a client recipient list.
  // For assignments: recipients are students enrolled in the assignment's sections
  // plus individually targeted students. For threads: the student participant.
  // For notices: users in the notice_recipients table.
  let recipientIds: string[] = [];

  if (kind === 'thread') {
    const { data: thread } = await adminClient
      .from('threads')
      .select('student_id')
      .eq('id', entityId)
      .single();
    if (thread?.student_id) recipientIds.push(thread.student_id);
  } else if (kind === 'notice') {
    const { data: recipients } = await adminClient
      .from('notice_recipients')
      .select('user_id')
      .eq('notice_id', entityId);
    recipientIds = (recipients ?? []).map((r) => r.user_id);
  } else {
    // assignment: section enrolments + individual targets
    const { data: sectionRecipients } = await adminClient
      .from('assignment_recipients')
      .select('student_id')
      .eq('assignment_id', entityId);
    recipientIds = (sectionRecipients ?? []).map((r) => r.student_id);
  }

  // Deduplicate and exclude the sender.
  recipientIds = [...new Set(recipientIds)].filter((id) => id !== userData.user.id);

  // 4. Look up push tokens for recipients.
  const { data: tokens } = await adminClient
    .from('push_tokens')
    .select('user_id, expo_token')
    .filter('user_id', 'in', `(${recipientIds.join(',')})`);

  const expoTokens = (tokens ?? []).map((t) => t.expo_token).filter(Boolean);

  // 5. Insert notification_jobs with idempotency key.
  const idempotencyKey = `${kind}:${entityId}:${actorId}`;
  const { error: jobError } = await adminClient
    .from('notification_jobs')
    .insert({
      kind,
      entity_id: entityId,
      recipient_id: userData.user.id, // job owner is the actor
      idempotency_key: idempotencyKey,
      status: 'pending',
      attempts: 0,
    });

  if (jobError) {
    // Idempotency: job may already exist from a retry.
    if (!jobError.message.includes('duplicate') && !jobError.message.includes('unique')) {
      return json({ error: 'Could not create notification job' }, 500);
    }
  }

  // 6. Send push notifications.
  const { sent, failed } = await sendExpoPush(
    expoTokens,
    title,
    bodyText,
    { kind, entity_id: entityId, deep_link: deepLink },
  );

  // 7. Update job status.
  const status = expoTokens.length === 0 ? 'failed' : failed > 0 ? 'failed' : 'sent';
  await adminClient
    .from('notification_jobs')
    .update({ status, attempts: 1, last_error: failed > 0 ? `${failed} failed` : null })
    .eq('idempotency_key', idempotencyKey);

  // 8. Write audit log.
  await adminClient.from('audit_log').insert({
    actor_id: callerProfile.id,
    action: `notify:${kind}`,
    entity_type: kind,
    entity_id: entityId,
    meta: { recipients: recipientIds.length, sent, failed },
  });

  return json({
    ok: true,
    kind,
    entity_id: entityId,
    recipients: recipientIds.length,
    sent,
    failed,
  });
});
