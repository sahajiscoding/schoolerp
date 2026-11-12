# Screenshots checklist — Pacific World School

- **App:** Pacific World School (mobile; teachers and students)
- **Prepared:** 2026-11-12
- **Branch:** `milestone/f-store-readiness`
- **Status:** Capture from the release candidate after Milestone E lands. Do not capture from placeholder `app.json`.

## Required device sizes

| Store | Required sizes |
|---|---|
| Apple App Store | iPhone 6.7" (1290×2796), iPhone 6.5" (1242×2208), iPad Pro 12.9" (2048×2732) |
| Google Play | Phone 7-inch table / 10-inch tablet (1080×1920 or higher), 7-inch tablet (600×1024) |
| Feature graphics | Google Play: 1024×500 |

## Screens per role

| Screen | Teacher | Student | Notes |
|---|---|---|---|
| Sign in + forced password change | Yes | Yes | Show login ID + password; forced-change screen |
| Dashboard | Yes | Yes | Role-aware cards |
| Assignments list | Yes | Yes | Teacher sees own + roster; student sees targeted |
| Assignment detail | Yes | Yes | Instructions, due date, attachments |
| Submit assignment | — | Yes | Text input + file picker |
| Submission review | Yes | — | Teacher roster with status |
| Messages inbox | Yes | Yes | Inbox/sent with unread badge |
| Thread detail + reply | Yes | Yes | One thread per student pair |
| Compose message | Yes | — | Multi-student picker |
| Notices / circulars | Yes | Yes | List + detail + mark read |
| Leave apply | — | Yes | Date range, type, reason, attachment |
| Leave approve/reject | Yes | — | Status + decision note |
| Library catalog | Yes | Yes | Browse + search |
| Borrow / return | Yes | Yes | Issue + return flow |
| Fees | — | Yes | Invoices, instalments, sibling discount |
| Report card | — | Yes | Published marks + grades |
| Attendance | Yes | Yes | Teacher marks; student reads own |
| Profile | Yes | Yes | Name, role, section, sign out |
| Account-deletion request | Yes | Yes | Confirmation dialog |

## Admin-route capture (web console, for reviewer context)

| Route | Notes |
|---|---|
| `/dashboard` | Counts + quick links |
| `/people` | List + CSV import |
| `/classes` / `/sections` | Class and section management |
| `/subjects` | Subject list |
| `/teaching-assignments` | Teacher ↔ section ↔ subject |
| `/enrollments` | Student placement |
| `/homeworks` | All assignments (admin read-only) |
| `/circulars` | Broadcast composer |
| `/messages` | All threads (read-only, audited) |
| `/audit-log` | Read-only audit trail |

## Capture rules

- Use the anonymized demo identities from `review-notes.md` (§2). Never real student or staff data.
- Blur or redact any admission number, phone number, or email that appears incidentally.
- Capture in both light and dark theme (time-aware auto: 05:00–18:00 light, else dark).
- Capture with the demo banner visible where applicable ("Sample data only…").
- Save as PNG; name files `screen-<role>-<name>.png` (e.g., `screen-student-dashboard.png`).
- Do not include the school logo/crest unless supplied by the school; do not invent branding.
