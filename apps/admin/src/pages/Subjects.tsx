import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import { Button, Card, StatCard, Table, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { Modal } from '../components/modal';
import { FiBookOpen, FiEdit3, FiHash, FiPlus, FiTrash2 } from 'react-icons/fi';

const DEFAULT_COLOR = '#586A36';
const EMPTY_FORM = { name: '', code: '', color: DEFAULT_COLOR };

export default function Subjects() {
  const { isAdmin } = useAuth();
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const subjects = data.subjects;

  if (!isAdmin()) {
    return <Page><PageHeader eyebrow="Administration" title="Subjects" description="Only administrators can manage subjects." /></Page>;
  }

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const subject = subjects.find((item) => item.id === id);
    if (!subject) return;
    setEditingId(id);
    setForm({ name: subject.name, code: subject.code, color: subject.color });
    setOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    if (!name || !code) {
      data.notify('Subject name and code are required.');
      return;
    }
    const duplicate = subjects.some((item) => item.id !== editingId && item.code.toUpperCase() === code);
    if (duplicate) {
      data.notify(`Code ${code} is already used by another subject.`);
      return;
    }
    if (editingId) data.updateSubject(editingId, { name, code, color: form.color });
    else data.addSubject({ name, code, color: form.color });
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOpen(false);
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Academic structure"
        title="Subjects"
        description="Keep the subject directory clear and consistent across classes and teaching assignments."
        actions={<Button onClick={openCreate}><FiPlus size={16} aria-hidden="true" /> Add subject</Button>}
      />

      <MetricGrid className="lg:grid-cols-2 xl:grid-cols-2">
        <StatCard label="Subjects" value={subjects.length} icon={FiBookOpen} />
        <StatCard label="Subject codes" value={new Set(subjects.map((subject) => subject.code)).size} icon={FiHash} variant="terracotta" />
      </MetricGrid>

      <Card padded={false}>
        <div className="p-5 pb-2 sm:p-6 sm:pb-2"><SectionHeading title="Subject directory" description="Colours provide a visual marker; the code remains the unique operational label." /></div>
        {subjects.length ? (
          <Table className="min-w-0">
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <tbody>
              {subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 font-semibold"><span className="h-3 w-3 rounded-full border border-ink/10" style={{ backgroundColor: subject.color }} aria-hidden="true" />{subject.name}</span>
                  </TableCell>
                  <TableCell><code className="rounded bg-daylight px-2 py-1 text-xs font-bold text-deep-olive">{subject.code}</code></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(subject.id)} aria-label={`Edit ${subject.name}`}><FiEdit3 size={14} aria-hidden="true" /></Button>
                      <Button variant="danger" size="sm" onClick={() => data.removeSubject(subject.id)} aria-label={`Remove ${subject.name}`}><FiTrash2 size={14} aria-hidden="true" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="p-5 pt-2 sm:p-6 sm:pt-2"><EmptyState title="No subjects yet" description="Add the first subject to use it in teaching assignments." icon={FiBookOpen} action={<Button onClick={openCreate}>Add subject</Button>} /></div>
        )}
      </Card>

      {open && (
        <Modal title={editingId ? 'Edit subject' : 'Add subject'} description="Use a distinct code and a visual marker." onClose={() => setOpen(false)} size="sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label htmlFor="subject-name" className="field-label">Subject name</label><input id="subject-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="field-control" /></div>
            <div><label htmlFor="subject-code" className="field-label">Code</label><input id="subject-code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} className="field-control uppercase" /></div>
            <div>
              <label htmlFor="subject-colour" className="field-label">Colour</label>
              <input id="subject-colour" type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="focus-ring h-12 w-24 cursor-pointer rounded-[10px] border border-olive/20 bg-paper p-1" />
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2"><Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">{editingId ? 'Save changes' : 'Add'}</Button></div>
          </form>
        </Modal>
      )}
    </Page>
  );
}
