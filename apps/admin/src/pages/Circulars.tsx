import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Table, TableHeader, TableRow, TableHead, TableCell, Button } from "../components/ui";
import { formatDateLong } from "../lib/utils";

/**
 * Report-parity `/circulars?page=1&limit=10` — institutional notices. Demo
 * reuses the events store (live build: `circulars` table + `circular-files`
 * bucket, signed URLs only).
 */
export default function Circulars() {
  const { profile, isAdmin, isTeacher } = useAuth();
  const data = useData();
  const [params] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? "10") || 10));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", audience: "Whole school" });

  const canAuthor = isAdmin() || isTeacher();
  const paged = data.events.slice((page - 1) * limit, page * limit);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !form.title.trim()) {
      data.notify("Give the circular a title before publishing.");
      return;
    }
    data.addEvent({
      title: form.title.trim(),
      description: form.description.trim() || form.title.trim(),
      type: "event",
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date().toISOString().slice(0, 10),
      audience: form.audience,
      created_by: profile.id,
    });
    setForm({ title: "", description: "", audience: "Whole school" });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-ink dark:text-white">Circulars</h2>
        {canAuthor && (
          <Button size="sm" className="ml-auto" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "New circular"}
          </Button>
        )}
      </div>

      {open && canAuthor && (
        <Card>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={form.title}
                onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Audience
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={form.audience}
                onChange={(e) => setForm((v) => ({ ...v, audience: e.target.value }))}
              >
                {["Whole school", "IX - E", "Teachers only", "Parents only"].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted sm:col-span-2">
              Body
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Publish circular</Button>
            </div>
          </form>
        </Card>
      )}

      <Card padded={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Circular</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {paged.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link to={`/circulars/${c.id}`} className="font-medium text-navy hover:underline dark:text-blue-300">
                    {c.title}
                  </Link>
                  <div className="text-xs text-muted line-clamp-1">{c.description}</div>
                </TableCell>
                <TableCell>{c.audience}</TableCell>
                <TableCell>{formatDateLong(c.start_date)}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        {paged.length === 0 && <p className="p-6 text-sm text-muted">No circulars yet.</p>}
      </Card>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>
          Page {page} · showing {paged.length} of {data.events.length}
        </span>
        <Link className="underline" to={`/circulars?page=${page + 1}&limit=${limit}`}>
          Next →
        </Link>
      </div>
    </div>
  );
}
