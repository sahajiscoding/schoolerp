import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import { Badge, Card, StatCard } from '../components/ui';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiFileText,
  FiUsers,
  FiCreditCard,
} from 'react-icons/fi';
import { cn, formatDateLong, inr, relativeToToday } from '../lib/utils';

export default function Dashboard() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useAppData();

  const mySection = data.people.find((p) => p.id === profile?.id)?.class_teacher_of ?? 'IX - E';

  const stats = useMemo(() => {
    const students = data.people.filter((p) => p.role === 'student');
    const teachers = data.people.filter((p) => p.role === 'teacher');
    const pendingLeaves = data.leaves.filter((l) => l.status === 'pending');
    const upcomingEvents = data.events.filter((e) => e.end_date >= '2026-11-04');
    const myFees = data.fees.filter((f) => f.student_id === profile?.id);
    const dueFees = myFees.reduce((sum, f) => sum + (f.amount - f.discount - f.paid), 0);
    const collected = data.fees.reduce((sum, f) => sum + f.paid, 0);
    const billed = data.fees.reduce((sum, f) => sum + f.amount - f.discount, 0);
    const myAttendance = data.attendance.filter((a) => a.student_id === profile?.id);
    const presentDays = myAttendance.filter((a) => a.status === 'present').length;
    const teachingDays = myAttendance.filter((a) => a.status !== 'holiday').length;
    return {
      students: students.length,
      teachers: teachers.length,
      pendingLeaves,
      upcomingEvents,
      dueFees,
      collected,
      billed,
      attendanceRate: teachingDays ? Math.round((presentDays / teachingDays) * 100) : 0,
      unread: data.notifications.filter((n) => !n.read).length,
    };
  }, [data, profile?.id]);

  const myAssignments = useMemo(() => {
    if (!isStudent()) return [];
    return data.homework.filter((hw) => {
      const student = data.people.find((p) => p.id === profile?.id);
      return hw.section_label === `${student?.class_label} - ${student?.section_label}`;
    });
  }, [data.homework, data.people, isStudent, profile?.id]);

  const recentLeaves = useMemo(() => {
    const scoped = isAdmin()
      ? data.leaves
      : data.leaves.filter((leave) => {
          const student = data.people.find((p) => p.id === leave.student_id);
          return `${student?.class_label} - ${student?.section_label}` === mySection;
        });
    return [...scoped]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 4);
  }, [data.leaves, data.people, isAdmin, mySection]);

  const upcoming = useMemo(
    () =>
      [...data.events]
        .filter((e) => e.end_date >= '2026-11-04')
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 4),
    [data.events],
  );

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-olive/10 bg-gradient-to-br from-olive to-olive-700 p-6 text-white shadow-lift">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/60">
              {isStudent() ? `Admission ${profile?.login_id}` : isTeacher() ? `Class teacher · ${mySection}` : 'Administrator'}
            </div>
            <h1 className="mt-1 text-2xl font-bold">
              {greeting}, {profile?.full_name?.split(' ')[0] ?? 'there'}.
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/70">
              {isStudent()
                ? `You have ${myAssignments.length} assignment${myAssignments.length === 1 ? '' : 's'} on the board and ${stats.upcomingEvents.length} upcoming school events.`
                : isTeacher()
                  ? `${stats.pendingLeaves.length} leave request${stats.pendingLeaves.length === 1 ? '' : 's'} waiting on you. ${upcoming.length} events this month.`
                  : `${stats.students} students, ${stats.teachers} teachers. ${stats.pendingLeaves.length} leave approvals pending across the school.`}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-right backdrop-blur">
            <div className="text-[10px] uppercase tracking-wider text-white/60">Today</div>
            <div className="text-sm font-semibold">{formatDateLong('2026-11-04')}</div>
            <div className="text-[10px] text-white/60">Academic year 2026-27</div>
          </div>
        </div>
      </div>

      {isStudent() ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Attendance this month" value={`${stats.attendanceRate}%`} icon={FiCheckCircle} />
            <StatCard label="Assignments pending" value={myAssignments.length} icon={FiFileText} variant="terracotta" />
            <StatCard label="Fee due" value={inr(stats.dueFees)} icon={FiCreditCard} variant="warning" />
            <StatCard label="Notifications" value={stats.unread} icon={FiBell} variant="neutral" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <SectionHeading title="Homework & assignments" action={<Link to="/assignments">Open</Link>} />
              <div className="space-y-2">
                {myAssignments.slice(0, 4).map((hw) => {
                  const teacher = data.people.find((p) => p.id === hw.teacher_id);
                  return (
                    <div key={hw.id} className="rounded-lg border border-sand/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium text-ink">{hw.title}</div>
                        <Badge variant={hw.type === 'HOMEWORK' ? 'olive' : 'terracotta'}>{hw.type}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {hw.subject} · assigned by {teacher?.full_name ?? 'your teacher'} · due{' '}
                        {formatDateLong(hw.due_date)} ({relativeToToday(hw.due_date)})
                      </div>
                    </div>
                  );
                })}
                {myAssignments.length === 0 && <Empty>No assignments posted yet.</Empty>}
              </div>
            </Card>

            <Card>
              <SectionHeading title="Upcoming events" action={<Link to="/events">Calendar</Link>} />
              <div className="space-y-2">
                {upcoming.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 rounded-lg border border-sand/50 p-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-olive/5 text-olive">
                      <span className="text-sm font-bold leading-none">
                        {new Date(ev.start_date).getDate()}
                      </span>
                      <span className="text-[9px] uppercase">
                        {new Date(ev.start_date).toLocaleString('en', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink">{ev.title}</div>
                      <div className="text-xs text-muted">
                        {ev.audience} · {formatDateLong(ev.start_date)}
                      </div>
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && <Empty>No upcoming events.</Empty>}
              </div>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {isAdmin() && (
              <StatCard label="Total students" value={stats.students} icon={FiUsers} />
            )}
            {isAdmin() && (
              <StatCard label="Teaching staff" value={stats.teachers} icon={FiBookOpen} variant="terracotta" />
            )}
            <StatCard
              label="Leave approvals pending"
              value={stats.pendingLeaves.length}
              icon={FiAlertCircle}
              variant="warning"
            />
            {isAdmin() ? (
              <StatCard label="Fees collected" value={inr(stats.collected)} icon={FiCreditCard} variant="neutral" />
            ) : (
              <StatCard label="Upcoming events" value={upcoming.length} icon={FiCalendar} variant="terracotta" />
            )}
          </div>

          {isAdmin() && (
            <Card>
              <SectionHeading title="Fee collection" action={<Link to="/fees">Open fees</Link>} />
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <span className="text-muted">
                  Collected {inr(stats.collected)} of {inr(stats.billed)}
                </span>
                <span className="font-semibold text-olive">
                  {stats.billed ? Math.round((stats.collected / stats.billed) * 100) : 0}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand">
                <div
                  className="h-2.5 rounded-full bg-olive transition-all"
                  style={{ width: `${stats.billed ? Math.min(100, (stats.collected / stats.billed) * 100) : 0}%` }}
                />
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <SectionHeading
                title={isAdmin() ? 'Latest leave requests' : `Leaves in ${mySection}`}
                action={<Link to="/approvals">Approvals</Link>}
              />
              <div className="space-y-2">
                {recentLeaves.map((leave) => {
                  const student = data.people.find((p) => p.id === leave.student_id);
                  return (
                    <div
                      key={leave.id}
                      className="flex flex-wrap items-center gap-2 rounded-lg border border-sand/50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-ink">{student?.full_name ?? '—'}</div>
                        <div className="text-xs text-muted">
                          {leave.leave_type} · {formatDateLong(leave.start_date)} →{' '}
                          {formatDateLong(leave.end_date)}
                        </div>
                      </div>
                      <Badge
                        variant={
                          leave.status === 'approved'
                            ? 'success'
                            : leave.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {leave.status}
                      </Badge>
                    </div>
                  );
                })}
                {recentLeaves.length === 0 && <Empty>No leave requests yet.</Empty>}
              </div>
            </Card>

            <Card>
              <SectionHeading title="Upcoming events" action={<Link to="/events">Calendar</Link>} />
              <div className="space-y-2">
                {upcoming.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 rounded-lg border border-sand/50 p-3">
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-terracotta/5 text-terracotta">
                      <span className="text-sm font-bold leading-none">
                        {new Date(ev.start_date).getDate()}
                      </span>
                      <span className="text-[9px] uppercase">
                        {new Date(ev.start_date).toLocaleString('en', { month: 'short' })}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink">{ev.title}</div>
                      <div className="text-xs text-muted">
                        {ev.audience} · {relativeToToday(ev.start_date)}
                      </div>
                    </div>
                  </div>
                ))}
                {upcoming.length === 0 && <Empty>No upcoming events.</Empty>}
              </div>
            </Card>
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickLink to="/assignments" icon={FiFileText} title="Assignments" sub="Homework board" />
        <QuickLink to="/attendance" icon={FiClipboard} title="Attendance" sub={isStudent() ? 'My register' : 'Mark today'} />
        <QuickLink to="/library" icon={FiBookOpen} title="Library" sub="Books & issues" />
        <QuickLink to="/fees" icon={FiCreditCard} title={isStudent() ? 'My fee' : 'Fee collection'} sub="Invoices" />
      </div>
    </div>
  );
}

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {action && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-olive [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:hover:underline">
          {action} <FiArrowRight size={12} />
        </span>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-6 text-center text-sm text-muted">{children}</div>;
}

function QuickLink({
  to,
  icon: Icon,
  title,
  sub,
}: {
  to: string;
  icon: React.ElementType;
  title: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-sand/60 bg-white p-3.5 transition-all',
        'hover:-translate-y-0.5 hover:border-olive/20 hover:shadow-card',
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-olive/5 text-olive transition-colors group-hover:bg-olive group-hover:text-white">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-ink">{title}</span>
        <span className="block truncate text-[10px] text-muted">{sub}</span>
      </span>
    </Link>
  );
}
