import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import { parseCsv, passwordFromDob } from '../lib/utils';
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
import { FiUsers, FiPlus, FiUpload, FiEdit3, FiTrash2 } from 'react-icons/fi';

export default function People() {
  const { isAdmin } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    login_id: '',
    role: 'student' as const,
    email: '',
    phone: '',
  });
  const [csvText, setCsvText] = useState('');
  const [importPreview, setImportPreview] = useState<{ full_name: string; admission_no: string; dob: string; password: string }[]>([]);

  const people = data.people;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    data.addPerson({
      full_name: form.full_name,
      login_id: form.login_id,
      role: form.role,
      email: form.email,
      phone: form.phone,
    });
    setForm({ full_name: '', login_id: '', role: 'student', email: '', phone: '' });
    setOpen(false);
  };

  const handleParseCsv = () => {
    try {
      const rows = parseCsv(csvText);
      const preview = rows.map((row) => {
        const dob = row.dob || row.date_of_birth || '';
        const password = dob ? passwordFromDob(dob) : '';
        return {
          full_name: row.full_name || row.name || '',
          admission_no: row.admission_no || row.admission_number || row.login_id || '',
          dob,
          password,
        };
      });
      setImportPreview(preview);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Invalid CSV');
    }
  };

  const handleImport = () => {
    const rows = importPreview.map((p) => ({
      full_name: p.full_name,
      admission_no: p.admission_no,
      dob: p.dob,
      class_label: '',
      section_label: '',
      password: p.password,
    }));
    data.importPeople(rows);
    setCsvText('');
    setImportPreview([]);
    setImportOpen(false);
  };

  if (!isAdmin()) {
    return (
      <div className="p-4 text-terracotta">Admin only</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">People</h1>
          <p className="text-muted">
            School roster. Import students via CSV (admission number + DOB → password `Student@DDMMYYYY`).
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> Add person
          </Button>
          <Button onClick={() => setImportOpen(true)}>
            <FiUpload size={16} /> Import CSV
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink">Roster</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Login ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {people.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.full_name}</TableCell>
                  <TableCell className="text-muted text-sm">{p.login_id}</TableCell>
                  <TableCell>
                    <Badge variant={p.role === 'admin' ? 'olive' : p.role === 'teacher' ? 'terracotta' : 'neutral'}>
                      {p.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.is_active ? 'success' : 'terracotta'} className="text-[10px]">
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
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
              {people.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted py-4">
                    No people in roster.
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
            <h2 className="text-lg font-bold text-ink mb-4">Create person</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Full name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Login ID</label>
                <input
                  value={form.login_id}
                  onChange={(e) => setForm({ ...form, login_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g. ADMIN001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Email</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-ink mb-4">Import students (CSV)</h2>
            <p className="text-muted text-sm mb-4">
              Columns: <code className="text-xs bg-sand px-1.5 py-0.5 rounded">full_name</code>,
              <code className="text-xs bg-sand px-1.5 py-0.5 rounded">admission_no</code>,
              <code className="text-xs bg-sand px-1.5 py-0.5 rounded">dob</code> (DD/MM/YYYY or YYYY-MM-DD).
              Password is generated as <code className="text-xs bg-sand px-1.5 py-0.5 rounded font-medium">Student@DDMMYYYY</code>.
            </p>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Paste CSV text</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                placeholder="full_name,admission_no,dob&#10;Sahaj Chugh,0185/18,14/05/2010"
              />
            </div>
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={handleParseCsv}>
                <FiUpload size={14} /> Preview
              </Button>
            </div>
            {importPreview.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Full name</TableHead>
                      <TableHead>Admission no.</TableHead>
                      <TableHead>DOB</TableHead>
                      <TableHead>Generated password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody>
                    {importPreview.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{p.full_name}</TableCell>
                        <TableCell className="text-sm text-muted">{p.admission_no}</TableCell>
                        <TableCell className="text-sm">{p.dob}</TableCell>
                        <TableCell className="text-sm font-medium text-olive">{p.password}</TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={importPreview.length === 0}
                onClick={handleImport}
                className="w-auto"
              >
                Import {importPreview.length} student{importPreview.length === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
