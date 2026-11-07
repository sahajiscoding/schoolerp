import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.hoisted(() => { window.history.replaceState(null, '', '/login'); });
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => { throw new Error('Demo must not construct a Supabase client'); }),
}));

import { createClient } from '@supabase/supabase-js';
import App from '../src/App';
import { supabase } from '../src/lib/supabase';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/login');
});
afterEach(cleanup);

it.each(['Admin', 'Teacher', 'Student'])('enters %s demo on the same URLs, restores and exits locally', async (role) => {
  const user = userEvent.setup();
  localStorage.setItem('sb-existing-auth-token', 'untouched-session');
  const { unmount } = render(<App />);

  await user.click(screen.getByRole('button', { name: /try a demo/i }));
  await user.click(screen.getByRole('button', { name: role, exact: true }));
  await screen.findByText('Demo mode');

  // Same URLs — no /demo prefix.
  expect(window.location.pathname).toBe('/dashboard');
  expect(sessionStorage.getItem('pws.demo.session')).toBe('1');
  expect(sessionStorage.getItem('pws.demo.role')).toBe(role.toLowerCase());
  expect(localStorage.getItem('pws.demo.data.v5')).toContain('p-student-1');

  // Refresh/remount on a nested route preserves the selected demo identity.
  unmount();
  window.history.replaceState(null, '', '/homeworks');
  render(<App />);
  await screen.findByText('Demo mode');
  expect(window.location.pathname).toBe('/homeworks');

  await user.click(screen.getByRole('button', { name: /exit demo/i }));
  await screen.findByText(/login to your account/i);
  expect(sessionStorage.getItem('pws.demo.session')).toBeNull();
  expect(localStorage.getItem('sb-existing-auth-token')).toBe('untouched-session');
  expect(createClient).not.toHaveBeenCalled();
  expect(supabase).toBeNull();
});

it('keeps an existing demo session isolated from real sign-in', async () => {
  sessionStorage.setItem('pws.demo.session', '1');
  sessionStorage.setItem('pws.demo.role', 'student');
  render(<App />);
  await screen.findByText('Demo mode');
  expect(window.location.pathname).toBe('/dashboard');
  expect(createClient).not.toHaveBeenCalled();
});

it('keeps administrators read-only on academic homework content', async () => {
  sessionStorage.setItem('pws.demo.session', '1');
  sessionStorage.setItem('pws.demo.role', 'admin');
  window.history.replaceState(null, '', '/homeworks');
  render(<App />);

  await screen.findByRole('heading', { name: 'Homeworks' });
  expect(screen.queryByRole('button', { name: 'New homework' })).toBeNull();
});
