# Privacy Policy — Pacific World School

<!--
PUBLISHER NOTES (remove this comment before publishing)
1. Replace every {{PLACEHOLDER}} with the school's approved value.
2. Publish at the final HTTPS URL and enter that URL in App Store Connect and Google Play Console.
3. This is a school-facing policy, not legal advice. The school's legal reviewer must approve it.
4. Do not add analytics, advertising, or tracking statements unless those services are actually enabled.
-->

**Effective date:** 12 November 2026  
**Last updated:** 12 November 2026  
**Version:** 1.0

Pacific World School ("the School", "we", "us") provides the Pacific World School mobile application for teachers and students, and a web administration console for authorised school staff (together, "the Service"). This policy explains what personal data the Service handles, why, who can see it, and what choices you have.

The School is the controller of the data described here. Our registered details are:

- **Legal entity:** {{SCHOOL_LEGAL_NAME}}
- **Registered address:** {{SCHOOL_POSTAL_ADDRESS}}
- **Privacy contact:** {{PRIVACY_CONTACT_NAME}}, {{PRIVACY_CONTACT_EMAIL}}, {{PRIVACY_CONTACT_PHONE}}
- **Grievance / Data Protection Officer:** {{GRIEVANCE_OFFICER_NAME}}, {{GRIEVANCE_OFFICER_EMAIL}}

## 1. Who this policy applies to

This policy applies to:

- **Students** enrolled at the School who receive a School-issued account.
- **Teachers and other staff** who receive a School-issued account.
- **Parents or guardians** who are linked to a student account, where the School enables that feature.
- **Visitors** to the public sign-in screen. The Service has no public sign-up. Accounts are created by the School.

The Service is not a general-purpose social network. It does not offer student-to-student messaging, public profiles, public posts, or open registration.

## 2. Data we collect

We collect only what the School needs to run classes, communicate about schoolwork, keep attendance and academic records, manage the library, and account for fees.

### 2.1 Account and identity data

| Data | Why it is collected |
|---|---|
| Full name | To identify the account holder to teachers, students, and staff |
| School login ID (admission number for students, staff ID for staff) | To sign in; the School maps it to an internal sign-in address |
| Role (student, teacher, administrator) | To decide what the account may see and do |
| Account status and first-login flag | To deactivate leavers and force a password change |
| Profile photo (optional) | To personalise the account; the School may leave this empty |
| Internal sign-in address derived from the login ID | To operate authentication; it is not a personal email address |

Passwords are handled by our authentication provider. They are stored as salted hashes, are never visible to the School, and must be changed at first sign-in. The initial student password follows the School's rule `Student@DDMMYYYY`, derived from the student's date of birth; the date of birth itself is stored in the student record described below.

### 2.2 Student record data

| Data | Why it is collected |
|---|---|
| Admission number | Identity and academic records |
| Date of birth | Identity confirmation, initial-password rule, and school records |
| Class, section, roll number, academic year | To route work, attendance, and notices to the right class |
| Guardian name | School records and contact context |
| Guardian phone number (optional) | Only if the School chooses to record it for school communication |
| Sibling link | To apply the School's sibling fee rule |

The School does **not** collect Aadhaar numbers, home addresses, student mobile numbers, government benefit identifiers, biometric data, precise location, contacts, SMS logs, or call logs through the Service.

### 2.3 Academic and school-life data

- Assignments and homework set by teachers, including instructions and attachments.
- Submissions by students, including typed answers and uploaded files.
- Marks, grades, report cards, teacher remarks, and examination records.
- Attendance records, leave requests and their reasons, and approval decisions.
- Course goals and progress notes.
- Declaration forms and the fact that a student signed one.
- Polls and a student's selected option.
- Library borrowing, returns, reservations, and fines.
- School events and circulars published to a class or the whole school.
- Notices sent to an account and whether the notice was read.

### 2.4 Communications data

- Messages exchanged in a teacher-to-student thread, including the subject, message body, sender, recipients, and timestamps.
- Read status for notices.
- Moderation and oversight records created when authorised staff access academic content.

There is **no student-to-student messaging channel**. A thread is between one teacher and one student. Administrators can read threads for safeguarding and oversight but cannot post inside them.

### 2.5 Fees data

