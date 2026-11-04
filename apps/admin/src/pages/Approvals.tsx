import { useState, useCallback } from 'react';
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
import { FiCheckCircle, FiX } from 'react-icons/fi';

type LeaveStatus = 'pending' | 'approved' | 'rejected';

export default function Approvals() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'Sick Leave' as const,
    reason: '',
  });

  const myLeaves = data.leaves.filter(
    (l) => l.student_id === profile?.id,
  );
  const pendingForMe = data.leaves.filter(
    (l) => l.status === 'pending' && (isAdmin() || isTeacher()),
  );

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.applyLeave({
      student_id: profile.id,
      start_date: form.start_date,
      end_date: form.end_date,
      leave_type: form.leave_type,
      reason: form.reason,
    });
    setForm({ start_date: '', end_date: '', leave_type: 'Sick Leave', reason: '' });
    setOpen(false);
  };

  const handleReview = useCallback(
    (id: string, status: LeaveStatus) => {
      if (!profile) return;
      data.reviewLeave(id, status, profile.id);
    },
    [data, profile],
  );

  const leaveTypeOptions = [
    'Sick Leave',
    'Casual Leave',
    'Medical Leave',
    'Emergency Leave',
    'Long Leave',
  ] as const;

  const canManage = isAdmin() || isTeacher();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Approvals</h1>
          <p className="text-muted">
            Leave requests. {isStudent() ? 'Apply for leave' : 'Review and approve/reject leave requests for your students.'}
          </p>
        </div>
        {isStudent() && (
          <Button onClick={() => setOpen(true)}>Apply for leave</Button>
        )}
      </div>

      {isStudent() && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-ink">Your leave requests</h3>
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
                    <TableCell>{`${leave.start_date} → ${leave.end_date}`}</TableCell>
                    <TableCell className="text-sm truncate max-w-[200px]">{leave.reason}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          leave.status === 'approved'
                            ? 'success'
                            : leave.status === 'rejected'
                              ? 'terracotta'
                              : 'pending'
                        } as any
                      >
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted text-xs">{new Date(leave.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {myLeaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted py-4">
                      No leave requests yet.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {canManage && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-ink">Pending approvals</h3>
            <p className="text-muted text-sm">
              Leave requests awaiting your review. Same table as the student page.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {pendingForMe.map((leave) => {
                  const student = data.people.find((p) => p.id === leave.student_id);
                  return (
                    <TableRow key={leave.id}>
                      <TableCell>{student?.full_name ?? '—'}</TableCell>
                      <TableCell>{leave.leave_type}</TableCell>
                      <TableCell>{`${leave.start_date} → ${leave.end_date}`}</TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]">{leave.reason}</TableCell>
                      <TableCell className="flex gap-2">
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
                      </TableCell>
                    </TableRow>
                  );
                })}
                {pendingForMe.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted py-4">
                      No pending approvals.
                    </TableCell>
                  </TableRow>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">Apply for leave</h2>
            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Leave type</label>
                <select
                  value={form.leave_type}
                  onChange={(e) => setForm({ ...form, leave_type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {leaveTypeOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
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
                <label className="block text-xs font-medium text-muted mb-1">Reason</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Apply</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
