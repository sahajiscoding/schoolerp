import { useMemo, useState } from 'react';
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
import { MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { FiCheckCircle, FiPlus, FiUserX, FiUsers } from 'react-icons/fi';

export default function Enrollments() {
  const data = useData();
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

  const selectedClass = data.classes.find((c) => c.id === form.class_id);
  const allStudents = data.people.filter((person) => person.role === 'student');
  const placedStudents = allStudents.filter((student) => student.class_label);

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.class_id || !form.section) {
      data.notify('Pick a student, a class and a section.');
      return;
    }
    data.enrollStudent(form.student_id, form.class_id, form.section);
    setForm({ student_id: '', class_id: '', section: '' });
    setOpen(false);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Administration"
        title="Enrollments"
        description="Place students into a class and section. The class teacher then owns their leave approvals."
        meta={`${placedStudents.length} of ${allStudents.length} students placed`}
        actions={<Button onClick={() => setOpen(true)}>
          <FiPlus size={16} /> Enroll student
        </Button>}
      />

      <MetricGrid className="xl:grid-cols-3">
        <StatCard label="Students" value={allStudents.length} icon={FiUsers} variant="neutral" />
        <StatCard label="Placed" value={placedStudents.length} icon={FiCheckCircle} />
        <StatCard label="Unplaced" value={allStudents.length - placedStudents.length} icon={FiUserX} variant="warning" />
      </MetricGrid>

      <Card padded={false}>
        <div className="flex flex-col gap-4 px-5 pt-5 sm:px-6 sm:pt-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading title="Enrollment ledger" description="Current student class and section placement." className="mb-0" />
          <input
            aria-label="Search enrollments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or admission number"
            className="field-control max-w-sm"
          />
        </div>
        <div className="mt-4 overflow-x-auto">
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
                  <TableCell className="font-bold">{student.full_name}</TableCell>
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
        <Modal title="Enroll a student" description="Choose the student's current class and section." onClose={() => setOpen(false)} size="sm">
            <form onSubmit={handleEnroll} className="space-y-3">
              <div>
                <label htmlFor="enrollment-student" className="field-label">Student</label>
                <select
                  id="enrollment-student"
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="field-control"
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
                  <label htmlFor="enrollment-class" className="field-label">Class</label>
                  <select
                    id="enrollment-class"
                    value={form.class_id}
                    onChange={(e) => setForm({ ...form, class_id: e.target.value, section: '' })}
                    className="field-control"
                  >
                    <option value="">Select class</option>
                    {data.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="enrollment-section" className="field-label">Section</label>
                  <select
                    id="enrollment-section"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    disabled={!selectedClass}
                    className="field-control"
                  >
                    <option value="">Select section</option>
                    {selectedClass?.sections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Enroll</Button>
              </div>
            </form>
        </Modal>
      )}
    </Page>
  );
}
