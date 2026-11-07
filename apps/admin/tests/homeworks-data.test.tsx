import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: {
    inDemo: true,
    profile: { id: 'student-1', role: 'student' as const },
  },
  addAssignment: vi.fn(),
  submitAssignment: vi.fn(),
  notify: vi.fn(),
  loadLiveHomeworkRows: vi.fn(),
  publishLiveAssignment: vi.fn(),
  submitLiveAssignment: vi.fn(),
  createSubmissionDownloadUrl: vi.fn(),
}));

vi.mock('../src/contexts/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('../src/lib/appData', () => ({
  useAppData: () => ({
    homework: [
      {
        id: 'demo-homework',
        title: 'Demo homework',
        description: '',
        teacher_id: 'teacher-1',
        subject: 'Mathematics',
        section_label: 'IX - E',
        due_date: '2026-11-12',
        type: 'HOMEWORK',
        attachments: [],
        created_at: '2026-11-07T00:00:00.000Z',
      },
    ],
    submissions: [],
    people: [{ id: 'student-1', class_label: 'IX', section_label: 'E' }],
    teachingAssignments: [],
    subjects: [],
    addAssignment: mocks.addAssignment,
    submitAssignment: mocks.submitAssignment,
    notify: mocks.notify,
  }),
}));
vi.mock('../src/lib/supabase', () => ({ supabase: { id: 'live-client' } }));
vi.mock('../src/lib/demoSession', () => ({ isDemoSession: () => mocks.auth.inDemo }));
vi.mock('../src/lib/homeworksLive', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/homeworksLive')>();
  return {
    ...original,
    loadLiveHomeworkRows: mocks.loadLiveHomeworkRows,
    publishLiveAssignment: mocks.publishLiveAssignment,
    submitLiveAssignment: mocks.submitLiveAssignment,
    createSubmissionDownloadUrl: mocks.createSubmissionDownloadUrl,
  };
});

import { useHomeworksData } from '../src/lib/useHomeworksData';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.inDemo = true;
  mocks.auth.profile = { id: 'student-1', role: 'student' };
});

it('uses the browser-only store in demo mode without loading Supabase', () => {
  const { result } = renderHook(() => useHomeworksData());

  expect(result.current.homework.map((entry) => entry.id)).toEqual(['demo-homework']);
  expect(result.current.isLive).toBe(false);
  expect(mocks.loadLiveHomeworkRows).not.toHaveBeenCalled();
});

it('loads and refreshes the live slice for a real teacher session', async () => {
  mocks.auth.inDemo = false;
  mocks.auth.profile = { id: 'teacher-1', role: 'teacher' };
  mocks.loadLiveHomeworkRows.mockResolvedValue({
    homework: [],
    submissions: [],
    targets: [
      {
        sectionId: 'section-1',
        sectionLabel: 'IX - E',
        subjectId: 'subject-1',
        subject: 'Mathematics',
      },
    ],
  });

  const { result } = renderHook(() => useHomeworksData());
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(mocks.loadLiveHomeworkRows).toHaveBeenCalledWith(
    { id: 'live-client' },
    'teacher-1',
    'teacher',
  );

  await act(async () => {
    await result.current.addAssignment({
      title: 'New homework',
      description: '',
      teacher_id: 'teacher-1',
      subject: 'Mathematics',
      section_label: 'IX - E',
      due_date: '2026-11-12',
      type: 'HOMEWORK',
      attachments: [],
    });
  });

  expect(mocks.publishLiveAssignment).toHaveBeenCalledOnce();
  expect(mocks.loadLiveHomeworkRows).toHaveBeenCalledTimes(2);
});
