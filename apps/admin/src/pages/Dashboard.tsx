import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Profile } from '@schoolerp/shared';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import type { Homework, LeaveRequest, SchoolEvent } from '../lib/types';
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

type AppData = ReturnType<typeof useAppData>;

type DashboardStats = {
  students: number;
  teachers: number;
  pendingLeaves: LeaveRequest[];
  upcomingEvents: SchoolEvent[];
  dueFees: number;
  collected: number;
  billed: number;
  attendanceRate: number;
  unread: number;
};

type SharedDashboardProps = {
  profile: Profile | null;
  data: AppData;
  stats: DashboardStats;
  upcoming: SchoolEvent[];
  greeting: string;
};

export default function Dashboard() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useAppData();

  const mySection = data.people.find((person) => person.id === profile?.id)?.class_teacher_of ?? 'IX - E';

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
    return {
      students: students.length,
      teachers: teachers.length,
      pendingLeaves,
      upcomingEvents,
      dueFees,
      collected,
      billed,
      attendanceRate: teachingDays ? Math.round((presentDays / teachingDays) * 100) : 0,
      unread: data.notifications.filter((notification) => !notification.read).length,
    };
  }, [data, profile?.id]);

  const myAssignments = useMemo(() => {
    if (!isStudent()) return [];
    return data.homework.filter((homework) => {
      const student = data.people.find((person) => person.id === profile?.id);
      return homework.section_label === `${student?.class_label} - ${student?.section_label}`;
    });
  }, [data.homework, data.people, isStudent, profile?.id]);

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

  const shared = { profile, data, stats, upcoming, greeting };
  if (isStudent()) return <StudentDashboard {...shared} myAssignments={myAssignments} />;
  if (isTeacher()) return <TeacherDashboard {...shared} mySection={mySection} recentLeaves={recentLeaves} />;
  return <AdminDashboard {...shared} recentLeaves={recentLeaves} />;
}

function AdminDashboard({ profile, data, stats, upcoming, greeting, recentLeaves }: SharedDashboardProps & { recentLeaves: LeaveRequest[] }) {
  const collectedPercent = stats.billed ? Math.round((stats.collected / stats.billed) * 100) : 0;
  return (
    <Page>
      <PageHeader
        eyebrow={`${greeting}, ${firstName(profile)}`}
        title="School pulse"
        description={`${stats.students} students and ${stats.teachers} teachers are represented in the current school workspace.`}
        meta="Administrator view"
        actions={<DateCard />}
      />

      <MetricGrid>
        <StatCard label="Total students" value={stats.students} icon={FiUsers} />
        <StatCard label="Teaching staff" value={stats.teachers} icon={FiBookOpen} variant="terracotta" />
        <StatCard label="Leave approvals pending" value={stats.pendingLeaves.length} icon={FiAlertCircle} variant="warning" />
        <StatCard label="Fees collected" value={inr(stats.collected)} icon={FiCreditCard} variant="neutral" />
      </MetricGrid>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <section aria-labelledby="fee-collection-title" className="editorial-panel relative overflow-hidden p-6 sm:p-7 xl:col-span-7">
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border border-gold/10" aria-hidden="true" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gold">Finance overview</p>
                <h2 id="fee-collection-title" className="mt-2 font-display text-3xl font-medium text-paper">Fee collection</h2>
              </div>
              <Link to="/fees" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-paper/15 px-4 text-xs font-bold text-paper transition-colors duration-150 hover:bg-white/10">
                Open fees <FiArrowRight size={13} />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="font-display text-5xl font-medium leading-none text-gold">{collectedPercent}%</div>
                <div className="mt-2 text-sm text-paper/65">Collected {inr(stats.collected)} of {inr(stats.billed)}</div>
              </div>
              <div className="w-full max-w-sm">
                <div className="h-2 overflow-hidden rounded-full bg-paper/15" aria-label={`${collectedPercent}% of fees collected`} role="img">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, collectedPercent)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <EventStory event={upcoming[0]} className="xl:col-span-5" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <SectionHeading title="Requires attention" description="Latest leave requests across the school." action={<TextLink to="/approvals">All approvals</TextLink>} />
          <LeaveList leaves={recentLeaves} data={data} />
        </Card>
        <Card>
          <SectionHeading title="Upcoming school moments" description="The next entries on the shared calendar." action={<TextLink to="/events">Full calendar</TextLink>} />
          <EventList events={upcoming} />
        </Card>
      </div>

      <QuickLinks student={false} />
    </Page>
  );
}

