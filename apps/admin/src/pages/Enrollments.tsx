import { useMemo, useState } from 'react';
import { useAppData as useData } from '../lib/appData';
import { Badge, Button, Card, StatCard, Table, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { Modal } from '../components/modal';
import { FiCheckCircle, FiPlus, FiSearch, FiUserPlus, FiUsers } from 'react-icons/fi';

export default function Enrollments() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ student_id: '', class_id: '', section: '' });

  const allStudents = useMemo(() => data.people.filter((person) => person.role === 'student'), [data.people]);
  const students = useMemo(
    () => allStudents.filter((person) => (
      search
        ? `${person.full_name} ${person.admission_no} ${person.login_id}`.toLowerCase().includes(search.toLowerCase())
        : true
    )),
    [allStudents, search],
  );
  const selectedClass = data.classes.find((item) => item.id === form.class_id);
  const enrolled = allStudents.filter((student) => student.class_label).length;

  const handleEnroll = (event: React.FormEvent) => {
    event.preventDefault();
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
        eyebrow="Our school community"
        title="Enrollments"
        description="Place students into a class and section. The class teacher then owns their leaves."
        actions={<Button onClick={() => setOpen(true)}><FiPlus size={16} aria-hidden="true" /> Enroll student</Button>}
      />

      <MetricGrid className="lg:grid-cols-3 xl:grid-cols-3">
        <StatCard label="Students" value={allStudents.length} icon={FiUsers} />
        <StatCard label="Enrolled" value={enrolled} icon={FiCheckCircle} variant="terracotta" />
        <StatCard label="Unplaced" value={allStudents.length - enrolled} icon={FiUserPlus} variant="warning" />
      </MetricGrid>

      <Card padded={false}>
        <div className="flex flex-col gap-4 p-5 pb-3 sm:p-6 sm:pb-3 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading title="Student placements" description="Search the roster or open the enrolment form to move a student." />
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Search students</span>
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or admission number" className="field-control pl-10" />
          </label>
        </div>

        {students.length ? (
          <Table className="min-w-0">
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead className="hidden md:table-cell">Admission no.</TableHead><TableHead className="hidden md:table-cell">Class</TableHead><TableHead className="hidden lg:table-cell">Section</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <tbody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell><span className="font-semibold">{student.full_name}</span><span className="mt-1 block text-xs text-muted md:hidden">{student.admission_no ?? student.login_id} · {student.class_label ? `${student.class_label} ${student.section_label ?? ''}` : 'No class placement'}</span></TableCell>
                  <TableCell className="hidden md:table-cell"><code className="rounded bg-daylight px-2 py-1 text-xs">{student.admission_no ?? student.login_id}</code></TableCell>
                  <TableCell className="hidden md:table-cell">{student.class_label ?? <span className="text-muted">—</span>}</TableCell>
                  <TableCell className="hidden lg:table-cell">{student.section_label ?? <span className="text-muted">—</span>}</TableCell>
                  <TableCell><Badge variant={student.class_label ? 'success' : 'warning'}>{student.class_label ? 'Enrolled' : 'Unplaced'}</Badge></TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="p-5 pt-2 sm:p-6 sm:pt-2"><EmptyState title="No students match that search" description="Clear the search or try an admission number." icon={FiSearch} /></div>
        )}
      </Card>

      {open && (
        <Modal title="Enroll a student" description="Choose the student, class and section together." onClose={() => setOpen(false)} size="sm">
          <form onSubmit={handleEnroll} className="space-y-4">
            <div><label htmlFor="enrol-student" className="field-label">Student</label><select id="enrol-student" value={form.student_id} onChange={(event) => setForm({ ...form, student_id: event.target.value })} className="field-control"><option value="">Select student</option>{allStudents.map((student) => <option key={student.id} value={student.id}>{student.full_name} — {student.admission_no}</option>)}</select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="enrol-class" className="field-label">Class</label><select id="enrol-class" value={form.class_id} onChange={(event) => setForm({ ...form, class_id: event.target.value, section: '' })} className="field-control"><option value="">Select class</option>{data.classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
              <div><label htmlFor="enrol-section" className="field-label">Section</label><select id="enrol-section" value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })} disabled={!selectedClass} className="field-control"><option value="">Select section</option>{selectedClass?.sections.map((section) => <option key={section} value={section}>{section}</option>)}</select></div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2"><Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Enroll</Button></div>
          </form>
        </Modal>
      )}
    </Page>
  );
}
