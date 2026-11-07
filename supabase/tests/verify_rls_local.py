"""Local RLS verification without the Supabase CLI.

pgTAP (`supabase/tests/*.sql`) is the canonical suite and needs `supabase test
db`. This script is the fallback for environments without Docker: it boots a
throwaway Postgres with `pgserver`, applies 0001-0004, seeds a school and
asserts the same rules through the `authenticated` role.

    python3 -m venv .venv && .venv/bin/pip install pgserver
    .venv/bin/python supabase/tests/verify_rls_local.py

Note: `SET LOCAL ROLE authenticated` must run inside the same transaction as the
statement under test — pgserver.psql() opens a new connection per call.
"""

import pgserver, tempfile, uuid, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
d = tempfile.mkdtemp(); db = pgserver.get_server(d, cleanup_mode='stop')
db.psql("""create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $fn$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid; $fn$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create schema if not exists storage;
create table storage.buckets (
  id text primary key, name text not null, public boolean not null default false,
  file_size_limit bigint, allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text not null references storage.buckets(id),
  name text not null, owner_id text, unique (bucket_id, name)
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(path text) returns text[] language sql immutable as $fn$
  select case when path not like '%/%' then array[]::text[]
    else string_to_array(regexp_replace(path, '/[^/]+$', ''), '/') end; $fn$;
""")

def migration(name):
    return (ROOT / 'supabase' / 'migrations' / name).read_text(encoding='utf-8')

db.psql(migration('0001_initial_schema.sql').replace('CREATE EXTENSION IF NOT EXISTS pgcrypto;',''))
db.psql(migration('0002_dashboard_modules.sql'))
db.psql(migration('0003_function_hardening.sql'))
db.psql(migration('0004_profiles_hardening.sql'))
db.psql(migration('0005_pws_clone_tables.sql'))
db.psql(migration('0006_homeworks_live.sql'))

ids = {k: str(uuid.uuid4()) for k in ['admin','cteach','oteach','sa','sb']}
sec, osec, cls, subj, assignment = (str(uuid.uuid4()) for _ in range(5))
for v in ids.values(): db.psql(f"insert into auth.users (id) values ('{v}');")
db.psql(f"""
insert into profiles (id, role, full_name, login_id) values
 ('{ids['admin']}','admin','Admin','A1'),('{ids['cteach']}','teacher','Class Teacher','T1'),
 ('{ids['oteach']}','teacher','Other Teacher','T2'),('{ids['sa']}','student','Student A','S1'),
 ('{ids['sb']}','student','Student B','S2');
insert into classes (id,name,sort_order) values ('{cls}','IX',1);
insert into sections (id,class_id,name,academic_year,class_teacher_id) values
 ('{sec}','{cls}','Z','2026-27','{ids['cteach']}'),('{osec}','{cls}','Y','2026-27',null);
insert into subjects (id,name,code) values ('{subj}','Math','M1');
insert into teaching_assignments (teacher_id,section_id,subject_id) values ('{ids['oteach']}','{osec}','{subj}');
insert into enrollments (student_id,section_id,roll_no,academic_year) values
 ('{ids['sa']}','{sec}','1','2026-27'),('{ids['sb']}','{osec}','2','2026-27');
insert into leave_requests (student_id,section_id,from_date,to_date,leave_type,reason) values
 ('{ids['sa']}','{sec}','2026-11-12','2026-11-13','Medical','Fever'),
 ('{ids['sb']}','{osec}','2026-11-18','2026-11-18','Travel','Wedding');
insert into attendance (student_id,section_id,date,mark,marked_by) values
 ('{ids['sa']}','{sec}','2026-11-03','present','{ids['cteach']}'),
 ('{ids['sb']}','{osec}','2026-11-03','absent','{ids['oteach']}');
insert into fee_records (student_id,academic_year,sibling_discount_percent) values
 ('{ids['sa']}','2026-27',0),('{ids['sb']}','2026-27',50);
insert into sibling_links (student_id,sibling_id,discount_percent) values ('{ids['sa']}','{ids['sb']}',50);
insert into report_cards (student_id,section_id,term,academic_year,created_by) values
  ('{ids['sa']}','{sec}','HALF YEARLY','2026-27','{ids['cteach']}');
insert into assignments (id,teacher_id,title,kind,subject_id) values
  ('{assignment}','{ids['oteach']}','RLS Homework','HOMEWORK','{subj}');
insert into assignment_sections (assignment_id,section_id) values ('{assignment}','{osec}');
insert into school_events (title,kind,start_date,end_date,section_ids,created_by) values
 ('Sports Day','Sports','2026-11-21','2026-11-21','{{}}','{ids['admin']}');
grant usage on schema auth to authenticated;
grant usage on schema public to authenticated;
grant usage on schema storage to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
grant execute on all functions in schema public to authenticated;
""")

