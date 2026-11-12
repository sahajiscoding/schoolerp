import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui';
import { Page, PageHeader, SectionHeading } from '../components/page';
import { Modal } from '../components/modal';
import { FiPlus } from 'react-icons/fi';

const SUBJECTS = [
  'Artificial Intelligence',
  'Mathematics',
  'English',
  'Science',
  'Social Science',
  'Hindi',
];

export default function CourseProgress() {
  const { profile, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    subject: '',
    title: '',
    percent: '',
    grade: '',
    remarks: '',
  });

  const myProgress = data.courseProgress.filter(
    (c) => c.student_id === profile?.id,
  );

  const students = data.people.filter((p) => p.role === 'student');
  const canAdd = isTeacher();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.student_id) {
      data.notify('Choose the student this goal belongs to.');
      return;
    }
    if (!form.title.trim() || !form.subject.trim()) {
      data.notify('A subject and a goal title are required.');
      return;
    }
    const percent = Number(form.percent);
    if (form.percent === '' || Number.isNaN(percent) || percent < 0 || percent > 100) {
      data.notify('Progress must be a number between 0 and 100.');
      return;
    }
    data.addProgress({
      student_id: form.student_id,
      subject: form.subject,
      title: form.title,
      percent,
      grade: form.grade,
      remarks: form.remarks,
      teacher_id: profile.id,
    });
    setForm({ student_id: '', subject: '', title: '', percent: '', grade: '', remarks: '' });
    setOpen(false);
  };

  return (
    <Page>
      <PageHeader
        eyebrow={isStudent() ? 'My learning' : 'Academic progress'}
        title={isStudent() ? 'My Progress' : 'Course Progress'}
        description="Track subject-wise progress per student. Teachers and admins can add progress."
        actions={canAdd ? (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} aria-hidden="true" /> Add progress
          </Button>
        ) : undefined}
      />

      <section aria-label="Progress records">
      <Card>
        <SectionHeading title={isStudent() ? 'My course progress' : 'All course progress'} />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {(isStudent() ? myProgress : data.courseProgress)
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .map((entry) => {
                  const student = data.people.find((p) => p.id === entry.student_id);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell>{student?.full_name ?? '—'}</TableCell>
                      <TableCell>{entry.subject}</TableCell>
                      <TableCell className="text-sm">{entry.title}</TableCell>
                      <TableCell>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-olive h-2 rounded-full"
                            style={{ width: `${entry.percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-ink ml-2">
                          {entry.percent}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="olive">{entry.grade}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted truncate max-w-[160px]">{entry.remarks}</TableCell>
                      <TableCell className="text-muted text-xs">{new Date(entry.updated_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })}
                {(isStudent() ? myProgress : data.courseProgress).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted py-4">
                      No course progress records yet.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
      </Card>
      </section>

      {canAdd && open && (
          <Modal title="Add course progress" description="Record a subject goal and the student's current progress." onClose={() => setOpen(false)} size="sm">
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label htmlFor="progress-student" className="field-label">Student</label>
                  <select
                    id="progress-student"
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    className="field-control"
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.login_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="progress-subject" className="field-label">Subject</label>
                  <select
                    id="progress-subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="field-control"
                  >
                    <option value="">Select subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="progress-title" className="field-label">Title</label>
                  <input
                    id="progress-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="field-control"
                    placeholder="e.g. Polynomials and quadratic equations"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="progress-percent" className="field-label">Percent</label>
                    <input
                      id="progress-percent"
                      type="number"
                      min="0"
                      max="100"
                      value={form.percent}
                      onChange={(e) => setForm({ ...form, percent: e.target.value })}
                      className="field-control"
                    />
                  </div>
                  <div>
                    <label htmlFor="progress-grade" className="field-label">Grade</label>
                    <input
                      id="progress-grade"
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}
                      className="field-control"
                      placeholder="A1"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="progress-remarks" className="field-label">Remarks</label>
                  <textarea
                    id="progress-remarks"
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                    rows={2}
                    className="field-control"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
          </Modal>
      )}
    </Page>
  );
}
