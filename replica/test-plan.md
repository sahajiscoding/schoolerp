# Test plan: Pacific World School ERP clone

Build: working tree 2026-11-07  Date: 2026-11-07  Env: local, demo seed data (pws.demo.data.v5)

| case | flow | type | steps | expected | auto | result |
| --- | --- | --- | --- | --- | --- | --- |
| F01-H1 | sign in | happy | open /login, enter ID + password, submit | lands on /dashboard, olive primary button, red hover | e2e (vitest) | pass (6/6 vitest) |
| F01-H2 | account picker | happy | open /login with remembered account, click card | quick sign-in, "Use another account" available | manual | pass (code verified) |
| F01-N1 | forgot password | negative | click "I forgot my password" | admin-reset notice, no password leaked | manual | pass |
| F02-H1 | student submits homework | happy | dashboard homework -> hub -> submit page + file | submitted state on hub | e2e (vitest) | pass |
| F03-H1 | teacher distributes homework | happy | hub -> composer -> publish | published card with teacher name | e2e (vitest) | pass |
| F04-H1 | leave apply -> approve | happy | Apply Leave dialog -> approvals approve/reject | status flips, audited | e2e (vitest) | pass |
| F05-H1 | library borrow/return | happy | issue-book -> my-library -> return | ledger updates, fines show | e2e (vitest) | pass |
| F06-H1 | teacher <-> student message | happy | compose -> inbox -> thread reply | thread replies, no student-to-student path | manual | pass (RBAC verified) |
| F07-H1 | fee payment sibling discount | happy | fee ledger -> pay | 50% discount = second child only | manual | pass |
| F02-E1 | oversized/wrong-MIME file | edge | attach >10MB or .exe to submit | explicit rejection, no silent drop | manual | pending (server-side) |
| F03-E1 | teacher targets foreign section | edge | target untaught section | rejected with error, never silent-filtered | manual | pending (RLS) |
| F04-E1 | medical leave without attachment | edge | submit Medical leave, no file | blocked, attachment mandatory | manual | pending |
| F01-E1 | double submit | edge | double-click Login | single session, no double sign-in | manual | pending |
| F01-E2 | expired session | edge | idle past JWT expiry | re-login prompt, no data loss | manual | pending |
