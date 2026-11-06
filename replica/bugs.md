# Bugs

## Fixed in this pass

### BUG-001: Digital Library "Open e-book" was a no-op

- Severity: S3
- Flow / case: F05 (library) / S12
- Build: 2026-11-07 working tree

Steps
1. Open /digital-library as any role.
2. Click "Open e-book" on any card.

Expected: the e-book opens.
Actual: button did nothing (no handler, no navigation).
Evidence: `apps/admin/src/pages/DigitalLibrary.tsx` — `<Button>Open e-book</Button>` with no onClick.
Status: fixed — button now navigates to /study-room where e-books open (same dataset).
Verified: typecheck + build + 6/6 vitest green after fix.

## Open (punch list — see diff-report.md)

- Dark chrome is slate-900/clone vs reference slate-950 (§dark delta).
- Light/dark time-of-day rendering differs between captures (not a bug).
- Behind-login screens are guess-marked (login-walled — by design, not scraped).
