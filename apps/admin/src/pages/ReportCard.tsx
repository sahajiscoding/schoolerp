import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import { printHtml } from '../lib/utils';
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
import { FiPlus, FiPrinter } from 'react-icons/fi';

const SUBJECTS = ['Artificial Intelligence', 'Mathematics', 'English', 'Science', 'Social Science'];

export default function ReportCard() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    term: 'HALF YEARLY',
    academic_year: '2026-27',
    class_label: '',
    section_label: '',
    subjects: SUBJECTS.map((s) => ({ subject: s, marks: '', max_marks: '100' })),
  });

  const canGenerate = isAdmin() || isTeacher();
  const students = data.people.filter((p) => p.role === 'student');

  const myReportCards = data.reportCards.filter(
    (rc) => rc.student_id === profile?.id,
  );

  const handleAddSubject = () => {
    setForm((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { subject: '', marks: '', max_marks: '100' }],
    }));
  };

  const handleRemoveSubject = (index: number) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index),
    }));
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const subjects = form.subjects.filter((s) => s.subject);
    const total = subjects.reduce((sum, s) => sum + (Number(s.marks) || 0), 0);
    const maxTotal = subjects.reduce((sum, s) => sum + (Number(s.max_marks) || 0), 0);
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
    const grade = percentage >= 91 ? 'A1' : percentage >= 81 ? 'A2' : percentage >= 71 ? 'B1' : percentage >= 61 ? 'B2' : percentage >= 51 ? 'C1' : percentage >= 41 ? 'C2' : percentage >= 33 ? 'D' : 'E';

    data.addReportCard({
      student_id: form.student_id || profile.id,
      term: form.term,
      academic_year: form.academic_year,
      class_label: form.class_label,
      section_label: form.section_label,
      subjects: subjects.map((s) => ({ subject: s.subject, marks: Number(s.marks) || 0, max_marks: Number(s.max_marks) || 100 })),
      total,
      max_total: maxTotal,
      percentage,
      grade,
    });
    setForm({
      student_id: '',
      term: 'HALF YEARLY',
      academic_year: '2026-27',
      class_label: '',
      section_label: '',
      subjects: SUBJECTS.map((s) => ({ subject: s, marks: '', max_marks: '100' })),
    });
    setOpen(false);
  };

  const handlePrint = (rc: typeof data.reportCards[number]) => {
    const rows = rc.subjects
      .map(
        (s) => `<tr><td>${s.subject}</td><td>${s.marks}</td><td>${s.max_marks}</td></tr>`,
      )
      .join('');
    printHtml(`Report Card - ${rc.student_id}`, `
      <div class="sheet">
        <div class="school">
          <h1>PACIFIC WORLD SCHOOL</h1>
          <p>Report Card · ${rc.term} · ${rc.academic_year}</p>
        </div>
        <h2>Report Card</h2>
        <div class="meta">
          <div><strong>Student</strong> ${rc.student_id}</div>
          <div><strong>Class / Section</strong> ${rc.class_label} / ${rc.section_label}</div>
        </div>
        <table>
          <thead>
            <tr><th>Subject</th><th>Marks</th><th>Max</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </Table>
        <div class="total">
          Total: <strong>${rc.total} / ${rc.max_total}</strong> &nbsp;·&nbsp;
          Percentage: <strong>${rc.percentage.toFixed(1)}%</strong> &nbsp;·&nbsp;
          Grade: <strong>${rc.grade}</strong>
        </div>
        <div class="signatures">
          <div>Class Teacher</div>
          <div>Principal</div>
        </div>
      </div>
    `);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {isStudent() ? 'My Report Card' : 'Report Cards'}
          </h1>
          <p className="text-muted">
            {canGenerate
              ? 'Enter student, class, section, subjects and marks to generate a report card.'
              : 'View your published report cards.'}
          </p>
        </div>
        {canGenerate && (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> Generate report card
          </Button>
        )}
      </div>

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink">
            {isStudent() ? 'My report cards' : 'All report cards'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Class / Section</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>%</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {(isStudent() ? myReportCards : data.reportCards).map((rc) => {
                const student = data.people.find((p) => p.id === rc.student_id);
                return (
                  <TableRow key={rc.id}>
                    <TableCell>{student?.full_name ?? '—'}</TableCell>
                    <TableCell>{rc.term}</TableCell>
                    <TableCell className="text-sm">{rc.class_label} / {rc.section_label}</TableCell>
                    <TableCell>{rc.total} / {rc.max_total}</TableCell>
                    <TableCell>{rc.percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant="olive">{rc.grade}</Badge>
                    </TableCell>
                    <TableCell>
                      {isStudent() ? (
                        <Button variant="outline" size="sm" onClick={() => handlePrint(rc)}>
                          <FiPrinter size={14} /> Print
                        </Button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(isStudent() ? myReportCards : data.reportCards).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted py-4">
                    No report cards yet.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {canGenerate && open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 lg:hidden">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-ink mb-4">Generate report card</h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.login_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Term</label>
                  <select
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="HALF YEARLY">Half Yearly</option>
                    <option value="ANNUAL">Annual</option>
                    <option value="TERM 1">Term 1</option>
                    <option value="TERM 2">Term 2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Academic year</label>
                  <input
                    value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Class</label>
                  <input
                    value={form.class_label}
                    onChange={(e) => setForm({ ...form, class_label: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Section</label>
                  <input
                    value={form.section_label}
                    onChange={(e) => setForm({ ...form, section_label: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Subjects &amp; marks</label>
                <div className="space-y-2">
                  {form.subjects.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={s.subject}
                        onChange={(ev) => {
                          const subs = [...form.subjects];
                          subs[i] = { ...subs[i], subject: ev.target.value };
                          setForm({ ...form, subjects: subs });
                        }}
                        className="flex-1 px-3 py-2 border rounded-lg"
                        placeholder="Subject"
                      />
                      <input
                        type="number"
                        value={s.marks}
                        onChange={(ev) => {
                          const subs = [...form.subjects];
                          subs[i] = { ...subs[i], marks: ev.target.value };
                          setForm({ ...form, subjects: subs });
                        }}
                        className="w-20 px-3 py-2 border rounded-lg"
                        placeholder="Marks"
                      />
                      <input
                        type="number"
                        value={s.max_marks}
                        onChange={(ev) => {
                          const subs = [...form.subjects];
                          subs[i] = { ...subs[i], max_marks: ev.target.value };
                          setForm({ ...form, subjects: subs });
                        }}
                        className="w-20 px-3 py-2 border rounded-lg"
                        placeholder="Max"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(i)}
                        className="text-terracotta hover:text-terracotta/80"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" type="button" onClick={handleAddSubject}>
                    <FiPlus size={14} /> Add subject
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Generate &amp; assign</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
