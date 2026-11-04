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
    .filter((p) =>
      isAdmin() || isStudent()
        ? true
        : mySection
          ? `${p.class_label} - ${p.section_label}` === mySection
          : false,
    );

  const dayRecords = useMemo(() => {
    return data.attendance.filter((a) => a.date === viewDate);
  }, [data.attendance, viewDate]);

  const statusByStudent = new Map(dayRecords.map((r) => [r.student_id, r.status]));

  const weekStart = startOfWeek(new Date(viewDate), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: new Date(weekStart.getTime() + 6 * 86400000),
  });

  const handleMark = (studentId: string, status: AttendanceStatus) => {
    if (!profile) return;
    const existing = dayRecords.find((r) => r.student_id === studentId);
    if (existing) {
      // update
      data.saveAttendance([
        { ...existing, status },
      ]);
    } else {
      data.saveAttendance([
        {
          student_id: studentId,
          date: viewDate,
          status,
          note: '',
        },
      ]);
    }
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Attendance</h1>
          <p className="text-muted">
            Mark attendance for your class. {isStudent() ? 'View your own attendance.' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevDay}>
            ◀
          </Button>
          <span className="px-3 py-1 text-sm font-medium text-ink bg-white border border-sand/30 rounded-lg">
            {format(new Date(viewDate), 'dd MMM yyyy')}
          </span>
          <Button variant="outline" size="sm" onClick={nextDay}>
            ▶
          </Button>
        </div>
      </div>

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
                      <Badge
                        variant={STATUS_COLOR[status]}
                        className="text-[10px] px-2 py-1"
                        onClick={canMark ? () => handleMark(student.id, status) : undefined}
                        >
                          {STATUS_LABEL[status].charAt(0)}
                        </Badge>
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-ink">Mark today ({format(new Date(viewDate), 'dd MMM yyyy')})</h3>
          {canMark && (
            <Button onClick={() => setOpen(true)}>
              <FiCheckCircle size={14} /> Mark attendance
            </Button>
          )}
        </div>
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>

      {canMark && open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 lg:hidden">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">Mark attendance</h2>
            <p className="text-muted text-sm mb-4">Date: {format(new Date(viewDate), 'dd MMM yyyy')}</p>
            <div className="space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-2 rounded-lg border border-sand/20">
                  <span className="text-sm">{student.full_name}</span>
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
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
