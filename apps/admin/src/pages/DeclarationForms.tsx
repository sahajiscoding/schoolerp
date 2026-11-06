import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Button, Table, TableHeader, TableRow, TableHead, TableCell } from "../components/ui";

/** Report-parity `/declaration-forms?page=1&limit=10` — undertakings + consents. */
export default function DeclarationForms() {
  const { profile, isAdmin, isTeacher, isStudent } = useAuth();
  const data = useData();
  const [params] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? "10") || 10));
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", type: "Transport" });

  const canAuthor = isAdmin() || isTeacher();
  const paged = data.declarations.slice((page - 1) * limit, page * limit);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      data.notify("Give the declaration a name before publishing.");
      return;
    }
    data.addDeclaration({ name: form.name.trim(), description: form.description.trim() || form.name.trim(), type: form.type });
    setForm({ name: "", description: "", type: "Transport" });
    setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-ink dark:text-white">Declaration Forms</h2>
        {canAuthor && (
          <Button size="sm" className="ml-auto" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "New declaration"}
          </Button>
        )}
      </div>

      {open && canAuthor && (
        <Card>
          <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={form.name}
                onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Type
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={form.type}
                onChange={(e) => setForm((v) => ({ ...v, type: e.target.value }))}
              >
                {["Transport", "Registration", "Academic", "Medical", "Discipline"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted sm:col-span-2">
              Description
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Publish declaration</Button>
            </div>
          </form>
        </Card>
      )}

      <Card padded={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <tbody>
            {paged.map((d) => {
              const signed = profile ? d.signed_by.includes(profile.id) : false;
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted line-clamp-1">{d.description}</div>
                  </TableCell>
                  <TableCell>{d.type}</TableCell>
                  <TableCell>{signed ? "Signed" : "Pending"}</TableCell>
                  <TableCell>
                    {isStudent() && !signed && (
                      <Button size="sm" onClick={() => profile && data.signDeclaration(d.id, profile.id)}>
                        Sign
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
        {paged.length === 0 && <p className="p-6 text-sm text-muted">No declarations yet.</p>}
      </Card>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>
          Page {page} · showing {paged.length} of {data.declarations.length}
        </span>
        <Link className="underline" to={`/declaration-forms?page=${page + 1}&limit=${limit}`}>
          Next →
        </Link>
      </div>
    </div>
  );
}
