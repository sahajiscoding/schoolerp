# Diff report — reference vs clone (2026-11-07)

Overall parity: **85.2 / 100** (must-haves **26 of 28** done; `parity.py` on `features.csv`).
Verdict per replica-diff rules: **not shippable yet** — 2 must-haves remain open,
both backend/rich-text, not visual deltas:
1. Live Supabase wiring module by module (demo store only — declared next milestone).
2. Homework submit uses textarea; Tiptap rich-text pending.

Layout score: not machine-scored this pass (headless browser cannot capture
screenshots; no `imgdiff.py` run). S01 was verified by DOM measurement instead
(see token table below). S02+ internals are guess-marked (login-walled).

## Token table: reference vs clone

| role | reference (live DOM) | clone (`theme.ts` / Tailwind) | match |
| --- | --- | --- | --- |
| accent/primary | hsl(76,29%,31%) = `#5A6638` (rgb 90,102,56) | `#5A6638` (`brand.primary`, `olive.DEFAULT`, `navy`) | exact |
| accent-2 | hsl(76,29%,43%) = `#7C8D4E` (`--accent`) | `#7C8D4E` (`brand.accent`, `terracotta`) | exact |
| ring | hsl(76,29%,36%) = `#687641` (`--ring`, `--sidebar-ring`) | `#687641` (`brand.ring`, `sidebarRing`) | exact |
| hover-primary | hsl(0,99%,54%) = `#FE1616` (`--hover-primary`) | `#FE1616` (`brand.hover`, `hoverText`) | exact |
| on-accent | white (`--primary-foreground`) | `#FFFFFF` (`onPrimary`, `onAccent`) | exact |
| light bg | `#f8fafc` (spec) | `#f8fafc` (`bgLight`, `sand`) | exact (clone measured `rgb(248,250,252)`) |
| dark bg | `hsl(222.2,84%,4.9%)` ≈ `#020817` (`rgb(2,8,23)`) | `#0f172a` (slate-900) + `#1e293b` surface | **delta: clone is ~1 step lighter** |
| dark card | `hsl(222.2,84%,4.9%)` ≈ `#020817` | `#1e293b` (slate-800) | **delta** |
| dark border | `hsl(217.2,32.6%,17.5%)` | `slate-800` `#1e293b` | **delta (lighter)** |
| dark text | `hsl(210,40%,98%)` | `white` / `text-ink` on light | match (dark text-white) |
| dark muted | `hsl(215,20.2%,65.1%)` | `muted` `#64748b` | **delta: clone muted darker in dark mode** |
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

1. **Dark chrome one step lighter than reference** — clone `#0f172a`/`#1e293b` vs
   reference `#020817` (both bg and card). Fix: align `bgDark`/`surfaceDark` +
   dark `Card` surface toward `hsl(222.2,84%,4.9%)`; also dark border toward
   `hsl(217.2,32.6%,17.5%)` and dark muted toward `hsl(215,20.2%,65.1%)`.
   Owner decision needed before touching (concurrent accent work).
   **S01/login itself is now exempt** — rebuilt 2026-11-07 against the live
   reference with exact `#020817` light/dark tokens (see PROJECT_STATUS.md);
   this item covers the rest of the app shell only.
2. **S01 font**: reference renders system-ui, clone renders Roboto. Spec §3
   mandates Roboto — keep clone font; noting for completeness.
3. **S01 capture mode**: reference measured in dark (local night), clone in light.
   Mode difference is expected (daylight auto 05:00–18:00); not a delta in code.
4. **Login-walled screens** (S02–S25 internals): unknown by design — marked
   "guess" in `replica/recon.md`; verified only after Marion's own account
   observation. Not scraped, not bypassed.
5. **Tiptap editor** (S08): textarea today — functional, visual delta vs
   rich-text reference (guess-marked).
6. **Demo banner** is a clone addition ("Try a demo", banner). Supersedes
   reference login; intentional per school rule, not a delta to remove.

## Build / test results

- `npm run typecheck --workspace=apps/admin` — clean (exit 0).
- `npm run lint --workspace=apps/admin` — 0 errors, 4 pre-existing fast-refresh warnings.
- `npm run build --workspace=apps/admin` — passes (428 modules).
- `npm run test --workspace=apps/admin` — 6/6 vitest pass.
- `contrast.py` — 0 AA failures (see above).
- Code change this pass: `apps/admin/src/pages/DigitalLibrary.tsx` (Open e-book fix).
- 2026-11-07 follow-up: `apps/admin/src/pages/Login.tsx` + `src/index.css`
  rebuilt to live-reference parity (owner-confirmed). All S01 measurements in
  the table above now match exactly except the Roboto/system-ui font delta
  (item 2) and the documented mode difference (item 3).