# Migration 0006 intentionally closes direct academic writes after the broad
# local test grants above; re-apply those revocations to mirror Supabase.
db.psql("""
revoke insert, update, delete on assignments from authenticated;
revoke insert, update, delete on assignment_sections from authenticated;
revoke insert, update, delete on assignment_students from authenticated;
revoke insert, update, delete on submissions from authenticated;
""")
print("fixtures + grants OK\n")

def run_as(uid, sql):
    """One connection, one transaction: set claims, switch role, run, roll back."""
    claims = json.dumps({'sub': uid}).replace("'", "''")
    script = f"""
begin;
select set_config('request.jwt.claims', '{claims}', true);
set local role authenticated;
{sql}
rollback;
"""
    try:
        return True, db.psql(script)
    except Exception as e:
        return False, str(e)

def rows(uid, table, where='true'):
    ok, out = run_as(uid, f"select count(*) as n from {table} where {where};")
    if not ok: return f"ERR {out.splitlines()[0][:70]}"
    m = re.findall(r'^\s*(\d+)\s*$', out, re.M)
    return int(m[-1]) if m else '?'

def scalar(uid, sql):
    """Run a one-row query and return its first column.

    psql prints a header, a rule line, the value and a "(N rows)" footer, so the
    value is the line after the dashed rule of the LAST result set.
    """
    ok, out = run_as(uid, sql)
    if not ok:
        return f"ERR {out.splitlines()[0][:60]}"
    lines = out.splitlines()
    rule = max((i for i, l in enumerate(lines) if set(l.strip()) == {'-'}), default=None)
    if rule is None or rule + 1 >= len(lines):
        return '?'
    return lines[rule + 1].strip()

def attempt(uid, sql):
    """Blocked writes produce no command tag (the RLS error goes to stderr) and
    a blocked UPDATE/DELETE reports `UPDATE 0` / `DELETE 0`."""
    ok, out = run_as(uid, f"{sql} RETURNING 1;")
    err = [l for l in out.splitlines() if l.startswith("ERROR:")]
    if not ok or err:
        return "DENIED" if any("row-level security" in l or "permission denied" in l for l in err) else "OTHER"
    tag = re.search(r'^(INSERT \d+ (\d+)|UPDATE (\d+)|DELETE (\d+))', out, re.M)
    if not tag:
        return "DENIED"
    count = tag.group(2) or tag.group(3) or tag.group(4)
    if count == '0':
        return "NO-ROWS (blocked)"
    return "ALLOWED"

def invoke(uid, sql):
    """Run an RPC/SELECT and classify permission failures without mutating SQL."""
    ok, out = run_as(uid, sql)
    err = [l for l in out.splitlines() if l.startswith("ERROR:")]
    if not ok or err:
        return "DENIED" if any("permission denied" in l or "not targeted" in l or "only an active" in l for l in err) else "OTHER"
    return "ALLOWED"

