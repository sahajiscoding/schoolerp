import type { Role } from '@schoolerp/shared';

/**
 * A full page load separates the showcase from the school app. Never change
 * this flag in-place: the Supabase module uses it BEFORE creating a client.
 * This is UI isolation, not authorization; live data remains protected by RLS.
 */
export const isDemoPath = /^\/demo(?:\/|$)/.test(window.location.pathname);
const ROLE_KEY = 'pws.showcase.role';

function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'teacher' || value === 'student';
}

export function readDemoRole(): Role | null {
  if (!isDemoPath) return null;
  const requested = new URLSearchParams(window.location.search).get('role');
  if (requested !== null) return isRole(requested) ? requested : null;
  try {
    const saved = sessionStorage.getItem(ROLE_KEY);
    return isRole(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function saveDemoRole(role: Role | null) {
  try {
    if (role) sessionStorage.setItem(ROLE_KEY, role);
    else sessionStorage.removeItem(ROLE_KEY);
  } catch {
    // In-memory demo entry still works when storage is unavailable.
  }
}
