import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import {
  Card,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  StatCard,
} from '../components/ui';
import { Modal } from '../components/modal';
import { MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { FiEdit3, FiGrid, FiPlus, FiSend, FiTrash2, FiUsers } from 'react-icons/fi';

const EMPTY_FORM = { teacher_id: '', section_label: '', subject: '' };

export default function TeachingAssignments() {
  const { isAdmin } = useAuth();
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const teachers = useMemo(
    () => data.people.filter((p) => p.role === 'teacher' && p.is_active),
    [data.people],
  );
  const sections = useMemo(
    () => data.classes.flatMap((c) => c.sections.map((s) => `${c.name} - ${s}`)),
    [data.classes],
  );
  const subjectNames = useMemo(() => data.subjects.map((s) => s.name), [data.subjects]);

  if (!isAdmin()) return <div className="p-4 text-terracotta">Admin only</div>;

  const teacherName = (id: string) =>
    data.people.find((p) => p.id === id)?.full_name ?? 'Unknown teacher';

  const openCreate = () => {
    setEditingId(null);
    setForm({
      teacher_id: teachers[0]?.id ?? '',
      section_label: sections[0] ?? '',
      subject: subjectNames[0] ?? '',
    });
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const entry = data.teachingAssignments.find((t) => t.id === id);
    if (!entry) return;
    setEditingId(id);
    setForm({ teacher_id: entry.teacher_id, section_label: entry.section_label, subject: entry.subject });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.teacher_id || !form.section_label || !form.subject) {
      data.notify('Pick a teacher, section and subject.');
      return;
    }
    const duplicate = data.teachingAssignments.some(
      (t) =>
        t.id !== editingId &&
        t.teacher_id === form.teacher_id &&
        t.section_label === form.section_label &&
        t.subject === form.subject,
    );
    if (duplicate) {
      data.notify('That teacher is already assigned to this section and subject.');
      return;
    }
    if (editingId) {
      data.updateTeachingAssignment(editingId, form);
    } else {
      data.addTeachingAssignment(form);
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOpen(false);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Administration"
        title="Teaching assignments"
        description="Connect each teacher to the sections and subjects they are authorised to teach."
        meta={`${data.teachingAssignments.length} assignments`}
        actions={<Button onClick={openCreate}>
          <FiPlus size={16} /> Add assignment
        </Button>}
      />

      <MetricGrid className="xl:grid-cols-3">
        <StatCard label="Assignments" value={data.teachingAssignments.length} icon={FiSend} />
        <StatCard label="Active teachers" value={teachers.length} icon={FiUsers} variant="terracotta" />
        <StatCard label="Available sections" value={sections.length} icon={FiGrid} variant="neutral" />
      </MetricGrid>

      <Card padded={false}>
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <SectionHeading title="Assignment ledger" description="Teacher reach is defined by these section and subject links." />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {data.teachingAssignments.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-bold">{teacherName(t.teacher_id)}</TableCell>
                  <TableCell>{t.section_label}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(t.id)} aria-label={`Edit ${t.subject}`}>
                      <FiEdit3 size={14} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => data.removeTeachingAssignment(t.id)} aria-label={`Remove ${t.subject}`}>
                      <FiTrash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data.teachingAssignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted py-4">
                    No teaching assignments yet. Use “Add assignment” to create one.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {open && (
        <Modal
          title={editingId ? 'Edit teaching assignment' : 'Add teaching assignment'}
          description="Choose one teacher, section and subject."
          onClose={() => setOpen(false)}
          size="sm"
        >
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="assignment-teacher" className="field-label">Teacher</label>
                <select
                  id="assignment-teacher"
                  value={form.teacher_id}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  className="field-control"
                >
                  <option value="">Select a teacher…</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assignment-section" className="field-label">Section</label>
                <select
                  id="assignment-section"
                  value={form.section_label}
                  onChange={(e) => setForm({ ...form, section_label: e.target.value })}
                  className="field-control"
                >
                  <option value="">Select a section…</option>
                  {sections.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assignment-subject" className="field-label">Subject</label>
                <select
                  id="assignment-subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="field-control"
                >
                  <option value="">Select a subject…</option>
                  {subjectNames.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? 'Save changes' : 'Assign'}</Button>
              </div>
            </form>
        </Modal>
      )}
    </Page>
  );
}
