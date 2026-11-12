import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubjectsData } from '../lib/useSubjectsData';
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

const DEFAULT_COLOR = '#4B5D2A';
const EMPTY_FORM = { name: '', code: '', color: DEFAULT_COLOR };

export default function Subjects() {
  const { isAdmin } = useAuth();
  const data = useSubjectsData();
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
      data.updateSubject({ id: editingId, name, code, color: form.color });
    } else {
      data.addSubject({ name, code, color: form.color });
    }
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Subjects</h1>
          <p className="text-muted">Manage school subjects.</p>
        </div>
        <Button onClick={openCreate}>
          <FiPlus size={16} /> Add subject
        </Button>
      </div>

      <Card>
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
                      {s.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted text-sm">{s.code}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s.id)} aria-label={`Edit ${s.name}`}>
                        <FiEdit3 size={14} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => data.deleteSubject(s.id)} aria-label={`Remove ${s.name}`}>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">{editingId ? 'Edit subject' : 'Add subject'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Subject name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Colour</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-10 w-20 px-1 py-1 border rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingId ? 'Save changes' : 'Add'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}