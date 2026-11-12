# Reviewer notes — Pacific World School

- **App:** Pacific World School (mobile; teachers and students)
- **Admin console:** web app (staff-only; not distributed through stores)
- **Prepared:** 2026-11-12
- **Branch:** `milestone/f-store-readiness`
- **Status:** Draft for store reviewers. No submission has been performed.

## 1. What this app is

Pacific World School ERP is a school-issued application for enrolled students and teaching staff at Pacific World School. It covers the daily academic loop: assignments, submissions, messaging, attendance, leave, library, fees, report cards, notices, and circulars. A separate web administration console is used by school staff for roster and setup management.

## 2. Reviewer login

There is **no public sign-up**. Accounts are created by the school. Reviewers should use the dedicated demo identities below, which live in a review-only Supabase project (not the production school project).

| Role | Login ID | Password rule | Display name |
|---|---|---|---|
| Admin | `{{DEMO_ADMIN_LOGIN}}` | Set by school at first use | Admin |
| Teacher | `{{DEMO_TEACHER_LOGIN}}` | `Student@DDMMYYYY` from demo DOB | Teacher |
| Student | `{{DEMO_STUDENT_LOGIN}}` | `Student@DDMMYYYY` from demo DOB | Student |
| Parent (if enabled) | `{{DEMO_PARENT_LOGIN}}` | `Student@DDMMYYYY` from demo DOB | Parent |

Passwords follow the school rule: `Student@` + DDMMYYYY from the account's date of birth. For example, a DOB of 14 May 2010 → `Student@14052010`. Passwords are never stored as literals; they are derived at runtime.

Never use real student or staff accounts for review.

## 3. Core flows to test

Each flow lists the in-app path and the expected outcome. Reviewers should test as both teacher and student where applicable.

| Flow | Path | Expected |
|---|---|---|
| Sign in | App → Sign in → login ID + password | Session established; forced password change if `must_change_password` |
| Dashboard | App → Dashboard | Role-aware cards: assignments due, notices, messages |
| Submit assignment | App → Assignments → :id → Submit | Text + optional file accepted; submission recorded |
| View submissions | App → Assignments → :id → Review (teacher) | Teacher sees own-class submissions; student sees own only |
| Compose message | App → Messages → Compose → pick student(s) | One private thread per student; no student-to-student |
| Reply in thread | App → Messages → :id → Reply | Teacher or student replies; admin reads only |
| Read notice | App → Notices → Circulars → :id | Read status updates; download attachment if present |
| Apply leave | App → Leave → Apply | Date range, type, reason, attachment; status "pending" |
| Approve leave | App → Leave → :id → Approve/Reject (teacher) | Status changes; decision recorded with actor |
| Borrow book | App → Library → Issue | Book marked borrowed; due date set |
| View fees | App → Fees | Invoices, instalments, sibling discount visible |
| View report card | App → Report Cards | Published marks, grades, remarks |
| Mark attendance | App → Attendance (teacher) | Present/absent/late per student, own section |
| Account deletion | App → Profile → Security → Request deletion | Request queued; confirmation shown |

## 4. What reviewers must NOT see

- Real student names, admission numbers, DOBs, guardian phone numbers
- Real message bodies or submission content
- Payment instruments, card details, bank details
- Admin credentials or service-role keys
- Public sign-up or self-registration

## 5. Safeguarding statements (safe to repeat in review forms)

1. **No student-to-student channel.** Threads are teacher↔student only. A student cannot initiate a thread.
2. **Admin oversight is read-only.** Administrators read academic content for safeguarding but cannot write assignments, submissions, threads, or messages.
3. **Admin cannot post in a teacher–student thread.** RLS requires the message sender to be the thread's teacher or student.
4. **Role-based access.** Students read their own records; teachers read students they teach or are class teacher of.
5. **Private files.** Homework and submission attachments are in private buckets; files are served through short-lived signed URLs.
6. **Upload limits.** 10 MB per file; PDF/JPEG/PNG/DOCX only.

## 6. Known limitations at review time

- Parent-switch feature is not yet built (schema exists, UI pending)
- Thread archival column not yet present; retention claim is aspirational
- Admin thread-read auditing not yet implemented
- `apps/mobile/app.json` placeholder values; EAS build not yet performed

## 7. Contact

- **Submission owner:** {{SUBMISSION_OWNER_NAME}} — {{SUBMISSION_OWNER_EMAIL}}
- **School contact:** {{SCHOOL_CONTACT_NAME}} — {{SCHOOL_CONTACT_EMAIL}}
- **Privacy contact:** {{PRIVACY_CONTACT_NAME}} — {{PRIVACY_CONTACT_EMAIL}}
