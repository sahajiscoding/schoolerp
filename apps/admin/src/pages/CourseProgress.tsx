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
  StatCard,
} from '../components/ui';
import { Modal } from '../components/modal';
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { FiBarChart2, FiPlus, FiTrendingUp, FiUsers } from 'react-icons/fi';

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
  const visibleProgress = isStudent() ? myProgress : data.courseProgress;
  const averageProgress = visibleProgress.length
    ? Math.round(visibleProgress.reduce((sum, entry) => sum + entry.percent, 0) / visibleProgress.length)
    : 0;
  const representedStudents = new Set(visibleProgress.map((entry) => entry.student_id)).size;

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
        eyebrow="Academic progress"
        title={isStudent() ? 'My progress' : 'Course progress'}
        description={isStudent()
          ? 'Your subject goals, grades and teacher remarks in one view.'
          : 'Track subject-wise progress and record the next learning milestone.'}
        meta={`${visibleProgress.length} progress records`}
        actions={canAdd ? (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> Add progress
          </Button>
        ) : undefined}
      />

      <MetricGrid className="xl:grid-cols-3">
        <StatCard label="Progress records" value={visibleProgress.length} icon={FiBarChart2} />
        <StatCard label="Average progress" value={`${averageProgress}%`} icon={FiTrendingUp} variant="neutral" />
        <StatCard label={isStudent() ? 'Student view' : 'Students represented'} value={isStudent() ? 1 : representedStudents} icon={FiUsers} variant="terracotta" />
      </MetricGrid>

      <Card>
        <SectionHeading title={isStudent() ? 'My course progress' : 'All course progress'} description="Most recently updated goals appear first." />
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
              {[...visibleProgress]
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .map((entry) => {
                  const student = data.people.find((p) => p.id === entry.student_id);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-bold">{student?.full_name ?? '—'}</TableCell>
                      <TableCell>{entry.subject}</TableCell>
                      <TableCell className="text-sm">{entry.title}</TableCell>
                      <TableCell>
                         <div className="h-2 w-full overflow-hidden rounded-full bg-parchment" role="progressbar" aria-label={`${entry.title} progress`} aria-valuenow={entry.percent} aria-valuemin={0} aria-valuemax={100}>
                           <div
                             className="h-2 rounded-full bg-moss"
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
                {visibleProgress.length === 0 && <TableRow><TableCell colSpan={7}><EmptyState title="No course progress records" description="Recorded learning goals will appear here." /></TableCell></TableRow>}
              </tbody>
            </Table>
          </div>
        </Card>

        {canAdd && open && (
          <Modal title="Add course progress" description="Record a subject goal for one student." onClose={() => setOpen(false)} size="sm">
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
                <div className="grid grid-cols-2 gap-3">
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
                <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
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
