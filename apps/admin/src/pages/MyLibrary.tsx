import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Table, TableHeader, TableRow, TableHead, TableCell } from "../components/ui";
import { formatDateLong } from "../lib/utils";

/** Report-parity `/my-library?page=1&limit=10` — borrowed-books ledger + fines. */
export default function MyLibrary() {
  const { profile } = useAuth();
  const data = useData();
  const [params] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? "10") || 10));

  const mine = useMemo(
    () => data.bookIssues.filter((i) => i.student_id === profile?.id),
    [data.bookIssues, profile?.id],
  );
  const paged = mine.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-ink dark:text-white">My Library</h2>
        <Link
          to="/issue-book?member_able_type=students"
          className="ml-auto rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white"
        >
          Issue a book
        </Link>
        <Link
          to="/digital-library"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:text-slate-200"
        >
          Digital library
        </Link>
      </div>
      <Card padded={false}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {paged.map((issue) => {
              const book = data.books.find((b) => b.id === issue.book_id);
              return (
                <TableRow key={issue.id}>
                  <TableCell>
                    <div className="font-medium">{book?.title ?? "Book"}</div>
                    <div className="text-xs text-muted">{book?.accession_no}</div>
                  </TableCell>
                  <TableCell>{formatDateLong(issue.issued_at)}</TableCell>
                  <TableCell>{formatDateLong(issue.due_at)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        issue.status === "returned"
                          ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : issue.status === "reserved"
                            ? "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            : "rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      }
                    >
                      {issue.status}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
        {paged.length === 0 && <p className="p-6 text-sm text-muted">No books borrowed yet.</p>}
      </Card>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>
          Page {page} · showing {paged.length} of {mine.length}
        </span>
        <Link className="underline" to={`/my-library?page=${page + 1}&limit=${limit}`}>
          Next →
        </Link>
      </div>
    </div>
  );
}