checks = [
 ("class teacher reads section leaves", rows(ids['cteach'],'leave_requests'), 1),
 ("unrelated teacher reads no leaves", rows(ids['oteach'],'leave_requests',f"student_id='{ids['sa']}'"), 0),
 ("student reads own leave", rows(ids['sa'],'leave_requests',f"student_id='{ids['sa']}'"), 1),
 ("student cannot read peer leave", rows(ids['sb'],'leave_requests',f"student_id='{ids['sa']}'"), 0),
 ("student reads own attendance", rows(ids['sa'],'attendance',f"student_id='{ids['sa']}'"), 1),
 ("student cannot read peer attendance", rows(ids['sa'],'attendance',f"student_id='{ids['sb']}'"), 0),
 ("admin reads all attendance", rows(ids['admin'],'attendance'), 2),
 ("student reads own fee", rows(ids['sa'],'fee_records',f"student_id='{ids['sa']}'"), 1),
 ("student cannot read sibling fee", rows(ids['sa'],'fee_records',f"student_id='{ids['sb']}'"), 0),
 ("student sees own sibling link", rows(ids['sa'],'sibling_links'), 1),
 ("student reads own report card", rows(ids['sa'],'report_cards',f"student_id='{ids['sa']}'"), 1),
 ("student reads school events", rows(ids['sb'],'school_events'), 1),
 # Regression: teaches_section() used to compare `ta.section_id = section_id`,
 # where the bare name resolved to the parameter, making it true for every
 # caller. A teacher must NOT see another section's rows.
 ("unrelated teacher sees no other-section rows", rows(ids['oteach'],'leave_requests',f"student_id='{ids['sa']}'"), 0),
 ("teaches_section(other section) is false", scalar(ids['oteach'], f"select case when teaches_section('{sec}') then 'TRUE' else 'FALSE' end as v;"), 'FALSE'),
 ("teaches_section(own section) is true", scalar(ids['oteach'], f"select case when teaches_section('{osec}') then 'TRUE' else 'FALSE' end as v;"), 'TRUE'),
 ("targeted student reads homework", rows(ids['sb'],'assignments',f"id='{assignment}'"), 1),
 ("foreign student reads no homework", rows(ids['sa'],'assignments',f"id='{assignment}'"), 0),
 ("targeted student reads homework section", rows(ids['sb'],'assignment_sections',f"assignment_id='{assignment}'"), 1),
]
fails = 0
for name, got, want in checks:
    ok = got == want; fails += 0 if ok else 1
    print(f"{'PASS' if ok else 'FAIL'}  {name:40s} got={got} want={want}")

print()
neg = [
 ("student marks attendance", attempt(ids['sa'], f"insert into attendance (student_id,section_id,date,mark) values ('{ids['sa']}','{sec}','2026-11-09','present')")),
 ("student authors report card", attempt(ids['sa'], f"insert into report_cards (student_id,term,academic_year,created_by) values ('{ids['sa']}','X','2026-27','{ids['sa']}')")),
 ("student creates sibling link", attempt(ids['sa'], f"insert into sibling_links (student_id,sibling_id,discount_percent) values ('{ids['sb']}','{ids['sa']}',50)")),
 ("student approves own leave", attempt(ids['sb'], f"update leave_requests set status='approved' where student_id='{ids['sb']}'")),
 ("teacher creates school-wide event", attempt(ids['cteach'], f"insert into school_events (title,kind,start_date,end_date,section_ids,created_by) values ('Fake','Holiday','2026-12-01','2026-12-01','{{}}','{ids['cteach']}')")),
 # Regression: the threads INSERT policy compared `e.student_id = student_id`,
 # which collapsed to a tautology and let a teacher open a thread with ANY
 # student. 'sa' sits in a section this teacher does not teach.
 ("teacher opens thread with foreign student", attempt(ids['oteach'], f"insert into threads (teacher_id,student_id,subject) values ('{ids['oteach']}','{ids['sa']}','Extra classes')")),
 # Regression (security audit run-1 / migration 0004):
 # F1 — a user must not be able to raise their own role / is_active / login_id.
 ("student escalates own role to admin", attempt(ids['sa'], f"update profiles set role='admin' where id='{ids['sa']}'")),
 ("student flips own is_active", attempt(ids['sa'], f"update profiles set is_active=false where id='{ids['sa']}'")),
 ("student rewrites own login_id", attempt(ids['sa'], f"update profiles set login_id='HACKED' where id='{ids['sa']}'")),
 # F2 — the audit trail must not be forgeable by a regular user.
 ("student forges an audit_log entry", attempt(ids['sa'], f"insert into audit_log (actor_id,action,entity_type) values ('{ids['admin']}','create-admin','profile')")),
 # F3/F4 — teacher writes must be scoped to students they teach (sa is NOT oteach's).
 ("unrelated teacher marks foreign attendance", attempt(ids['oteach'], f"insert into attendance (student_id,section_id,date,mark,marked_by) values ('{ids['sa']}','{sec}','2026-11-10','present','{ids['oteach']}')")),
 ("unrelated teacher authors foreign report card", attempt(ids['oteach'], f"insert into report_cards (student_id,term,academic_year,created_by) values ('{ids['sa']}','FORGED','2026-27','{ids['oteach']}')")),
 ("student forges peer submission", attempt(ids['sb'], f"insert into submissions (assignment_id,student_id,body) values ('{assignment}','{ids['sa']}','forged')")),
 ("foreign student submits homework", invoke(ids['sa'], f"select submit_assignment('{assignment}','forged',null);")),
 ("admin submits homework", invoke(ids['admin'], f"select submit_assignment('{assignment}','forged',null);")),
 ("student uploads to peer folder", attempt(ids['sb'], f"insert into storage.objects (bucket_id,name) values ('submission-files','{ids['sa']}/forged.pdf')")),
 ("student uploads homework source", attempt(ids['sb'], f"insert into storage.objects (bucket_id,name) values ('homework-files','{ids['sb']}/forged.pdf')")),
]
for name, res in neg:
    ok = res.startswith("DENIED") or res.startswith("NO-ROWS"); fails += 0 if ok else 1
    print(f"{'PASS' if ok else 'FAIL'}  {name:40s} {res}")

