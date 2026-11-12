# Data Safety and App Privacy answers

- **App:** Pacific World School (Expo mobile app; teachers and students)
- **Admin console:** React/Vite web app, staff-only, not distributed through the app stores
- **Answers prepared:** 2026-11-12
- **Schema checked:** `supabase/migrations/0001_initial_schema.sql` – `0012_course_progress_live.sql`
- **Status:** Draft answers for the store consoles. **Do not submit until the open items in §9 are closed.** The mobile app is still being built under Milestone E; these answers describe the intended release build and the schema it will use.

This document is the working answer key for:

- Google Play Console → **App content → Data safety**
- App Store Connect → **App Privacy**

The guiding rule is data minimisation: the Service exists to run a school, not to build an advertising or analytics profile. There are no ads, no third-party analytics SDKs, no data brokers, and no student-to-student channel.

## 1. Plain-language summary

| Question | Answer |
|---|---|
| Does the app collect user data? | **Yes.** School account, academic, communication, library, and fee data are collected because the app is the school's record system. |
| Is data shared with third parties? | **No, not for the third party's own purposes.** Supabase, Vercel, and Expo process data on the School's instructions as service providers. No sale, no advertising, no data brokers. |
| Is data encrypted in transit? | **Yes.** HTTPS/TLS for all app, API, and storage traffic. |
| Can users request deletion? | **Yes, by design.** The in-app request path and backend queue are specified in `account-deletion.md`; they must be implemented and tested before submission. |
| Is there third-party advertising? | **No.** |
| Is there behavioural tracking or cross-app tracking? | **No.** No advertising ID, no ATT prompt, no tracking SDK. |
| Is student-to-student messaging possible? | **No.** Threads are teacher↔student. Administrators can read for oversight and cannot post. |
| Are administrators able to edit academic content? | **No.** Admin access to assignments, submissions, threads, and messages is read-only and enforced by RLS. |
| Is the app directed to children? | It is a **school-issued** app for enrolled students, not a public child-directed service. No public sign-up and no ads. Age-rating recommendation is in `store-listing.md`. |

## 2. Google Play Data Safety

### 2.1 Collection and sharing table

Play asks for each data type: collected, shared, whether it is required or optional, the purpose, and whether it is linked to the user. "Collected" means transmitted off the device. All of the following are linked to the signed-in school account.

| Play category | Data type | Collected | Shared | Optional? | Purpose | Notes / schema source |
|---|---|---|---|---|---|---|
| Personal info | Name | Yes | No | Required | Account management; app functionality | `profiles.full_name`, `student_details.guardian_name` |
| Personal info | User IDs | Yes | No | Required | Account management; app functionality | `profiles.login_id`, `student_details.admission_no`; internal sign-in address derived from login ID |
| Personal info | Phone number | Yes | No | Optional | School communication | `student_details.guardian_phone`; recorded only if the School fills it. See §9 item 1. |
| Personal info | Other personal info | Yes | No | Required | Account management; academic records | Date of birth in `student_details.date_of_birth`; role, class, section, roll number, academic year |
| Financial info | Other financial info | Yes | No | Required | App functionality; school accounting | `fee_records`, `fee_installments` (amounts, discounts, paid amount, receipt number, payment date, status). No card, bank, UPI, or wallet credentials. |
| Messages | In-app messages | Yes | No | Required | App functionality; safeguarding | `threads`, `messages`; teacher↔student only. Administrators read; no admin posting. |
| Photos and videos | Photos | Yes | No | Optional | App functionality | Avatar uploads and image attachments. Only if the user chooses a photo. |
| Files and docs | Files and docs | Yes | No | Optional | App functionality | Assignment and submission attachments; PDF/JPEG/PNG/DOCX, max 10 MB |
| App activity | Other user-generated content | Yes | No | Required | App functionality; academic records | Assignment text, submissions, leave reasons, declaration signatures, poll votes, library notes |
| App activity | Other actions | Yes | No | Required | App functionality; academic records | Attendance, leave apply/review, library issue/return/reserve, fee recording |
| Device or other IDs | Device or other IDs | Yes | No | Required for push | App functionality (notifications) | `push_tokens.expo_token`, `push_tokens.platform`; not an advertising ID |
| Location | Approximate/precise location | No | — | — | — | Not requested or stored |
| Contacts | Contacts | No | — | — | — | Not requested or stored |
| Calendar | Calendar | No | — | — | — | Not requested or stored |
| Health and fitness | Health/fitness | No | — | — | — | No health fields. A free-text leave reason may mention health; that is user-generated content, not a structured health record. |
| Audio | Voice/sound recordings | No | — | — | — | No microphone access |
| Web browsing | Web browsing history | No | — | — | — | No browser history collection |
| App info and performance | Crash logs / diagnostics | No | — | — | — | No crash/analytics SDK in the app. Hosting logs are operational, not analytics. Confirm with the final EAS build. |
| Financial info | Payment info / purchase history | No | — | — | — | No in-app purchases and no payment-instrument data |

