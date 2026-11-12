import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
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
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { FiAlertCircle, FiCalendar, FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';
import { cn, formatRange } from '../lib/utils';

type EventType = 'holiday' | 'event' | 'exam' | 'meeting';

const TYPE_LABEL: Record<EventType, string> = {
  holiday: 'Holiday',
  event: 'Event',
  exam: 'Exam',
  meeting: 'Meeting',
};

const TYPE_COLOR: Record<EventType, 'terracotta' | 'olive' | 'warning' | 'default'> = {
  holiday: 'terracotta',
  event: 'olive',
  exam: 'warning',
  meeting: 'default',
};

const TYPE_DOT: Record<EventType, string> = {
  holiday: 'bg-terracotta',
  event: 'bg-olive',
  exam: 'bg-amber-500',
  meeting: 'bg-slate-400',
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function Events() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState({ year: 2026, month: 10 });
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'event' as EventType,
    start_date: '',
    end_date: '',
    audience: isAdmin() ? 'Whole school' : 'Class only',
  });

  /** Teachers may only publish inside their own section; admins own the calendar. */
  const canManage = isAdmin() || isTeacher();
  const teacherSection =
    data.people.find((p) => p.id === profile?.id)?.class_teacher_of ?? 'IX - E';

  const studentView = isStudent();
  const mySectionLabel = (() => {
    const me = data.people.find((p) => p.id === profile?.id);
    return me?.class_label && me?.section_label ? `${me.class_label} - ${me.section_label}` : undefined;
  })();

  const events = useMemo(() => {
    const visible = data.events.filter((ev) => {
      // Students see whole-school events plus their own class's "Class only"
      // events; admins and teachers see the full calendar.
      if (!studentView) return true;
      if (ev.audience !== 'Class only') return true;
      return !!ev.section_label && ev.section_label === mySectionLabel;
    });
    return visible.sort((a, b) => a.start_date.localeCompare(b.start_date));
  }, [data.events, studentView, mySectionLabel]);

  const todayIso = '2026-11-04';
  const upcoming = events.filter((e) => e.end_date >= todayIso).slice(0, 8);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim() || !form.start_date) {
      data.notify('An event needs a title and a start date.');
      return;
    }
    const audience = isAdmin() ? form.audience : 'Class only';
    if (!isAdmin() && audience !== 'Class only') {
      data.notify('Teachers can only publish events for their own class.');
      return;
    }
    data.addEvent({
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date || form.start_date,
      audience,
      section_label: audience === 'Class only' ? teacherSection : undefined,
      created_by: profile.id,
    });
    setForm({
      title: '',
      description: '',
      type: 'event',
      start_date: '',
      end_date: '',
      audience: isAdmin() ? 'Whole school' : 'Class only',
    });
    setOpen(false);
  };

  /* ---------------------------------------------------------------- calendar */
  const firstDay = new Date(cursor.year, cursor.month, 1);
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const leading = (firstDay.getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsOn = (day: number) => {
    const isoDate = `${cursor.year}-${`${cursor.month + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
    return events.filter((ev) => isoDate >= ev.start_date && isoDate <= ev.end_date);
  };

  const shiftMonth = (delta: number) => {
    setCursor(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  };

  return (
    <Page>
      <PageHeader
        eyebrow="School calendar"
        title="Events & calendars"
        description={isAdmin()
              ? 'School-wide holidays, exams and meetings. Only admins publish to the whole school.'
              : isTeacher()
                ? `Class events for ${teacherSection}. School-wide events come from the admin.`
                : 'Holidays, exams and school events for the year.'}
        meta={`${events.length} calendar entries`}
        actions={canManage ? (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> {isAdmin() ? 'Add event' : 'Add class event'}
          </Button>
        ) : undefined}
      />

      <MetricGrid className="xl:grid-cols-3">
        <StatCard label="Calendar entries" value={events.length} icon={FiCalendar} />
        <StatCard label="Upcoming" value={upcoming.length} icon={FiChevronRight} variant="neutral" />
        <StatCard label="Event types" value={new Set(events.map((event) => event.type)).size} icon={FiCalendar} variant="terracotta" />
      </MetricGrid>

      <section aria-label="School calendar" className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <SectionHeading title={`${MONTH_NAMES[cursor.month]} ${cursor.year}`} description="Month view" action={
            <div className="flex items-center gap-1">
              <button
                onClick={() => shiftMonth(-1)}
                className="focus-ring touch-target inline-flex items-center justify-center rounded-full border border-border text-muted hover:bg-parchment hover:text-ink"
                aria-label="Previous month"
              >
                <FiChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCursor({ year: 2026, month: 10 })}
                className="focus-ring min-h-11 rounded-full border border-border px-3 text-xs font-bold text-muted hover:bg-parchment hover:text-ink"
              >
                Today
              </button>
              <button
                onClick={() => shiftMonth(1)}
                className="focus-ring touch-target inline-flex items-center justify-center rounded-full border border-border text-muted hover:bg-parchment hover:text-ink"
                aria-label="Next month"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          } />
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="pb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
                {d}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} />;
              const dayEvents = eventsOn(day);
              const isoDate = `${cursor.year}-${`${cursor.month + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
              const isToday = isoDate === todayIso;
              return (
                <div
                  key={day}
                  className={cn(
                    'min-h-[68px] rounded-xl border p-1.5 text-left sm:min-h-[76px]',
                    isToday ? 'border-moss bg-moss/10' : 'border-border',
                    dayEvents.length > 0 && !isToday && 'bg-parchment/45',
                  )}
                >
                  <div
                    className={cn(
                      'text-xs',
                       isToday ? 'font-bold text-moss' : 'text-muted',
                    )}
                  >
                    {day}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center gap-1 truncate text-[9px] leading-tight text-ink"
                        title={`${ev.title} · ${TYPE_LABEL[ev.type as EventType]}`}
                      >
                        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TYPE_DOT[ev.type as EventType])} aria-hidden="true" />
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-muted">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-muted">
            {(Object.keys(TYPE_LABEL) as EventType[]).map((t) => (
              <span key={t} className="inline-flex items-center gap-1">
                <span className={cn('h-2 w-2 rounded-full', TYPE_DOT[t])} aria-hidden="true" /> {TYPE_LABEL[t]}
              </span>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHeading title="Upcoming" description="The next entries across the visible calendar." />
          <div className="space-y-2">
            {upcoming.map((ev) => {
              const start = new Date(ev.start_date);
              return (
                <div
                  key={ev.id}
                   className="flex items-start gap-3 rounded-xl border border-border bg-parchment/25 p-3"
                >
                   <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-forest text-gold">
                    <span className="text-sm font-bold leading-none">{start.getDate()}</span>
                    <span className="text-[9px] uppercase">
                      {MONTH_NAMES[start.getMonth()].slice(0, 3)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-2">
                       <span className="text-sm font-bold text-ink">{ev.title}</span>
                      <Badge variant={TYPE_COLOR[ev.type as EventType]}>
                        {TYPE_LABEL[ev.type as EventType]}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted">
                      {formatRange(ev.start_date, ev.end_date)} · {ev.audience}
                    </div>
                    {ev.description && ev.description !== ev.title && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{ev.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <EmptyState title="No upcoming events" icon={FiAlertCircle} />
            )}
          </div>
        </Card>
      </section>

      <Card>
        <SectionHeading title="All events" description={`${events.length} entries on the calendar`} />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Added by</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {events.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell className="font-bold">{ev.title}</TableCell>
                  <TableCell>
                    <Badge variant={TYPE_COLOR[ev.type as EventType]}>
                      {TYPE_LABEL[ev.type as EventType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatRange(ev.start_date, ev.end_date)}
                  </TableCell>
                  <TableCell className="text-sm">{ev.audience}</TableCell>
                  <TableCell className="text-sm text-muted">
                    {data.people.find((p) => p.id === ev.created_by)?.full_name ?? 'Admin'}
                  </TableCell>
                </TableRow>
              ))}
              {events.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-4 text-center text-muted">
                    No events yet.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {canManage && open && (
        <Modal
          title={isAdmin() ? 'Add event' : 'Add class event'}
          description={isAdmin()
                ? 'Only admins can publish school-wide holidays and exams.'
                : `Teachers can publish for ${teacherSection} only.`}
          onClose={() => setOpen(false)}
          size="sm"
        >
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label htmlFor="event-title" className="field-label">Title</label>
                <input
                  id="event-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="field-control"
                  placeholder="Unit test — Mathematics"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="event-type" className="field-label">Type</label>
                  <select
                    id="event-type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                    className="field-control"
                  >
                    {(Object.keys(TYPE_LABEL) as EventType[]).map((k) => (
                      <option key={k} value={k}>
                        {TYPE_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="event-audience" className="field-label">Audience</label>
                  {isAdmin() ? (
                    <select
                      value={form.audience}
                      id="event-audience"
                      onChange={(e) => setForm({ ...form, audience: e.target.value })}
                      className="field-control"
                    >
                      <option value="Whole school">Whole school</option>
                      <option value="Grades IX-XII">Grades IX-XII</option>
                      <option value="Section E">Section E</option>
                      <option value="Class only">Class only</option>
                    </select>
                  ) : (
                    <input
                      value={teacherSection}
                      id="event-audience"
                      readOnly
                      className="field-control"
                    />
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="event-start" className="field-label">Start date</label>
                  <input
                    id="event-start"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="field-control"
                  />
                </div>
                <div>
                  <label htmlFor="event-end" className="field-label">End date</label>
                  <input
                    id="event-end"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="field-control"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="event-description" className="field-label">Description</label>
                <textarea
                  id="event-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="field-control"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add to calendar</Button>
              </div>
            </form>
        </Modal>
      )}
    </Page>
  );
}
