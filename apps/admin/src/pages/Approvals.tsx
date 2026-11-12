import { useCallback, useMemo, useState } from 'react';
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
import { FiCheckCircle, FiClock, FiX } from 'react-icons/fi';
import { cn, formatDateLong, daysBetween } from '../lib/utils';

type LeaveStatus = 'pending' | 'approved' | 'rejected';

const LEAVE_TYPES = [
  'Sick Leave',
  'Casual Leave',
  'Medical Leave',
  'Emergency Leave',
  'Long Leave',
] as const;

const STATUS_VARIANT: Record<LeaveStatus, 'success' | 'terracotta' | 'pending'> = {
  approved: 'success',
  rejected: 'terracotta',
  pending: 'pending',
};

export default function Approvals() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | LeaveStatus>('all');
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'Sick Leave' as (typeof LEAVE_TYPES)[number],
    reason: '',
  });

  const myLeaves = data.leaves.filter((l) => l.student_id === profile?.id);
  const canManage = isAdmin() || isTeacher();

  /**
   * A leave lands with the class teacher of the student's section. Admins see
   * everything. Teachers only see sections they are the class teacher for.
   */
  const inboxForMe = useMemo(() => {
    if (isAdmin()) return data.leaves;
    if (!isTeacher() || !profile) return [];
    const mySection = data.people.find((p) => p.id === profile.id)?.class_teacher_of;
    if (!mySection) return [];
    return data.leaves.filter((leave) => {
      const student = data.people.find((p) => p.id === leave.student_id);
      return student ? `${student.class_label} - ${student.section_label}` === mySection : false;
    });
  }, [data.leaves, data.people, isAdmin, isTeacher, profile]);

  const pendingInbox = inboxForMe.filter((l) => l.status === 'pending');
  const history = inboxForMe.filter((l) => (filter === 'all' ? true : l.status === filter));
  const studentProfile = data.people.find((person) => person.id === profile?.id);
  const studentSection = `${studentProfile?.class_label} - ${studentProfile?.section_label}`;
  const classTeacherName = data.people.find((person) => person.class_teacher_of === studentSection)?.full_name;
  const studentLeaveDescription = classTeacherName
    ? `Reviewed by ${classTeacherName}, your class teacher.`
    : 'Awaiting your class teacher.';
  const approvalDescription = isAdmin()
    ? 'Every class, newest first.'
    : `Students in ${data.people.find((person) => person.id === profile?.id)?.class_teacher_of ?? 'your class'}.`;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.start_date || !form.end_date) {
      data.notify('Choose both the start and end date.');
      return;
    }
    if (daysBetween(form.start_date, form.end_date) < 0) {
      data.notify('The end date cannot be before the start date.');
      return;
    }
    if (!form.reason.trim()) {
      data.notify('Please give a short reason for the leave.');
      return;
    }
    data.applyLeave({
      student_id: profile.id,
      start_date: form.start_date,
      end_date: form.end_date,
      leave_type: form.leave_type,
      reason: form.reason.trim(),
    });
    setForm({ start_date: '', end_date: '', leave_type: 'Sick Leave', reason: '' });
    setOpen(false);
  };

  const handleReview = useCallback(
    (id: string, status: Exclude<LeaveStatus, 'pending'>) => {
      if (!profile) return;
      data.reviewLeave(id, status, profile.id);
    },
    [data, profile],
  );

  return (
    <Page>
      <PageHeader
        eyebrow="Academic workflow"
        title={isStudent() ? 'My leaves' : 'Leave approvals'}
        description={isStudent()
          ? 'Apply for leave and track what your class teacher decides.'
          : 'Review leave requests routed to the responsible class teacher.'}
        meta={isStudent() ? `${myLeaves.length} requests` : `${pendingInbox.length} awaiting a decision`}
        actions={isStudent() ? <Button onClick={() => setOpen(true)}>Apply for leave</Button> : undefined}
      />

      {isStudent() && (
        <Card>
          <SectionHeading
            title="Your leave requests"
            description={studentLeaveDescription}
          />
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
                {myLeaves.length === 0 && <TableRow><TableCell colSpan={5}><EmptyState title="No leave requests yet" description="Use Apply for leave when you need time away." /></TableCell></TableRow>}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {canManage && (
        <>
          <MetricGrid>
            <StatCard label="Pending" value={pendingInbox.length} icon={FiClock} variant="warning" />
            <StatCard label="Approved" value={inboxForMe.filter((leave) => leave.status === 'approved').length} icon={FiCheckCircle} />
            <StatCard label="Rejected" value={inboxForMe.filter((leave) => leave.status === 'rejected').length} icon={FiX} variant="terracotta" />
            <StatCard label="Total requests" value={inboxForMe.length} icon={FiClock} variant="neutral" />
          </MetricGrid>

          <Card>
            <SectionHeading
              title="Pending approvals"
              description={approvalDescription}
              action={<Badge variant={pendingInbox.length ? 'terracotta' : 'success'}>
                {pendingInbox.length} waiting
              </Badge>}
            />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {pendingInbox.map((leave) => {
                    const student = data.people.find((p) => p.id === leave.student_id);
                    return (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div className="font-medium text-ink">{student?.full_name ?? '—'}</div>
                          <div className="text-xs text-muted">
                            {student?.class_label} {student?.section_label} · {student?.admission_no}
                          </div>
                        </TableCell>
                        <TableCell>{leave.leave_type}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateLong(leave.start_date)}
                          {leave.end_date !== leave.start_date && ` → ${formatDateLong(leave.end_date)}`}
                          <div className="text-xs text-muted">
                            {daysBetween(leave.start_date, leave.end_date) + 1} day
                            {daysBetween(leave.start_date, leave.end_date) === 0 ? '' : 's'}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[260px] text-sm">{leave.reason}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReview(leave.id, 'approved')}
                            >
                              <FiCheckCircle size={14} /> Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReview(leave.id, 'rejected')}
                            >
                              <FiX size={14} /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pendingInbox.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-muted">
                        Nothing waiting for you. Every request is handled.
                      </TableCell>
                    </TableRow>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>

          <Card>
            <SectionHeading title="Decision history" description="Approved and rejected requests remain visible for review." action={
              <div role="group" aria-label="Filter decision history" className="flex gap-1 rounded-full border border-border bg-parchment/55 p-1">
                {(['all', 'approved', 'rejected'] as const).map((key) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={cn(
                      'rounded-full px-3 text-xs font-bold capitalize transition-colors duration-150',
                      filter === key ? 'bg-forest text-paper shadow-sm' : 'text-muted hover:text-ink',
                    )}
                    aria-pressed={filter === key}
                  >
                    {key}
                  </button>
                ))}
              </div>
            } />
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reviewed by</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {history.map((leave) => {
                    const student = data.people.find((p) => p.id === leave.student_id);
                    const reviewer = data.people.find((p) => p.id === leave.reviewed_by);
                    return (
                      <TableRow key={leave.id}>
                        <TableCell>{student?.full_name ?? '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatDateLong(leave.start_date)}
                          {leave.end_date !== leave.start_date && ` → ${formatDateLong(leave.end_date)}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[leave.status]}>{leave.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {reviewer?.full_name ?? <span className="text-muted">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {history.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center text-muted">
                        No decisions recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {open && (
        <Modal title="Apply for leave" description="Your request is sent to your class teacher for a decision." onClose={() => setOpen(false)} size="sm">
            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label htmlFor="leave-type" className="field-label">Leave type</label>
                <select
                  id="leave-type"
                  value={form.leave_type}
                  onChange={(e) =>
                    setForm({ ...form, leave_type: e.target.value as (typeof LEAVE_TYPES)[number] })
                  }
                  className="field-control"
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="leave-start" className="field-label">Start date</label>
                  <input
                    id="leave-start"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="field-control"
                  />
                </div>
                <div>
                  <label htmlFor="leave-end" className="field-label">End date</label>
                  <input
                    id="leave-end"
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="field-control"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="leave-reason" className="field-label">Reason</label>
                <textarea
                  id="leave-reason"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  className="field-control"
                  placeholder="Doctor advised rest for two days…"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit for approval</Button>
              </div>
            </form>
        </Modal>
      )}
    </Page>
  );
}