### 2.2 Play security-practices answers

| Play question | Answer |
|---|---|
| Is all user data encrypted in transit? | **Yes.** TLS for Supabase, storage, and push registration. |
| Do you provide a way for users to request data deletion? | **Yes.** In-app request plus school contact. Must be implemented before submission; see `account-deletion.md`. |
| Do you commit to deleting data on request? | **Yes**, subject to the academic, fee, and audit retention described in the privacy policy. |
| Is data used for advertising or marketing? | **No.** |
| Is data shared with third parties? | **No third-party use.** Processors are listed in the privacy policy. |
| Is data used for personalisation? | **No.** Role-based UI is functionality, not advertising personalisation. |
| Is data used for fraud prevention, security, or compliance? | **Yes** — audit logs, authentication, and RLS enforcement. |
| Does the app use independent security review? | **No claim.** Do not tick this unless the School commissions one. |
| Families / children policy | School-issued accounts only; no public sign-up, no ads, no student-to-student chat. The School obtains guardian consent at admission. |

### 2.3 Play content rating notes

- No violence, sexual content, profanity, gambling, drugs, or user-generated public feed.
- Users can interact through **moderated teacher↔student messaging**; there is no public chat and no student-to-student chat.
- No location sharing, no physical-meetup features, no purchases, no ads.
- The questionnaire should disclose in-app messaging and school-record data. Recommended rating: **Everyone / 12+ depending on the questionnaire result**; see `store-listing.md` §5.

## 3. Apple App Privacy

### 3.1 Data linked to the user

Apple asks whether each type is linked to the user's identity and whether it is used for tracking. All categories below are **linked** to the school account and **not used for tracking**.

| Apple category | Data type | Linked | Tracking | Purpose |
|---|---|---|---|---|
| Contact Info | Name | Yes | No | App functionality; account management |
| Contact Info | Phone Number | Yes | No | School communication (optional guardian phone) |
| Financial Info | Other Financial Info | Yes | No | App functionality; fee ledger |
| User Content | Emails or Text Messages | Yes | No | Teacher↔student messages |
| User Content | Photos or Videos | Yes | No | Avatar and image attachments (optional) |
| User Content | Other User Content | Yes | No | Assignments, submissions, leave reasons, declarations, poll votes |
| Identifiers | User ID | Yes | No | School login ID and internal account ID |
| Identifiers | Device ID | Yes | No | Push token; app-scoped, not advertising ID |
| Usage Data | Product Interaction | No | No | No analytics SDK. School actions are records, not analytics. |
| Diagnostics | Crash Data / Performance Data | No | No | No crash/analytics SDK. Confirm final build. |

### 3.2 Data not collected

Declare **No** for: precise location, coarse location, health, fitness, payment info, credit score, contacts, calendar, reminders, sensitive info, browsing history, search history, audio data, gameplay content, customer support, advertising data, and other diagnostic data.

### 3.3 Apple tracking and advertising answers

| Question | Answer |
|---|---|
| Does the app track users across apps/websites owned by other companies? | **No.** No ATT prompt is required. |
| Does the app include third-party advertising? | **No.** |
| Does the app use third-party analytics? | **No.** |
| Is data used for developer advertising or marketing? | **No.** |
| Is data used for product personalisation? | **No.** Role-aware navigation is functionality. |
| Is data used for app functionality? | **Yes.** |
| Is data used for analytics? | **No.** |

### 3.4 Apple encryption / export compliance

- The app uses HTTPS/TLS provided by the operating system and Supabase. It does not implement proprietary cryptography.
- The likely export-compliance answer is the standard "uses encryption that is exempt" path, but the release owner must confirm the current App Store Connect wording. Do not copy a previous answer without checking.

## 4. What the app does not do