function TeacherDashboard({ profile, data, stats, upcoming, greeting, mySection, recentLeaves }: SharedDashboardProps & { mySection: string; recentLeaves: LeaveRequest[] }) {
  const teacherAssignments = data.homework.filter((homework) => homework.teacher_id === profile?.id);
  return (
    <Page>
      <PageHeader
        eyebrow={`${greeting}, ${firstName(profile)}`}
        title="Class pulse"
        description={`A focused view of ${mySection}: approvals, class work and the next school moments.`}
        meta={`Class teacher · ${mySection}`}
        actions={<DateCard />}
      />

      <MetricGrid className="xl:grid-cols-3">
        <StatCard label="Leave approvals pending" value={stats.pendingLeaves.length} icon={FiAlertCircle} variant="warning" />
        <StatCard label="Assignments authored" value={teacherAssignments.length} icon={FiFileText} />
        <StatCard label="Upcoming events" value={upcoming.length} icon={FiCalendar} variant="terracotta" />
      </MetricGrid>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <SectionHeading title={`Leaves in ${mySection}`} description="Requests routed to this class teacher." action={<TextLink to="/approvals">Open approvals</TextLink>} />
          <LeaveList leaves={recentLeaves} data={data} />
        </Card>
        <EventStory event={upcoming[0]} className="xl:col-span-5" />
      </div>

      <Card>
        <SectionHeading title="Class assignments" description="Recently authored work for your sections." action={<TextLink to="/assignments">Assignment board</TextLink>} />
        {teacherAssignments.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {teacherAssignments.slice(0, 3).map((homework) => <AssignmentItem key={homework.id} homework={homework} teacherName={profile?.full_name} />)}
          </div>
        ) : <EmptyState title="No assignments authored" description="Your published class work will appear here." />}
      </Card>

      <QuickLinks student={false} />
    </Page>
  );
}

function StudentDashboard({ profile, data, stats, upcoming, greeting, myAssignments }: SharedDashboardProps & { myAssignments: Homework[] }) {
  return (
    <Page>
      <PageHeader
        eyebrow={`${greeting}, ${firstName(profile)}`}
        title="My day"
        description={`You have ${myAssignments.length} assignment${myAssignments.length === 1 ? '' : 's'} on the board and ${stats.upcomingEvents.length} upcoming school events.`}
        meta={`Admission ${profile?.login_id ?? '—'}`}
        actions={<DateCard />}
      />

      <MetricGrid>
        <StatCard label="Attendance this month" value={`${stats.attendanceRate}%`} icon={FiCheckCircle} />
        <StatCard label="Assignments pending" value={myAssignments.length} icon={FiFileText} variant="terracotta" />
        <StatCard label="Fee due" value={inr(stats.dueFees)} icon={FiCreditCard} variant="warning" />
        <StatCard label="Notifications" value={stats.unread} icon={FiBell} variant="neutral" />
      </MetricGrid>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <SectionHeading title="Homework & assignments" description="Work posted for your section." action={<TextLink to="/assignments">Open board</TextLink>} />
          {myAssignments.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {myAssignments.slice(0, 4).map((homework) => {
                const teacher = data.people.find((person) => person.id === homework.teacher_id);
                return <AssignmentItem key={homework.id} homework={homework} teacherName={teacher?.full_name} />;
              })}
            </div>
          ) : <EmptyState title="No assignments posted" description="New work for your section will appear here." />}
        </Card>
        <EventStory event={upcoming[0]} className="xl:col-span-5" />
      </div>

      <QuickLinks student />
    </Page>
  );
}

function DateCard() {
  return (
    <div className="min-w-52 rounded-heritage border border-border bg-parchment/55 px-4 py-3">
      <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-moss">School calendar</div>
      <div className="mt-0.5 font-display text-lg font-medium text-ink">{formatDateLong('2026-11-04')}</div>
      <div className="text-[10px] font-semibold text-muted">Academic year 2026–27</div>
    </div>
  );
}

