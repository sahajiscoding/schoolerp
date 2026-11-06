import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Table, TableHeader, TableRow, TableHead, TableCell } from "../components/ui";

/**
 * Report-parity `/messages?box=inbox&page=1&limit=10` — inbox/sent.
 * Teacher↔student only (AGENTS.md §5): the demo store only ever creates
 * threads between a teacher/admin and a student; admins keep read-only
 * oversight on live via RLS.
 */
export default function Messages() {
  const { profile, isStudent, isAdmin } = useAuth();
  const data = useData();
  const [params] = useSearchParams();
  const box = params.get("box") ?? "inbox";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? "10") || 10));

  const mine = data.threads.filter((t) => {
    if (isAdmin()) return true;
    if (box === "sent") return t.messages.some((m) => m.sender_id === profile?.id);
    return t.participant_ids.includes(profile?.id ?? "");
  });
  const paged = mine.slice((page - 1) * limit, page * limit);

  const nameOf = (id: string) => data.people.find((p) => p.id === id)?.full_name ?? "User";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-ink dark:text-white">Messages</h2>
        <div className="flex gap-1">
          <Link
            to={`/messages?box=inbox&page=1&limit=${limit}`}
            className={
              box === "inbox"
                ? "rounded-full bg-navy px-3 py-1 text-xs font-medium text-white"
                : "rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700 dark:text-slate-200"
            }
          >
            Inbox
          </Link>
          <Link
            to={`/messages?box=sent&page=1&limit=${limit}`}
            className={
              box === "sent"
                ? "rounded-full bg-navy px-3 py-1 text-xs font-medium text-white"
                : "rounded-full border border-slate-300 px-3 py-1 text-xs dark:border-slate-700 dark:text-slate-200"
            }
          >
            Sent
          </Link>
        </div>
        {!isStudent() && (
          <Link to="/messages/create" className="ml-auto rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white">
            New message
          </Link>
        )}
      </div>

      <Card padded={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Last activity</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {paged.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <Link to={`/messages/${t.id}`} className="font-medium text-navy hover:underline dark:text-blue-300">
                    {t.subject}
                  </Link>
                  <div className="text-xs text-muted line-clamp-1">{t.messages[t.messages.length - 1]?.body}</div>
                </TableCell>
                <TableCell>
                  {t.participant_ids.map(nameOf).join(", ")}
                </TableCell>
                <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
        {paged.length === 0 && <p className="p-6 text-sm text-muted">No messages in this box.</p>}
      </Card>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>
          Page {page} · showing {paged.length} of {mine.length}
        </span>
        <Link className="underline" to={`/messages?box=${box}&page=${page + 1}&limit=${limit}`}>
          Next →
        </Link>
      </div>
    </div>
  );
}