- No advertising SDK, ad mediation, or attribution SDK.
- No Firebase Analytics, Google Analytics, Sentry, Amplitude, Mixpanel, Segment, or PostHog.
- No advertising identifier (IDFA/GAID) access.
- No contact, SMS, call-log, photo-library-wide, microphone, camera, or location permission.
- No public profile, public feed, or student-to-student messaging.
- No sale of personal data.
- No cross-app tracking.

Evidence: dependency manifests in `apps/mobile/package.json`, `apps/admin/package.json`, and `packages/shared/package.json` contain no analytics, advertising, or crash-reporting package. Re-run this check on the final build because EAS or a future dependency can add an SDK.

## 5. Safeguarding and access statements

These statements are safe to repeat in review notes and the data-safety form:

1. **No student-to-student channel.** Threads have one teacher and one student. A student cannot create a thread (RLS requires teacher/admin on insert), and a student cannot read another student's thread.
2. **Admin oversight is read-only.** Administrators can read assignments, submissions, threads, and messages; RLS has no admin write policy for those tables. Admin writes are limited to admin-owned data such as fees, users, and school setup.
3. **Admin cannot post in a teacher–student thread.** `messages_send` requires the caller to be the thread's teacher or student; an administrator is neither.
4. **Role-based access.** Students read their own records; teachers read students they teach; deactivated accounts resolve to no role and fail every policy.
5. **Private files.** The implemented homework and submission buckets are private. Files are read through short-lived signed URLs (60 seconds in the live Homework slice), never public URLs.
6. **Upload limits.** 10 MB per file; PDF, JPEG, PNG, DOCX allowlist.
7. **Audit trail.** Administrative and academic mutations write `audit_log` rows. Admin **read** auditing for threads is required by the design but not yet implemented; see §9 item 4.

## 6. Data map (schema → declaration)

| Declared data | Tables / fields |
|---|---|
| Name | `profiles.full_name`; `student_details.guardian_name` |
| Login/user ID | `profiles.login_id`; `student_details.admission_no`; internal `@pws.local` sign-in address derived at runtime |
| Date of birth | `student_details.date_of_birth` |
| Guardian phone | `student_details.guardian_phone` (optional) |
| Role/class/section | `profiles.role`, `classes`, `sections`, `enrollments`, `teaching_assignments` |
| Assignments | `assignments`, `assignment_sections`, `assignment_students` |
| Submissions and files | `submissions.body`, `submissions.file_path`; Storage `submission-files`; teacher attachments in `homework-files` |
| Marks/report cards | `report_cards`, `examination_marks`, `examination_remarks`, `examination_student_metadatas` |
| Attendance | `attendance` |
| Leave | `leave_requests` (reason, attachment, decision) |
| Messages | `threads`, `messages` |
| Notices/circulars | `notices`, `notice_recipients`, `circulars` |
| Declarations/polls | `declaration_forms`, `declaration_signatures`, `polls`, `poll_options`, `poll_votes` |
| Library | `books`, `book_issues`, `library_books`, `library_book_transactions`, `library_kiosk_sessions` |
| Fees | `fee_records`, `fee_installments`, `sibling_links`, `fee_cycles`–`fee_structures` |
| Push | `push_tokens`, `notification_jobs` |
| Audit | `audit_log` |
| Parent link | `parent_links` (feature UI not built; see §9 item 8) |
| Avatars | `profiles.avatar_path`; Storage `avatars` |
| Gallery/circular files | Storage `gallery-media`, `circular-files` (buckets exist; client policies not yet defined) |

## 7. Retention answers for the stores

- Account and roster data: while enrolled/employed, then per the School's record schedule.
- Academic records: school-defined retention; typically the transcript period.
- Threads/messages: retained for the academic year, then archived — **but see §9 item 3: no archive mechanism exists yet**.
- Fee records: statutory accounting/tax period.
- Audit logs: safeguarding/security/legal period.
- Push tokens: removed on account deletion or token invalidation.
- Deletion requests: acknowledgment within 7 days; completion target 30 days, subject to retention.

## 8. Age rating and children

- The app is for enrolled students and staff of one school. It is not a public social app.
- There is no public sign-up, no advertising, and no student-to-student chat.
- The School creates accounts and obtains guardian consent at admission.
- Apple age rating recommendation: **12+** because of moderated messaging and school-record content; the final answer comes from the App Store Connect questionnaire.
- Google Play content rating: answer the questionnaire honestly; expect **Everyone** or **12+** depending on the messaging and user-interaction answers. Do not select "Everyone" if the questionnaire flags unmoderated user interaction; this app's messaging is school-moderated and teacher-only.

