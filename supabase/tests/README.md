# Database tests

Two suites, same rules.

| File | Runner | Use |
|---|---|---|
| `rls_matrix.sql` | pgTAP (`supabase test db`) | Canonical. Runs in CI with a local Supabase stack. |
| `rls_matrix_dashboard.sql` | pgTAP | Canonical, for `0002_dashboard_modules.sql`. |
| `verify_rls_local.py` | plain Python + `pgserver` | Fallback when Docker/Supabase CLI is unavailable. Boots a throwaway Postgres, applies all three migrations and asserts 25 rules as the `authenticated` role. |

What is covered:

- A leave request reaches only the class teacher of the student's section.
- A student cannot approve their own leave, and cannot touch a peer's row.
- Attendance, fee records and report cards are owner-readable only.
- Sibling links are admin-write; students read their own.
- A teacher can publish a class-scoped event but never a school-wide one.
- Students cannot author report cards or mark attendance.

```bash
# conventional route
supabase start && supabase test db

# no-Docker route
python3 -m venv .venv && .venv/bin/pip install pgserver
.venv/bin/python supabase/tests/verify_rls_local.py
```