- Fee structure, instalments, amounts due, discounts (including the sibling discount), amounts paid, payment dates, receipt numbers, and payment status.

The Service does **not** collect card numbers, bank account numbers, UPI IDs, wallet credentials, or other payment-instrument details. Fee payments are recorded by the School as a ledger entry; any actual payment happens outside the app through the School's existing process.

### 2.6 Device and technical data

- Push-notification token and platform (Android or iOS), so the School can send assignment, message, and notice alerts.
- Authentication session data, held in the device's secure storage on mobile.
- Standard server logs generated by our hosting providers, which may include IP address, request time, and error information for security and reliability.

The app does not request access to location, contacts, calendar, microphone, camera, health data, or advertising identifiers. The app does not include third-party advertising or behavioural-tracking SDKs.

## 3. How we use data

We use the data to:

1. Create and administer School accounts and authenticate users.
2. Deliver assignments, collect submissions, and show marks and report cards.
3. Record attendance, process leave requests, and keep academic records.
4. Operate teacher-to-student messaging, notices, circulars, and school events.
5. Run the library and record borrowing and fines.
6. Maintain fee ledgers, discounts, receipts, and payment status.
7. Send push notifications about assignments, messages, and notices.
8. Keep audit records of administrative and safeguarding actions.
9. Protect the Service, investigate misuse, and meet legal and school-record obligations.
10. Respond to support requests and privacy requests.

We do **not** use personal data for advertising, profiling, automated decision-making with legal effect, or sale to any third party.

## 4. Legal bases

Where Indian law applies, the School processes personal data as a data fiduciary under the Digital Personal Data Protection Act, 2023, and other applicable law. Depending on the processing, the basis is:

- **Consent** from the student or guardian, obtained by the School at admission or before the relevant use.
- **Performance of the School's educational services** and the legitimate purposes of running a school.
- **Legal obligations**, including record-keeping, fee accounting, and safeguarding.
- **Safety and security** of students, staff, and the Service.

The Service is used in a school setting. Accounts are created by the School, not by children. The School is responsible for obtaining any guardian consent required for a student's use of the Service.

## 5. Children's privacy

The Service is intended for use by School students and staff. It is not directed to the general public and has no public sign-up. The School creates accounts and controls the roster.

We minimise what is collected about students: no home address, no student phone number, no Aadhaar number, no precise location, no contacts, and no advertising identifier. Students cannot message other students. Staff access to student content is role-based and, for administrators, read-only on academic content.

A parent or guardian who believes a student's data is incorrect or should not be processed should contact the School using the details above.

## 6. Who can see data

Access is enforced by database row-level security, not by the app alone.

| Role | Access |
|---|---|
| Student | Their own profile, assignments targeted at them, their own submissions, their own threads and messages, notices addressed to them, their own attendance, fees, library record, and leave requests |
| Teacher | Profiles of students they teach, their own assignments, submissions for those assignments, their own threads, and section rosters |
| Administrator | School-wide read access for administration and safeguarding, including academic content; administrators cannot write assignments, submissions, threads, or messages |
| Parent/guardian (where enabled) | Read-only access to the linked student's academic, attendance, and fee information; never a different student's data |
| Library kiosk (where enabled) | Library operations only; it cannot reach academic records |
| Deactivated account | No access; every policy denies the account |

Administrators cannot post inside a teacher-to-student thread. They can read academic content for oversight. The design requires administrator reads of threads to be audit-logged; the current implementation status of that audit trail is recorded in the release checklist.

## 7. Service providers

We use the following processors. They handle data on the School's instructions and are not permitted to use it for their own advertising.

| Provider | Service | Data involved |
|---|---|---|
| Supabase | Postgres database, authentication, file storage, realtime updates | All account, academic, communication, library, and fee data; uploaded files |
| Vercel | Hosting the web administration console | Staff sign-in traffic and console usage |
| Expo | Push-notification delivery and mobile build/distribution services | Device push token, platform, and app-build metadata |
| Apple App Store / Google Play | App distribution | Store-account and download data controlled by Apple/Google, not by the School |

We do not sell personal data. We do not share personal data with advertisers, data brokers, or social networks. We may disclose data if required by law, a court order, or a lawful safeguarding investigation, or to protect someone's safety.

