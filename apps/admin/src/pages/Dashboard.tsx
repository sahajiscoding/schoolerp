import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import {
  Card,
  StatCard,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui';
import {
  FiHome,
  FiUsers,
  FiAlertCircle,
  FiBell,
  FiCalendar,
} from 'react-icons/fi';

export default function Dashboard() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useAppData();

  const people = data.people;
  const leaves = data.leaves;
  const homework = data.homework;
  const events = data.events;
  const notifications = data.notifications;

  const stats = useMemo(() => {
    const totalStudents = people.filter((p) => p.role === 'student').length;
    const totalTeachers = people.filter((p) => p.role === 'teacher').length;
    const pendingLeaves = leaves.filter((l) => l.status === 'pending').length;
    const unread = notifications.filter((n) => !n.read).length;
    const upcoming = events.filter(
      (e) => new Date(e.start_date) >= new Date(),
    ).length;
    return { totalStudents, totalTeachers, pendingLeaves, unread, upcoming };
  }, [people, leaves, events, notifications]);

  const recentLeave = [...leaves]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentHomework = [...homework]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const roleView = isAdmin() ? 'Admin' : isTeacher() ? 'Teacher' : 'Student';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-muted">
          Welcome back, {profile?.full_name}. Role: {roleView}
          {isStudent() && ` · Admission {profile?.login_id}`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total students" value={stats.totalStudents} icon={FiHome} variant="olive" />
        <StatCard label="Total teachers" value={stats.totalTeachers} icon={FiUsers} variant="terracotta" />
        <StatCard label="Pending leave approvals" value={stats.pendingLeaves} icon={FiAlertCircle} variant="warning" />
        <StatCard label="Unread notifications" value={stats.unread} icon={FiBell} variant="olive" />
        <StatCard label="Upcoming events" value={stats.upcoming} icon={FiCalendar} variant="terracotta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-ink">Recent leave requests</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {recentLeave.map((leave) => {
                  const student = data.people.find((p) => p.id === leave.student_id);
                  return (
                    <TableRow key={leave.id}>
                      <TableCell>{student?.full_name ?? '—'}</TableCell>
                      <TableCell>{leave.leave_type}</TableCell>
                      <TableCell>{`${leave.start_date} to ${leave.end_date}`}</TableCell>
                      <TableCell>
                        <Badge
                          variant={(
                            leave.status === 'approved'
                              ? 'success'
                              : leave.status === 'rejected'
                                ? 'terracotta'
                                : 'pending'
                          ) as any}
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {recentLeave.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted py-4">
                      No leave requests.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-ink">Recent assignments</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {recentHomework.map((hw) => (
                  <TableRow key={hw.id}>
                    <TableCell>{hw.title}</TableCell>
                    <TableCell>{hw.subject}</TableCell>
                    <TableCell>{hw.due_date}</TableCell>
                    <TableCell>
                      <Badge variant={hw.type === 'HOMEWORK' ? 'olive' : 'terracotta'}>
                        {hw.type}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentHomework.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted py-4">
                      No assignments.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
