import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import { Badge, Card, StatCard } from '../components/ui';
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBell,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiUsers,
} from 'react-icons/fi';
import { cn, formatDateLong, inr, relativeToToday } from '../lib/utils';

export default function Dashboard() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useAppData();
  const currentPerson = data.people.find((person) => person.id === profile?.id);
  const mySection = currentPerson?.class_teacher_of ?? 'IX - E';

  const stats = useMemo(() => {
    const students = data.people.filter((person) => person.role === 'student');
    const teachers = data.people.filter((person) => person.role === 'teacher');
    const pendingLeaves = data.leaves.filter((leave) => leave.status === 'pending');
    const upcomingEvents = data.events.filter((event) => event.end_date >= '2026-11-04');
    const myFees = data.fees.filter((fee) => fee.student_id === profile?.id);
    const dueFees = myFees.reduce((sum, fee) => sum + (fee.amount - fee.discount - fee.paid), 0);
    const collected = data.fees.reduce((sum, fee) => sum + fee.paid, 0);
    const billed = data.fees.reduce((sum, fee) => sum + fee.amount - fee.discount, 0);
    const myAttendance = data.attendance.filter((attendance) => attendance.student_id === profile?.id);
    const presentDays = myAttendance.filter((attendance) => attendance.status === 'present').length;
    const teachingDays = myAttendance.filter((attendance) => attendance.status !== 'holiday').length;
    const schoolTeachingDays = data.attendance.filter((attendance) => attendance.status !== 'holiday');
    const schoolPresentDays = schoolTeachingDays.filter((attendance) => attendance.status === 'present').length;
    const sectionStudents = students.filter(
      (student) => `${student.class_label} - ${student.section_label}` === mySection,
    ).length;
    const authoredAssignments = data.homework.filter((homework) => homework.teacher_id === profile?.id).length;

    return {
      students: students.length,
      teachers: teachers.length,
      pendingLeaves,
      upcomingEvents,
      dueFees,
      collected,
      billed,
      attendanceRate: teachingDays ? Math.round((presentDays / teachingDays) * 100) : 0,
      schoolAttendanceRate: schoolTeachingDays.length
        ? Math.round((schoolPresentDays / schoolTeachingDays.length) * 100)
        : 0,
      sectionStudents,
      authoredAssignments,
      unread: data.notifications.filter((notification) => !notification.read).length,
    };
  }, [data, mySection, profile?.id]);

  const myAssignments = useMemo(() => {
    if (!isStudent()) return [];
    return data.homework.filter((homework) => (
      homework.section_label === `${currentPerson?.class_label} - ${currentPerson?.section_label}`
    ));
  }, [currentPerson?.class_label, currentPerson?.section_label, data.homework, isStudent]);

  const recentLeaves = useMemo(() => {
    const scoped = isAdmin()
      ? data.leaves
      : data.leaves.filter((leave) => {
          const student = data.people.find((person) => person.id === leave.student_id);
          return `${student?.class_label} - ${student?.section_label}` === mySection;
        });
    return [...scoped].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);
  }, [data.leaves, data.people, isAdmin, mySection]);

  const upcoming = useMemo(
    () => [...data.events]
      .filter((event) => event.end_date >= '2026-11-04')
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

  const heading = isStudent() ? 'My school day' : isTeacher() ? 'My class today' : 'Today at PWS';
  const roleContext = isStudent()
    ? `Admission ${profile?.login_id ?? '—'}`
    : isTeacher()
      ? `Class teacher · ${mySection}`
      : 'Whole-school view';
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

  return (
    <Page>
      <PageHeader
        eyebrow={roleContext}
        title={heading}
        description={`${greeting}, ${firstName}. ${dashboardSummary({
          student: isStudent(),
          teacher: isTeacher(),
          assignments: myAssignments.length,
          events: stats.upcomingEvents.length,
          leaves: stats.pendingLeaves.length,
          students: stats.students,
          teachers: stats.teachers,
        })}`}
        meta={formatDateLong(new Date().toISOString())}
      />

      <div className="grid items-stretch gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <CampusStory event={upcoming[0]} />
        <MetricGrid className="sm:grid-cols-2 xl:grid-cols-2">
          {isStudent() ? (
            <>
              <StatCard label="Attendance this month" value={`${stats.attendanceRate}%`} icon={FiCheckCircle} />
              <StatCard label="Assignments on the board" value={myAssignments.length} icon={FiFileText} variant="terracotta" />
              <StatCard label="Fee due" value={inr(stats.dueFees)} icon={FiCreditCard} variant="warning" />
              <StatCard label="Notifications" value={stats.unread} icon={FiBell} variant="neutral" />
            </>
          ) : isTeacher() ? (
            <>
              <StatCard label={`Students in ${mySection}`} value={stats.sectionStudents} icon={FiUsers} />
              <StatCard label="Assignments posted" value={stats.authoredAssignments} icon={FiFileText} variant="terracotta" />
              <StatCard label="Leave approvals pending" value={stats.pendingLeaves.length} icon={FiAlertCircle} variant="warning" />
              <StatCard label="Upcoming events" value={upcoming.length} icon={FiCalendar} variant="neutral" />
            </>
          ) : (
            <>
              <StatCard label="Students" value={stats.students} icon={FiUsers} />
              <StatCard label="Teaching staff" value={stats.teachers} icon={FiBookOpen} variant="terracotta" />
              <StatCard label="Attendance recorded" value={`${stats.schoolAttendanceRate}%`} icon={FiCheckCircle} variant="neutral" />
              <StatCard label="Leave approvals pending" value={stats.pendingLeaves.length} icon={FiAlertCircle} variant="warning" />
            </>
          )}
        </MetricGrid>
      </div>

      {isStudent() ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <SectionHeading title="Homework & assignments" description="Work posted for your section." action={<SectionLink to="/assignments">Open assignments</SectionLink>} />
            <div className="space-y-2.5">
              {myAssignments.slice(0, 4).map((homework) => {
                const teacher = data.people.find((person) => person.id === homework.teacher_id);
                return (
                  <article key={homework.id} className="rounded-campus border border-olive/10 bg-daylight/45 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-ink">{homework.title}</h3>
                      <Badge variant={homework.type === 'HOMEWORK' ? 'olive' : 'terracotta'}>{homework.type}</Badge>
                    </div>
                    <p className="mt-1.5 text-xs leading-5 text-muted">
                      {homework.subject} · assigned by {teacher?.full_name ?? 'your teacher'} · due {formatDateLong(homework.due_date)} ({relativeToToday(homework.due_date)})
                    </p>
                  </article>
                );
              })}
              {myAssignments.length === 0 && <EmptyState title="No assignments posted" description="New work for your section will appear here." icon={FiFileText} />}
            </div>
          </Card>
          <EventsCard events={upcoming} />
        </div>
      ) : (
        <>
          {isAdmin() && (
            <Card>
              <SectionHeading title="Fee collection" description="Recorded payments against billed fees." action={<SectionLink to="/fees">Open fees</SectionLink>} />
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span className="text-muted">Collected {inr(stats.collected)} of {inr(stats.billed)}</span>
                <span className="font-display text-xl font-semibold text-deep-olive">
                  {stats.billed ? Math.round((stats.collected / stats.billed) * 100) : 0}%
                </span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-leaf/50" aria-label="Fee collection progress">
                <div
                  className="h-full rounded-full bg-olive"
                  style={{ width: `${stats.billed ? Math.min(100, (stats.collected / stats.billed) * 100) : 0}%` }}
                />
              </div>
            </Card>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <SectionHeading
                title={isAdmin() ? 'Latest leave requests' : `Leaves in ${mySection}`}
                description="Recent requests and their recorded status."
                action={<SectionLink to="/approvals">Open approvals</SectionLink>}
              />
              <div className="space-y-2.5">
                {recentLeaves.map((leave) => {
                  const student = data.people.find((person) => person.id === leave.student_id);
                  return (
                    <article key={leave.id} className="flex flex-wrap items-center gap-3 rounded-campus border border-olive/10 bg-daylight/45 p-3.5">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-ink">{student?.full_name ?? '—'}</h3>
                        <p className="mt-1 text-xs text-muted">{leave.leave_type} · {formatDateLong(leave.start_date)} → {formatDateLong(leave.end_date)}</p>
                      </div>
                      <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'terracotta' : 'warning'}>
                        {leave.status}
                      </Badge>
                    </article>
                  );
                })}
                {recentLeaves.length === 0 && <EmptyState title="No leave requests" description="Requests in your scope will appear here." icon={FiClipboard} />}
              </div>
            </Card>
            <EventsCard events={upcoming} />
          </div>
        </>
      )}

      <section aria-label="Quick actions">
        <SectionHeading title="Move through the day" description="Frequently used school areas." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <QuickLink to="/assignments" icon={FiFileText} title="Assignments" sub="Homework board" />
          <QuickLink to="/attendance" icon={FiClipboard} title="Attendance" sub={isStudent() ? 'My register' : 'Mark today'} />
          <QuickLink to="/library" icon={FiBookOpen} title="Library" sub="Books & issues" />
          <QuickLink to="/fees" icon={FiCreditCard} title={isStudent() ? 'My fee' : 'Fee collection'} sub="Invoices" />
        </div>
      </section>
    </Page>
  );
}

