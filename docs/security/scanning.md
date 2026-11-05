# Security scanning — what runs, what it needs, what it costs

This repository runs GitHub's own **CodeQL** plus two free scanners (**Codacy**,
**OSSAR**) on top of the CI gate. Every check that runs is runnable without a
paid vendor account, so a red check now means a real finding, not a missing
credential.

> **2026-11-05:** all seven paid vendor scanners were **removed** — Black Duck,
> Synopsys, CxFlow, Checkmarx One, CodeScan, Endor Labs and Debricked. They only
> ever failed on missing vendor credentials, never on a real finding. CodeQL
> remains the always-on baseline.

## Runnable today (no vendor account)

| Workflow | File | What it does |
|---|---|---|
| CodeQL (JavaScript/TypeScript **and** Actions) | `codeql.yml` | GitHub's own engine. Free, no setup. Scans application code **and** the workflow files themselves. |
| Codacy | `codacy.yml` | Runs only Codacy's free, default rule sets without a project token. |
| OSSAR | `ossar.yml` | Runs Microsoft's open-source CLI on `windows-latest`. |
| CI (lint, typecheck, build) | `ci.yml` | Not a scanner, but the gate that matters most. |

CodeQL is the workflow that feeds the **Security → Code scanning** tab for this
repository. Codacy and OSSAR also upload SARIF and add their findings on top.

## Removed vendor scanners

The seven paid vendor scanners — Black Duck, Synopsys, CxFlow, Checkmarx One,
CodeScan, Endor Labs and Debricked — were removed on **2026-11-05**. They
overlapped heavily on the same ~4 kloc and, lacking vendor credentials, only ever
produced red authentication-error checks, never a real finding. Deleting a
workflow does not delete historical alerts, but it stops the failing checks. If
the school later provisions a vendor account, re-add that one scanner
deliberately rather than restoring all seven.

## Dependency advisories

`npm audit` reports **0 vulnerabilities** as of this commit. Three advisories
were present and are all fixed:

| Advisory | Package | Resolution |
|---|---|---|
| GHSA-mrhx-c7xc-m3w5 | `zod` < 4.6.6 | Bumped to 4.6.7 (PR #1, merged into `main`). |
| GHSA-3g3m-2fjr-6pw4 | `glob` 9.0.0 – 14.0.1 | `overrides` pin every copy to `^14.0.3`. |
| GHSA-g3hv-75wg-m249 | `minimatch` ≥ 7.0.0 < 11.0.1 | `overrides` pin every copy to `^11.0.4`. |

The `overrides` block in the root `package.json` is load-bearing; removing it
will reintroduce the two moderate advisories through Expo and ESLint. Each
override is scoped to a package whose declared range can actually satisfy the
patched version — an override that contradicts a parent's range makes npm 10
fail the install outright.

## Reading a failing scan correctly

Before treating a red scanning check as "we have a vulnerability":

1. Open the job log and look for *authentication*, *unauthorized*,
   *missing token*, or *invalid tenant* — that is a missing vendor account.
2. Check whether the alert actually came from CodeQL (the Security tab shows the
   tool per alert). CodeQL hits are real code findings.
3. Find the same issue locally before believing it: `npm run lint`,
   `npm run typecheck`, `npm audit`, and `npm run verify:rls`.
