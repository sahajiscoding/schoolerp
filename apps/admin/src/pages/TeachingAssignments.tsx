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
} from '../components/ui';
import { FiPlus, FiEdit3, FiTrash2 } from 'react-icons/fi';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Teaching Assignments</h1>
          <p className="text-muted">Assign teachers to sections and subjects.</p>
        </div>
        <Button onClick={openCreate}>
          <FiPlus size={16} /> Add assignment
        </Button>
      </div>

      <Card>
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
                  <TableCell>{teacherName(t.teacher_id)}</TableCell>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">
              {editingId ? 'Edit teaching assignment' : 'Add teaching assignment'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Teacher</label>
                <select
                  value={form.teacher_id}
                  onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a teacher…</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Section</label>
                <select
                  value={form.section_label}
                  onChange={(e) => setForm({ ...form, section_label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select a section…</option>
                  {sections.map((s) => (
                    <option key={s} value={s}>{s}</option>
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
                  <option value="">Select a subject…</option>
                  {subjectNames.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? 'Save changes' : 'Assign'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}