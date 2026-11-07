import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApprovalsData } from '../lib/useApprovalsData';
import {
  Badge,
  Button,
  Card,
  Modal,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui';
import { formatDateLong, daysBetween } from '../lib/utils';

type LeaveStatus = 'pending' | 'approved' | 'rejected';

const LEAVE_TYPES = [
  'Sick Leave',
  'Casual Leave',
  'Medical Leave',
  'Emergency Leave',
  'Long Leave',
] as const;

const STATUS_VARIANT: Record<LeaveStatus, 'success' | 'danger' | 'pending'> = {
  approved: 'success',
  rejected: 'danger',
  pending: 'pending',
};

export default function Approvals() {
  const { profile } = useAuth();
  const data = useApprovalsData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    section_id: '',
    from_date: '',
    to_date: '',
    leave_type: 'Sick Leave' as (typeof LEAVE_TYPES)[number],
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const myLeaves = data.leaves.filter((l) => l.student_id === profile?.id);
  const canManage = profile?.role === 'admin' || profile?.role === 'teacher';

  // RLS scopes leave rows at the database level, so data.leaves already
  // contains only the rows this role may see (student: own; teacher: sections
  // they teach; admin: everything).
  const pendingInbox = data.leaves.filter((l) => l.status === 'pending');
  const history = data.leaves;

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.section_id || !form.from_date || !form.to_date) {
      data.notify('Choose section, start date and end date.');
      return;
    }
    if (daysBetween(form.from_date, form.to_date) < 0) {
      data.notify('The end date cannot be before the start date.');
      return;
    }
    if (!form.reason.trim()) {
      data.notify('Please give a short reason for the leave.');
      return;
    }
    setSaving(true);
    try {
      await data.applyForLeave({
        student_id: profile.id,
        section_id: form.section_id,
        from_date: form.from_date,
        to_date: form.to_date,
        session: 'Full day',
        leave_type: form.leave_type,
        reason: form.reason.trim(),
      });
      data.notify('Leave request submitted.');
      setForm({ section_id: '', from_date: '', to_date: '', leave_type: 'Sick Leave', reason: '' });
      setOpen(false);
    } catch (reason) {
      data.notify(reason instanceof Error ? reason.message : 'Could not apply for leave.');
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (id: string, status: Exclude<LeaveStatus, 'pending'>) => {
    if (!profile) return;
    setSaving(true);
    try {
      await data.reviewLeave({ leave_id: id, status });
      data.notify(`Leave ${status}.`);
    } catch (reason) {
      data.notify(reason instanceof Error ? reason.message : 'Could not review leave.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Approvals</h1>
          <p className="text-muted">
            {profile?.role === 'student'
              ? 'Apply for leave and track what your class teacher decides.'
              : 'Leave requests from your class. Approve or reject in one click.'}
          </p>
        </div>
        {profile?.role === 'student' && (
          <Button onClick={() => setOpen(true)}>Apply for leave</Button>
        )}
      </div>

      {data.loading && <p className="text-sm text-muted">Loading leave requests…</p>}

      {data.error && (
        <Card className="flex items-center gap-3 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" role="alert">
          <p className="text-sm text-red-700 dark:text-red-300">{data.error}</p>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => void data.refresh()}>
            Try again
          </Button>
        </Card>
      )}

      {profile?.role === 'student' && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-ink">Your leave requests</h3>
            <p className="text-sm text-muted">
              Reviewed by your class teacher.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {myLeaves.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>{leave.leave_type}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateLong(leave.start_date)}
                      {leave.end_date !== leave.start_date && ` → ${formatDateLong(leave.end_date)}`}
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-sm">{leave.reason}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[leave.status]}>{leave.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted">
                      {formatDateLong(leave.created_at.slice(0, 10))}
                    </TableCell>
                  </TableRow>
                ))}
                {myLeaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-4 text-center text-muted">
                      No leave requests yet. Use “Apply for leave” above.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {canManage && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Pending" value={data.summary.pending} tone="warning" />
            <MiniStat label="Approved" value={data.summary.approved} tone="success" />
            <MiniStat label="Rejected" value={data.summary.rejected} tone="danger" />
            <MiniStat label="Total requests" value={data.summary.total} tone="neutral" />
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-bold text-ink">Pending approvals</h3>
                <p className="text-sm text-muted">
                  {profile?.role === 'admin'
                    ? 'Every class, newest first.'
                    : 'Students in your class sections.'}
                </p>
              </div>
              <Badge variant={pendingInbox.length ? 'warning' : 'success'}>
                {pendingInbox.length} waiting
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead className="text-right">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {pendingInbox.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell>
                        <div className="font-medium text-ink">{leave.student_id}</div>
                      </TableCell>
                      <TableCell>{leave.leave_type}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateLong(leave.start_date)}
                        {leave.end_date !== leave.start_date && ` → ${formatDateLong(leave.end_date)}`}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm">{leave.reason}</TableCell>
                      <TableCell className="text-xs text-muted">
                        {formatDateLong(leave.created_at.slice(0, 10))}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleReview(leave.id, 'approved')}
                          disabled={saving}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(leave.id, 'rejected')}
                          disabled={saving}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingInbox.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-4 text-center text-muted">
                        No pending approvals.
                      </TableCell>
                    </TableRow>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-ink">Leave history</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Decided</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {history.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="text-sm">{leave.student_id}</TableCell>
                      <TableCell>{leave.leave_type}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDateLong(leave.start_date)}
                        {leave.end_date !== leave.start_date && ` → ${formatDateLong(leave.end_date)}`}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm">{leave.reason}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[leave.status]}>{leave.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted">
                        {leave.reviewed_at ? formatDateLong(leave.reviewed_at.slice(0, 10)) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="py-4 text-center text-muted">
                        No history yet.
                      </TableCell>
                    </TableRow>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {open && profile?.role === 'student' && (
        <Modal title="Apply for leave" onClose={() => setOpen(false)}>
          <p className="mb-3 text-sm text-muted">
            Your class teacher will review this request.
          </p>
          <form onSubmit={handleApply} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted">Section</label>
              <select
                value={form.section_id}
                onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              >
                <option value="">Select section</option>
                <option value="IX - E">IX - E</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted">Start date</label>
                <input
                  type="date"
                  value={form.from_date}
                  onChange={(e) => setForm({ ...form, from_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted">End date</label>
                <input
                  type="date"
                  value={form.to_date}
                  onChange={(e) => setForm({ ...form, to_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">Leave type</label>
              <select
                value={form.leave_type}
                onChange={(e) => setForm({ ...form, leave_type: e.target.value as typeof LEAVE_TYPES[number] })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              >
                {LEAVE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted">Reason</label>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Submitting…' : 'Apply for leave'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'warning' | 'success' | 'danger' | 'neutral';
}) {
  const toneClass = tone === 'warning'
    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
    : tone === 'success'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
      : tone === 'danger'
        ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-900'
        : 'border-slate-200 bg-slate-50 text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
  return (
    <Card padded={false} className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
        <div className={`rounded-lg px-3 py-1.5 text-xs font-medium ${toneClass}`}>
          {tone === 'warning' ? 'Pending' : tone === 'success' ? 'Approved' : tone === 'danger' ? 'Rejected' : 'Neutral'}
        </div>
      </div>
    </Card>
  );
}
