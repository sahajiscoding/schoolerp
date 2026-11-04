import { useState, useMemo } from 'react';
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
} from '../components/ui';
import { FiCalendar, FiPlus, FiAlertCircle } from 'react-icons/fi';

type EventType = 'holiday' | 'event' | 'exam' | 'meeting';

const TYPE_LABEL: Record<EventType, string> = {
  holiday: 'Holiday',
  event: 'Event',
  exam: 'Exam',
  meeting: 'Meeting',
};

const TYPE_COLOR: Record<EventType, string> = {
  holiday: 'terracotta',
  event: 'olive',
  exam: 'terracotta',
  meeting: 'olive',
};

export default function Events() {
  const { profile, isAdmin, isTeacher } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'event' as EventType,
    start_date: '',
    end_date: '',
    audience: 'Whole school',
  });

  const canManage = isAdmin() || isTeacher();

  const events = useMemo(() => {
    return [...data.events].sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    );
  }, [data.events]);

  const today = new Date().toISOString().slice(0, 10);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.addEvent({
      title: form.title,
      description: form.description,
      type: form.type,
      start_date: form.start_date,
      end_date: form.end_date,
      audience: form.audience,
      created_by: profile.id,
    });
    setForm({ title: '', description: '', type: 'event', start_date: '', end_date: '', audience: 'Whole school' });
    setOpen(false);
  };

  const upcoming = events.filter((e) => new Date(e.end_date) >= new Date(today)).slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Events & Calendars</h1>
          <p className="text-muted">
            School events and holidays. {canManage ? 'Admins update all; teachers can update class-only events.' : ''}
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> Add event
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-ink">Upcoming events</h3>
          </div>
          <div className="space-y-2">
            {upcoming.map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg border border-sand/20 hover:bg-sand/50 transition-colors">
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-olive/5 text-olive font-bold text-xs leading-tight text-center">
                  {new Date(ev.start_date).getDate()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-ink">{ev.title}</span>
                    <Badge variant={TYPE_COLOR[ev.type as EventType]} className="text-[10px]">
                      {TYPE_LABEL[ev.type as EventType]}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted">
                    {ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} – ${ev.end_date}`}
                    &nbsp;·&nbsp; {ev.audience}
                  </div>
                  {ev.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{ev.description}</p>
                  )}
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <div className="text-center text-muted py-8">
                <FiAlertCircle size={24} className="mx-auto mb-2 opacity-50" />
                <div>No upcoming events.</div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-ink">All events</h3>
            <p className="text-muted text-sm">{events.length} total</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Audience</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {events.map((ev) => (
                  <TableRow key={ev.id}>
                    <TableCell>{ev.title}</TableCell>
                    <TableCell>
                      <Badge variant={TYPE_COLOR[ev.type as EventType]}>
                        {TYPE_LABEL[ev.type as EventType]}
                      </Badge>
                    </TableCell>
                    <TableCell>{ev.start_date === ev.end_date ? ev.start_date : `${ev.start_date} – ${ev.end_date}`}</TableCell>
                    <TableCell className="text-sm">{ev.audience}</TableCell>
                  </TableRow>
                ))}
                {events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted py-4">
                      No events yet.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        {canManage && open && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 lg:hidden">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
              <h2 className="text-lg font-bold text-ink mb-4">Add event</h2>
              <form onSubmit={handleAdd} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {Object.entries(TYPE_LABEL).map(([k, v]) => (
                      <option key={k} value={k as EventType}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">Start date</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1">End date</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="Whole school">Whole school</option>
                    <option value="Grades IX-XII">Grades IX-XII</option>
                    <option value="Section E">Section E</option>
                    <option value="Class only">Class only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Add event</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
