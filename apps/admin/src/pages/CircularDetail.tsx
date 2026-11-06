import { Link, useParams } from "react-router-dom";
import { useAppData as useData } from "../lib/appData";
import { Card } from "../components/ui";
import { formatDateLong } from "../lib/utils";

/** Report-parity `/circulars/:id` — single circular + download. */
export default function CircularDetail() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const circular = data.events.find((e) => e.id === id);

  if (!circular) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted">Circular not found.</p>
        <Link to="/circulars" className="text-sm text-navy underline dark:text-blue-300">
          Back to circulars
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link to="/circulars" className="text-xs text-muted hover:text-navy dark:hover:text-blue-300">
        ← Back to circulars
      </Link>
      <Card>
        <h2 className="text-xl font-bold text-ink dark:text-white">{circular.title}</h2>
        <p className="mt-1 text-xs text-muted">
          {formatDateLong(circular.start_date)} · {circular.audience}
        </p>
        <p className="mt-4 text-sm text-ink dark:text-slate-200">{circular.description}</p>
        <button className="mt-6 rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:text-slate-200">
          Download PDF
        </button>
      </Card>
    </div>
  );
}
