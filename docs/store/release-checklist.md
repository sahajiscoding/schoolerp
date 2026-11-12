# Release checklist — Pacific World School mobile

- **App:** Pacific World School (Expo mobile app)
- **Prepared:** 2026-11-12
- **Branch:** `milestone/f-store-readiness`
- **Status:** Draft. No EAS build or store submission has been performed.

## Preconditions (gates before building)

- [ ] Milestone E acceptance checks pass on the mobile app (typecheck, lint, route smoke as admin/teacher/student)
- [ ] Milestone B migrations applied to the release Supabase project and RLS verified empirically
- [ ] `admin-users` Edge Function deployed; first real admin created via `scripts/create-admin.mjs`
- [ ] `privacy-policy.md` placeholders filled, published at a stable HTTPS URL, and loaded without login
- [ ] `apps/mobile/app.json` has real display name, bundle ID, package name, version, and icon
- [ ] No `EXPO_PUBLIC_` or `VITE_` variable in `apps/` whose name contains SECRET, SERVICE, PRIVATE, JWT, POSTGRES, DATABASE, PASSWORD, or TOKEN (publishable key is the sole exception)
- [ ] `grep` of `apps/` for `SERVICE_ROLE_KEY`, `SECRET_KEY`, `JWT_SECRET`, `POSTGRES_` returns nothing
- [ ] `npm audit` reports 0 vulnerabilities (or only accepted, documented advisories)
- [ ] Screenshots captured per `screenshots-checklist.md` from the release candidate

## EAS configuration

`eas.json` is staged at the **repository root** (this branch does not touch `apps/mobile/**`).

**Integrator action:** when Milestone E lands, move `eas.json` to `apps/mobile/eas.json` and delete the root copy. EAS CLI looks for `eas.json` in the Expo project root, which is `apps/mobile` because `apps/mobile/app.json` is the app config.

```json
{
  "cli": {
    "version": ">=14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "{{APPLE_ID}}",
        "ascAppId": "{{ASC_APP_ID}}",
        "appleTeamId": "{{APPLE_TEAM_ID}}"
      },
      "android": {
        "serviceAccountKeyPath": "{{ANDROID_SERVICE_ACCOUNT_PATH}}"
      }
    }
  }
}
```

Credentials (`APPLE_ID`, `ASC_APP_ID`, `APPLE_TEAM_ID`, `ANDROID_SERVICE_ACCOUNT_PATH`) are owner-held and never committed.

## Build and submit commands

```bash
# From the repo root (before moving eas.json into apps/mobile):
npx eas build --platform all --profile production --non-interactive

# After moving eas.json into apps/mobile:
cd apps/mobile
npx eas build --platform all --profile production --non-interactive
npx eas submit --platform all --latest --non-interactive
```

## Client env allowlist (the only names allowed in `apps/`)

| Variable | Allowed in client? | Notes |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Public Supabase URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Publishable/anon key (legacy `..._ANON_KEY` accepted; use one family) |
| `VITE_SUPABASE_URL` | Yes | Admin console alias |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Admin console alias |
| Any name containing SECRET, SERVICE, PRIVATE, JWT, POSTGRES, DATABASE, PASSWORD, TOKEN | **No** | CI fails on these |

## Versioning

- First release: `1.0.0`, build `1`
- Use EAS `autoIncrement` for iOS; set `versionCode` manually for Android
- Tag each release in git: `v1.0.0`, `v1.0.1`, etc.

## Rollout and rollback

- Submit to both stores as a phased rollout (e.g., 10% → 50% → 100%)
- Keep the previous build available in each store console for immediate rollback
- If a critical defect is found, pause the rollout and republish the previous version

## Post-submission

- [ ] Confirm app appears in search on both stores
- [ ] Test deep links (notification tap → assignment/thread/notice screen)
- [ ] Test account-deletion flow end-to-end with a demo account
- [ ] Monitor crash reports and store reviews for the first 2 weeks

## What this checklist does NOT claim

- No EAS build has been run
- No store submission has been performed
- No reviewer has approved the app
- No real user data is in the app
