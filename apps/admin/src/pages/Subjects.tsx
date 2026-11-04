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
} from '../components/ui';
import { FiPlus, FiEdit3, FiTrash2 } from 'react-icons/fi';

export default function Subjects() {
  const { isAdmin } = useAuth();
  const data = useAppData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      data.notify('Subject name and code are required.');
      return;
    }
    data.addSubject({ name: form.name.trim(), code: form.code.trim().toUpperCase(), color: '#4B5D2A' });
    setForm({ name: '', code: '' });
    setOpen(false);
  };

  const subjects = data.subjects;

  if (!isAdmin()) return <div className="p-4 text-terracotta">Admin only</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Subjects</h1>
          <p className="text-muted">Manage school subjects.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
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
                      <Button variant="outline" size="sm" onClick={() => data.notify(`Editing ${s.name} is available to admins on the live database.`)} aria-label={`Edit ${s.name}`}>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">Add subject</h2>
            <form onSubmit={handleCreate} className="space-y-3">
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
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
