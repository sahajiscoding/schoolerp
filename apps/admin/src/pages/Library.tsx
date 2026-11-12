import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData as useData } from '../lib/appData';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  StatCard,
} from '../components/ui';
import { Modal } from '../components/modal';
import { EmptyState, MetricGrid, Page, PageHeader, SectionHeading } from '../components/page';
import { FiBookOpen, FiPlus, FiSend, FiRotateCcw, FiTrash2 } from 'react-icons/fi';

export default function Library() {
  const { profile, isAdmin, isTeacher } = useAuth();
  const data = useData();
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

  const canManage = isAdmin() || isTeacher();
  const students = data.people.filter((p) => p.role === 'student');

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.addBook({
      title: addForm.title,
      author: addForm.author,
      accession_no: addForm.accession_no,
      category: addForm.category,
      total_copies: Number(addForm.total_copies) || 1,
    });
    setAddForm({ title: '', author: '', accession_no: '', category: '', total_copies: '1' });
    setOpenAdd(false);
  };

  const handleIssueBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    data.issueBook({
      book_id: issueForm.book_id,
      student_id: issueForm.student_id,
      due_at: issueForm.due_at,
    });
    setIssueForm({ book_id: '', student_id: '', due_at: '' });
    setOpenIssue(false);
  };

  const handleReturn = (issueId: string) => {
    data.returnBook(issueId);
  };

  const availableBooks = data.books.filter((b) => b.available_copies > 0);
  const availableCopies = data.books.reduce((sum, book) => sum + book.available_copies, 0);
  const activeIssues = data.bookIssues.filter((issue) => issue.status === 'issued').length;

  return (
    <Page>
      <PageHeader
        eyebrow="Library"
        title={canManage ? 'Library' : 'My library'}
        description={canManage ? 'Browse the catalogue, add books and manage current issues.' : 'Browse available books and reserve a copy.'}
        meta={`${data.books.length} titles in the catalogue`}
        actions={canManage ? (
          <div className="flex gap-2">
            <Button onClick={() => setOpenAdd(true)}>
              <FiPlus size={16} /> Add book
            </Button>
            <Button onClick={() => setOpenIssue(true)}>
              <FiSend size={16} /> Issue book
            </Button>
          </div>
        ) : undefined}
      />

      <MetricGrid className="xl:grid-cols-3">
        <StatCard label="Titles" value={data.books.length} icon={FiBookOpen} />
        <StatCard label="Available copies" value={availableCopies} icon={FiBookOpen} variant="neutral" />
        <StatCard label="Active issues" value={activeIssues} icon={FiSend} variant="terracotta" />
      </MetricGrid>

      <section aria-labelledby="catalogue-title">
        <SectionHeading title="Book catalogue" description="Availability and circulation actions by title." />
      <div className="stagger-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.books.map((book) => (
          <Card key={book.id} className="hover-lift flex h-full flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-ink">{book.title}</h3>
                <p className="text-sm text-muted">{book.author}</p>
              </div>
              <Badge variant="olive" className="text-[10px]">
                {book.category}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-muted mb-3 flex-1">
              <div>Accession: {book.accession_no}</div>
              <div>
                Copies: {book.available_copies} / {book.total_copies} available
              </div>
            </div>
            <div className="flex gap-2">
              {canManage ? (
                book.available_copies > 0 ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIssueForm({ book_id: book.id, student_id: '', due_at: '' });
                      setOpenIssue(true);
                    }}
                    className="flex-1 text-sm"
                  >
                    <FiSend size={14} /> Issue
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled className="flex-1 text-sm">
                    All issued
                  </Button>
                )
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={book.available_copies === 0}
                  onClick={() => profile && data.reserveBook(book.id, profile.id)}
                  className="flex-1 text-sm"
                >
                  <FiBookOpen size={14} /> {book.available_copies === 0 ? 'All issued' : 'Reserve'}
                </Button>
              )}
              {isAdmin() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => data.removeBook(book.id)}
                  aria-label={`Remove ${book.title}`}
                >
                  <FiTrash2 size={14} />
                </Button>
              )}
            </div>
          </Card>
        ))}
         {data.books.length === 0 && <EmptyState className="col-span-full" title="No books in the library yet" icon={FiBookOpen} />}
      </div>
      </section>

      <Card>
        <SectionHeading title="Issued books" description="Current, returned and reserved circulation records." />
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {data.bookIssues.map((issue) => {
                const book = data.books.find((b) => b.id === issue.book_id);
                const student = data.people.find((p) => p.id === issue.student_id);
                return (
                  <TableRow key={issue.id}>
                    <TableCell className="font-bold">{book?.title ?? '—'}</TableCell>
                    <TableCell className="text-sm">{student?.full_name ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted">{issue.issued_at}</TableCell>
                    <TableCell className="text-sm text-muted">{issue.due_at}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          issue.status === 'issued'
                            ? 'warning'
                            : issue.status === 'returned'
                              ? 'success'
                              : 'pending'
                        }
                      >
                        {issue.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {issue.status === 'issued' && canManage ? (
                        <Button variant="danger" size="sm" onClick={() => handleReturn(issue.id)}>
                          <FiRotateCcw size={14} /> Return
                        </Button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {data.bookIssues.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted py-4">
                    No books issued yet.
                  </TableCell>
                </TableRow>
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {canManage && openAdd && (
        <Modal title="Add book" description="Create a catalogue record and set its copy count." onClose={() => setOpenAdd(false)} size="sm">
            <form onSubmit={handleAddBook} className="space-y-3">
              <div>
                <label htmlFor="book-title" className="field-label">Title</label>
                <input
                  id="book-title"
                  value={addForm.title}
                  onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                  className="field-control"
                />
              </div>
              <div>
                <label htmlFor="book-author" className="field-label">Author</label>
                <input
                  id="book-author"
                  value={addForm.author}
                  onChange={(e) => setAddForm({ ...addForm, author: e.target.value })}
                  className="field-control"
                />
              </div>
              <div>
                <label htmlFor="book-accession" className="field-label">Accession no.</label>
                <input
                  id="book-accession"
                  value={addForm.accession_no}
                  onChange={(e) => setAddForm({ ...addForm, accession_no: e.target.value })}
                  className="field-control"
                />
              </div>
              <div>
                <label htmlFor="book-category" className="field-label">Category</label>
                <input
                  id="book-category"
                  value={addForm.category}
                  onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                  className="field-control"
                />
              </div>
              <div>
                <label htmlFor="book-copies" className="field-label">Total copies</label>
                <input
                  id="book-copies"
                  type="number"
                  value={addForm.total_copies}
                  onChange={(e) => setAddForm({ ...addForm, total_copies: e.target.value })}
                  className="field-control"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" type="button" onClick={() => setOpenAdd(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add book</Button>
              </div>
            </form>
        </Modal>
      )}

      {canManage && openIssue && (
        <Modal title="Issue book" description="Assign an available copy to one student." onClose={() => setOpenIssue(false)} size="sm">
            <form onSubmit={handleIssueBook} className="space-y-3">
              <div>
                <label htmlFor="issue-book" className="field-label">Book</label>
                <select
                  id="issue-book"
                  value={issueForm.book_id}
                  onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })}
                  className="field-control"
                >
                  <option value="">Select book</option>
                  {availableBooks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.accession_no})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="issue-student" className="field-label">Student</label>
                <select
                  id="issue-student"
                  value={issueForm.student_id}
                  onChange={(e) => setIssueForm({ ...issueForm, student_id: e.target.value })}
                  className="field-control"
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.login_id})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="issue-due" className="field-label">Due date</label>
                <input
                  id="issue-due"
                  type="date"
                  value={issueForm.due_at}
                  onChange={(e) => setIssueForm({ ...issueForm, due_at: e.target.value })}
                  className="field-control"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="ghost" type="button" onClick={() => setOpenIssue(false)}>
                  Cancel
                </Button>
                <Button type="submit">Issue book</Button>
              </div>
            </form>
        </Modal>
      )}
    </Page>
  );
}
