import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import type { StudyMaterial } from '../lib/types';
import { escapeHtml } from '../lib/utils';
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
import { FiPlus, FiDownload } from 'react-icons/fi';

const SUBJECTS = ['Artificial Intelligence', 'Mathematics', 'English', 'Science', 'Social Science', 'Hindi'];

/** Materials are demo records, so "Open" renders the note the teacher attached. */
function openMaterial(material: StudyMaterial) {
  // Everything below is teacher-entered text. Escape it before it becomes HTML,
  // otherwise a title or note could inject markup into the preview window.
  const notes = escapeHtml(material.description || 'No notes attached to this material.')
    .replace(/\r?\n/g, '<br/>');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(material.title)}</title>
    <style>body{font-family:Georgia,serif;max-width:720px;margin:48px auto;padding:0 24px;color:#1f2937;line-height:1.6}
    h1{color:#4B5D2A;border-bottom:2px solid #4B5D2A;padding-bottom:8px}
    .meta{font-size:12px;color:#6b7280;margin-bottom:24px}</style></head><body>
    <h1>${escapeHtml(material.title)}</h1>
    <div class="meta">${escapeHtml(material.subject)} · ${escapeHtml(material.section_label)} · filed as ${escapeHtml(material.file_name)}</div>
    <p>${notes}</p>
    </body></html>`;
  const win = window.open('', '_blank');
  if (win) {
    // Reviewed XSS sink: `html` is assembled from escapeHtml()-wrapped values.
    // eslint-disable-next-line no-restricted-syntax
    win.document.write(html);
    win.document.close();
  }
}

export default function StudyRoom() {
  const { profile, isAdmin, isTeacher } = useAuth();
  const data = useData();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: '',
    section_label: 'IX - E',
    file_name: '',
    file_size: '',
    type: 'PDF',
  });

  const canShare = isAdmin() || isTeacher();

  const myMaterials = data.studyMaterials;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.addStudyMaterial({
      title: form.title,
      description: form.description,
      subject: form.subject,
      section_label: form.section_label,
      file_name: form.file_name || 'document.pdf',
      file_size: form.file_size || '—',
      type: form.type,
      uploaded_by: profile.id,
    });
    setForm({ title: '', description: '', subject: '', section_label: 'IX - E', file_name: '', file_size: '', type: 'PDF' });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Study Room</h1>
          <p className="text-muted">
            Shared study materials and PDFs. Teachers can share PDFs.
          </p>
        </div>
        {canShare && (
          <Button onClick={() => setOpen(true)}>
            <FiPlus size={16} /> Share PDF
          </Button>
        )}
      </div>

      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-bold text-ink">Study materials</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {myMaterials.map((mat) => {
                const uploader = data.people.find((p) => p.id === mat.uploaded_by);
                return (
                  <TableRow key={mat.id}>
                    <TableCell>{mat.title}</TableCell>
                    <TableCell>{mat.subject}</TableCell>
                    <TableCell className="text-sm">{mat.section_label}</TableCell>
                    <TableCell className="text-sm">{mat.file_name}</TableCell>
                    <TableCell>
                      <Badge variant="olive" className="text-[10px]">{mat.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted">{uploader?.full_name ?? '—'}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openMaterial(mat)}
                      >
                        <FiDownload size={14} /> Open
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {myMaterials.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted py-4">
                    No study materials yet. {canShare && 'Use "Share PDF" to add one.'}
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {canShare && open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">Share PDF</h2>
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
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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
                <label className="block text-xs font-medium text-muted mb-1">File name</label>
                <input
                  value={form.file_name}
                  onChange={(e) => setForm({ ...form, file_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="document.pdf"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Share PDF</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
