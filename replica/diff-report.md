# Diff report — reference vs clone (2026-11-07)

Overall parity: **85.2 / 100** (must-haves **26 of 28** done; `parity.py` on `features.csv`).
Verdict per replica-diff rules: **not shippable yet** — 2 must-haves remain open,
both backend/rich-text, not visual deltas:
1. Live Supabase wiring module by module (demo store only — declared next milestone).
2. Homework submit uses textarea; Tiptap rich-text pending.

Layout score: not screenshot-scored (the browser desktop window is not visible, so
`imgdiff.py` cannot run). S01–S03 were verified by live DOM/computed-style measurement
instead; S04+ internals remain guess-marked until owner-session review.

## Token table: reference vs clone

| role | reference (live DOM) | clone (`theme.ts` / Tailwind) | match |
| --- | --- | --- | --- |
| accent/primary | hsl(76,29%,31%) = `#5A6638` (rgb 90,102,56) | `#5A6638` (`brand.primary`, `olive.DEFAULT`, `navy`) | exact |
| accent-2 | hsl(76,29%,43%) = `#7C8D4E` (`--accent`) | `#7C8D4E` (`brand.accent`, `terracotta`) | exact |
| ring | hsl(76,29%,36%) = `#687641` (`--ring`, `--sidebar-ring`) | `#687641` (`brand.ring`, `sidebarRing`) | exact |
| hover-primary | hsl(0,99%,54%) = `#FE1616` (`--hover-primary`) | `#FE1616` (`brand.hover`, `hoverText`) | exact |
| on-accent | white (`--primary-foreground`) | `#FFFFFF` (`onPrimary`, `onAccent`) | exact |
| light bg | `#f8fafc` (spec) | `#f8fafc` (`bgLight`, `sand`) | exact (clone measured `rgb(248,250,252)`) |
| dark bg | `hsl(222.2,84%,4.9%)` ≈ `#020817` (`rgb(2,8,23)`) | `#020817` (`brand.dark`, shared `bgDark`) | exact for login/shell/dashboard |
| dark card | `hsl(222.2,84%,4.9%)` ≈ `#020817` | `#020817` (`brand.dark`, shared `surfaceDark`) | exact for login/dashboard hero |
| dark border | `hsl(217.2,32.6%,17.5%)` = `#1e293b` | `#1e293b` (`brand.darkBorder`) | exact |
| dark text | `hsl(210,40%,98%)` = `#f8fafc` | `slate-50` | exact |
| dark muted | `hsl(215,20.2%,65.1%)` = `#94a3b8` | `#94a3b8` (`brand.darkMuted`) | exact |
| font | system-ui on `/login` (measured) | Roboto (spec §3) | **delta: spec-mandated, keep Roboto** |
| S01 button | "Login" bg `rgb(90,102,56)` white text; "I forgot my password" olive link | identical classes/behavior | exact |

Contrast (`contrast.py replica/design/tokens.json`): **11 pairs, 0 failing AA**
(exit 0). One owner-accepted exception: white on accent-2 = 3.64:1 — large-text AA only;
secondary buttons must stay large/bold and darken to primary on hover (>=4.5:1).
Primary pair: white on `#5A6638` = 6.19:1 AAA. Text on bg: 17.06:1 AAA.

## Host finding

- `https://schoolerp-desktop.vercel.app/login` — **live clone** (title
  "Pacific World School ERP - Admin", bg `#f8fafc`, Roboto). Parity target ✓.
- `https://school-erp.vercel.app/login` (SCHOOL-ERP.VERCEL.APP) — title "React App";
  **not the clone**. Do not use.

## Punch list (remaining visible deltas)

1. ~~**Dark shell/dashboard chrome one step lighter than reference**~~ — fixed 2026-11-07:
   shell, footer, body, and dashboard hero now use measured `#020817` / `#1e293b` /
   `#94a3b8`. Untouched module cards may still use the older slate-800 surface until
   each S04+ page receives its live-reference review.
2. **S01 font**: reference renders system-ui, clone renders Roboto. Spec §3
   mandates Roboto — keep clone font; noting for completeness.
3. **S01 capture mode**: reference measured in dark (local night), clone in light.
   Mode difference is expected (daylight auto 05:00–18:00); not a delta in code.
4. **Remaining login-walled module screens** (S04–S25 internals): still guess-marked.
   S02 shell and S03 student dashboard were measured through the owner's authorized
   session on 2026-11-07; no bundle/private API was copied.
5. **Tiptap editor** (S08): textarea today — functional, visual delta vs
   rich-text reference (guess-marked).
6. **Demo banner** is a clone addition ("Try a demo", banner). Supersedes
   reference login; intentional per school rule, not a delta to remove.

## Build / test results

- `npm run typecheck --workspace=apps/admin` — clean (exit 0).
- `npm run lint --workspace=apps/admin` — 0 errors, 4 pre-existing fast-refresh warnings.
- `npm run build --workspace=apps/admin` — passes (2,472 modules after lucide shell rollout).
- `npm run test --workspace=apps/admin` — 7/7 vitest pass (includes multi-day dashboard event expansion).
- `contrast.py` — 0 AA failures (see above).
- Code change this pass: `apps/admin/src/pages/DigitalLibrary.tsx` (Open e-book fix).
- 2026-11-07 follow-up: `apps/admin/src/pages/Login.tsx` + `src/index.css`
  rebuilt to live-reference parity (owner-confirmed). All S01 measurements in
  the table above now match exactly except the Roboto/system-ui font delta
  (item 2) and the documented mode difference (item 3).
- 2026-11-07 S02/S03 follow-up: authenticated shell + student dashboard rebuilt
  from the owner's live session. DOM/computed-style geometry and light/dark surfaces
  match at identical viewports; browser console clean; Lighthouse accessibility and
  best-practices scores 100. Screenshot diff remains unavailable because the desktop
  browser window is hidden.
