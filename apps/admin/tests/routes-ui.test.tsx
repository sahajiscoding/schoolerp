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

it.each([
  ['/course-progress', /Add progress/i],
  ['/study-room', /Share PDF/i],
  ['/report-card', /Generate report card/i],
] as const)('keeps academic authoring read-only for administrators at %s', async (path, action) => {
  window.history.replaceState(null, '', `/demo${path}?role=admin`);
  render(<App />);
  await screen.findByRole('heading', { level: 1 });
  expect(screen.queryByRole('button', { name: action })).toBeNull();
});

const communityRoutes = [
  ['/communications', /Communications|Inbox/i],
  ['/events', /Events & calendars/i],
  ['/study-room', /Study room/i],
  ['/library', /Library/i],
  ['/fees', /Fee collection|My fee/i],
  ['/gallery', /School gallery/i],
] as const;

it.each(communityRoutes)('renders the community and resource workspace at %s', async (path, heading) => {
  window.history.replaceState(null, '', `/demo${path}?role=admin`);
  render(<App />);
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeTruthy();
});

it('labels the events calendar for assistive technology', async () => {
  window.history.replaceState(null, '', '/demo/events?role=admin');
  render(<App />);
  expect(await screen.findByRole('region', { name: /School calendar/i })).toBeTruthy();
});

it('labels the three communications work areas', async () => {
  window.history.replaceState(null, '', '/demo/communications?role=admin');
  render(<App />);
  for (const name of [/Declarations/i, /Polls/i, /Recent messages/i]) {
    expect(await screen.findByRole('region', { name })).toBeTruthy();
  }
});

it('retains the second-child sibling discount rule', async () => {
  window.history.replaceState(null, '', '/demo/fees?role=admin');
  render(<App />);
  expect(await screen.findByText(/50% campus discount is applied to the sibling/i)).toBeTruthy();
});

it.each([
  ['/study-room', /Study resources/i],
  ['/gallery', /School memories/i],
] as const)('labels the resource region at %s', async (path, region) => {
  window.history.replaceState(null, '', `/demo${path}?role=admin`);
  render(<App />);
  expect(await screen.findByRole('region', { name: region })).toBeTruthy();
});
