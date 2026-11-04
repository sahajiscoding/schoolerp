import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import { downloadCsv, normalizeDob, parseCsv, passwordFromDob } from '../lib/utils';
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
import { FiDownload, FiInfo, FiPlus, FiUpload } from 'react-icons/fi';

/**
 * CSV formats the office already exports. Header names are matched loosely so
 * both `admission_no` and `Admission No.` work.
 */
const HEADER_ALIASES: Record<string, string[]> = {
  full_name: ['full_name', 'student_name', 'name', 'student'],
  admission_no: ['admission_no', 'admission_number', 'admission', 'adm_no', 'login_id'],
  dob: ['dob', 'date_of_birth', 'birth_date', 'birthdate'],
  class_label: ['class', 'class_label', 'grade'],
  section_label: ['section', 'section_label'],
  guardian_name: ['guardian', 'guardian_name', 'parent', 'parent_name'],
};

type PreviewRow = {
  full_name: string;
  admission_no: string;
  dob: string;
  isoDob: string | null;
  class_label: string;
  section_label: string;
  password: string;
  error?: string;
};

function pick(row: Record<string, string>, field: string): string {
  for (const alias of HEADER_ALIASES[field]) {
    if (row[alias]) return row[alias].trim();
  }
  return '';
}

export default function People() {
  const { isAdmin } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', login_id: '', dob: '', class_label: '', section_label: '' });
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const people = data.people;
  const students = useMemo(() => people.filter((p) => p.role === 'student'), [people]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.login_id.trim()) {
      data.notify('Full name and admission number are required.');
      return;
    }
    const isoDob = form.dob ? normalizeDob(form.dob)?.iso ?? null : null;
    data.addPerson({
      full_name: form.full_name.trim(),
      login_id: form.login_id.trim(),
      role: 'student',
      dob: isoDob ?? undefined,
      class_label: form.class_label,
      section_label: form.section_label,
    });
    setForm({ full_name: '', login_id: '', dob: '', class_label: '', section_label: '' });
    setOpen(false);
  };

  /** Parse whatever is in the textarea / uploaded file into validated rows. */
  const buildPreview = (text: string) => {
    setParseError('');
    if (!text.trim()) {
      setPreview([]);
      return;
    }
    const rows = parseCsv(text);
    if (rows.length === 0) {
      setParseError('No data rows found. The first line must be a header row.');
      setPreview([]);
      return;
    }
    const seen = new Set<string>();
    const parsed: PreviewRow[] = rows.map((row) => {
      const full_name = pick(row, 'full_name');
      const admission_no = pick(row, 'admission_no');
      const dob = pick(row, 'dob');
      const class_label = pick(row, 'class_label');
      const section_label = pick(row, 'section_label');
      const isoDob = dob ? (normalizeDob(dob)?.iso ?? null) : null;

      let error: string | undefined;
      if (!full_name) error = 'Missing student name';
      else if (!admission_no) error = 'Missing admission number';
      else if (!dob) error = 'Missing date of birth';
      else if (!isoDob) error = `Unreadable date "${dob}"`;
      else if (seen.has(admission_no.toLowerCase())) error = 'Duplicate admission number';

      if (admission_no) seen.add(admission_no.toLowerCase());

      return {
        full_name,
        admission_no,
        dob,
        isoDob,
        class_label,
        section_label,
        password: isoDob ? passwordFromDob(isoDob) : '—',
        error,
      };
    });
    setPreview(parsed);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setParseError('Please choose a .csv file.');
      return;
    }
    const text = await file.text();
    setCsvText(text);
    buildPreview(text);
  };

  const validRows = preview.filter((row) => !row.error);
  const invalidRows = preview.filter((row) => row.error);

  const handleImport = () => {
    if (validRows.length === 0) return;
    data.importPeople(
      validRows.map((row) => ({
        full_name: row.full_name,
        admission_no: row.admission_no,
        dob: row.isoDob ?? row.dob,
        class_label: row.class_label,
        section_label: row.section_label,
        password: row.password,
      })),
    );
    setCsvText('');
    setPreview([]);
    setImportOpen(false);
  };

  const downloadTemplate = () => {
    downloadCsv('student-import-template.csv', [
      { full_name: 'Sahaj Chugh', admission_no: '0185/18', dob: '14/05/2010', class: 'IX', section: 'E' },
      { full_name: 'Vivaan Chugh', admission_no: '0201/18', dob: '11/03/2015', class: 'V', section: 'A' },
    ]);
  };

  const downloadCredentials = () => {
    if (validRows.length === 0) return;
    downloadCsv(
      'student-credentials.csv',
      validRows.map((row) => ({
        full_name: row.full_name,
        admission_no: row.admission_no,
        login_id: row.admission_no,
        password: row.password,
        class: row.class_label,
        section: row.section_label,
      })),
    );
  };

  if (!isAdmin()) {
    return (
      <div className="rounded-xl border border-terracotta/20 bg-terracotta/5 p-6">
        <h1 className="text-lg font-bold text-ink">People</h1>
        <p className="mt-1 text-sm text-muted">
          Only administrators can add students or import the roster.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">People</h1>
          <p className="text-muted">
            {people.length} accounts · {students.length} students · {people.filter((p) => p.role === 'teacher').length} teachers
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <FiUpload size={16} /> Import CSV
          </Button>
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> Add student
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Login / Admission</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Initial password</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="font-medium">{person.full_name}</div>
                    <div className="text-xs text-muted">{person.email}</div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-sand px-1.5 py-0.5 text-xs">{person.login_id}</code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        person.role === 'admin' ? 'terracotta' : person.role === 'teacher' ? 'olive' : 'default'
                      }
                    >
                      {person.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {person.class_label ? `${person.class_label} ${person.section_label ?? ''}` : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted">{person.dob ?? '—'}</TableCell>
                  <TableCell className="text-sm">
                    {person.role === 'student' ? (
                      <code className="text-olive">{person.password ?? '—'}</code>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold text-ink">Add student</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Full name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Admission number</label>
                <input
                  value={form.login_id}
                  onChange={(e) => setForm({ ...form, login_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="0185/18"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Date of birth</label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <p className="mt-1 text-xs text-muted">
                  {form.dob && normalizeDob(form.dob)
                    ? `Password will be ${passwordFromDob(normalizeDob(form.dob)!.iso)}`
                    : 'Password is generated as Student@DDMMYYYY'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Class</label>
                  <input
                    value={form.class_label}
                    onChange={(e) => setForm({ ...form, class_label: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="IX"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Section</label>
                  <input
                    value={form.section_label}
                    onChange={(e) => setForm({ ...form, section_label: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="E"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add student</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-ink">Import students from CSV</h2>
            <p className="mb-4 text-sm text-muted">
              Include <code className="rounded bg-sand px-1 text-xs">full_name</code>,{' '}
              <code className="rounded bg-sand px-1 text-xs">admission_no</code> and{' '}
              <code className="rounded bg-sand px-1 text-xs">dob</code>. Class and section are optional.
            </p>

            <div className="mb-4 flex items-start gap-2 rounded-lg border border-olive/15 bg-olive/5 p-3 text-xs text-olive">
              <FiInfo size={14} className="mt-0.5 shrink-0" />
              <span>
                Every account starts with the password{' '}
                <strong>Student@</strong> followed by the date of birth as <strong>DDMMYYYY</strong>.
                A student born 14 May 2010 gets <code className="rounded bg-white px-1">Student@14052010</code>.
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <FiDownload size={14} /> Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <FiUpload size={14} /> Choose .csv file
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-muted">Or paste CSV text</label>
              <textarea
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  buildPreview(e.target.value);
                }}
                rows={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
                placeholder={'full_name,admission_no,dob,class,section\nSahaj Chugh,0185/18,14/05/2010,IX,E'}
              />
            </div>

            {parseError && (
              <p className="mt-2 rounded-lg border border-terracotta/20 bg-terracotta/5 px-3 py-2 text-xs text-terracotta">
                {parseError}
              </p>
            )}

            {preview.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="success">{validRows.length} ready</Badge>
                  {invalidRows.length > 0 && <Badge variant="terracotta">{invalidRows.length} need fixing</Badge>}
                  <span className="text-muted">Preview before anything is created</span>
                </div>
                <div className="max-h-64 overflow-auto rounded-lg border border-sand/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Admission</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Password</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <tbody>
                      {preview.map((row, i) => (
                        <TableRow key={i} className={row.error ? 'bg-terracotta/5' : undefined}>
                          <TableCell className="text-sm">{row.full_name || '—'}</TableCell>
                          <TableCell className="text-sm text-muted">{row.admission_no || '—'}</TableCell>
                          <TableCell className="text-sm">{row.isoDob ?? (row.dob || '—')}</TableCell>
                          <TableCell className="text-sm font-medium text-olive">{row.password}</TableCell>
                          <TableCell>
                            {row.error ? (
                              <span className="text-xs text-terracotta">{row.error}</span>
                            ) : (
                              <Badge variant="success">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => setImportOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled={validRows.length === 0}
                onClick={downloadCredentials}
              >
                <FiDownload size={14} /> Credentials CSV
              </Button>
              <Button type="button" disabled={validRows.length === 0} onClick={handleImport}>
                Import {validRows.length || ''} student{validRows.length === 1 ? '' : 's'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
