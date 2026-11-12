import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.hoisted(() => { window.history.replaceState(null, '', '/demo/login'); });
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => { throw new Error('Demo must not construct a Supabase client'); }),
}));

import { createClient } from '@supabase/supabase-js';
import App from '../src/App';
import { supabase } from '../src/lib/supabase';
import { readDemoRole } from '../src/lib/demo';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/demo/login');
});
afterEach(cleanup);

it.each(['Admin', 'Teacher', 'Student'])('enters %s with configured Supabase, navigates, restores and signs out locally', async (role) => {
  const user = userEvent.setup();
  localStorage.setItem('sb-existing-auth-token', 'untouched-session');
  localStorage.setItem('pws.demo.data.v4', JSON.stringify({ people: [{ id: 'private-person', full_name: 'Private school person' }] }));
  const schoolData = localStorage.getItem('pws.demo.data.v4');
  const { unmount } = render(<App />);
  expect(screen.queryByLabelText('Your Password')).toBeNull();
  await user.click(screen.getByRole('button', { name: role, exact: true }));
  await screen.findByText('Demo mode');
  expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Dashboard' }).getAttribute('aria-current')).toBe('page');
  expect(screen.getByRole('banner')).toBeTruthy();
  expect(screen.getByRole('main')).toBeTruthy();
  expect(window.location.pathname).toBe('/demo/dashboard');
  expect(sessionStorage.getItem('pws.showcase.role')).toBe(role.toLowerCase());
  expect(screen.getByRole('link', { name: 'Exit demo · School sign in' }).getAttribute('href')).toBe('/login');
  expect(document.body.textContent).not.toContain('Private school person');
  expect(localStorage.getItem('pws.showcase.data.v1')).toContain('p-student-1');

  // Refresh/remount on a nested route preserves the selected demo identity.
  unmount();
  window.history.replaceState(null, '', '/demo/assignments');
  render(<App />);
  await screen.findByText('Demo mode');
  expect(window.location.pathname).toBe('/demo/assignments');
  await user.click(screen.getAllByRole('button', { name: 'Reset demo data' })[0]);
  expect(localStorage.getItem('pws.demo.data.v4')).toBe(schoolData);
  await user.click(screen.getAllByRole('button', { name: 'Sign out', exact: true })[0]);
  await screen.findByText('Explore the school demo');
  expect(sessionStorage.getItem('pws.showcase.role')).toBeNull();
  expect(localStorage.getItem('sb-existing-auth-token')).toBe('untouched-session');
  expect(createClient).not.toHaveBeenCalled();
  expect(supabase).toBeNull();
});

it.each(['admin', 'teacher', 'student'])('supports a direct %s demo URL and strips the entry parameter', async (role) => {
  window.history.replaceState(null, '', `/demo/dashboard?role=${role}`);
  render(<App />);
  await screen.findByText('Demo mode');
  await waitFor(() => expect(window.location.search).toBe(''));
  expect(sessionStorage.getItem('pws.showcase.role')).toBe(role);
});

it('rejects unknown roles without granting a demo profile', async () => {
  window.history.replaceState(null, '', '/demo/dashboard?role=superadmin');
  expect(readDemoRole()).toBeNull();
  render(<App />);
  await screen.findByText('Explore the school demo');
  expect(window.location.pathname).toBe('/demo/login');
});

it('can enter a demo when browser storage is blocked', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'Student', exact: true }));
  await screen.findByText('Demo mode');
  expect(createClient).not.toHaveBeenCalled();
});
