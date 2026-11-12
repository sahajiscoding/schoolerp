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
  StatCard,
} from '../components/ui';
import { Modal } from '../components/modal';
import { MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { FiCheckCircle, FiChevronLeft, FiChevronRight, FiUsers, FiXCircle } from 'react-icons/fi';

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
        eyebrow="Academic register"
        title={isStudent() ? 'My attendance' : 'Attendance'}
        description={isStudent() ? 'View your own attendance register.' : 'Review and mark attendance for the current class scope.'}
        meta={isStudent() ? `${students[0]?.class_label ?? ''} ${students[0]?.section_label ?? ''}`.trim() : mySection ?? 'School-wide view'}
        actions={<div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevDay} aria-label="Previous day">
            <FiChevronLeft size={16} />
          </Button>
          <span className="inline-flex min-h-11 items-center rounded-xl border border-border bg-paper px-3 text-sm font-bold text-ink">
            {format(new Date(viewDate), 'dd MMM yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={nextDay} aria-label="Next day">
            <FiChevronRight size={16} />
          </Button>
        </div>}
      />

      {canMark && (
        <MetricGrid className="xl:grid-cols-3">
          <StatCard label="Total marked" value={total} icon={FiUsers} variant="neutral" />
          <StatCard label="Present" value={presentCount} icon={FiCheckCircle} />
          <StatCard label="Absent" value={absentCount} icon={FiXCircle} variant="terracotta" />
        </MetricGrid>
      )}

      <Card>
        <SectionHeading title="Weekly register" description="Monday to Sunday status summary. Select a status only when you are authorised to mark attendance." />
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
                    <TableCell className="font-bold">{student.full_name} <span className="block text-xs font-normal text-muted">{student.login_id}</span></TableCell>
                    {row.map((status, i) => (
                      <TableCell key={i} className="text-center">
                        {canMark ? (
                          <button
                            type="button"
                            onClick={() => markStatus(student.id, format(weekDays[i], 'yyyy-MM-dd'), nextStatus(status))}
                            className="focus-ring inline-flex min-h-10 min-w-10 items-center justify-center rounded-full"
                            aria-label={`${student.full_name}: ${STATUS_LABEL[status]} on ${format(weekDays[i], 'dd MMM')}. Change status`}
                          >
                            <Badge variant={STATUS_COLOR[status]} className="pointer-events-none px-2 py-1 text-[10px]">{STATUS_LABEL[status].charAt(0)}</Badge>
                          </button>
                        ) : <Badge variant={STATUS_COLOR[status]} className="px-2 py-1 text-[10px]">{STATUS_LABEL[status].charAt(0)}</Badge>}
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
          title={canMark ? 'Mark the selected day' : 'Attendance detail'}
          description={format(new Date(viewDate), 'dd MMM yyyy')}
          action={canMark ? (
            <Button onClick={() => setOpen(true)}>
              <FiCheckCircle size={14} /> Mark attendance
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
                    <TableCell className="font-bold">{student.full_name} <span className="block text-xs font-normal text-muted">{student.login_id}</span></TableCell>
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

      {canMark && open && (
        <Modal title="Mark attendance" description={`Date: ${format(new Date(viewDate), 'dd MMM yyyy')}`} onClose={() => setOpen(false)}>
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-parchment/30 p-3">
                  <span className="text-sm font-bold">{student.full_name}</span>
                  <div className="flex gap-1">
                    {['present', 'absent', 'leave', 'medical'].map((status) => (
                      <Button
                        key={status}
                        variant={statusByStudent.get(student.id) === status ? 'olive' : 'outline'}
                        size="sm"
                        onClick={() => handleMark(student.id, status as AttendanceStatus)}
                        className="px-2 py-1 text-[10px]"
                      >
                        {STATUS_LABEL[status as AttendanceStatus].charAt(0)}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end border-t border-border pt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>Done</Button>
            </div>
        </Modal>
      )}
    </Page>
  );
}
