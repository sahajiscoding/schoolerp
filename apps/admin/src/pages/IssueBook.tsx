import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData as useData } from "../lib/appData";
import { Card, Button } from "../components/ui";

/**
 * Report-parity `/issue-book?member_able_type=students` — book catalog +
 * reservation. `member_able_type` is carried verbatim from the deep link;
 * the demo store issues/reserves against the signed-in student.
 */
export default function IssueBook() {
  const { profile } = useAuth();
  const data = useData();
  const [params] = useSearchParams();
  const memberAbleType = params.get("member_able_type") ?? "students";
  const [query, setQuery] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });

  const books = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? data.books.filter(
          (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
        )
      : data.books;
  }, [data.books, query]);

  const handleIssue = (bookId: string) => {
    if (!profile) return;
    if (!dueDate) {
      data.notify("Pick a due date before issuing.");
      return;
    }
    data.issueBook({ book_id: bookId, student_id: profile.id, due_at: dueDate });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold text-ink dark:text-white">Issue a book</h2>
        <span className="text-xs text-muted">Catalog for {memberAbleType}</span>
        <Link to="/my-library" className="ml-auto text-xs text-muted underline">
          My ledger
        </Link>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <input
          placeholder="Search by title or author…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <label className="text-xs font-medium text-muted">
          Due date
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <Card key={book.id} className="flex flex-col gap-1">
            <div className="font-semibold text-ink dark:text-white">{book.title}</div>
            <div className="text-xs text-muted">
              {book.author} · {book.accession_no}
            </div>
            <div className="text-xs text-muted">
              {book.available_copies} of {book.total_copies} copies available
            </div>
            <div className="mt-auto flex gap-2 pt-2">
              <Button
                size="sm"
                disabled={book.available_copies <= 0}
                onClick={() => handleIssue(book.id)}
              >
                Issue
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={book.available_copies <= 0}
                onClick={() => profile && data.reserveBook(book.id, profile.id)}
              >
                Reserve
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {books.length === 0 && <p className="text-sm text-muted">No books match your search.</p>}
    </div>
  );
}
