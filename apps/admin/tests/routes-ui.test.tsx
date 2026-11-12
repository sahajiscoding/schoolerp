import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.hoisted(() => window.history.replaceState(null, '', '/demo/dashboard?role=admin'));
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => { throw new Error('Demo must stay isolated'); }),
}));

import App from '../src/App';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(cleanup);

it.each([
  ['admin', 'Today at PWS'],
  ['teacher', 'My class today'],
  ['student', 'My school day'],
] as const)('renders the %s dashboard identity', async (role, heading) => {
  window.history.replaceState(null, '', `/demo/dashboard?role=${role}`);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
});
