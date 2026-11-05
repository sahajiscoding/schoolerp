// supabase/functions/admin-users/index.ts
//
// Admin-only user provisioning. Deployed with `supabase functions deploy
// admin-users`. The service role key lives only in the function's environment.
//
// POST body:
//   { action: 'create-admin', loginId, fullName, password }
//   { action: 'import-students', rows: [{ admissionNo, fullName, dateOfBirth }] }
//
// Every request must carry a valid JWT for an active admin profile. Nothing is
// returned that the caller could not already see, and every action is written
// to audit_log.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';

interface ImportRow {
  admissionNo: string;
  fullName: string;
  dateOfBirth: string;
}

const STUDENT_DOMAIN = 'pws.local';

/** School rule: Student@ + DDMMYYYY. */
function passwordFromDob(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) throw new Error(`Bad date of birth: ${isoDate}`);
  return `Student@${day.padStart(2, '0')}${month.padStart(2, '0')}${year}`;
}

function authEmail(loginId: string): string {
  const local = loginId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${local || 'user'}@${STUDENT_DOMAIN}`;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return json({ error: 'Function is not configured' }, 500);
  }

  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, 401);
  }

  // 1. Verify the caller and that they are an active admin.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: 'Invalid session' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: callerProfile, error: profileError } = await admin
    .from('profiles')
    .select('id, role, is_active')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !callerProfile) {
    return json({ error: 'Profile not found' }, 403);
  }
  if (callerProfile.role !== 'admin' || !callerProfile.is_active) {
    return json({ error: 'Admin role required' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const action = String(body.action ?? '');

  /* ------------------------------------------------------------------ */
  /* create-admin                                                        */
  /* ------------------------------------------------------------------ */
  if (action === 'create-admin') {
    const loginId = String(body.loginId ?? '').trim();
    const fullName = String(body.fullName ?? '').trim();
    const password = String(body.password ?? '');

    if (!loginId || !fullName) {
      return json({ error: 'loginId and fullName are required' }, 400);
    }
    if (password.length < 10) {
      return json({ error: 'Admin passwords must be at least 10 characters' }, 400);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      // Normalize identically to authEmail()/client toAuthEmail() so the created
      // account matches the sign-in lookup (audit finding F8).
      email: authEmail(loginId),
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, login_id: loginId },
    });
    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'Could not create the admin user' }, 400);
    }

    const { error: insertError } = await admin.from('profiles').insert({
      id: created.user.id,
      role: 'admin',
      full_name: fullName,
      login_id: loginId,
      must_change_password: true,
      is_active: true,
    });
    if (insertError) {
      // Roll the auth user back so we never leave an orphan login.
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: insertError.message }, 400);
    }

    await admin.from('audit_log').insert({
      actor_id: callerProfile.id,
      action: 'create-admin',
      entity_type: 'profile',
      entity_id: created.user.id,
      meta: { login_id: loginId },
    });

    return json({ ok: true, id: created.user.id, loginId, mustChangePassword: true });
  }

  /* ------------------------------------------------------------------ */
  /* import-students                                                     */
  /* ------------------------------------------------------------------ */
  if (action === 'import-students') {
    const rows = Array.isArray(body.rows) ? (body.rows as ImportRow[]) : [];
    if (rows.length === 0) {
      return json({ error: 'rows is required' }, 400);
    }
    if (rows.length > 200) {
      return json({ error: 'Import at most 200 students per request' }, 400);
    }

    const results: Array<{ admissionNo: string; status: string; password?: string; error?: string }> = [];

    for (const row of rows) {
      const admissionNo = String(row.admissionNo ?? '').trim();
      const fullName = String(row.fullName ?? '').trim();
      const dateOfBirth = String(row.dateOfBirth ?? '').trim();

      if (!admissionNo || !fullName || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        results.push({
          admissionNo,
          status: 'skipped',
          error: 'admissionNo, fullName and YYYY-MM-DD dateOfBirth are required',
        });
        continue;
      }

      const password = passwordFromDob(dateOfBirth);

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: authEmail(admissionNo),
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, login_id: admissionNo },
      });

      if (createError || !created.user) {
        results.push({ admissionNo, status: 'failed', error: createError?.message ?? 'unknown' });
        continue;
      }

      const { error: profileInsertError } = await admin.from('profiles').insert({
        id: created.user.id,
        role: 'student',
        full_name: fullName,
        login_id: admissionNo,
        must_change_password: true,
        is_active: true,
      });

      if (profileInsertError) {
        await admin.auth.admin.deleteUser(created.user.id);
        results.push({ admissionNo, status: 'failed', error: profileInsertError.message });
        continue;
      }

      await admin.from('student_details').insert({
        profile_id: created.user.id,
        admission_no: admissionNo,
        date_of_birth: dateOfBirth,
      });

      results.push({ admissionNo, status: 'created', password });
    }

    const createdCount = results.filter((r) => r.status === 'created').length;

    await admin.from('audit_log').insert({
      actor_id: callerProfile.id,
      action: 'import-students',
      entity_type: 'profile',
      meta: { requested: rows.length, created: createdCount },
    });

    return json({ ok: true, created: createdCount, results });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});
