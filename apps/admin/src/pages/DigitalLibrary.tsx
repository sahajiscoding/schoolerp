import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData as useData } from "../lib/appData";
import { Card, Button } from "../components/ui";

/** Report-parity `/digital-library` — searchable digital e-books catalog. */
export default function DigitalLibrary() {
  const data = useData();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? data.studyMaterials.filter(
          (m) => m.title.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q),
        )
      : data.studyMaterials;
  }, [data.studyMaterials, query]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-ink dark:text-white">Digital Library</h2>
      <input
        placeholder="Search e-books…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <Card key={m.id} className="flex flex-col gap-1">
            <div className="font-semibold text-ink dark:text-white">{m.title}</div>
            <div className="text-xs text-muted">
              {m.subject} · {m.type} · {m.file_size}
            </div>
            <div className="mt-auto pt-2">
              <Button size="sm" onClick={() => navigate("/study-room")} aria-label={`Open ${m.title} in Study Room`}>
                Open e-book
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {items.length === 0 && <p className="text-sm text-muted">No e-books yet.</p>}
    </div>
  );
}
