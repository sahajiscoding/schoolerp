import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const auth = vi.hoisted(() => {
  window.history.replaceState(null, '', '/login');
  return {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { sub: null, subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn(async () => ({ error: { message: 'Test authentication response' } })),
    signOut: vi.fn(),
  };
});
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ auth })) }));

import App from '../src/App';
import { supabase } from '../src/lib/supabase';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/login');
});
afterEach(cleanup);

it('offers browser-only demo entry with Supabase configured', async () => {
  expect(supabase).not.toBeNull();
  render(<App />);
  const user = userEvent.setup();

  await user.click(await screen.findByRole('button', { name: /try a demo/i }));
  for (const role of ['Admin', 'Teacher', 'Student']) {
    expect(screen.getByRole('button', { name: role, exact: true })).toBeDefined();
  }
  expect(auth.signInWithPassword).not.toHaveBeenCalled();
  expect(auth.signOut).not.toHaveBeenCalled();
});

it('keeps real password login using Supabase Auth', async () => {
  render(<App />);
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Your Email/ UserId'), 'staff1');
  await user.type(screen.getByLabelText('Your Password'), 'test-input');
  await user.click(screen.getByRole('button', { name: 'Login', exact: true }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Test authentication response');
  expect(auth.signInWithPassword).toHaveBeenCalledOnce();
});
