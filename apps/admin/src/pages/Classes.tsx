import { useState } from 'react';
import { useAppData as useData } from '../lib/appData';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui';
import { FiPlus, FiTrash2, FiUsers } from 'react-icons/fi';

export default function Classes() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', sections: 'A' });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      data.notify('Give the class a name, for example “XI”.');
      return;
    }
    if (data.classes.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      data.notify(`${name} already exists.`);
      return;
    }
    const sections = form.sections
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    data.addClass({ name, sections });
    setForm({ name: '', sections: 'A' });
    setOpen(false);
  };

  const countStudents = (className: string) =>
    data.people.filter((p) => p.role === 'student' && p.class_label === className).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Classes &amp; Sections</h1>
          <p className="text-muted">
            {data.classes.length} classes ·{' '}
            {data.classes.reduce((sum, c) => sum + c.sections.length, 0)} sections
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <FiPlus size={16} /> Add class
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Sections</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Class teacher</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {data.classes.map((cls) => {
                const teacher = data.people.find(
                  (p) => p.role === 'teacher' && p.class_teacher_of?.startsWith(`${cls.name} `),
                );
                return (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cls.sections.map((section) => (
                          <Badge key={section} variant="olive">
                            {section}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <FiUsers size={13} className="text-muted" />
                        {countStudents(cls.name)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {teacher?.full_name ?? <span className="text-muted">Not assigned</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => data.removeClass(cls.id)}
                        aria-label={`Remove ${cls.name}`}
                      >
                        <FiTrash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink">Add class</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Class name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="XI"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Sections (comma separated)
                </label>
                <input
                  value={form.sections}
                  onChange={(e) => setForm({ ...form, sections: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="A, B, C"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add class</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
