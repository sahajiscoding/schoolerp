#!/usr/bin/env node
/**
 * Bootstrap the first administrator.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/create-admin.mjs ADMIN001 "School Administrator"
 *
 * The password is then prompted for interactively (preferred — it stays out
 * of shell history). Or run `node scripts/create-admin.mjs` and answer all
 * prompts. The service role key is read from the environment, or from
 * .env.local, never typed into a browser.
 *
 * The service role key must stay on this machine. Never commit it, never put it
 * in apps/*, and never ship it to Vercel as a client variable.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    out[key] = value;
  }
  return out;
}

// Fixed, repo-local filenames — never derived from user input.
const ENV_FILES = ['.env.local', '.env'];
const fileEnv = Object.assign({}, ...ENV_FILES.map((name) => loadEnvFile(name)));

const url =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || fileEnv.SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  fileEnv.SUPABASE_SERVICE_ROLE_KEY ||
  fileEnv.SUPABASE_SECRET_KEY;

if (!url || !serviceRoleKey) {
  console.error(`
Missing configuration.

Set the project URL and the SERVICE ROLE key (server-side only):

  SUPABASE_URL=https://<project>.supabase.co \\
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \\
  node scripts/create-admin.mjs ADMIN001 "School Administrator"

The service role key is never used by the web apps. Do not put it in .env
files that Vite reads.
`);
  process.exit(1);
}

const rl = createInterface({ input, output });

const loginId = (process.argv[2] || (await rl.question('Admin login ID [ADMIN001]: ')) || 'ADMIN001').trim();
const fullName = (process.argv[3] || (await rl.question('Full name [School Administrator]: ')) || 'School Administrator').trim();
const password = (process.argv[4] || (await rl.question('Password (min 10 chars): ')) || '').trim();

rl.close();

if (!loginId || !fullName) {
  console.error('Login ID and full name are required.');
  process.exit(1);
}
if (password.length < 10) {
  console.error('Password must be at least 10 characters. Nothing was created.');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const email = `${loginId.toLowerCase()}@pws.local`;

console.log(`\nCreating admin "${fullName}" (${loginId}) …`);

const { data: existing } = await supabase
  .from('profiles')
  .select('id')
  .eq('login_id', loginId)
  .maybeSingle();

if (existing) {
  console.error(`A profile with login ID ${loginId} already exists (${existing.id}). Aborting.`);
  process.exit(1);
}

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName, login_id: loginId },
});

if (createError || !created.user) {
  console.error('Could not create the auth user:', createError?.message ?? 'unknown error');
  process.exit(1);
}

const { error: profileError } = await supabase.from('profiles').insert({
  id: created.user.id,
  role: 'admin',
  full_name: fullName,
  login_id: loginId,
  must_change_password: true,
  is_active: true,
});

if (profileError) {
  await supabase.auth.admin.deleteUser(created.user.id);
  console.error('Could not create the profile, auth user rolled back:', profileError.message);
  process.exit(1);
}

await supabase.from('audit_log').insert({
  actor_id: created.user.id,
  action: 'bootstrap-admin',
  entity_type: 'profile',
  entity_id: created.user.id,
  meta: { source: 'scripts/create-admin.mjs', login_id: loginId },
});

console.log(`
Admin created.

  Login ID : ${loginId}
  Password : ${password}
  Role     : admin

The account is flagged must_change_password, so the console will ask for a new
password at first sign-in. Share these credentials over a secure channel and
then delete this terminal history.
`);
