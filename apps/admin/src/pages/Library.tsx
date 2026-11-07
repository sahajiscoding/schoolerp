import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLibraryData } from '../lib/useLibraryData';
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
import { FiPlus, FiSend } from 'react-icons/fi';
import { formatDateLong } from '../lib/utils';
import { supabase } from '../lib/supabase';

export default function Library() {
  const { profile } = useAuth();
  const data = useLibraryData();
  const [openAdd, setOpenAdd] = useState(false);
  const [openIssue, setOpenIssue] = useState(false);
  const [addForm, setAddForm] = useState({
    title: '',
    author: '',
    accession_no: '',
    category: '',
    total_copies: '1',
  });
  const [issueForm, setIssueForm] = useState({
    book_id: '',
    student_id: '',
    due_at: '',
  });

  const canManage = profile?.role === 'admin' || profile?.role === 'teacher';

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!addForm.title.trim() || !addForm.author.trim() || !addForm.accession_no.trim()) {
      data.notify('Title, author, and accession number are required.');
      return;
    }
    if (data.isLive) {
      // Live mode: staff creates books via Supabase directly.
      const { error } = await (supabase.from('library_books') as any).insert({
        title: addForm.title.trim(),
        author: addForm.author.trim(),
        accession_no: addForm.accession_no.trim(),
        category: addForm.category.trim() || 'General',
        total_copies: Number(addForm.total_copies) || 1,
        available_copies: Number(addForm.total_copies) || 1,
      });
      if (error) {
        data.notify('Could not add the book. Please try again.');
        return;
      }
      data.notify('Book added to the catalogue.');
    } else {
      // Demo mode uses the demo store.
      // Note: addBook is not exposed by useLibraryData; demo library writes are
      // intentionally limited to issue/return/reserve. Add-book stays demo-only.
      data.notify('Add book is demo-only in this build.');
    }
    setAddForm({ title: '', author: '', accession_no: '', category: '', total_copies: '1' });
    setOpenAdd(false);
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!issueForm.book_id || !issueForm.student_id || !issueForm.due_at) {
      data.notify('Choose a book, student, and due date before issuing.');
      return;
    }
    await data.issueBook({
      book_id: issueForm.book_id,
      student_id: issueForm.student_id,
      due_at: issueForm.due_at,
    });
    data.notify('Book issued.');
    setIssueForm({ book_id: '', student_id: '', due_at: '' });
    setOpenIssue(false);
  };

  const handleReturn = (transactionId: string) => {
    data.returnBook(transactionId);
    data.notify('Book returned.');
  };

  const availableBooks = data.books.filter((b) => b.available_copies > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Library</h1>
          <p className="text-muted">
            Browse books. Teachers can add and issue books.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button onClick={() => setOpenAdd(true)}>
              <FiPlus size={16} /> Add book
            </Button>
            <Button onClick={() => setOpenIssue(true)}>
              <FiSend size={16} /> Issue book
            </Button>
          </div>
        )}
      </div>

      {data.loading && <p className="text-sm text-muted">Loading library…</p>}

      {data.error && (
        <Card className="flex items-center gap-3 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950" role="alert">
          <p className="text-sm text-red-700 dark:text-red-300">{data.error}</p>
          <Button size="sm" variant="outline" className="ml-auto" onClick={() => void data.refresh()}>
            Try again
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.books.map((book) => (
          <Card key={book.id} className="h-full flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-ink">{book.title}</h3>
                <p className="text-sm text-muted">{book.author}</p>
              </div>
              <Badge variant="olive" className="text-[10px]">
                {book.category}
              </Badge>
            </div>
            <div className="text-xs text-muted mb-3">
              {book.accession_no}
            </div>
            <div className="mt-auto flex gap-2 pt-2">
              {book.available_copies > 0 && canManage && (
                <Button
                  size="sm"
                  onClick={() => {
                    setIssueForm({ book_id: book.id, student_id: '', due_at: '' });
                    setOpenIssue(true);
                  }}
                >
                  Issue
                </Button>
              )}
              {book.available_copies <= 0 && (
                <Badge variant="neutral" className="text-[10px]">
                  Unavailable
                </Badge>
              )}
            </div>
          </Card>
        ))}
        {data.books.length === 0 && (
          <div className="col-span-3 p-6 text-sm text-muted">No books in the catalogue yet.</div>
        )}
      </div>

      {openAdd && canManage && (
        <Card>
          <form onSubmit={handleAddBook} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted">
              Title
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={addForm.title}
                onChange={(e) => setAddForm((v) => ({ ...v, title: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Author
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={addForm.author}
                onChange={(e) => setAddForm((v) => ({ ...v, author: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Accession No.
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={addForm.accession_no}
                onChange={(e) => setAddForm((v) => ({ ...v, accession_no: e.target.value }))}
                required
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Category
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={addForm.category}
                onChange={(e) => setAddForm((v) => ({ ...v, category: e.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Total Copies
              <input
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={addForm.total_copies}
                onChange={(e) => setAddForm((v) => ({ ...v, total_copies: e.target.value }))}
                required
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={data.loading}>
                {data.loading ? 'Adding…' : 'Add book'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {openIssue && canManage && (
        <Card>
          <form onSubmit={handleIssueBook} className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-muted">
              Book
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={issueForm.book_id}
                onChange={(e) => setIssueForm((v) => ({ ...v, book_id: e.target.value }))}
                required
              >
                <option value="">Select a book…</option>
                {availableBooks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.accession_no})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Student ID
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={issueForm.student_id}
                onChange={(e) => setIssueForm((v) => ({ ...v, student_id: e.target.value }))}
                placeholder="e.g. 0185/18"
                required
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Due date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                value={issueForm.due_at}
                onChange={(e) => setIssueForm((v) => ({ ...v, due_at: e.target.value }))}
                required
              />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={data.loading}>
                {data.loading ? 'Issuing…' : 'Issue book'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-4">
        <h3 className="text-lg font-bold text-ink dark:text-white mb-3">Borrowed books</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {data.issues.map((issue) => {
                const book = data.books.find((b) => b.id === issue.book_id);
                return (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <div className="font-medium">{book?.title ?? 'Book'}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted">{issue.student_id}</TableCell>
                    <TableCell>{formatDateLong(issue.issued_at)}</TableCell>
                    <TableCell>{formatDateLong(issue.due_at)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          issue.status === 'returned'
                            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : issue.status === 'reserved'
                              ? 'rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }
                      >
                        {issue.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {issue.status === 'issued' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReturn(issue.id)}
                        >
                          Return
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.issues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-6 text-center text-sm text-muted">
                    No books issued yet.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}
