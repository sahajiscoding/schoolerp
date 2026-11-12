# Store listing — Pacific World School

- **App:** Pacific World School (mobile; teachers and students)
- **Admin console:** web app (not distributed through app stores)
- **Prepared:** 2026-11-12
- **Branch:** `milestone/f-store-readiness`
- **Status:** Draft copy for the store consoles. No submission has been performed.

## 1. App identity

| Field | Value | Notes |
|---|---|---|
| Display name | `{{APP_DISPLAY_NAME}}` | Suggested: Pacific World School; owner confirms |
| Android package / iOS bundle | `{{ANDROID_APP_ID}}` / `{{IOS_BUNDLE_ID}}` | Permanent, school-owned; set in `apps/mobile/app.json` |
| Version | 1.0.0 | First release; owner sets build number |
| Category | Education | Both stores |
| Price | Free | School-issued service; no in-app purchases |
| Content rating | `{{CONTENT_RATING}}` | Recommendation: 12+ (see §5); final answer from questionnaire |

## 2. Short description (Google Play, ≤ 80 chars)

School-issued app for Pacific World School: assignments, messages, attendance, leave, library, fees, notices.

## 3. Full description

Pacific World School provides this app to its enrolled students and teaching staff. It is the school's daily academic loop: teachers distribute and collect work, students submit and receive feedback, and both sides communicate through moderated teacher-to-student threads.

Core features:

- Assignments: list, detail, submit text and file attachments
- Messages: teacher-to-student threads with replies; one private thread per student
- Notices and circulars: school-wide and class-scoped, with read status
- Attendance: view own record; teachers mark present/absent/late
- Leave: apply with reason and attachment; class teacher approves or rejects
- Library: browse books, borrow, reserve, return
- Fees: view invoices, instalments, payments, sibling discount
- Report cards: view published marks and grades
- Profile: account details, password change, account-deletion request

Safety:

- No student-to-student messaging; threads are teacher↔student only
- Administrators read academic content for oversight; they cannot edit assignments, submissions, threads, or messages
- No advertising, no behavioural tracking, no third-party analytics SDKs
- Files are private and served through signed URLs
- Accounts are created by the school; no public sign-up

This app is not a social network. It is a school record system and communication channel.

## 4. Screenshots (placeholder URLs — replace with real captures)

| Screen | Role | URL |
|---|---|---|
| Sign in + forced password change | Teacher/Student | `{{SCREEN_LOGIN}}` |
| Dashboard | Teacher | `{{SCREEN_DASHBOARD_TEACHER}}` |
| Dashboard | Student | `{{SCREEN_DASHBOARD_STUDENT}}` |
| Assignments + submit | Student | `{{SCREEN_ASSIGNMENTS_STUDENT}}` |
| Assignments + roster | Teacher | `{{SCREEN_ASSIGNMENTS_TEACHER}}` |
| Messages inbox | Teacher/Student | `{{SCREEN_MESSAGES}}` |
| Notices/circulars | Teacher/Student | `{{SCREEN_NOTICES}}` |
| Leave apply / approve | Student / Teacher | `{{SCREEN_LEAVE}}` |
| Library borrow/return | Student | `{{SCREEN_LIBRARY}}` |
| Fees | Student | `{{SCREEN_FEES}}` |
| Report card | Student | `{{SCREEN_REPORT_CARD}}` |
| Profile / deletion request | Teacher/Student | `{{SCREEN_PROFILE}}` |

Capture sizes: see `screenshots-checklist.md`.

## 5. Age rating rationale

| Factor | Answer | Rationale |
|---|---|---|
| In-app purchases | No | No payments inside the app |
| Gambling | No | |
| Violence / horror | No | |
| Sexual content | No | |
| Profanity | No | |
| User-generated content | Moderated | Messages are teacher↔student only, school-moderated |
| Location sharing | No | |
| Advertising | No | |
| Social networking | No | No public profiles or feeds |

**Recommended:** 12+ (Apple) / Everyone or 12+ (Google Play questionnaire). The messaging is school-moderated and teacher-only; answer the questionnaire honestly.

## 6. Support and contact

| Field | Value | Notes |
|---|---|---|
| Support URL | `{{SUPPORT_URL}}` | Must resolve without login |
| Support email | `{{SUPPORT_EMAIL}}` | Monitored mailbox |
| Marketing URL | `{{MARKETING_URL}}` | Optional; school website |
| Privacy policy URL | `{{PRIVACY_POLICY_URL}}` | Published copy of `privacy-policy.md` |

## 7. Reviewer accounts

Demo identities are anonymized (`Teacher`, `Student`). See `review-notes.md`.

## 8. Keywords (Google Play)

Pacific World School, school app, assignments, messages, attendance, library, fees, report card, leave, ERP, teacher, student

## 9. What is NOT in this listing

- No claim of EAS build completion — `apps/mobile/app.json` still has placeholder values (`name: "mobile"`, no bundle identifiers)
- No claim of store submission
- No real student names, admission numbers, or contact details anywhere in this document
- No logo or crest images are included; the school supplies these separately