## 8. Storage, security, and location

- Data is encrypted in transit using TLS.
- Our hosting provider encrypts stored data at rest.
- File buckets are private. Files are served through short-lived signed URLs after a database check, never through public links.
- Uploads are limited to 10 MB and to PDF, JPEG, PNG, and DOCX files.
- Access is governed by row-level security with default deny, scoped helper functions, and role checks.
- Sessions on mobile are held in the device's secure storage, not in plain application storage.
- Administrative actions are written to an audit log; the service-role credential is kept server-side only.
- Staff accounts are individual. The School must not share accounts.

No system is perfectly secure. If the School becomes aware of a breach affecting personal data, it will notify affected users and the relevant authority as required by applicable law.

## 9. Retention

We keep data only as long as the School needs it for education, safeguarding, accounting, or legal obligations.

| Data | Retention |
|---|---|
| Active account and roster data | While the student is enrolled or the staff member is employed, then according to the School's record schedule |
| Assignments, submissions, marks, report cards | Academic record retention set by the School; typically the period required for transcripts and school records |
| Attendance and leave records | Academic record retention set by the School |
| Teacher-to-student threads and messages | Retained for the academic year and then archived, not silently deleted, so safeguarding and academic queries can be answered |
| Notices, circulars, events | Retained while relevant to the academic record, then archived |
| Fee records and receipts | Retained for the period required by accounting and tax law |
| Library records | Retained while the borrowing record is needed, then archived or deleted |
| Push tokens | Deleted when the account is deleted or the token is no longer valid |
| Audit logs | Retained for safeguarding, security, and legal purposes; not editable by users |
| Server logs | Short operational retention set by the hosting provider |

When the retention period ends, data is deleted or de-identified. Archived records remain access-controlled and are not used for any new purpose.

## 10. Your rights

Subject to applicable law and the School's record-keeping duties, you may:

- **Access** the personal data the School holds about you.
- **Correct** inaccurate data.
- **Request deletion** of your account and personal data.
- **Withdraw consent** where processing relies on consent, without affecting processing already carried out.
- **Object or restrict** certain processing.
- **Ask for a copy** of data you provided, in a structured format where required.
- **Complain** to the School's grievance officer or the relevant data-protection authority.

To exercise a right, contact {{PRIVACY_CONTACT_EMAIL}} or the grievance officer. The School will verify identity before acting. We aim to respond within 30 days, or sooner where the law requires.

Some requests cannot be granted in full: the School may need to retain academic, fee, or audit records, or may be legally barred from deleting them. If so, we will explain what is retained and why.

## 11. Account deletion

You can request deletion from inside the app: **Profile → Security → Request account deletion**. The request is queued for School review. The School verifies identity, then deletes the sign-in identity and direct identifiers and retains academic, fee, and audit records in de-identified form where retention is required.

The full path, the backend action, the deleted-versus-retained matrix, and the timeline are in the School's account-deletion notice, available at {{ACCOUNT_DELETION_URL}} and from the School office. You may also request deletion by emailing {{PRIVACY_CONTACT_EMAIL}}.

## 12. Cookies and analytics

The mobile app does not use advertising cookies or third-party analytics. The web administration console is for staff and uses only what is necessary to operate a signed-in session. We do not run cross-site advertising trackers.

## 13. Changes to this policy

We may update this policy when the Service or the law changes. The effective date at the top will change. Material changes will be notified to the School community through the usual school channels. Continued use after an update means the updated policy applies.

## 14. Contact and grievances

- **Privacy questions:** {{PRIVACY_CONTACT_NAME}} — {{PRIVACY_CONTACT_EMAIL}} — {{PRIVACY_CONTACT_PHONE}}
- **Grievance officer:** {{GRIEVANCE_OFFICER_NAME}} — {{GRIEVANCE_OFFICER_EMAIL}}
- **Postal address:** {{SCHOOL_POSTAL_ADDRESS}}

If you are not satisfied with the School's response, you may complain to the Data Protection Board of India or the supervisory authority that applies to you.

---

**Publication URL:** {{PRIVACY_POLICY_URL}}  
**App:** Pacific World School (Android and iOS)  
**Admin console:** the School's staff web console
