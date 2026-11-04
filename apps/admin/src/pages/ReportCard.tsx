import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useAppDataHook } from '../lib/appData';
import { formatDateLong, gradeFor, printHtml } from '../lib/utils';
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
import { FiPlus, FiPrinter, FiTrash2 } from 'react-icons/fi';
import type { ReportCard as ReportCardType } from '../lib/types';

const DEFAULT_SUBJECTS = [
  'Artificial Intelligence',
  'Mathematics',
  'English',
  'Science',
  'Social Science',
];

const TERMS = ['HALF YEARLY', 'ANNUAL', 'TERM 1', 'TERM 2'];

export default function ReportCard() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useAppDataHook();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    term: 'HALF YEARLY',
    academic_year: '2026-27',
    class_label: '',
    section_label: '',
    subjects: DEFAULT_SUBJECTS.map((s) => ({ subject: s, marks: '', max_marks: '100' })),
  });

  const canGenerate = isAdmin() || isTeacher();
  const students = data.people.filter((p) => p.role === 'student');
  const myReportCards = data.reportCards.filter((rc) => rc.student_id === profile?.id);
  const visibleCards = isStudent() ? myReportCards : data.reportCards;

  const pickStudent = (id: string) => {
    const student = data.people.find((p) => p.id === id);
    setForm((prev) => ({
      ...prev,
      student_id: id,
      class_label: student?.class_label ?? prev.class_label,
      section_label: student?.section_label ?? prev.section_label,
    }));
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.student_id) {
      data.notify('Choose which student this report card belongs to.');
      return;
    }
    const subjects = form.subjects
      .filter((s) => s.subject.trim() && s.marks !== '')
      .map((s) => ({
        subject: s.subject.trim(),
        marks: Number(s.marks) || 0,
        max_marks: Number(s.max_marks) || 100,
      }));
    if (subjects.length === 0) {
      data.notify('Add at least one subject with marks.');
      return;
    }
    const total = subjects.reduce((sum, s) => sum + s.marks, 0);
    const maxTotal = subjects.reduce((sum, s) => sum + s.max_marks, 0);
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

    data.addReportCard({
      student_id: form.student_id,
      term: form.term,
      academic_year: form.academic_year,
      class_label: form.class_label,
      section_label: form.section_label,
      subjects,
      total,
      max_total: maxTotal,
      percentage,
      grade: gradeFor(percentage),
    });
    setForm({
      student_id: '',
      term: 'HALF YEARLY',
      academic_year: '2026-27',
      class_label: '',
      section_label: '',
      subjects: DEFAULT_SUBJECTS.map((s) => ({ subject: s, marks: '', max_marks: '100' })),
    });
    setOpen(false);
  };

  const handlePrint = (rc: ReportCardType) => {
    const student = data.people.find((p) => p.id === rc.student_id);
    const rows = rc.subjects
      .map(
        (s) =>
          `<tr><td>${s.subject}</td><td style="text-align:center">${s.marks}</td><td style="text-align:center">${s.max_marks}</td><td style="text-align:center">${((s.marks / (s.max_marks || 100)) * 100).toFixed(1)}%</td></tr>`,
      )
      .join('');
    printHtml(
      `Report Card — ${student?.full_name ?? ''}`,
      `<div class="sheet">
        <div class="school">
          <h1>PACIFIC WORLD SCHOOL</h1>
          <p>Greater Noida West · Report Card</p>
        </div>
        <h2>${rc.term} · Academic Year ${rc.academic_year}</h2>
        <div class="meta">
          <div><strong>Student</strong> ${student?.full_name ?? '—'}</div>
          <div><strong>Admission No.</strong> ${student?.admission_no ?? student?.login_id ?? '—'}</div>
          <div><strong>Class / Section</strong> ${rc.class_label || (student?.class_label ?? '')} / ${rc.section_label || (student?.section_label ?? '')}</div>
          <div><strong>Date of Birth</strong> ${student?.dob ? formatDateLong(student.dob) : '—'}</div>
        </div>
        <table>
          <thead>
            <tr><th>Subject</th><th style="text-align:center">Marks</th><th style="text-align:center">Max</th><th style="text-align:center">Percent</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="total">
          Total: <strong>${rc.total} / ${rc.max_total}</strong> &nbsp;·&nbsp;
          Percentage: <strong>${rc.percentage.toFixed(1)}%</strong> &nbsp;·&nbsp;
          Grade: <strong>${rc.grade}</strong>
        </div>
        <div class="signatures">
          <div>Class Teacher</div>
          <div>Parent</div>
          <div>Principal</div>
        </div>
      </div>`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            {isStudent() ? 'My Report Card' : 'Report Cards'}
          </h1>
          <p className="text-muted">
            {canGenerate
              ? 'Pick a student, enter subject marks, and the card is generated and assigned instantly.'
              : 'Your published report cards. Print any term for your records.'}
          </p>
        </div>
        {canGenerate && (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> Generate report card
          </Button>
        )}
      </div>

      {isStudent() && myReportCards.length > 0 && (
        <LatestCard card={myReportCards[0]} onPrint={handlePrint} studentName={profile?.full_name ?? ''} />
      )}

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink">
            {isStudent() ? 'All my report cards' : 'All report cards'}
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
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {visibleCards.map((rc) => {
                const student = data.people.find((p) => p.id === rc.student_id);
                return (
                  <TableRow key={rc.id}>
                    <TableCell>
                      <div className="font-medium">{student?.full_name ?? '—'}</div>
                      <div className="text-xs text-muted">{student?.admission_no}</div>
                    </TableCell>
                    <TableCell>{rc.term}</TableCell>
                    <TableCell className="text-sm">
                      {rc.class_label} / {rc.section_label}
                    </TableCell>
                    <TableCell>
                      {rc.total} / {rc.max_total}
                    </TableCell>
                    <TableCell>{rc.percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      <Badge variant="olive">{rc.grade}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handlePrint(rc)}>
                          <FiPrinter size={14} /> Print
                        </Button>
                        {canGenerate && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => data.removeReportCard(rc.id)}
                            aria-label="Withdraw report card"
                          >
                            <FiTrash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {visibleCards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-4 text-center text-muted">
                    No report cards yet.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {canGenerate && open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-bold text-ink">Generate report card</h2>
            <p className="mb-4 text-xs text-muted">
              Marks are graded automatically (A1 to E). The card appears in the student’s account
              immediately.
            </p>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Student</label>
                <select
                  value={form.student_id}
                  onChange={(e) => pickStudent(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} — {s.admission_no} ({s.class_label} {s.section_label})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Term</label>
                  <select
                    value={form.term}
                    onChange={(e) => setForm({ ...form, term: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Academic year</label>
                  <input
                    value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">Subjects &amp; marks</label>
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
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                        className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
                        className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Max"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            subjects: prev.subjects.filter((_, index) => index !== i),
                          }))
                        }
                        className="text-terracotta hover:text-terracotta/80"
                        aria-label="Remove subject"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        subjects: [...prev.subjects, { subject: '', marks: '', max_marks: '100' }],
                      }))
                    }
                  >
                    <FiPlus size={14} /> Add subject
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
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

function LatestCard({
  card,
  onPrint,
  studentName,
}: {
  card: ReportCardType;
  onPrint: (card: ReportCardType) => void;
  studentName: string;
}) {
  return (
    <Card className="print-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-olive">Latest result</div>
          <h3 className="text-lg font-bold text-ink">
            {card.term} · {card.academic_year}
          </h3>
          <p className="text-sm text-muted">
            {studentName} · {card.class_label} {card.section_label}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onPrint(card)}>
          <FiPrinter size={14} /> Print
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total" value={`${card.total}/${card.max_total}`} />
        <Metric label="Percentage" value={`${card.percentage.toFixed(1)}%`} />
        <Metric label="Grade" value={card.grade} />
        <Metric label="Subjects" value={`${card.subjects.length}`} />
      </div>
      <div className="mt-4 space-y-1.5">
        {card.subjects.map((s) => {
          const share = Math.round((s.marks / (s.max_marks || 100)) * 100);
          return (
            <div key={s.subject}>
              <div className="flex justify-between text-xs">
                <span className="text-ink">{s.subject}</span>
                <span className="text-muted">
                  {s.marks}/{s.max_marks}
                </span>
              </div>
              <div className="mt-0.5 h-1.5 w-full rounded-full bg-sand">
                <div
                  className="h-1.5 rounded-full bg-olive"
                  style={{ width: `${Math.min(100, share)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-sand/60 bg-cream/40 p-3">
      <div className="text-lg font-bold text-ink">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
