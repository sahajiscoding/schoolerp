import { useMemo } from 'react';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, BookText, CalendarDays, Clock, UserRound } from 'lucide-react';
import {
  FiAlertCircle,
  FiArrowRight,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiUsers,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import { expandDashboardEvents, type DashboardEvent } from '../lib/dashboard';
import { Badge, Card, StatCard } from '../components/ui';
import { cn, formatDateLong, initials, inr, relativeToToday } from '../lib/utils';

function greetingAt(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Dashboard() {
  const { profile, isAdmin, isStudent } = useAuth();
  const data = useAppData();
  const now = useMemo(() => new Date(), []);
  const admin = isAdmin();
  const student = isStudent();
  const me = data.people.find((person) => person.id === profile?.id);
  const mySection = me?.class_teacher_of ?? 'IX - E';

  const studentEvents = useMemo(() => expandDashboardEvents(data.events, now), [data.events, now]);
  const upcoming = useMemo(
    () =>
      [...data.events]
        .filter((event) => event.end_date >= format(now, 'yyyy-MM-dd'))
        .sort((a, b) => a.start_date.localeCompare(b.start_date))
        .slice(0, 4),
    [data.events, now],
  );

  const stats = useMemo(() => {
    const students = data.people.filter((person) => person.role === 'student');
    const teachers = data.people.filter((person) => person.role === 'teacher');
    const pendingLeaves = data.leaves.filter((leave) => leave.status === 'pending');
    const collected = data.fees.reduce((sum, fee) => sum + fee.paid, 0);
    const billed = data.fees.reduce((sum, fee) => sum + fee.amount - fee.discount, 0);
    return { students: students.length, teachers: teachers.length, pendingLeaves, collected, billed };
  }, [data]);

  const recentLeaves = useMemo(() => {
    const scoped = admin
      ? data.leaves
      : data.leaves.filter((leave) => {
          const leaveStudent = data.people.find((person) => person.id === leave.student_id);
          return `${leaveStudent?.class_label} - ${leaveStudent?.section_label}` === mySection;
        });
    return [...scoped].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4);
  }, [admin, data.leaves, data.people, mySection]);

  if (student) {
    return (
      <StudentDashboard
        name={profile?.full_name ?? 'Student'}
        loginId={profile?.login_id ?? ''}
        now={now}
        events={studentEvents}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-primary/10 bg-gradient-to-br from-brand-primary to-olive-700 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/60">
              {admin ? 'Administrator' : `Class teacher · ${mySection}`}
            </div>
            <h1 className="mt-1 text-2xl font-bold">
              {greetingAt(now)}, {profile?.full_name?.split(' ')[0] ?? 'there'}.
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/70">
              {admin
                ? `${stats.students} students, ${stats.teachers} teachers. ${stats.pendingLeaves.length} leave approvals pending across the school.`
                : `${stats.pendingLeaves.length} leave request${stats.pendingLeaves.length === 1 ? '' : 's'} waiting on you. ${upcoming.length} events this month.`}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3 text-right backdrop-blur">
            <div className="text-[10px] uppercase tracking-wider text-white/60">Today</div>
            <div className="text-sm font-semibold">{formatDateLong(format(now, 'yyyy-MM-dd'))}</div>
            <div className="text-[10px] text-white/60">Academic year 2026-27</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {admin && <StatCard label="Total students" value={stats.students} icon={FiUsers} />}
        {admin && <StatCard label="Teaching staff" value={stats.teachers} icon={FiBookOpen} variant="terracotta" />}
        <StatCard
          label="Leave approvals pending"
          value={stats.pendingLeaves.length}
          icon={FiAlertCircle}
          variant="warning"
        />
        {admin ? (
          <StatCard label="Fees collected" value={inr(stats.collected)} icon={FiCreditCard} variant="neutral" />
        ) : (
          <StatCard label="Upcoming events" value={upcoming.length} icon={FiCalendar} variant="terracotta" />
        )}
      </div>

      {admin && (
        <Card>
          <SectionHeading title="Fee collection" action={<Link to="/fee-collections/create">Open fees</Link>} />
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-muted">
              Collected {inr(stats.collected)} of {inr(stats.billed)}
            </span>
            <span className="font-semibold text-brand-primary">
              {stats.billed ? Math.round((stats.collected / stats.billed) * 100) : 0}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-2.5 rounded-full bg-brand-primary transition-all"
              style={{ width: `${stats.billed ? Math.min(100, (stats.collected / stats.billed) * 100) : 0}%` }}
            />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <SectionHeading title={admin ? 'Latest leave requests' : `Leaves in ${mySection}`} action={<Link to="/approvals">Approvals</Link>} />
          <div className="space-y-2">
            {recentLeaves.map((leave) => {
              const leaveStudent = data.people.find((person) => person.id === leave.student_id);
              return (
                <div key={leave.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-brand-foreground dark:text-slate-50">{leaveStudent?.full_name ?? '—'}</div>
                    <div className="text-xs text-muted">
                      {leave.leave_type} · {formatDateLong(leave.start_date)} → {formatDateLong(leave.end_date)}
                    </div>
                  </div>
                  <Badge variant={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}>
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
            {upcoming.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-accent/10 text-brand-primary">
                  <span className="text-sm font-bold leading-none">{parseISO(event.start_date).getDate()}</span>
                  <span className="text-[9px] uppercase">{format(parseISO(event.start_date), 'MMM')}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-brand-foreground dark:text-slate-50">{event.title}</div>
                  <div className="text-xs text-muted">
                    {event.audience} · {relativeToToday(event.start_date)}
                  </div>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && <Empty>No upcoming events.</Empty>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickLink to="/homeworks" icon={BookText} title="Assignments" sub="Homework board" />
        <QuickLink to="/my-attendance" icon={FiClipboard} title="Attendance" sub="Mark today" />
        <QuickLink to="/my-library" icon={FiBookOpen} title="Library" sub="Books & issues" />
        <QuickLink to="/fee-collections/create" icon={FiCreditCard} title="Fee collection" sub="Invoices" />
      </div>
    </div>
  );
}

function StudentDashboard({
  name,
  loginId,
  now,
  events,
}: {
  name: string;
  loginId: string;
  now: Date;
  events: DashboardEvent[];
}) {
  return (
    <div className="w-full">
      <div className="gap-8">
        <section className="pws-dashboard-hero relative overflow-hidden rounded-2xl border border-brand-primary/25 shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand-primary/45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full bg-brand-hoverText/40 blur-3xl" />

          <div className="relative grid items-stretch gap-5 md:p-3 lg:grid-cols-[minmax(200px,2.6fr)_minmax(0,7fr)]">
            <div className="flex min-h-[189px] flex-col justify-between rounded-2xl border border-slate-200/70 bg-white/90 p-5 text-brand-foreground shadow-lg ring-1 ring-slate-200/40 backdrop-blur-md dark:border-white/10 dark:bg-brand-dark/75 dark:text-slate-50 dark:ring-white/5">
              <div>
                <div className="mb-5 flex items-start gap-4">
                  <div className="relative shrink-0">
                    <span
                      className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-primary/10 text-2xl font-bold text-brand-primary shadow-md ring-2 ring-brand-primary/40 dark:border-slate-800 dark:text-olive-300"
                      aria-label={`${name} avatar`}
                    >
                      {initials(name)}
                    </span>
                    <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-emerald-500 p-1 text-white shadow-sm dark:border-slate-800">
                      <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="min-w-0 pt-1">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary dark:text-olive-300">
                      {greetingAt(now)},
                    </p>
                    <h1 className="text-xl font-bold uppercase leading-tight text-brand-foreground dark:text-slate-50" title={name}>
                      {name}
                    </h1>
                    <span className="mt-2 inline-flex max-w-full items-center rounded-full bg-brand-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                      <span className="truncate">Student</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 text-sm text-slate-500 dark:text-slate-400">
                  <CalendarDays className="h-4 w-4 text-brand-primary dark:text-olive-300" aria-hidden="true" />
                  <span className="font-semibold text-brand-primary dark:text-olive-300">{format(now, 'MMMM yyyy')}</span>
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-brand-primary dark:text-olive-300" aria-hidden="true" />
                    <span className="truncate">ID: {loginId}</span>
                  </span>
                </div>
              </div>
              <Link
                to="/profile"
                className="group mt-5 inline-flex w-full max-w-[275px] items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-foreground transition-all duration-200 hover:border-brand-primary/40 hover:bg-brand-primary/5 hover:text-brand-primary hover:shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-50 dark:hover:border-brand-primary/40 dark:hover:bg-slate-800 dark:hover:text-olive-300"
              >
                <span>View Profile</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="min-h-[198px] min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-4 text-brand-foreground shadow-lg ring-1 ring-slate-200/40 backdrop-blur-md dark:border-white/10 dark:bg-brand-dark/75 dark:text-slate-50 dark:ring-white/5 md:p-5">
              <div className="flex h-full min-h-0 flex-col overflow-hidden">
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="rounded-xl bg-brand-primary p-2 text-white shadow-sm">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-bold text-brand-foreground dark:text-slate-50 md:text-lg">Recent &amp; frequent actions</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Continue where you left off</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex h-[91px] min-w-0 items-center justify-center rounded-xl border border-dashed border-brand-primary/20 bg-slate-100/40 px-6 text-center transition-transform motion-safe:hover:-translate-y-1 dark:border-white/15 dark:bg-slate-800/50">
                    <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                      Your four most recently clicked menu actions will appear here.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto p-8 md:p-0">
          <section className="relative mt-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <UpcomingEvents events={events} now={now} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function UpcomingEvents({ events, now }: { events: DashboardEvent[]; now: Date }) {
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white via-white to-gray-50/50 p-4 shadow-xl backdrop-blur-sm transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-2xl">
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-gradient-to-br from-brand-primary/5 to-transparent opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-75" />
      <div className="relative z-10 mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative rounded-xl bg-gradient-to-br from-brand-primary via-brand-primary/90 to-brand-primary/80 p-2 text-white shadow-lg transition-all duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-3">
            <CalendarDays className="relative h-5 w-5" aria-hidden="true" />
          </div>
          <h3 className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-base font-bold text-transparent">
            Upcoming Events
          </h3>
        </div>
        <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/10 px-3 py-1 text-xs font-bold text-brand-primary shadow-sm dark:text-olive-300">
          {events.length}
        </span>
      </div>

      <div className="dashboard-scrollbar relative z-10 max-h-60 flex-1 space-y-2 overflow-y-auto pr-2">
        {events.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-slate-500">
            No upcoming events.
          </div>
        ) : (
          events.map((event) => {
            const daysAway = differenceInCalendarDays(parseISO(event.display_date), now);
            return (
              <EventRow
                key={`${event.id}-${event.display_date}`}
                event={event}
                daysAway={daysAway}
                featured={daysAway === 0}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function EventRow({ event, daysAway, featured }: { event: DashboardEvent; daysAway: number; featured: boolean }) {
  return (
    <div
      className={cn(
        'group/event relative overflow-hidden rounded-xl border-2 p-3 transition-all duration-300',
        featured
          ? 'border-orange-400 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-lg hover:shadow-xl'
          : 'border-gray-200 bg-white/80 backdrop-blur-sm hover:border-orange-300/50 hover:bg-gradient-to-br hover:from-orange-50/50 hover:to-transparent',
      )}
    >
      {featured && <div className="pws-event-pulse absolute inset-0 animate-pulse bg-gradient-to-r from-orange-200/30 via-amber-200/30 to-yellow-200/30" />}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2.5">
            <div
              className={cn(
                'rounded-lg p-1.5 transition-all duration-300',
                featured
                  ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 group-hover/event:bg-orange-100 group-hover/event:text-orange-600',
              )}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </div>
            <p className="truncate text-sm font-bold text-gray-900 transition-colors group-hover/event:text-orange-700">
              {event.title}
            </p>
          </div>
          <p className="ml-8 mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {event.description}
          </p>
          <div className="ml-8 mt-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex rounded-lg border px-3 py-1 text-xs font-semibold shadow-sm',
                event.type === 'holiday'
                  ? 'border-red-200 bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
                  : 'border-gray-200 bg-gray-100 text-gray-700',
              )}
            >
              {event.type}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {event.start_date} - {event.end_date}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {daysAway === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-all duration-300 motion-safe:hover:scale-105 hover:shadow-xl">
              ⚡ Today!
            </span>
          ) : (
            <span className="inline-flex rounded-lg border border-gray-200 bg-gradient-to-br from-gray-100 to-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 transition-all duration-300 group-hover/event:border-orange-300/50 group-hover/event:from-orange-100 group-hover/event:to-orange-50 group-hover/event:text-orange-700">
              {daysAway} {daysAway === 1 ? 'day' : 'days'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-base font-bold text-brand-foreground dark:text-slate-50">{title}</h3>
      {action && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary [&_a]:inline-flex [&_a]:items-center [&_a]:gap-1 [&_a]:hover:underline dark:text-olive-300">
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
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 transition-all motion-safe:hover:-translate-y-0.5 hover:border-brand-primary/20 hover:shadow-md dark:border-brand-darkBorder dark:bg-brand-dark"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/5 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white dark:text-olive-300">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-brand-foreground dark:text-slate-50">{title}</span>
        <span className="block truncate text-[10px] text-muted">{sub}</span>
      </span>
    </Link>
  );
}
