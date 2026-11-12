import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.hoisted(() => window.history.replaceState(null, '', '/demo/dashboard?role=admin'));
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => { throw new Error('Demo routes must remain isolated from Supabase'); }),
}));

import App from '../src/App';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(cleanup);

it.each([
  ['admin', 'School pulse'],
  ['teacher', 'Class pulse'],
  ['student', 'My day'],
] as const)('renders the %s dashboard identity', async (role, heading) => {
  window.history.replaceState(null, '', `/demo/dashboard?role=${role}`);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: new RegExp(heading, 'i') })).toBeTruthy();
});

const adminRoutes = [
  ['/people', /People & profiles/i],
  ['/classes', /Classes & sections/i],
  ['/subjects', /Subjects/i],
  ['/teaching-assignments', /Teaching assignments/i],
  ['/enrollments', /Enrollments/i],
  ['/audit-log', /Audit log/i],
] as const;

it.each(adminRoutes)('renders the administration ledger at %s', async (path, heading) => {
  window.history.replaceState(null, '', `/demo${path}?role=admin`);
  render(<App />);
  const pageHeading = await screen.findByRole('heading', { level: 1, name: heading });
  expect(pageHeading).toBeTruthy();
});
