import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@schoolerp/shared';
import type { Book, BookIssue } from './types';

type LibraryClient = SupabaseClient<Database>;

type LibraryRpcCall = (
  functionName: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

const libraryRpc = (client: LibraryClient): LibraryRpcCall =>
  client.rpc.bind(client) as unknown as LibraryRpcCall;

export interface LibraryBookRow {
  id: string;
  title: string;
  author: string;
  accession_no: string;
  category: string | null;
  total_copies: number;
  available_copies: number;
}

export interface LibraryTransactionRow {
  id: string;
  book_id: string;
  student_id: string;
  issued_by: string | null;
  issued_on: string;
  due_on: string;
  returned_on: string | null;
  fine_amount: number;
  status: 'issued' | 'returned' | 'reserved';
}

export interface MappedLibraryData {
  books: Book[];
  issues: BookIssue[];
}

export function mapLibraryData(
  books: LibraryBookRow[],
  transactions: LibraryTransactionRow[],
): MappedLibraryData {
  const mappedBooks = books.map<Book>((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    accession_no: b.accession_no,
    category: b.category ?? 'General',
    total_copies: b.total_copies,
    available_copies: b.available_copies,
  }));

  const mappedIssues = transactions.map<BookIssue>((t) => ({
    id: t.id,
    book_id: t.book_id,
    student_id: t.student_id,
    issued_at: t.issued_on,
    due_at: t.due_on,
    returned_at: t.returned_on ?? undefined,
    status: t.status,
  }));

  return { books: mappedBooks, issues: mappedIssues };
}

export async function loadLibraryData(
  client: LibraryClient,
  studentId: string | null,
  role: 'admin' | 'teacher' | 'student'
): Promise<MappedLibraryData> {
  const [booksResult, transactionsResult] = await Promise.all([
    client.from('library_books').select('*').order('title', { ascending: true }),
    role === 'student' && studentId
      ? client
          .from('library_book_transactions')
          .select('*')
          .eq('student_id', studentId)
          .order('issued_on', { ascending: false })
      : client.from('library_book_transactions').select('*').order('issued_on', { ascending: false }),
  ]);

  if (booksResult.error || transactionsResult.error) {
    throw new Error('Could not load library data. Please try again.');
  }

  return mapLibraryData(
    (booksResult.data ?? []) as LibraryBookRow[],
    (transactionsResult.data ?? []) as LibraryTransactionRow[],
  );
}

export async function issueLibraryBook(
  client: LibraryClient,
  bookId: string,
  studentId: string,
  dueAt: string
): Promise<void> {
  const { error } = await libraryRpc(client)('library_issue_book', {
    p_book_id: bookId,
    p_student_id: studentId,
    p_due_at: dueAt,
  });
  if (error) throw new Error('Could not issue the book. Please try again.');
}

export async function returnLibraryBook(
  client: LibraryClient,
  transactionId: string
): Promise<void> {
  const { error } = await libraryRpc(client)('library_return_book', {
    p_transaction_id: transactionId,
  });
  if (error) throw new Error('Could not return the book. Please try again.');
}

export async function reserveLibraryBook(
  client: LibraryClient,
  bookId: string,
  studentId: string
): Promise<void> {
  const { error } = await libraryRpc(client)('library_reserve_book', {
    p_book_id: bookId,
    p_student_id: studentId,
  });
  if (error) throw new Error('Could not reserve the book. Please try again.');
}
