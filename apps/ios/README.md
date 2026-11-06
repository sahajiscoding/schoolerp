# Pacific World School — iOS app

Native SwiftUI client for the School ERP. Built with SwiftPM through [xtool](https://github.com/xtool-org/xtool), so it compiles on Linux/WSL without an Xcode install.

## Layout

- `Package.swift` — SwiftPM manifest (iOS 17+)
- `xtool.yml` — xtool project config (`bundleID: com.pacificworld.school`)
- `Sources/PacificWorldSchool/` — SwiftUI app

## Build / run

From this folder inside WSL:

```bash
xtool dev build   # compile only
xtool dev         # build and run on an attached device
```

On Windows, install WSL first (`wsl --install`), plus xtool, Swift, and the Darwin Swift SDK. USB passthrough uses `usbipd`.

## Demo mode

This is a **demo-mode** build that mirrors the web console:

- Sign in as Admin / Teacher / Student with the one-click demo buttons, or
- sign in as a student with admission no + the school-issued password derived from DOB (`Student@DDMMYYYY`).

Seeded data lives in `Seed.swift`; the in-memory store is `DemoStore.swift`. Live Supabase wiring is the same next step as the admin console (`PROJECT_STATUS.md`). No secrets or Supabase keys are in this app.

## Visual direction

Deep olive (`#4B5D2A`), terracotta (`#D2691E`), sand (`#F5F1EC`), cream (`#FAF7F2`), ink (`#1A1A1A`). Tokens live in `Theme.swift` and match `packages/shared/src/theme.ts`.
