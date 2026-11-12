import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import { Button, Card, StatCard, Table, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { Modal } from '../components/modal';
import { FiBookOpen, FiEdit3, FiPlus, FiSend, FiTrash2, FiUsers } from 'react-icons/fi';

const EMPTY_FORM = { teacher_id: '', section_label: '', subject: '' };

export default function TeachingAssignments() {
  const { isAdmin } = useAuth();
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const teachers = useMemo(() => data.people.filter((person) => person.role === 'teacher' && person.is_active), [data.people]);
  const sections = useMemo(() => data.classes.flatMap((item) => item.sections.map((section) => `${item.name} - ${section}`)), [data.classes]);
  const subjectNames = useMemo(() => data.subjects.map((subject) => subject.name), [data.subjects]);

  if (!isAdmin()) {
    return <Page><PageHeader eyebrow="Administration" title="Teaching assignments" description="Only administrators can manage teaching assignments." /></Page>;
  }

  const teacherName = (id: string) => data.people.find((person) => person.id === id)?.full_name ?? 'Unknown teacher';

  const openCreate = () => {
    setEditingId(null);
    setForm({ teacher_id: teachers[0]?.id ?? '', section_label: sections[0] ?? '', subject: subjectNames[0] ?? '' });
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const entry = data.teachingAssignments.find((item) => item.id === id);
    if (!entry) return;
    setEditingId(id);
    setForm({ teacher_id: entry.teacher_id, section_label: entry.section_label, subject: entry.subject });
    setOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.teacher_id || !form.section_label || !form.subject) {
      data.notify('Pick a teacher, section and subject.');
      return;
    }
    const duplicate = data.teachingAssignments.some(
      (item) => item.id !== editingId && item.teacher_id === form.teacher_id && item.section_label === form.section_label && item.subject === form.subject,
    );
    if (duplicate) {
      data.notify('That teacher is already assigned to this section and subject.');
      return;
    }
    if (editingId) data.updateTeachingAssignment(editingId, form);
    else data.addTeachingAssignment(form);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOpen(false);
  };

  const assignedTeachers = new Set(data.teachingAssignments.map((item) => item.teacher_id)).size;
  const assignedSections = new Set(data.teachingAssignments.map((item) => item.section_label)).size;

  return (
    <Page>
      <PageHeader
        eyebrow="Administration"
        title="Teaching assignments"
        description="Connect each teacher with the sections and subjects they are responsible for."
        actions={<Button onClick={openCreate}><FiPlus size={16} aria-hidden="true" /> Add assignment</Button>}
      />

      <MetricGrid className="lg:grid-cols-3 xl:grid-cols-3">
        <StatCard label="Assignments" value={data.teachingAssignments.length} icon={FiSend} />
        <StatCard label="Teachers assigned" value={assignedTeachers} icon={FiUsers} variant="terracotta" />
        <StatCard label="Sections covered" value={assignedSections} icon={FiBookOpen} variant="neutral" />
      </MetricGrid>

      <aside className="surface-muted flex items-start gap-3 p-4 text-sm leading-6 text-deep-olive">
        <FiBookOpen className="mt-1 shrink-0" size={17} aria-hidden="true" />
        <p>Assignments determine which class and subject responsibilities appear for each teacher. Duplicate teacher, section and subject combinations remain blocked.</p>
      </aside>

      <Card padded={false}>
        <div className="p-5 pb-2 sm:p-6 sm:pb-2"><SectionHeading title="Current responsibilities" description="Edit a row to move a teacher, section or subject together." /></div>
        {data.teachingAssignments.length ? (
          <Table className="min-w-0">
            <TableHeader><TableRow><TableHead>Teacher</TableHead><TableHead className="hidden md:table-cell">Section</TableHead><TableHead className="hidden md:table-cell">Subject</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <tbody>
              {data.teachingAssignments.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><span className="font-semibold">{teacherName(item.teacher_id)}</span><span className="mt-1 block text-xs text-muted md:hidden">{item.section_label} · {item.subject}</span></TableCell>
                  <TableCell className="hidden md:table-cell">{item.section_label}</TableCell>
                  <TableCell className="hidden md:table-cell">{item.subject}</TableCell>
                  <TableCell><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(item.id)} aria-label={`Edit ${item.subject}`}><FiEdit3 size={14} aria-hidden="true" /></Button><Button variant="danger" size="sm" onClick={() => data.removeTeachingAssignment(item.id)} aria-label={`Remove ${item.subject}`}><FiTrash2 size={14} aria-hidden="true" /></Button></div></TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="p-5 pt-2 sm:p-6 sm:pt-2"><EmptyState title="No teaching assignments yet" description="Create the first teacher, section and subject responsibility." icon={FiSend} action={<Button onClick={openCreate}>Add assignment</Button>} /></div>
        )}
      </Card>

      {open && (
        <Modal title={editingId ? 'Edit teaching assignment' : 'Add teaching assignment'} description="Choose one teacher, section and subject." onClose={() => setOpen(false)} size="sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label htmlFor="assignment-teacher" className="field-label">Teacher</label><select id="assignment-teacher" value={form.teacher_id} onChange={(event) => setForm({ ...form, teacher_id: event.target.value })} className="field-control"><option value="">Select a teacher…</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select></div>
            <div><label htmlFor="assignment-section" className="field-label">Section</label><select id="assignment-section" value={form.section_label} onChange={(event) => setForm({ ...form, section_label: event.target.value })} className="field-control"><option value="">Select a section…</option>{sections.map((section) => <option key={section} value={section}>{section}</option>)}</select></div>
            <div><label htmlFor="assignment-subject" className="field-label">Subject</label><select id="assignment-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} className="field-control"><option value="">Select a subject…</option>{subjectNames.map((subject) => <option key={subject} value={subject}>{subject}</option>)}</select></div>
            <div className="flex flex-wrap justify-end gap-2 pt-2"><Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editingId ? 'Save changes' : 'Assign'}</Button></div>
          </form>
        </Modal>
      )}
    </Page>
  );
}