print()
pos = [
 ("class teacher approves leave", attempt(ids['cteach'], f"update leave_requests set status='approved', decided_by='{ids['cteach']}' where student_id='{ids['sa']}'")),
 ("teacher creates class event", attempt(ids['oteach'], f"insert into school_events (title,kind,start_date,end_date,section_ids,created_by) values ('Unit test','Exam','2026-12-02','2026-12-02',ARRAY['{osec}']::uuid[],'{ids['oteach']}')")),
 ("admin applies sibling discount", attempt(ids['admin'], f"update fee_records set sibling_discount_percent=50 where student_id='{ids['sb']}'")),
 ("teacher opens thread with own student", attempt(ids['oteach'], f"insert into threads (teacher_id,student_id,subject) values ('{ids['oteach']}','{ids['sb']}','Revision plan')")),
 # Regression (migration 0004) — legitimate self-service / in-scope writes still work.
 ("student updates own full_name", attempt(ids['sa'], f"update profiles set full_name='Student A Renamed' where id='{ids['sa']}'")),
 ("teacher marks own-student attendance", attempt(ids['oteach'], f"insert into attendance (student_id,section_id,date,mark,marked_by) values ('{ids['sb']}','{osec}','2026-11-12','present','{ids['oteach']}')")),
 ("teacher authors own-student report card", attempt(ids['oteach'], f"insert into report_cards (student_id,term,academic_year,created_by) values ('{ids['sb']}','UNIT','2026-27','{ids['oteach']}')")),
 ("targeted student submits homework", invoke(ids['sb'], f"select submit_assignment('{assignment}','done',null);")),
 ("teacher publishes to own subject section", invoke(ids['oteach'], f"select publish_assignment('RPC Homework','valid','2026-12-20','HOMEWORK','{subj}',array['{osec}']::uuid[],array[]::uuid[],null);")),
 ("student uploads own submission file", attempt(ids['sb'], f"insert into storage.objects (bucket_id,name) values ('submission-files','{ids['sb']}/answer.pdf')")),
 ("teacher uploads own homework file", attempt(ids['oteach'], f"insert into storage.objects (bucket_id,name) values ('homework-files','{ids['oteach']}/source.pdf')")),
]
for name, res in pos:
    ok = res == "ALLOWED"; fails += 0 if ok else 1
    print(f"{'PASS' if ok else 'FAIL'}  {name:40s} {res}")

print("\nRESULT:", "ALL PASS" if fails == 0 else f"{fails} FAILURES")
