import { useMemo, useState } from 'react';
import { useEnrollmentsData } from '../lib/useEnrollmentsData';
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

export default function Enrollments() {
  const data = useEnrollmentsData();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ student_id: '', class_id: '', section: '' });

  const students = useMemo(
    () =>
      data.people
        .filter((p) => p.role === 'student')
        .filter((p) =>
          search
            ? `${p.full_name} ${p.admission_no} ${p.login_id}`
                .toLowerCase()
                .includes(search.toLowerCase())
            : true,
        ),
    [data.people, search],
  );

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.section) {
      data.notify('Pick a student and a section.');
      return;
    }
    data.addEnrollment({
      student_id: form.student_id,
      section_id: form.section,
      roll_no: undefined,
      academic_year: '2026-27',
    });
    setForm({ student_id: '', class_id: '', section: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Enrollments</h1>
          <p className="text-muted">
            Place students into a class and section. The class teacher then owns their leaves.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <FiPlus size={16} /> Enroll student
        </Button>
      </div>

      <Card>
        <div className="mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission number"
            className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Admission no.</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>
                    <code className="rounded bg-sand px-1.5 py-0.5 text-xs">
                      {student.admission_no ?? student.login_id}
                    </code>
                  </TableCell>
                  <TableCell>{student.class_label ?? <span className="text-muted">—</span>}</TableCell>
                  <TableCell>{student.section_label ?? <span className="text-muted">—</span>}</TableCell>
                  <TableCell>
                    <Badge variant={student.class_label ? 'success' : 'warning'}>
                      {student.class_label ? 'Enrolled' : 'Unplaced'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-4 text-center text-muted">
                    No students match that search.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink">Enroll a student</h2>
            <form onSubmit={handleEnroll} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select student</option>
                  {data.people
                    .filter((p) => p.role === 'student')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} — {s.admission_no}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Class</label>
                  <select
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value, section: '' })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select section (e.g. "IX - E")</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Section</label>
                  <select
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select section (e.g. "IX - E")</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Enroll</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
