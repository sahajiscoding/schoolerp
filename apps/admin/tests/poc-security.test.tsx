/**
 * SECURITY PROOF-OF-CONCEPT (audit artefact — see docs/audits/2026-11-06-application-security-audit.md)
 *
 * These tests are written to PASS against the current code so that the suite stays
 * green, but each one asserts the *insecure* behaviour. When a finding is remediated,
 * flip the assertion to the commented "FIXED" expectation — the test then becomes the
 * regression guard.
 *
 *   PoC-1  F-01  Passwordless credential derivation (login ID + DOB -> working password)
 *   PoC-2  F-04  `viewAsRole()` grants admin affordances with no server-side authority
 *   PoC-3  F-11  DOB / phone / initial password reach the client store and are rendered
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';

const TEACHER_ID = '11111111-1111-1111-1111-111111111111';

const sb = vi.hoisted(() => {
  window.history.replaceState(null, '', '/dashboard');
  const auth = {
    getSession: vi.fn(async () => ({
      data: {
        session: {
          user: { id: '11111111-1111-1111-1111-111111111111' },
        },
      },
      error: null,
    })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn(async () => ({ error: null })),
    signOut: vi.fn(),
    getUser: vi.fn(async () => ({ data: { user: { id: '11111111-1111-1111-1111-111111111111' } } })),
  };
  const from = vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: {
            id: '11111111-1111-1111-1111-111111111111',
            role: 'teacher', // <-- a *teacher* session, not an admin
            full_name: 'Teacher',
            login_id: 'TCH001',
            must_change_password: false,
            is_active: true,
            avatar_path: null,
            created_at: new Date().toISOString(),
          },
          error: null,
        })),
      })),
    })),
  }));
  return { auth, from };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ auth: sb.auth, from: sb.from })),
}));

import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { passwordFromDob, toAuthEmail } from '../src/lib/utils';
import { seedPeople } from '../src/lib/seed';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/dashboard');
});
afterEach(cleanup);

/* -------------------------------------------------------------------------- */
/* PoC-1 — F-01: the initial password is a pure function of public data.      */
/* -------------------------------------------------------------------------- */
describe('PoC-1 passwordless credential derivation (F-01)', () => {
  it('reconstructs a working password from a leaked/stale login ID + DOB', () => {
    // "admissionNo" is displayed in the UI, printed on report cards and
    // exported to CSV. "dateOfBirth" is the credentials field handed to
    // students/parents and is readable by any teacher of that student.
    const admissionNo = 'PWS/2026/0142';
    const dateOfBirth = '2011-07-09';

    const email = toAuthEmail(admissionNo);
    const password = passwordFromDob(dateOfBirth);

    // The auth identity is guessable from the (public) admission number:
    expect(email).toBe('pws-2026-0142@pws.local');

    // ...and two distinct admission numbers collapse to one identity, because
    // every non [a-z0-9._-] char is rewritten to '-':
    expect(toAuthEmail('PWS/1')).toBe(toAuthEmail('PWS-1'));
    expect(toAuthEmail('PWS//1')).toBe(toAuthEmail('PWS/1')); // '-' collapse
    expect(toAuthEmail('PWS.1')).toBe(toAuthEmail('PWS.1'));

    // ...and the password's entropy is calendar-space, not random:
    expect(password).toBe('Student@09072011');

    // Search space for any known student: days between ages 3 and 18.
    const candidates = (18 - 3) * 365 + Math.ceil(15 / 4);
    expect(candidates).toBeLessThan(5500);

    // FIXED: expect(password).toMatch(/^[A-Za-z0-9_-]{20,}$/) // random, server-set,
    //        never derived; no plaintext display anywhere.
  });

  it('ships the derived passwords of seeded identities in the client bundle', () => {
    const withPasswords = seedPeople.filter((p) => p.password);
    expect(withPasswords.length).toBeGreaterThan(0);
    // FIXED: expect(withPasswords).toHaveLength(0)
  });
});

/* -------------------------------------------------------------------------- */
/* PoC-2 — F-04: view-as role is a *display* override that feeds authz.        */
/* -------------------------------------------------------------------------- */
describe('PoC-2 client-side role escalation surface (F-04)', () => {
  it('a teacher session can make isAdmin() true with no server round-trip', async () => {
    let api: ReturnType<typeof useAuth> | null = null;
    function Probe() {
      api = useAuth();
      return <div data-testid="role">{api.isAdmin() ? 'admin' : 'not-admin'}</div>;
    }

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    // Wait for the teacher profile to resolve from Supabase.
    await waitFor(() => expect(screen.getByTestId('role').textContent).toBe('not-admin'));
    expect(api!.profile?.role).toBe('teacher');
    // The RoleSwitcher is hidden from teachers (AppShell gates on profile.role)...
    expect(api!.isAdmin()).toBe(false);

    // ...but the capability it calls is not gated at all.
    act(() => api!.viewAsRole('admin'));

    // Every client-side "admin only" gate (AppShell nav, AdminOnly routes,
    // canShare-style checks) now opens for a teacher session.
    expect(api!.isAdmin()).toBe(true);
    expect(screen.getByTestId('role').textContent).toBe('admin');

    // FIXED: viewAsRole must be a no-op unless profile.role === 'admin'
    //        (expect(api.isAdmin()) toBe(false)); and no *write* may rely on it.
  });
});

/* -------------------------------------------------------------------------- */
/* PoC-3 — F-11: sensitive student data is stored client-side in clear.        */
/* -------------------------------------------------------------------------- */
describe('PoC-3 sensitive fields in the client store (F-11)', () => {
  it('persists DOB, guardian phone and initial passwords to localStorage', async () => {
    const { AppDataProvider, useAppData } = await import('../src/lib/appData');

    function Seed() {
      const data = useAppData();
      const person = data.people[0];
      return (
        <>
          <span data-testid="dob">{person?.dob ?? 'none'}</span>
          <span data-testid="phone">{person?.phone ?? 'none'}</span>
          <span data-testid="pw">{person?.password ?? 'none'}</span>
        </>
      );
    }

    render(
      <AuthProvider>
        <AppDataProvider>
          <Seed />
        </AppDataProvider>
      </AuthProvider>,
    );

    // The whole app state — including these fields — is written to localStorage
    // by AppDataProvider on every mutation and is world-readable to any script
    // on the origin (and to anyone with the device).
    await waitFor(() => {
      const raw = localStorage.getItem('pws.demo.data.v4') ?? localStorage.getItem('pws.showcase.data.v1');
      expect(raw).toBeTruthy();
    });

    const key =
      localStorage.getItem('pws.demo.data.v4') !== null ? 'pws.demo.data.v4' : 'pws.showcase.data.v1';
    const raw = localStorage.getItem(key)!;
    expect(raw).toContain('password');
    expect(raw).toContain('Student@'); // derived initial password in clear text
    expect(raw).toMatch(/\d{4}-\d{2}-\d{2}/); // date of birth
    expect(raw).toMatch(/\+91/); // guardian phone

    // FIXED: no password/dob/guardian_phone in client state or storage; server-side
    //        credentials only, and PII fetched on demand under RLS.
  });
});
