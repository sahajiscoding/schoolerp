import type { Role } from '@schoolerp/shared';

/**
 * Browser-only demo session flag.
 *
 * Demo data lives exclusively in `localStorage` (see `appData.tsx`) and must
 * never reach Supabase. This module is the single source of truth for "are we
 * in a demo session right now?" — while it returns true, no Supabase client is
 * created and no Supabase API (`auth.*`, `from().*`) is ever called.
 *
 * Kept in `sessionStorage` so a new tab starts in live mode and there is no
 * cross-tab surprise where one tab's demo leaks into another tab's real
 * session. All storage access is wrapped so SSR/tests without storage still
 * work.
 */
const SESSION_KEY = 'pws.demo.session';
const ROLE_KEY = 'pws.demo.role';

const DEMO_ROLES: Role[] = ['admin', 'teacher', 'student'];

export function isDemoSession(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function getDemoRole(): Role | null {
  try {
    const raw = window.sessionStorage.getItem(ROLE_KEY);
    return raw && (DEMO_ROLES as string[]).includes(raw) ? (raw as Role) : null;
  } catch {
    return null;
  }
}

export function setDemoSession(role: Role): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, '1');
    window.sessionStorage.setItem(ROLE_KEY, role);
  } catch {
    // Storage unavailable — the in-memory demo state still works for this tab.
  }
}

export function clearDemoSession(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(ROLE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
