import { describe, expect, it, vi } from 'vitest';
import {
  createSubmissionDownloadUrl,
  mapLiveHomeworkRows,
  publishLiveAssignment,
  storagePathForSubmission,
  submitLiveAssignment,
  validateSubmissionFile,
} from '../src/lib/homeworksLive';

const rows = {
  assignments: [
    {
      id: 'assignment-1',
      teacher_id: 'teacher-1',
      title: 'Fractions worksheet',
      instructions: 'Complete questions 1–10.',
      due_at: '2026-11-12T12:00:00.000Z',
      attachment_path: null,
      published_at: '2026-11-07T08:00:00.000Z',
      created_at: '2026-11-07T08:00:00.000Z',
      kind: 'HOMEWORK' as const,
      subject_id: 'subject-1',
    },
  ],
  assignmentSections: [{ assignment_id: 'assignment-1', section_id: 'section-1' }],
  sections: [
    {
      id: 'section-1',
      class_id: 'class-1',
      name: 'E',
      academic_year: '2026-27',
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  classes: [
    {
      id: 'class-1',
      name: 'IX',
      sort_order: 1,
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  subjects: [
    {
      id: 'subject-1',
      name: 'Mathematics',
      code: 'MATH',
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ],
  submissions: [
    {
      id: 'submission-1',
      assignment_id: 'assignment-1',
      student_id: 'student-1',
      body: 'Done',
      file_path: 'student-1/submission-1-answer.pdf',
      submitted_at: '2026-11-07T09:00:00.000Z',
      status: 'submitted' as const,
      reviewed_at: null,
    },
  ],
  teachingAssignments: [
    {
      id: 'teaching-1',
      teacher_id: 'teacher-1',
      section_id: 'section-1',
      subject_id: 'subject-1',
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ],
};

describe('live homework row mapping', () => {
  it('maps database rows into the existing page contract and teacher target options', () => {
    const result = mapLiveHomeworkRows(rows);

    expect(result.homework).toEqual([
      expect.objectContaining({
        id: 'assignment-1',
        subject: 'Mathematics',
        section_label: 'IX - E',
        due_date: '2026-11-12',
        type: 'HOMEWORK',
      }),
    ]);
    expect(result.submissions[0]).toEqual(
      expect.objectContaining({
        assignment_id: 'assignment-1',
        file_name: 'submission-1-answer.pdf',
        file_path: 'student-1/submission-1-answer.pdf',
      }),
    );
    expect(result.targets).toEqual([
      {
        sectionId: 'section-1',
        sectionLabel: 'IX - E',
        subjectId: 'subject-1',
        subject: 'Mathematics',
      },
    ]);
  });
});

describe('submission file validation', () => {
  it('accepts an allowed PDF and creates an owner-scoped sanitized path', () => {
    const file = { name: 'My answers (final).pdf', size: 1024, type: 'application/pdf' } as File;

    expect(() => validateSubmissionFile(file)).not.toThrow();
    expect(storagePathForSubmission('student-1', file, 'upload-1')).toBe(
      'student-1/upload-1-My-answers--final-.pdf',
    );
  });

  it.each([
    [{ name: 'answer.exe', size: 1024, type: 'application/octet-stream' }, 'PDF, JPEG, PNG, or DOCX'],
    [{ name: 'answer.pdf', size: 10 * 1024 * 1024 + 1, type: 'application/pdf' }, '10 MB'],
    [{ name: 'answer.png', size: 1024, type: 'image/jpeg' }, 'does not match'],
  ])('rejects unsafe files', (candidate, message) => {
    expect(() => validateSubmissionFile(candidate as File)).toThrow(message);
  });
});

describe('live homework writes', () => {
  it('publishes through the server-side targeting RPC', async () => {
    const rpc = vi.fn(async () => ({ data: rows.assignments[0], error: null }));
    const client = { rpc } as never;

    await publishLiveAssignment(client, {
      title: 'Fractions worksheet',
      description: 'Complete questions 1–10.',
      dueDate: '2026-11-12',
      kind: 'HOMEWORK',
      target: {
        sectionId: 'section-1',
        sectionLabel: 'IX - E',
        subjectId: 'subject-1',
        subject: 'Mathematics',
      },
    });

    expect(rpc).toHaveBeenCalledWith('publish_assignment', {
      p_title: 'Fractions worksheet',
      p_instructions: 'Complete questions 1–10.',
      p_due_at: '2026-11-12T23:59:59.999Z',
      p_kind: 'HOMEWORK',
      p_subject_id: 'subject-1',
      p_section_ids: ['section-1'],
      p_student_ids: [],
      p_attachment_path: null,
    });
  });

  it('uploads an owner-scoped file before submitting through the RPC', async () => {
    const upload = vi.fn(async () => ({ data: { path: 'student-1/upload-1-answer.pdf' }, error: null }));
    const remove = vi.fn(async () => ({ data: [], error: null }));
    const rpc = vi.fn(async () => ({ data: rows.submissions[0], error: null }));
    const client = { storage: { from: vi.fn(() => ({ upload, remove })) }, rpc } as never;
    const file = { name: 'answer.pdf', size: 1024, type: 'application/pdf' } as File;

    await submitLiveAssignment(
      client,
      {
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        body: 'Done',
        file,
      },
      () => 'upload-1',
    );

    expect(upload).toHaveBeenCalledWith('student-1/upload-1-answer.pdf', file, {
      contentType: 'application/pdf',
      upsert: false,
    });
    expect(rpc).toHaveBeenCalledWith('submit_assignment', {
      p_assignment_id: 'assignment-1',
      p_body: 'Done',
      p_file_path: 'student-1/upload-1-answer.pdf',
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it('removes a newly uploaded file when the submission RPC fails', async () => {
    const upload = vi.fn(async () => ({ data: { path: 'student-1/upload-1-answer.pdf' }, error: null }));
    const remove = vi.fn(async () => ({ data: [], error: null }));
    const rpc = vi.fn(async () => ({ data: null, error: { message: 'denied' } }));
    const client = { storage: { from: vi.fn(() => ({ upload, remove })) }, rpc } as never;
    const file = { name: 'answer.pdf', size: 1024, type: 'application/pdf' } as File;

    await expect(
      submitLiveAssignment(
        client,
        { assignmentId: 'assignment-1', studentId: 'student-1', body: '', file },
        () => 'upload-1',
      ),
    ).rejects.toThrow('Could not submit the assignment');
    expect(remove).toHaveBeenCalledWith(['student-1/upload-1-answer.pdf']);
  });

  it('creates a short-lived signed URL for a private submission file', async () => {
    const createSignedUrl = vi.fn(async () => ({ data: { signedUrl: 'https://signed.example/file' }, error: null }));
    const client = { storage: { from: vi.fn(() => ({ createSignedUrl })) } } as never;

    await expect(createSubmissionDownloadUrl(client, 'student-1/answer.pdf')).resolves.toBe(
      'https://signed.example/file',
    );
    expect(createSignedUrl).toHaveBeenCalledWith('student-1/answer.pdf', 60);
  });
});
