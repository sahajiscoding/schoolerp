import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import { Card, Button, Badge, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui';
import { Page, PageHeader } from '../components/page';
import { Modal } from '../components/modal';
import { FiFileText, FiPlus, FiClipboard, FiPaperclip, FiCheckCircle } from 'react-icons/fi';
import { cn, formatDateLong, relativeToToday } from '../lib/utils';
import type { Homework } from '../lib/types';

export default function Assignments() {
  const { profile, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [reviewing, setReviewing] = useState<Homework | null>(null);
  const [submitting, setSubmitting] = useState<Homework | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'HOMEWORK' | 'ASSIGNMENT'>('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: 'Mathematics',
    section_label: 'IX - E',
    due_date: '',
    type: 'HOMEWORK' as 'HOMEWORK' | 'ASSIGNMENT',
    attachmentName: '',
  });

  const canAdd = isTeacher();

  const myAssignments = useMemo(() => {
    const scoped = isStudent()
      ? data.homework.filter((hw) => {
          const student = data.people.find((p) => p.id === profile?.id);
          return hw.section_label === `${student?.class_label} - ${student?.section_label}`;
        })
      : data.homework;
    return filter === 'all' ? scoped : scoped.filter((hw) => hw.type === filter);
  }, [data.homework, data.people, filter, isStudent, profile?.id]);

  const mySubmissions = data.submissions.filter((s) => s.student_id === profile?.id);
  const submittedAssignmentIds = new Set(mySubmissions.map((s) => s.assignment_id));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim() || !form.due_date) {
      data.notify('A title and a due date are required.');
      return;
    }
    data.addAssignment({
      title: form.title.trim(),
      description: form.description.trim(),
      teacher_id: profile.id,
      subject: form.subject,
      section_label: form.section_label,
      due_date: form.due_date,
      type: form.type,
      attachments: form.attachmentName
        ? [{ id: `att-${Date.now()}`, name: form.attachmentName, size: '—' }]
        : [],
    });
    setForm({
      title: '',
      description: '',
      subject: 'Mathematics',
      section_label: 'IX - E',
      due_date: '',
      type: 'HOMEWORK',
      attachmentName: '',
    });
    setOpen(false);
  };

  const handleSubmit = (assignmentId: string) => {
    if (!profile || submittedAssignmentIds.has(assignmentId)) return;
    data.submitAssignment({
      assignment_id: assignmentId,
      student_id: profile.id,
      body: submissionNote.trim() || 'Submitted from the student portal.',
      file_name: submissionNote.trim() ? 'submission.pdf' : undefined,
    });
    setSubmissionNote('');
    setSubmitting(null);
  };

  const [tab, setTab] = useState<'board' | 'submissions'>('board');

  const submissionRows = useMemo(() => {
    if (isStudent()) return [];
    return data.homework.flatMap((hw) => {
      const sectionStudents = data.people.filter(
        (p) => p.role === 'student' && `${p.class_label} - ${p.section_label}` === hw.section_label,
      );
      const submitted = data.submissions.filter((s) => s.assignment_id === hw.id);
      return sectionStudents
        .filter((student) => !submitted.some((s) => s.student_id === student.id))
        .map((student) => ({
          assignment: hw,
          student,
          submission: submitted.find((s) => s.student_id === student.id) ?? null,
          missing: true,
        }))
        .concat(
          submitted.map((submission) => ({
            assignment: hw,
            student: data.people.find((p) => p.id === submission.student_id)!,
            submission,
            missing: false,
          })),
        );
    });
  }, [data.homework, data.people, data.submissions, isStudent]);

  return (
    <Page>
      <PageHeader
        eyebrow={isStudent() ? 'My learning' : 'Classroom work'}
        title={isStudent() ? 'Assignments / Homework' : 'Class Assignments'}
        description={isStudent()
          ? 'Everything your teachers set, with who assigned it and when it is due.'
          : isTeacher()
            ? 'Set homework, attach the worksheet and review what comes back.'
            : 'Read-only school-wide oversight of assignments and submissions.'}
        actions={canAdd ? (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} aria-hidden="true" /> Add assignment
          </Button>
        ) : undefined}
      />

      <section aria-label="Assignment workspace" className="space-y-6">

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
          {(['all', 'HOMEWORK', 'ASSIGNMENT'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-md px-3 py-1 text-xs capitalize transition-colors',
                filter === key ? 'bg-olive text-white' : 'text-muted hover:text-ink',
              )}
            >
              {key === 'all' ? 'All' : key === 'HOMEWORK' ? 'Homework' : 'Assignments'}
            </button>
          ))}
        </div>
        {!isStudent() && (
          <div className="flex gap-1 rounded-lg bg-white p-1 shadow-sm">
            {(['board', 'submissions'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs capitalize transition-colors',
                  tab === key ? 'bg-olive text-white' : 'text-muted hover:text-ink',
                )}
              >
                {key}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'board' || isStudent() ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {myAssignments.map((hw) => {
            const teacher = data.people.find((p) => p.id === hw.teacher_id);
            const alreadySubmitted = submittedAssignmentIds.has(hw.id);
            const overdue = hw.due_date < '2026-11-04';
            return (
              <Card key={hw.id} className="flex h-full flex-col">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-ink">{hw.title}</h3>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                      <FiFileText size={13} />
                      <span>{hw.subject}</span>
                      <span className="text-slate-300">·</span>
                      <span>{hw.section_label}</span>
                    </div>
                  </div>
                  <Badge variant={hw.type === 'HOMEWORK' ? 'olive' : 'terracotta'}>
                    {hw.type === 'HOMEWORK' ? 'Homework' : 'Assignment'}
                  </Badge>
                </div>

                <p className="mb-3 line-clamp-3 flex-1 whitespace-pre-line text-sm text-muted">
                  {hw.description || 'No instructions added.'}
                </p>

                {hw.attachments.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {hw.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 rounded-md bg-sand/60 px-2 py-1 text-xs text-ink"
                      >
                        <FiPaperclip size={12} className="shrink-0 text-terracotta" />
                        <span className="truncate">{att.name}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-muted">{att.size}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-auto space-y-2 border-t border-sand/40 pt-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-olive/10 text-[9px] font-bold text-olive">
                      {(teacher?.full_name ?? 'T')
                        .split(' ')
                        .slice(0, 2)
                        .map((p) => p[0])
                        .join('')}
                    </span>
                    <span className="text-muted">
                      Assigned by <strong className="text-ink">{teacher?.full_name ?? 'Teacher'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(overdue ? 'text-terracotta' : 'text-muted')}>
                      Due {formatDateLong(hw.due_date)} · {relativeToToday(hw.due_date)}
                    </span>
                    {alreadySubmitted && (
                      <span className="inline-flex items-center gap-1 text-olive">
                        <FiCheckCircle size={12} /> Submitted
                      </span>
                    )}
                  </div>

                  {isStudent() ? (
                    alreadySubmitted ? (
                      <Button variant="outline" disabled className="w-full text-sm">
                        Submitted
                      </Button>
                    ) : (
                      <Button onClick={() => setSubmitting(hw)} className="w-full text-sm">
                        Submit work
                      </Button>
                    )
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-sm"
                      onClick={() => setReviewing(hw)}
                    >
                      <FiClipboard size={14} /> View submissions
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
          {myAssignments.length === 0 && (
            <Card className="col-span-full py-12 text-center">
              <div className="text-sm text-muted">
                No assignments here yet.
                {canAdd && ' Use “Add assignment” to post the first one.'}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-ink">Submissions</h3>
            <p className="text-sm text-muted">
              Who has handed in and who is still missing, per assignment.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {submissionRows.map((row, i) => (
                  <TableRow key={`${row.assignment.id}-${row.student?.id ?? i}`}>
                    <TableCell>
                      <div className="font-medium">{row.student?.full_name ?? '—'}</div>
                      <div className="text-xs text-muted">{row.student?.admission_no}</div>
                    </TableCell>
                    <TableCell className="text-sm">{row.assignment.title}</TableCell>
                    <TableCell className="text-xs text-muted">
                      {row.submission ? formatDateLong(row.submission.submitted_at.slice(0, 10)) : '—'}
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.submission?.file_name ?? <span className="text-muted">—</span>}
                    </TableCell>
                    <TableCell>
                      {row.missing ? (
                        <Badge variant="terracotta">Not submitted</Badge>
                      ) : row.submission?.status === 'reviewed' ? (
                        <Badge variant="success">Reviewed</Badge>
                      ) : (
                        <Badge variant="olive">Submitted</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {isTeacher() && !row.missing && row.submission && row.submission.status !== 'reviewed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => data.reviewSubmission(row.submission!.id)}
                        >
                          Mark reviewed
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {submissionRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-4 text-center text-muted">
                      Nothing submitted yet.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      </section>

      {/* Student: submit work */}
      {submitting && (
        <Modal title={`Submit — ${submitting.title}`} onClose={() => setSubmitting(null)}>
          <p className="mb-3 text-sm text-muted">
            Add a short note or the file name you are handing in. Your teacher sees it against your
            name.
          </p>
          <textarea
            aria-label="Submission note or file name"
            value={submissionNote}
            onChange={(e) => setSubmissionNote(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Completed exercises 4.1–4.4. Attached the scanned worksheet."
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSubmitting(null)}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(submitting.id)}>Submit</Button>
          </div>
        </Modal>
      )}

      {/* Teacher: review submissions for one assignment */}
      {reviewing && (
        <Modal title={reviewing.title} onClose={() => setReviewing(null)}>
          <div className="space-y-2">
            {data.people
              .filter(
                (p) => p.role === 'student' && `${p.class_label} - ${p.section_label}` === reviewing.section_label,
              )
              .map((student) => {
                const submission = data.submissions.find(
                  (s) => s.assignment_id === reviewing.id && s.student_id === student.id,
                );
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 rounded-lg border border-sand/50 p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-ink">{student.full_name}</div>
                      <div className="text-xs text-muted">
                        {submission
                          ? `${submission.file_name ?? 'Text submission'} · ${formatDateLong(submission.submitted_at.slice(0, 10))}`
                          : 'Not submitted'}
                      </div>
                    </div>
                    {submission ? (
                       submission.status === 'reviewed' ? (
                         <Badge variant="success">Reviewed</Badge>
                       ) : isTeacher() ? (
                         <Button variant="outline" size="sm" onClick={() => data.reviewSubmission(submission.id)}>
                           Review
                         </Button>
                       ) : (
                         <Badge variant="olive">Submitted</Badge>
                       )
                    ) : (
                      <Badge variant="terracotta">Missing</Badge>
                    )}
                  </div>
                );
              })}
          </div>
        </Modal>
      )}

      {canAdd && open && (
        <Modal title="Add assignment" onClose={() => setOpen(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Title</label>
              <input
                aria-label="Assignment title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Quadratic equations worksheet"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Instructions</label>
              <textarea
                aria-label="Assignment instructions"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Subject</label>
                <select
                  aria-label="Assignment subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {['Artificial Intelligence', 'Mathematics', 'English', 'Science', 'Social Science', 'Hindi'].map(
                    (s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Section</label>
                <select
                  aria-label="Assignment section"
                  value={form.section_label}
                  onChange={(e) => setForm({ ...form, section_label: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {['IX - E', 'IX - A', 'V - A'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Due date</label>
                <input
                  aria-label="Assignment due date"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Type</label>
                <select
                  aria-label="Assignment type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'HOMEWORK' | 'ASSIGNMENT' })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="HOMEWORK">Homework</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Attachment name (worksheet PDF)
              </label>
              <input
                aria-label="Attachment name"
                value={form.attachmentName}
                onChange={(e) => setForm({ ...form, attachmentName: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Quadratic-equations.pdf"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Publish</Button>
            </div>
          </form>
        </Modal>
      )}
    </Page>
  );
}