## 9. Cross-check findings and unresolved mismatches

These were checked against `0001`–`0012` and the two design specs. Items marked **blocker** must be fixed or explicitly accepted before a store submission.

1. **Guardian phone contradicts the v1 design.** Design §8 says "No Aadhaar, address, or phone number collected in v1", but `0002_dashboard_modules.sql` creates `student_details.guardian_phone`. If the field is used, the phone declaration above is required. If it is not used, drop the column or never populate it. **Owner/product decision required.**
2. **No account-deletion queue or in-app path exists — blocker.** There is no `account_deletion_requests` table, no mobile screen, and the `admin-users` Edge Function only implements `create-admin` and `import-students`. Both stores require a working deletion path. See `account-deletion.md`.
3. **No thread archive mechanism — blocker for the retention claim.** `threads` has no `archived_at`/`academic_year` column, and `threads.student_id`/`teacher_id` plus `messages.thread_id` use `ON DELETE CASCADE`. The policy says threads are archived for the academic year, but the schema would delete them if an account or thread is deleted. A migration and admin flow are required.
4. **Admin thread reads are not audited.** Design §8 says every admin read of a thread writes an `audit_log` row. No SELECT trigger or audit call exists; `audit_log` only receives write actions from RPCs and Edge Functions. Either implement read auditing or remove the claim from the privacy policy/review notes. This document states the current truth.
5. **Deleting an auth user destroys academic records.** `profiles.id REFERENCES auth.users(id) ON DELETE CASCADE`, and most academic tables reference `profiles(id) ON DELETE CASCADE`. A hard delete of the sign-in user cascades into submissions, attendance, fees, messages, and more. This conflicts with the stated academic/audit retention. Fix by anonymising the profile and revoking auth until retention ends, or by changing academic foreign keys to `ON DELETE SET NULL` / a tombstone profile. **Engineering decision required.**
6. **Storage buckets exist without client policies.** `0005` creates `homework-files`, `submission-files`, `gallery-media`, `avatars`, and `circular-files` as private. Only `homework-files` and `submission-files` receive storage policies and 10 MB/MIME limits in `0006`. `gallery-media`, `avatars`, and `circular-files` have no client policies in `0001`–`0012`. Do not enable uploads to those buckets until policies and tests exist. The data-safety answer for "private buckets/signed URLs" is true for the implemented Homework flow, not yet for gallery/avatars/circular files.
7. **Teacher read scope is broader than the design.** `threads_participant` in `0009` allows any teacher who teaches the student (or is class teacher) to read the thread, not only the thread's own teacher. Message bodies remain participant/admin-only, but thread metadata is visible to other teachers of that student. Either narrow the policy to `teacher_id = auth.uid()` or document the oversight scope in the privacy policy. The policy currently states "their own threads" in the access table and must be aligned before publication.
8. **Parent feature is not built.** `parent_links` exists, but no academic table has a parent RLS policy, and the parent-switch UI is pending. Do not describe parent access as live in the store listing or data-safety answers.
9. **Notices vs circulars.** Both `notices` (0001) and `circulars` (0005) exist. The mobile build must state which one it uses so the data-safety inventory and retention wording are accurate. Both are covered above to be safe.
10. **Mobile app is not a release candidate.** `apps/mobile/app.json` still has `"name": "mobile"`, `"slug": "mobile"`, no bundle identifiers, and `App.tsx` is the Expo starter screen. Milestone E owns the fix. Do not capture screenshots or submit from this branch.
11. **"28 canonical routes" label vs 25 paths.** The clone spec §2 table lists 25 paths; `PROJECT_STATUS.md` and the recon notes call the set "28-route". This package enumerates the 25 real paths plus role/state variants in `screenshots-checklist.md` and flags the count rather than inventing three routes.

## 10. Store-console entry checklist

- [ ] Privacy policy URL is live and matches `privacy-policy.md` after placeholders are filled.
- [ ] Data Safety answers entered exactly as §2.
- [ ] App Privacy answers entered exactly as §3.
- [ ] Account deletion path implemented and tested on both platforms; URL/email entered.
- [ ] Final dependency scan re-run for analytics/advertising SDKs (including transitive Expo modules).
- [ ] Demo accounts and reviewer notes prepared from `review-notes.md`.
- [ ] Age rating questionnaires completed and reviewed.
- [ ] Export-compliance answer confirmed for the final build.
- [ ] No real student data in screenshots or review notes.
