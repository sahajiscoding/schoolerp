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

const adminRoutes = [
  ['/people', /People & profiles/i, 'Add student'],
  ['/classes', /Classes & sections/i, 'Add class'],
  ['/subjects', /^Subjects$/i, 'Add subject'],
  ['/teaching-assignments', /Teaching assignments/i, 'Add assignment'],
  ['/enrollments', /^Enrollments$/i, 'Enroll student'],
  ['/audit-log', /Audit log/i, null],
] as const;

it.each(adminRoutes)('renders the administration route %s with its primary action', async (path, heading, action) => {
  window.history.replaceState(null, '', `/demo${path}?role=admin`);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
  if (action) expect(screen.getByRole('button', { name: action })).toBeTruthy();
});

const academicRoutes = [
  ['/approvals', /Leave approvals/i, 'Leave requests'],
  ['/assignments', /Assignments/i, 'Assignment workspace'],
  ['/course-progress', /Course progress/i, 'Progress records'],
  ['/attendance', /Attendance/i, 'Attendance register'],
  ['/report-card', /Report cards/i, 'Report card records'],
] as const;

it.each(academicRoutes)('renders the academic route %s as a labelled workspace', async (path, heading, region) => {
  window.history.replaceState(null, '', `/demo${path}?role=admin`);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
  expect(screen.getByRole('region', { name: region })).toBeTruthy();
});

it('keeps attendance read-only for students', async () => {
  window.history.replaceState(null, '', '/demo/attendance?role=student');
  render(<App />);
  await screen.findByRole('heading', { level: 1, name: /My attendance/i });
  expect(screen.queryByRole('button', { name: /Mark attendance/i })).toBeNull();
});

it('keeps academic publishing and review read-only for administrators', async () => {
  window.history.replaceState(null, '', '/demo/assignments?role=admin');
  render(<App />);
  await screen.findByRole('heading', { level: 1, name: /Class assignments/i });
  expect(screen.queryByRole('button', { name: /Add assignment/i })).toBeNull();
  expect(screen.queryByRole('button', { name: /Mark reviewed/i })).toBeNull();
});

const communityRoutes = [
  ['/communications', /Communications/i, 'Communication centre'],
  ['/events', /Events & calendars/i, 'School calendar'],
  ['/study-room', /Study room/i, 'Study resources'],
  ['/library', /Library/i, 'Library workspace'],
  ['/fees', /Fee collection/i, 'Fee records'],
  ['/gallery', /School gallery/i, 'School memories'],
] as const;

it.each(communityRoutes)('renders the community route %s as a labelled workspace', async (path, heading, region) => {
  window.history.replaceState(null, '', `/demo${path}?role=admin`);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
  expect(screen.getByRole('region', { name: region })).toBeTruthy();
});