function dashboardSummary({
  student,
  teacher,
  assignments,
  events,
  leaves,
  students,
  teachers,
}: {
  student: boolean;
  teacher: boolean;
  assignments: number;
  events: number;
  leaves: number;
  students: number;
  teachers: number;
}) {
  if (student) return `${assignments} assignment${assignments === 1 ? '' : 's'} and ${events} upcoming school event${events === 1 ? '' : 's'} are on your board.`;
  if (teacher) return `${leaves} leave request${leaves === 1 ? '' : 's'} pending, with ${events} upcoming event${events === 1 ? '' : 's'}.`;
  return `${students} students and ${teachers} teachers are represented in this school view.`;
}

function CampusStory({ event }: { event?: { id: string; title: string; start_date: string; audience: string } }) {
  if (!event) {
    return <EmptyState title="A clear day ahead" description="No upcoming events are scheduled." icon={FiCalendar} />;
  }

  return (
    <article aria-label="Campus story" className="relative min-h-64 overflow-hidden rounded-story bg-deep-olive shadow-lift sm:min-h-80">
      <img src="/brand/campus-1.jpg" alt="" width="654" height="305" className="h-full min-h-64 w-full object-cover sm:absolute sm:inset-0 sm:min-h-80" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-white/70">On the school calendar</p>
        <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-none tracking-[-0.025em] sm:text-4xl">{event.title}</h2>
        <p className="mt-3 text-sm text-white/80">{formatDateLong(event.start_date)} · {event.audience}</p>
      </div>
    </article>
  );
}