function EventStory({ event, className }: { event?: SchoolEvent; className?: string }) {
  if (!event) return <EmptyState className={className} title="No upcoming events" description="The shared calendar has no future entries." />;
  return (
    <section aria-labelledby={`event-${event.id}`} className={cn('surface-paper hover-lift relative flex min-h-64 flex-col overflow-hidden p-6 sm:p-7', className)}>
      <div className="absolute right-5 top-4 font-display text-7xl font-medium leading-none text-gold/45" aria-hidden="true">{new Date(event.start_date).getDate()}</div>
      <p className="relative text-[10px] font-extrabold uppercase tracking-[0.18em] text-moss">Next on the calendar</p>
      <div className="relative mt-auto max-w-md pt-20">
        <Badge variant="olive">{event.audience}</Badge>
        <h2 id={`event-${event.id}`} className="mt-3 font-display text-3xl font-medium leading-tight text-ink">{event.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{formatDateLong(event.start_date)} · {relativeToToday(event.start_date)}</p>
        <TextLink to="/events" className="mt-4">View calendar</TextLink>
      </div>
    </section>
  );
}

function LeaveList({ leaves, data }: { leaves: LeaveRequest[]; data: AppData }) {
  if (leaves.length === 0) return <EmptyState title="No leave requests" description="Requests will appear here when submitted." />;
  return (
    <div className="divide-y divide-border">
      {leaves.map((leave) => {
        const student = data.people.find((person) => person.id === leave.student_id);
        return (
          <div key={leave.id} className="flex flex-wrap items-center gap-3 py-3.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-ink">{student?.full_name ?? '—'}</div>
              <div className="mt-0.5 text-xs leading-5 text-muted">{leave.leave_type} · {formatDateLong(leave.start_date)} → {formatDateLong(leave.end_date)}</div>
            </div>
            <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'terracotta' : 'warning'}>{leave.status}</Badge>
          </div>
        );
      })}
    </div>
  );
}

function EventList({ events }: { events: SchoolEvent[] }) {
  if (events.length === 0) return <EmptyState title="No upcoming events" description="Published calendar entries will appear here." />;
  return (
    <div className="divide-y divide-border">
      {events.map((event) => (
        <div key={event.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-forest text-gold">
            <span className="font-display text-lg font-medium leading-none">{new Date(event.start_date).getDate()}</span>
            <span className="text-[8px] font-extrabold uppercase tracking-wider">{new Date(event.start_date).toLocaleString('en', { month: 'short' })}</span>
          </div>
          <div className="min-w-0 pt-0.5">
            <div className="text-sm font-bold text-ink">{event.title}</div>
            <div className="mt-0.5 text-xs text-muted">{event.audience} · {relativeToToday(event.start_date)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AssignmentItem({ homework, teacherName }: { homework: Homework; teacherName?: string }) {
  return (
    <div className="rounded-heritage border border-border bg-parchment/35 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-bold text-ink">{homework.title}</div>
        <Badge variant={homework.type === 'HOMEWORK' ? 'olive' : 'terracotta'}>{homework.type}</Badge>
      </div>
      <div className="mt-2 text-xs leading-5 text-muted">
        {homework.subject}{teacherName ? ` · ${teacherName}` : ''} · due {formatDateLong(homework.due_date)}
      </div>
    </div>
  );
}

function QuickLinks({ student }: { student: boolean }) {
  return (
    <section aria-labelledby="quick-actions-title">
      <SectionHeading title="Quick actions" description="Open the areas used most often." />
      <div className="stagger-grid grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QuickLink to="/assignments" icon={FiFileText} title="Assignments" sub="Homework board" />
        <QuickLink to="/attendance" icon={FiClipboard} title="Attendance" sub={student ? 'My register' : 'Mark today'} />
        <QuickLink to="/library" icon={FiBookOpen} title="Library" sub="Books & issues" />
        <QuickLink to="/fees" icon={FiCreditCard} title={student ? 'My fee' : 'Fee collection'} sub="Invoices" />
      </div>
    </section>
  );
}

function QuickLink({ to, icon: Icon, title, sub }: { to: string; icon: React.ElementType; title: string; sub: string }) {
  return (
    <Link to={to} className="surface-paper hover-lift group flex min-h-20 items-center gap-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-gold transition-colors duration-150 group-hover:bg-gold group-hover:text-forest" aria-hidden="true"><Icon size={17} /></span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-extrabold text-ink">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">{sub}</span>
      </span>
      <FiArrowRight className="ml-auto shrink-0 text-moss" size={14} aria-hidden="true" />
    </Link>
  );
}

function TextLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return <Link to={to} className={cn('inline-flex min-h-10 items-center gap-1.5 text-xs font-extrabold text-forest underline decoration-gold underline-offset-4', className)}>{children} <FiArrowRight size={12} aria-hidden="true" /></Link>;
}

function firstName(profile: Profile | null) {
  return profile?.full_name?.split(' ')[0] ?? 'there';
}
