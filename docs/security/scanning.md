# Security scanning — what runs, what it needs, what it costs

This repository has nine third-party scanning workflows on top of GitHub's own
code scanning. They are **not** all runnable: most are vendor SaaS products that
need a paid account whose credentials this repository does not have. This file
records which is which so a red check is never mistaken for a code defect.

## Runnable today (no vendor account)

| Workflow | File | What it does |
|---|---|---|
| CodeQL (JavaScript/TypeScript **and** Actions) | `codeql.yml` | GitHub's own engine. Free, no setup. Scans application code **and** the workflow files themselves. |
| Codacy | `codacy.yml` | Runs only Codacy's free, default rule sets without a project token. |
| OSSAR | `ossar.yml` | Runs Microsoft's open-source CLI on `windows-latest`. |
| CI (lint, typecheck, build) | `ci.yml` | Not a scanner, but the gate that matters most. |

CodeQL is the workflow that feeds the **Security → Code scanning** tab for this
repository. Everything else that also uploads SARIF only adds findings *if* its
vendor account exists.

## Cannot succeed without a vendor account

These fail with an authentication/configuration error, not a finding. They stay
red on every push until the corresponding account is provisioned and the secret
is added in **Settings → Secrets and variables → Actions**.

| Workflow | Required secret(s) | Vendor |
|---|---|---|
| Black Duck | `BLACKDUCKSCA_TOKEN` (+ `vars.BLACKDUCKSCA_URL`) or Coverity/Polaris/SRM equivalents | Black Duck / Synopsys |
| Synopsys | `COVERITY_URL`, `COVERITY_USER`, `COVERITY_PASSPHRASE`, `BLACKDUCK_*`, `POLARIS_*` | Synopsys |
| CxFlow (Checkmarx) | `CHECKMARX_URL`, `CHECKMARX_USERNAME`, `CHECKMARX_PASSWORD`, `CHECKMARX_CLIENT_SECRET`, `CHECKMARX_PROJECT`, `CHECKMARX_TEAMS` | Checkmarx |
| Checkmarx One | `CX_CLIENT_ID`, `CX_CLIENT_SECRET`, `CX_TENANT` | Checkmarx |
| CodeScan | `CODESCAN_AUTH_TOKEN`, `CODESCAN_ORGANIZATION_KEY`, `CODESCAN_PROJECT_KEY` | CodeScan (SonarQube-based) |
| Endor Labs | `ENDOR_API_CREDENTIALS_KEY`, `ENDOR_API_CREDENTIALS_SECRET` **and** the `namespace` input must be set to the real tenant instead of the template default `example` | Endor Labs |
| Debricked | `DEBRICKED_TOKEN` | Debricked (OpenText) |

The Endor Labs workflow additionally ships with `namespace: "example"`, a
placeholder from the vendor template. Even with credentials it cannot work until
that is replaced with the real tenant namespace.

### Choose one, don't run all seven

Seven overlapping SCA/SAST products scanning the same ~4 kloc is redundant and
mostly a way to keep seven checks red. Pick the one the school's security budget
covers, delete the rest, and keep CodeQL as the always-on baseline:

```bash
# Example: keep CodeQL only.
git rm .github/workflows/{black-duck-security-scan-ci,synopsys-action,checkmarx,checkmarx-one,codescan,endorlabs,debricked}.yml
```

Deleting a workflow does not delete historical alerts, but it does stop the
failing checks. This is a decision for the repository owner, not something an
agent should do unilaterally.

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
