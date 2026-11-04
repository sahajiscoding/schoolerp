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

export default function Enrollments() {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ student: '', section: '', roll_no: '' });

  if (!isAdmin()) return <div className="p-4 text-terracotta">Admin only</div>;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setForm({ student: '', section: '', roll_no: '' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Enrollments</h1>
          <p className="text-muted">Enroll students into sections.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <FiPlus size={16} /> Enroll student
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Roll no.</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {[
                { student: 'Sahaj Chugh', section: 'IX - E', roll_no: '1' },
                { student: 'Aarav Mehta', section: 'IX - E', roll_no: '2' },
              ].map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{e.student}</TableCell>
                  <TableCell>{e.section}</TableCell>
                  <TableCell>{e.roll_no}</TableCell>
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
            <h2 className="text-lg font-bold text-ink mb-4">Enroll student</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Student</label>
                <input
                  value={form.student}
                  onChange={(e) => setForm({ ...form, student: e.target.value })}
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
                <label className="block text-xs font-medium text-muted mb-1">Roll no.</label>
                <input
                  value={form.roll_no}
                  onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Enroll</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
