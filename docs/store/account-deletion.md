# Account deletion — Pacific World School

- **App:** Pacific World School (mobile; teachers and students)
- **Prepared:** 2026-11-12
- **Branch:** `milestone/f-store-readiness`
- **Status:** Specification only. The in-app path and backend queue are not yet implemented; both stores require a working deletion path before submission.

## 1. In-app path

**Profile → Security → Request account deletion**

1. User taps "Request account deletion" on the Profile screen.
2. A confirmation dialog explains what is deleted vs retained (see §3).
3. User confirms. The app creates an `account_deletion_requests` row (pending) and shows "Request submitted. The school will review within 7 days."
4. The request appears in the admin console for review. An admin verifies identity and either approves or rejects.
5. On approval, the backend deletes the Supabase Auth user and de-identifies direct identifiers; academic, fee, and audit records are retained in de-identified form where retention is required.
6. The user is signed out and sees a confirmation screen with a support contact.

## 2. Backend queue

| Component | Status | Notes |
|---|---|---|
| `account_deletion_requests` table | Not created | Needs migration: id, user_id, status (pending/approved/rejected/completed), requested_at, decided_by, decided_on, reason |
| Admin console review screen | Not built | Lists pending requests with approve/reject actions |
| Deletion Edge Function | Not built | `account-deletion` function: verify JWT + admin, delete auth user, de-identify profile, write audit_log |
| Mobile confirmation screen | Not built | Milestone E |

## 3. Deleted vs retained

| Data | Action | Reason |
|---|---|---|
| Supabase Auth user | Deleted | Removes sign-in identity |
| `profiles.full_name`, `login_id`, `avatar_path` | De-anonymized (replaced with placeholder) | Retain audit trail without direct identifiers |
| `student_details.admission_no`, `date_of_birth`, `guardian_*` | De-anonymized | Academic records need the student context |
| Assignments, submissions, marks, report cards | Retained (de-identified owner) | School record / transcript obligations |
| Attendance, leave requests | Retained (de-identified owner) | School record obligations |
| Fee records, receipts | Retained (de-identified owner) | Accounting / tax retention |
| Threads, messages | Retained (de-identified participants) | Safeguarding and academic queries |
| `push_tokens` | Deleted | No longer valid |
| `audit_log` rows referencing the user | Retained (actor_id set NULL) | Audit integrity |
| Library transactions | Retained (de-identified borrower) | Borrowing history |

## 4. Timeline

| Step | Target |
|---|---|
| User submits request | Immediate (in-app) |
| Request visible to admin | Immediate (realtime) |
| Admin decision | ≤ 7 days |
| Deletion executed | ≤ 30 days from approval, subject to retention |
| User notified of outcome | In-app + email |

## 5. Store console entries

- **Google Play Data Safety:** "Do you provide a way for users to request data deletion?" → Yes. Provide privacy-policy URL and support email.
- **App Store Connect App Privacy:** Data deletion is available; the in-app path is described above.

## 6. What must be implemented before submission

1. Migration: `account_deletion_requests` table with RLS
2. Admin console: deletion-request review screen
3. Edge Function: `account-deletion` (auth user deletion + de-identification + audit)
4. Mobile screen: Profile → Security → Request account deletion
5. Email/notification to user on decision (can use `notify` Edge Function)
6. End-to-end test with a demo account

## 7. References

- Privacy policy §10 (rights), §11 (account deletion)
- Data-safety.md §2.2 (deletion question), §9 item 2 (blocker)
- AGENTS.md non-negotiable rule: no secrets in clients
