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

const academicRoutes = [
  ['/approvals', 'student', /My leaves/i],
  ['/assignments', 'admin', /Assignments/i],
  ['/course-progress', 'student', /My progress/i],
  ['/attendance', 'student', /Attendance/i],
  ['/report-card', 'student', /My report card/i],
] as const;

it.each(academicRoutes)('renders the academic workspace at %s', async (path, role, heading) => {
  window.history.replaceState(null, '', `/demo${path}?role=${role}`);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
});

it('keeps attendance read-only for students', async () => {
  window.history.replaceState(null, '', '/demo/attendance?role=student');
  render(<App />);
  await screen.findByRole('heading', { level: 1, name: /Attendance/i });
  expect(screen.queryByRole('button', { name: /Mark attendance/i })).toBeNull();
});

it('keeps assignment content read-only for administrators', async () => {
  window.history.replaceState(null, '', '/demo/assignments?role=admin');
  render(<App />);
  await screen.findByRole('heading', { level: 1, name: /Assignments/i });
  expect(screen.queryByRole('button', { name: /Add assignment|Publish assignment/i })).toBeNull();
});
