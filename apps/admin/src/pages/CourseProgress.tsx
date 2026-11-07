import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCourseProgressData } from '../lib/useCourseProgressData';
import { Badge, Button, Card, Modal, Table, TableHeader, TableRow, TableHead, TableCell } from '../components/ui';
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
  const { profile } = useAuth();
  const data = useCourseProgressData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    subject: '',
    title: '',
    percent: '',
    grade: '',
    remarks: '',
  });

  const canAdd = profile?.role === 'admin' || profile?.role === 'teacher';

  const handleAdd = async (e: React.FormEvent) => {
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
    await data.addCourseGoal({
      student_id: form.student_id,
      subject_id: form.subject,
      title: form.title.trim(),
      description: null,
      percent,
      grade: form.grade.trim() || null,
      remarks: form.remarks.trim() || null,
      due_date: undefined,
    });
    setForm({ student_id: '', subject: '', title: '', percent: '', grade: '', remarks: '' });
    data.notify('Course goal added.');
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Course Progress</h1>
          <p className="text-muted">
            Track subject-wise progress per student. Teachers and admins can add progress.
          </p>
        </div>
        {canAdd && (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> Add progress
          </Button>
        )}
      </div>

      {data.loading && <p className="text-sm text-muted">Loading course progress…</p>}

      {data.error && (
        <Card className="flex items-center gap-3 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" role="alert">
          <p className="text-sm text-red-700 dark:text-red-300">{data.error}</p>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => void data.refresh()}>
            Try again
          </Button>
        </Card>
      )}

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink">
            {profile?.role === 'student' ? 'My course progress' : 'All course progress'}
          </h3>
        </div>
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
              {data.entries
                .sort(
                  (a, b) =>
                    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
                )
                .map((entry) => {
                  const studentName =
                    profile?.role === 'student' ? 'You' : entry.student_id;
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">{studentName}</TableCell>
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
                      <TableCell className="text-sm text-muted truncate max-w-[160px]">
                        {entry.remarks}
                      </TableCell>
                      <TableCell className="text-muted text-xs">
                        {new Date(entry.updated_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {data.entries.length === 0 && (
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

      {canAdd && open && (
        <Modal title="Add course progress" onClose={() => setOpen(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Student</label>
              <select
                value={form.student_id}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select student</option>
                {data.entries.length > 0
                  ? [...new Set(data.entries.map((e) => e.student_id))].map((sid) => (
                      <option key={sid} value={sid}>
                        {sid}
                      </option>
                    ))
                  : null}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g. Polynomials and quadratic equations"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Percent</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.percent}
                  onChange={(e) => setForm({ ...form, percent: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Grade</label>
                <input
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="A1"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Remarks</label>
              <textarea
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={data.loading}>
                {data.loading ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
