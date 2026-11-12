import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import { format, startOfWeek, eachDayOfInterval, isSunday } from 'date-fns';
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
import { Page, PageHeader, SectionHeading } from '../components/page';
import { Modal } from '../components/modal';
import { FiCheckCircle } from 'react-icons/fi';

type AttendanceStatus = 'present' | 'absent' | 'leave' | 'medical' | 'holiday';

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  leave: 'Leave',
  medical: 'Medical',
  holiday: 'Holiday',
};

const STATUS_COLOR: Record<AttendanceStatus, string> = {
  present: 'olive',
  absent: 'terracotta',
  leave: 'slate',
  medical: 'slate',
  holiday: 'slate',
};

export default function Attendance() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [viewDate, setViewDate] = useState(new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);

  const canMark = isAdmin() || isTeacher();

  /**
   * A teacher only marks the section they are class teacher of. Admins see the
   * whole school. This mirrors the RLS policy on `attendance`.
   */
  const mySection = data.people.find((p) => p.id === profile?.id)?.class_teacher_of;
  const students = data.people
    .filter((p) => p.role === 'student')
    .filter((p) => {
      // Students only ever see their own attendance (mirrors the RLS policy).
      if (isStudent()) return p.id === profile?.id;
      if (isAdmin()) return true;
      return mySection ? `${p.class_label} - ${p.section_label}` === mySection : false;
    });

  const dayRecords = useMemo(() => {
    return data.attendance.filter((a) => a.date === viewDate);
  }, [data.attendance, viewDate]);

  const statusByStudent = new Map(dayRecords.map((r) => [r.student_id, r.status]));

  const weekStart = startOfWeek(new Date(viewDate), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: new Date(weekStart.getTime() + 6 * 86400000),
  });

  /**
   * Only admins and teachers may write attendance, and a teacher only for the
   * section they are class teacher of. Students have a read-only view. This
   * mirrors the RLS policy on `attendance` and is enforced here regardless of
   * which control triggered the write.
   */
  const markStatus = (studentId: string, dateStr: string, status: AttendanceStatus) => {
    if (!canMark || !profile) return;
    if (!isAdmin()) {
      const student = data.people.find((p) => p.id === studentId);
      if (!student || `${student.class_label} - ${student.section_label}` !== mySection) return;
    }
    const existing = data.attendance.find((r) => r.student_id === studentId && r.date === dateStr);
    data.saveAttendance([
      existing
        ? { ...existing, status }
        : { student_id: studentId, date: dateStr, status, note: '' },
    ]);
  };

  const handleMark = (studentId: string, status: AttendanceStatus) => markStatus(studentId, viewDate, status);

  // Clicking a day badge cycles that day's status (present → absent → leave → medical).
  const CYCLE: AttendanceStatus[] = ['present', 'absent', 'leave', 'medical'];
  const nextStatus = (s: AttendanceStatus): AttendanceStatus => CYCLE[(CYCLE.indexOf(s) + 1) % CYCLE.length];

  const presentCount = dayRecords.filter((r) => r.status === 'present').length;
  const absentCount = dayRecords.filter((r) => r.status === 'absent').length;
  const total = dayRecords.length;

  const prevDay = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() - 1);
    setViewDate(d.toISOString().slice(0, 10));
  };
  const nextDay = () => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + 1);
    setViewDate(d.toISOString().slice(0, 10));
  };

  return (
    <Page>
      <PageHeader
        eyebrow={isStudent() ? 'My school day' : 'Daily rhythm'}
        title={isStudent() ? 'My Attendance' : 'Attendance'}
        description={isStudent() ? 'View your own attendance.' : 'Mark attendance for your class and review the week at a glance.'}
        actions={<div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevDay}>
            <span aria-hidden="true">◀</span><span className="sr-only">Previous day</span>
          </Button>
          <span className="rounded-[10px] border border-olive/15 bg-paper px-3 py-2 text-sm font-semibold text-ink">
            {format(new Date(viewDate), 'dd MMM yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={nextDay}>
            <span aria-hidden="true">▶</span><span className="sr-only">Next day</span>
          </Button>
        </div>}
      />

      <section aria-label="Attendance register" className="space-y-6">

      {canMark && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
          <Card className="p-4">
            <div className="text-xs text-muted">Total marked</div>
            <div className="text-2xl font-bold text-ink">{total}</div>
          </Card>
          <Card className="p-4 border-olive/10 bg-olive/5">
            <div className="text-xs text-muted text-olive">Present</div>
            <div className="text-2xl font-bold text-olive">{presentCount}</div>
          </Card>
          <Card className="p-4 border-terracotta/10 bg-terracotta/5">
            <div className="text-xs text-muted text-terracotta">Absent</div>
            <div className="text-2xl font-bold text-terracotta">{absentCount}</div>
          </Card>
        </div>
      )}

      <Card>
        <SectionHeading title="Weekly register" description="Select a status to move through present, absent, leave and medical." />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                {weekDays.map((d) => (
                  <TableHead key={format(d, 'yyyy-MM-dd')} className="text-center">
                    {format(d, 'EEE')}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <tbody>
              {students.map((student) => {
                const row: AttendanceStatus[] = weekDays.map((d) => {
                  const rec = data.attendance.find(
                    (a) => a.student_id === student.id && a.date === format(d, 'yyyy-MM-dd'),
                  );
                  return (rec?.status as AttendanceStatus) || (isSunday(d) ? 'holiday' : 'present');
                });
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name} ({student.login_id})</TableCell>
                    {row.map((status, i) => (
                      <TableCell key={i} className="text-center">
                        {canMark ? (
                          <button
                            type="button"
                            className="focus-ring rounded-full"
                            aria-label={`Change ${student.full_name}'s ${format(weekDays[i], 'dd MMM')} attendance from ${STATUS_LABEL[status]}`}
                            onClick={() => markStatus(student.id, format(weekDays[i], 'yyyy-MM-dd'), nextStatus(status))}
                          >
                            <Badge variant={STATUS_COLOR[status]} className="px-2 py-1 text-[10px]">{STATUS_LABEL[status].charAt(0)}</Badge>
                          </button>
                        ) : (
                          <Badge variant={STATUS_COLOR[status]} className="px-2 py-1 text-[10px]">{STATUS_LABEL[status].charAt(0)}</Badge>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted py-4">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      <Card>
        <SectionHeading
          title={`${canMark ? 'Mark today' : 'Attendance'} · ${format(new Date(viewDate), 'dd MMM yyyy')}`}
          action={canMark ? (
            <Button onClick={() => setOpen(true)}>
              <FiCheckCircle size={14} aria-hidden="true" /> Mark attendance
            </Button>
          ) : undefined}
        />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {students.map((student) => {
                const current = statusByStudent.get(student.id) || 'present';
                return (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name} ({student.login_id})</TableCell>
                    <TableCell>
                      {canMark ? (
                        <div className="flex gap-2">
                          {['present', 'absent', 'leave', 'medical'].map((status) => (
                            <Button
                              key={status}
                              variant={current === status ? 'olive' : 'outline'}
                              size="sm"
                              onClick={() => handleMark(student.id, status as AttendanceStatus)}
                              className="px-2 py-1 text-xs"
                              aria-label={`Mark ${student.full_name} ${STATUS_LABEL[status as AttendanceStatus].toLowerCase()}`}
                            >
                              {STATUS_LABEL[status as AttendanceStatus].charAt(0)}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <Badge variant={STATUS_COLOR[current]}>{STATUS_LABEL[current]}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>

      </section>

      {canMark && open && (
        <Modal title="Mark attendance" description={`Date: ${format(new Date(viewDate), 'dd MMM yyyy')}`} onClose={() => setOpen(false)} size="sm">
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex flex-wrap items-center justify-between gap-2 rounded-campus border border-olive/10 p-3">
                  <span className="text-sm">{student.full_name}</span>
                  <div className="flex flex-wrap gap-1">
                    {['present', 'absent', 'leave', 'medical'].map((status) => (
                      <Button
                        key={status}
                        variant={statusByStudent.get(student.id) === status ? 'olive' : 'outline'}
                        size="sm"
                        onClick={() => handleMark(student.id, status as AttendanceStatus)}
                        className="px-2 py-1 text-[10px]"
                        aria-label={`Mark ${student.full_name} ${STATUS_LABEL[status as AttendanceStatus].toLowerCase()}`}
                      >
                        {STATUS_LABEL[status as AttendanceStatus].charAt(0)}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>Done</Button>
            </div>
        </Modal>
      )}
    </Page>
  );
}
