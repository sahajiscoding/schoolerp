# REA notes — morluto/rea (fetched 2026-11-07)

Source: https://github.com/morluto/rea (README, raw `main/README.md`).
No `SKILL.md` at repo root (404 on `raw.githubusercontent.com/morluto/rea/main/SKILL.md`;
skill install is via `npx rea-agents setup` / skills.sh, not a plain file).

## Intended role

REA ("Reverse Engineer Anything") is an MCP + CLI toolkit for investigating
software you own or are authorized to examine: native binaries (Hopper/Ghidra/IDA/Kuna),
static JS/Electron bundles, .NET, APKs, websites (Chrome-family browser analysis),
network captures, and more. It returns findings with evidence + limitations, which the
agent then uses to write and test its own implementation. Key commands: `npx rea-agents setup`,
`rea analyze-javascript-application`, MCP tools for website/browser observation
(`docs/browser-observation.md`).

## How it overlaps this replica build

- Where it overlaps (website/browser observation, page structure + screenshots),
  this build follows **replica-skill clean-room rules**, which win on conflict:
  public pages + Marion's own account only, human-speed reading, no bundle/API harvesting.
- REA's workflow (ask → inspect → explain with evidence → implement → test) maps to
  replica-recon → replica-build → replica-test → replica-diff. For this ERP the
  "inspect" step is done via the connected browser's DOM evaluation (documentElement
  inline styles, computed styles) rather than REA's MCP, because: (1) no login bypass
  is needed — `/login` is public, dashboard is login-gated and out of scope for scraping;
  (2) the authoritative design signal is the live authenticated-DOM inline style, which
  DOM evaluation reads directly without touching private APIs.
- What was NOT used from REA: native-binary / bundle decompilation (forbidden by
  replica clean-room rules for this task), RL-environment export, Android/device flows.

## Verdict

REA confirms the method (evidence-first, behavior reconstruction) but does not change
any file, token, or screen in this pass. Where REA would decompile bundles or trace
network calls, replica-skill rules prohibit it — those paths were not taken.
