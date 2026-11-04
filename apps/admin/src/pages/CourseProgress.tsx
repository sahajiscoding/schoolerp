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
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
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
  const canAdd = isAdmin() || isTeacher();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.addProgress({
      student_id: form.student_id || profile.id,
      subject: form.subject,
      title: form.title,
      percent: Number(form.percent) || 0,
      grade: form.grade,
      remarks: form.remarks,
      teacher_id: profile.id,
    });
    setForm({ student_id: '', subject: '', title: '', percent: '', grade: '', remarks: '' });
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

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink">
            {isStudent() ? 'My course progress' : 'All course progress'}
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

        {canAdd && open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
              <h2 className="text-lg font-bold text-ink mb-4">Add course progress</h2>
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Student</label>
                  <select
                    value={form.student_id}
                    onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
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
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Grade</label>
                    <input
                      value={form.grade}
                      onChange={(e) => setForm({ ...form, grade: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
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
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
