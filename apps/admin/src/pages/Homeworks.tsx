import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useHomeworksData } from "../lib/useHomeworksData";
import { Card, Button, Badge } from "../components/ui";
import { cn, formatDateLong, relativeToToday } from "../lib/utils";

/**
 * Report-parity hub at `/homeworks` (canonical). Assignment hub + worksheets.
 * Reuses the demo store's homework/submissions — no new backend needed for
 * demo; live wiring will use the assignments tables.
 */
export default function Homeworks() {
  const { profile } = useAuth();
  const data = useHomeworksData();
  const [filter, setFilter] = useState<"all" | "HOMEWORK" | "ASSIGNMENT">("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "Mathematics",
    section_label: "IX - E",
    due_date: "",
    type: "HOMEWORK" as "HOMEWORK" | "ASSIGNMENT",
  });

  const canAdd = profile?.role === "teacher";
  const canSubmit = profile?.role === "student";

  const scoped = useMemo(() => {
    return filter === "all" ? data.homework : data.homework.filter((homework) => homework.type === filter);
  }, [data.homework, filter]);

  const sectionOptions = useMemo(
    () => Array.from(new Set(data.targets.map((target) => target.sectionLabel))),
    [data.targets],
  );
  const subjectOptions = useMemo(
    () => data.targets.filter((target) => target.sectionLabel === form.section_label).map((target) => target.subject),
    [data.targets, form.section_label],
  );

  useEffect(() => {
    if (!canAdd || data.targets.length === 0) return;
    const currentIsValid = data.targets.some(
      (target) => target.sectionLabel === form.section_label && target.subject === form.subject,
    );
    if (!currentIsValid) {
      const first = data.targets[0];
      const timer = setTimeout(() => {
        setForm((current) => ({ ...current, section_label: first.sectionLabel, subject: first.subject }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [canAdd, data.targets, form.section_label, form.subject]);

  const submittedIds = new Set(
    data.submissions.filter((s) => s.student_id === profile?.id).map((s) => s.assignment_id),
  );

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim() || !form.due_date) {
      data.notify("A title and a due date are required.");
      return;
    }
    setSaving(true);
    try {
      await data.addAssignment({
        title: form.title.trim(),
        description: form.description.trim(),
        teacher_id: profile.id,
        subject: form.subject,
        section_label: form.section_label,
        due_date: form.due_date,
        type: form.type,
        attachments: [],
      });
      setForm((current) => ({ ...current, title: "", description: "", due_date: "", type: "HOMEWORK" }));
      setOpen(false);
    } catch (reason) {
      data.notify(reason instanceof Error ? reason.message : "Could not publish the assignment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-ink dark:text-white">Homeworks</h2>
        <Badge variant="olive">Assignment hub</Badge>
        <div className="ml-auto flex items-center gap-2">
          {(["all", "HOMEWORK", "ASSIGNMENT"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === f
                  ? "border-navy bg-navy text-white"
                  : "border-slate-300 bg-white text-slate-600 hover:border-navy dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
              )}
            >
              {f === "all" ? "All" : f === "HOMEWORK" ? "Homework" : "Assignments"}
            </button>
          ))}
          {canAdd && <Button size="sm" onClick={() => setOpen((v) => !v)}>{open ? "Cancel" : "New homework"}</Button>}
        </div>
      </div>

      {data.loading && <p className="text-sm text-muted">Loading homeworks…</p>}
      {data.error && (
        <Card className="flex items-center gap-3 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" role="alert">
          <p className="text-sm text-red-700 dark:text-red-300">{data.error}</p>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => void data.refresh()}>
            Try again
          </Button>
        </Card>
      )}

      {open && canAdd && (
        <Card>
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
            {data.targets.length === 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-300 sm:col-span-2" role="alert">
                No section and subject assignment is available for this teacher.
              </p>
            )}
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
              Subject
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={form.subject}
                onChange={(e) => setForm((v) => ({ ...v, subject: e.target.value }))}
              >
                {subjectOptions.map((subject) => <option key={subject}>{subject}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Section
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={form.section_label}
                onChange={(e) => setForm((v) => ({ ...v, section_label: e.target.value }))}
              >
                {sectionOptions.map((section) => (
                  <option key={section}>{section}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Due date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={form.due_date}
                onChange={(e) => setForm((v) => ({ ...v, due_date: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted sm:col-span-2">
              Description
              <textarea
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))}
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving || data.targets.length === 0}>
                {saving ? "Publishing…" : "Publish homework"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {scoped.map((hw) => {
          const submitted = submittedIds.has(hw.id);
          return (
            <Card key={hw.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="olive">{hw.type === "HOMEWORK" ? "Homework" : "Assignment"}</Badge>
                <Badge>{hw.subject}</Badge>
                <span className="ml-auto text-xs text-muted">{relativeToToday(hw.due_date)}</span>
              </div>
              <div className="font-semibold text-ink dark:text-white">{hw.title}</div>
              {hw.description && <p className="text-sm text-muted line-clamp-2">{hw.description}</p>}
              <div className="text-xs text-muted">Due {formatDateLong(hw.due_date)} · {hw.section_label}</div>
              <div className="mt-auto flex items-center gap-2 pt-2">
                {canSubmit && (
                  <Link
                    to={`/homeworks/${hw.id}/submit`}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium",
                      submitted
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-navy px-3 py-1.5 text-xs font-medium text-white",
                    )}
                  >
                    {submitted ? "View submission" : "Submit work"}
                  </Link>
                )}
                {!canSubmit && (
                  <span className="text-xs text-muted">
                    {data.submissions.filter((submission) => submission.assignment_id === hw.id).length} submission(s)
                  </span>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {scoped.length === 0 && <p className="text-sm text-muted">No homeworks yet.</p>}
    </div>
  );
}
