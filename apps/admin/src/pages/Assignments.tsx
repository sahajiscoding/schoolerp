import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import {
  Card,
  Button,
  Badge,
} from '../components/ui';
import { FiFileText, FiPlus, FiEye } from 'react-icons/fi';

export default function Assignments() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    section_label: 'IX - E',
    due_date: '',
    type: 'HOMEWORK' as const,
  });

  const myAssignments = data.homework;

  const mySubmissions = data.submissions.filter(
    (s) => s.student_id === profile?.id,
  );

  const submittedAssignmentIds = new Set(mySubmissions.map((s) => s.assignment_id));

  const canAdd = isAdmin() || isTeacher();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.addAssignment({
      title: form.title,
      description: form.description,
      teacher_id: profile.id,
      subject: form.subject,
      section_label: form.section_label,
      due_date: form.due_date,
      type: form.type,
      attachments: [],
    });
    setForm({ title: '', description: '', subject: '', section_label: 'IX - E', due_date: '', type: 'HOMEWORK' });
    setOpen(false);
  };

  const handleSubmit = (assignmentId: string) => {
    // In demo, create a placeholder submission
    const existing = mySubmissions.find((s) => s.assignment_id === assignmentId);
    if (existing) return;
    if (!profile) return;
    data.submitAssignment({
      assignment_id: assignmentId,
      student_id: profile.id,
      body: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Assignments / Homework</h1>
          <p className="text-muted">
            Homework and assignments with teacher name and due dates.
          </p>
        </div>
        {canAdd && (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> Add assignment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {myAssignments.map((hw) => {
          const teacher = data.people.find((p) => p.id === hw.teacher_id);
          const alreadySubmitted = submittedAssignmentIds.has(hw.id);
          return (
            <Card key={hw.id} className="h-full flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-ink">{hw.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                    <FiFileText size={14} />
                    <span>{hw.type}</span>
                  </div>
                </div>
                <Badge variant={hw.type === 'HOMEWORK' ? 'olive' : 'terracotta'} className="text-[10px]">
                  {hw.subject}
                </Badge>
              </div>
              <p className="text-sm text-muted line-clamp-2 mb-3 flex-1">{hw.description}</p>
              <div className="mt-auto pt-3 border-t border-sand/20">
                <div className="flex items-center gap-2 text-xs text-muted mb-2">
                  <FiEye size={14} />
                  <span>Assigned by <strong>{teacher?.full_name ?? 'Teacher'}</strong> ({teacher?.login_id ?? '—'})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted mb-3">
                  <span>Due {hw.due_date}</span>
                </div>
                {isStudent() ? (
                  alreadySubmitted ? (
                    <Button variant="outline" disabled className="w-full text-sm">
                      Submitted
                    </Button>
                  ) : (
                    <Button onClick={() => handleSubmit(hw.id)} className="w-full text-sm">
                      Submit
                    </Button>
                  )
                ) : (
                  <Button variant="outline" size="sm" className="w-full text-sm" onClick={() => {}}>
                    <FiClipboardList size={14} /> View submissions
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
        {myAssignments.length === 0 && (
          <div className="grid-cols-1 col-span-full">
            <Card className="text-center py-12">
              <div className="text-muted text-sm">No assignments yet.</div>
            </Card>
          </div>
        )}
      </div>

      {canAdd && open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 lg:hidden">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">Add assignment</h2>
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
                <label className="block text-xs font-medium text-muted mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Subject</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Section</label>
                  <input
                    value={form.section_label}
                    onChange={(e) => setForm({ ...form, section_label: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Due date</label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="HOMEWORK">Homework</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Publish</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
