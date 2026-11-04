import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
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

export default function TeachingAssignments() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ teacher: '', section: '', subject: '' });

  if (!isAdmin()) return <div className="p-4 text-terracotta">Admin only</div>;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setForm({ teacher: '', section: '', subject: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Teaching Assignments</h1>
          <p className="text-muted">Assign teachers to sections and subjects.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
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
              {[
                { teacher: 'Anuradha Gupta', section: 'IX - E', subject: 'Artificial Intelligence' },
                { teacher: 'Radhika Malhotra', section: 'IX - E', subject: 'Mathematics' },
              ].map((t, i) => (
                <TableRow key={i}>
                  <TableCell>{t.teacher}</TableCell>
                  <TableCell>{t.section}</TableCell>
                  <TableCell>{t.subject}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {}}>
                      <FiEdit3 size={14} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => {}}>
                      <FiTrash2 size={14} />
                    </Button>
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
            <h2 className="text-lg font-bold text-ink mb-4">Add teaching assignment</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Teacher</label>
                <input
                  value={form.teacher}
                  onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Section</label>
                <input
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Subject</label>
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Assign</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
