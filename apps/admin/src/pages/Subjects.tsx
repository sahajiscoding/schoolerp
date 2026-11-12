import { useState } from 'react';
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
import { FiBookOpen, FiEdit3, FiPlus, FiSend, FiTrash2 } from 'react-icons/fi';

const DEFAULT_COLOR = '#4B5D2A';
const EMPTY_FORM = { name: '', code: '', color: DEFAULT_COLOR };

export default function Subjects() {
  const { isAdmin } = useAuth();
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const subjects = data.subjects;

  if (!isAdmin()) return <div className="p-4 text-terracotta">Admin only</div>;

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    if (!subject) return;
    setEditingId(id);
    setForm({ name: subject.name, code: subject.code, color: subject.color });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || !code) {
      data.notify('Subject name and code are required.');
      return;
    }
    const duplicate = subjects.some((s) => s.id !== editingId && s.code.toUpperCase() === code);
    if (duplicate) {
      data.notify(`Code ${code} is already used by another subject.`);
      return;
    }
    if (editingId) {
      data.updateSubject(editingId, { name, code, color: form.color });
    } else {
      data.addSubject({ name, code, color: form.color });
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOpen(false);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Administration"
        title="Subjects"
        description="Maintain the subject catalogue and the codes used across teaching assignments."
        meta={`${subjects.length} subjects`}
        actions={<Button onClick={openCreate}>
          <FiPlus size={16} /> Add subject
        </Button>}
      />

      <MetricGrid className="xl:grid-cols-2">
        <StatCard label="Subjects" value={subjects.length} icon={FiBookOpen} />
        <StatCard label="Teaching assignments" value={data.teachingAssignments.length} icon={FiSend} variant="neutral" />
      </MetricGrid>

      <Card padded={false}>
        <div className="px-5 pt-5 sm:px-6 sm:pt-6">
          <SectionHeading title="Subject ledger" description="Names, school codes and visual identifiers." />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {subjects.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                        aria-hidden
                      />
                       <span className="font-bold">{s.name}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted text-sm">{s.code}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s.id)} aria-label={`Edit ${s.name}`}>
                        <FiEdit3 size={14} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => data.removeSubject(s.id)} aria-label={`Remove ${s.name}`}>
                        <FiTrash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      {open && (
        <Modal title={editingId ? 'Edit subject' : 'Add subject'} description="Set the name, code and colour used in the school catalogue." onClose={() => setOpen(false)} size="sm">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="subject-name" className="field-label">Subject name</label>
                <input
                  id="subject-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="field-control"
                />
              </div>
              <div>
                <label htmlFor="subject-code" className="field-label">Code</label>
                <input
                  id="subject-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="field-control"
                />
              </div>
              <div>
                <label htmlFor="subject-colour" className="field-label">Colour</label>
                <input
                  id="subject-colour"
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-12 w-24 cursor-pointer rounded-xl border border-border bg-paper p-1"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? 'Save changes' : 'Add'}</Button>
              </div>
            </form>
        </Modal>
      )}
    </Page>
  );
}