function EventsCard({ events }: { events: { id: string; title: string; start_date: string; audience: string }[] }) {
  return (
    <Card>
      <SectionHeading title="Upcoming events" description="Dates already published to the school calendar." action={<SectionLink to="/events">Open calendar</SectionLink>} />
      <div className="space-y-2.5">
        {events.map((event) => (
          <article key={event.id} className="flex items-start gap-3 rounded-campus border border-olive/10 bg-daylight/45 p-3.5">
            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[10px] bg-clay/65 text-terracotta-700">
              <span className="font-display text-lg font-semibold leading-none">{new Date(event.start_date).getDate()}</span>
              <span className="text-[0.58rem] font-bold uppercase tracking-wide">{new Date(event.start_date).toLocaleString('en', { month: 'short' })}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink">{event.title}</h3>
              <p className="mt-1 text-xs text-muted">{event.audience} · {relativeToToday(event.start_date)}</p>
            </div>
          </article>
        ))}
        {events.length === 0 && <EmptyState title="No upcoming events" description="Published dates will appear here." icon={FiCalendar} />}
      </div>
    </Card>
  );
}

function SectionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="focus-ring inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-xs font-bold text-deep-olive transition-colors hover:bg-leaf/35">
      {children} <FiArrowRight size={13} aria-hidden="true" />
    </Link>
  );
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
    <Link to={to} className={cn('surface-paper surface-interactive focus-ring group flex min-h-20 items-center gap-3 p-4')}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-leaf/45 text-deep-olive transition-colors group-hover:bg-olive group-hover:text-white">
        <Icon size={17} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-ink">{title}</span>
        <span className="mt-0.5 block truncate text-[0.68rem] text-muted">{sub}</span>
      </span>
      <FiArrowRight className="ml-auto shrink-0 text-olive/60" size={15} aria-hidden="true" />
    </Link>
  );
}
