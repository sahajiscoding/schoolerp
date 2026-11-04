import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ACADEMIC_YEAR, seedAttendance, seedBookIssues, seedBooks, seedCirculars, seedCourseProgress, seedDeclarations, seedEvents, seedFees, seedGallery, seedHomework, seedLeaveRequests, seedNotifications, seedPeople, seedPolls, seedReportCards, seedSiblingLinks, seedStudyMaterials, seedSubmissions, seedThreads } from './seed';
import type {
  AppNotification,
  AttendanceRecord,
  Book,
  BookIssue,
  ChatThread,
  Circular,
  CourseProgressEntry,
  DeclarationForm,
  FeeInvoice,
  GalleryAlbum,
  Homework,
  ImportRow,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  Person,
  Poll,
  ReportCard,
  Role,
  SchoolEvent,
  SiblingLink,
  StudyMaterial,
  Submission,
} from './types';
import { uid } from './utils';

interface AppState {
  people: Person[];
  homework: Homework[];
  submissions: Submission[];
  leaves: LeaveRequest[];
  courseProgress: CourseProgressEntry[];
  declarations: DeclarationForm[];
  polls: Poll[];
  events: SchoolEvent[];
  studyMaterials: StudyMaterial[];
  books: Book[];
  bookIssues: BookIssue[];
  reportCards: ReportCard[];
  attendance: AttendanceRecord[];
  fees: FeeInvoice[];
  siblings: SiblingLink[];
  gallery: GalleryAlbum[];
  notifications: AppNotification[];
  threads: ChatThread[];
  circulars: Circular[];
}

const STORAGE_KEY = 'pws.demo.data.v2';

function initialData(): AppState {
  return {
    people: seedPeople,
    homework: seedHomework,
    submissions: seedSubmissions,
    leaves: seedLeaveRequests,
    courseProgress: seedCourseProgress,
    declarations: seedDeclarations,
    polls: seedPolls,
    events: seedEvents,
    studyMaterials: seedStudyMaterials,
    books: seedBooks,
    bookIssues: seedBookIssues,
    reportCards: seedReportCards,
    attendance: seedAttendance,
    fees: seedFees,
    siblings: seedSiblingLinks,
    gallery: seedGallery,
    notifications: seedNotifications,
    threads: seedThreads,
    circulars: seedCirculars,
  };
}

function loadData(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialData();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...initialData(), ...parsed };
  } catch {
    return initialData();
  }
}

interface AppDataContextValue extends AppState {
  toast: string | null;
  notify: (message: string) => void;
  addPerson: (input: { full_name: string; login_id: string; role: Role; email?: string; phone?: string; dob?: string; class_label?: string; section_label?: string }) => void;
  importPeople: (rows: ImportRow[]) => void;
  applyLeave: (input: { student_id: string; start_date: string; end_date: string; leave_type: LeaveType; reason: string; attachment_name?: string }) => void;
  reviewLeave: (id: string, status: LeaveStatus, reviewerId: string, note?: string) => void;
  addProgress: (input: Omit<CourseProgressEntry, 'id' | 'updated_at'>) => void;
  signDeclaration: (id: string) => void;
  createPoll: (input: { question: string; audience: string; created_by: string; closes_at: string; options: string[] }) => void;
  votePoll: (pollId: string, optionId: string, studentId: string) => void;
  addEvent: (input: Omit<SchoolEvent, 'id' | 'created_by'> & { created_by: string }) => void;
  addAssignment: (input: Omit<Homework, 'id' | 'created_at'>) => void;
  submitAssignment: (input: Omit<Submission, 'id' | 'submitted_at' | 'status'>) => void;
  reviewSubmission: (id: string) => void;
  addStudyMaterial: (input: Omit<StudyMaterial, 'id' | 'created_at'>) => void;
  addBook: (input: Omit<Book, 'id' | 'available_copies'>) => void;
  issueBook: (input: { book_id: string; student_id: string; due_at: string }) => void;
  returnBook: (issueId: string) => void;
  reserveBook: (bookId: string, studentId: string) => void;
  addReportCard: (input: Omit<ReportCard, 'id' | 'generated_at'>) => void;
  saveAttendance: (records: Omit<AttendanceRecord, 'id'>[]) => void;
  recordPayment: (invoiceId: string, amount: number) => void;
  linkSibling: (studentId: string, siblingId: string, discount: number) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendMessage: (threadId: string, senderId: string, body: string) => void;
  createThread: (input: { subject: string; participant_ids: string[]; sender_id: string; body: string }) => void;
  addCircular: (input: Omit<Circular, 'id'>) => void;
  resetDemoData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used inside AppDataProvider');
  return context;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadData);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Demo state is optional; storage may be unavailable.
    }
  }, [state]);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
  }, []);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'created_at' | 'read'>) => {
    setState((current) => ({
      ...current,
      notifications: [
        { ...notification, id: uid('notif'), created_at: new Date().toISOString(), read: false },
        ...current.notifications,
      ],
    }));
  }, []);

  const addPerson: AppDataContextValue['addPerson'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      people: [
        ...current.people,
        {
          id: uid('person'),
          is_active: true,
          email: input.email || `${input.login_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@pws.local`,
          ...input,
        },
      ],
    }));
    notify(`${input.full_name} added.`);
  }, [notify]);

  const importPeople: AppDataContextValue['importPeople'] = useCallback((rows) => {
    setState((current) => ({
      ...current,
      people: [
        ...current.people,
        ...rows.map((row) => ({
          id: uid('person'),
          login_id: row.admission_no,
          full_name: row.full_name,
          role: 'student' as const,
          is_active: true,
          email: `${row.admission_no.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@pws.local`,
          dob: row.dob,
          admission_no: row.admission_no,
          class_label: row.class_label,
          section_label: row.section_label,
        })),
      ],
    }));
    notify(`${rows.length} student${rows.length === 1 ? '' : 's'} imported.`);
  }, [notify]);

  const applyLeave: AppDataContextValue['applyLeave'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      leaves: [
        {
          ...input,
          id: uid('leave'),
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        ...current.leaves,
      ],
    }));
    addNotification({
      title: 'Leave request submitted',
      body: `A ${input.leave_type.toLowerCase()} request is waiting for approval.`,
      kind: 'approval',
    });
    notify('Leave request submitted for approval.');
  }, [addNotification, notify]);

  const reviewLeave: AppDataContextValue['reviewLeave'] = useCallback((id, status, reviewerId, note) => {
    setState((current) => ({
      ...current,
      leaves: current.leaves.map((leave) =>
        leave.id === id
          ? { ...leave, status, reviewed_by: reviewerId, reviewed_at: new Date().toISOString(), review_note: note }
          : leave,
      ),
    }));
    addNotification({
      title: status === 'approved' ? 'Leave approved' : 'Leave rejected',
      body: 'Your class teacher reviewed your leave request.',
      kind: 'approval',
    });
    notify(`Leave ${status}.`);
  }, [addNotification, notify]);

  const addProgress: AppDataContextValue['addProgress'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      courseProgress: [
        { ...input, id: uid('progress'), updated_at: new Date().toISOString() },
        ...current.courseProgress,
      ],
    }));
    notify('Course progress saved.');
  }, [notify]);

  const signDeclaration: AppDataContextValue['signDeclaration'] = useCallback((id) => {
    setState((current) => ({
      ...current,
      declarations: current.declarations.map((form) =>
        form.id === id ? { ...form, status: 'signed', signed_at: new Date().toISOString() } : form,
      ),
    }));
    notify('Declaration signed.');
  }, [notify]);

  const createPoll: AppDataContextValue['createPoll'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      polls: [
        {
          id: uid('poll'),
          question: input.question,
          audience: input.audience,
          created_by: input.created_by,
          created_at: new Date().toISOString(),
          closes_at: input.closes_at,
          options: input.options.filter(Boolean).map((label) => ({ id: uid('option'), label })),
          votes: {},
        },
        ...current.polls,
      ],
    }));
    notify('Poll published.');
  }, [notify]);

  const votePoll: AppDataContextValue['votePoll'] = useCallback((pollId, optionId, studentId) => {
    setState((current) => ({
      ...current,
      polls: current.polls.map((poll) =>
        poll.id === pollId ? { ...poll, votes: { ...poll.votes, [studentId]: optionId } } : poll,
      ),
    }));
    notify('Vote recorded.');
  }, [notify]);

  const addEvent: AppDataContextValue['addEvent'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      events: [...current.events, { ...input, id: uid('event') }],
    }));
    notify('Event added to the calendar.');
  }, [notify]);

  const addAssignment: AppDataContextValue['addAssignment'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      homework: [{ ...input, id: uid('homework'), created_at: new Date().toISOString() }, ...current.homework],
    }));
    addNotification({
      title: 'New assignment published',
      body: `${input.title} is now available.`,
      kind: 'assignment',
    });
    notify('Assignment published.');
  }, [addNotification, notify]);

  const submitAssignment: AppDataContextValue['submitAssignment'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      submissions: [
        {
          ...input,
          id: uid('submission'),
          submitted_at: new Date().toISOString(),
          status: 'submitted',
        },
        ...current.submissions.filter(
          (submission) => !(submission.assignment_id === input.assignment_id && submission.student_id === input.student_id),
        ),
      ],
    }));
    notify('Assignment submitted.');
  }, [notify]);

  const reviewSubmission: AppDataContextValue['reviewSubmission'] = useCallback((id) => {
    setState((current) => ({
      ...current,
      submissions: current.submissions.map((submission) =>
        submission.id === id ? { ...submission, status: 'reviewed' } : submission,
      ),
    }));
    notify('Submission marked as reviewed.');
  }, [notify]);

  const addStudyMaterial: AppDataContextValue['addStudyMaterial'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      studyMaterials: [
        { ...input, id: uid('material'), created_at: new Date().toISOString() },
        ...current.studyMaterials,
      ],
    }));
    notify('Study material shared.');
  }, [notify]);

  const addBook: AppDataContextValue['addBook'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      books: [...current.books, { ...input, id: uid('book'), available_copies: input.total_copies }],
    }));
    notify('Book added to the library.');
  }, [notify]);

  const issueBook: AppDataContextValue['issueBook'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      bookIssues: [
        { ...input, id: uid('issue'), issued_at: new Date().toISOString().slice(0, 10), status: 'issued' },
        ...current.bookIssues,
      ],
      books: current.books.map((book) =>
        book.id === input.book_id ? { ...book, available_copies: Math.max(0, book.available_copies - 1) } : book,
      ),
    }));
    notify('Book issued.');
  }, [notify]);

  const returnBook: AppDataContextValue['returnBook'] = useCallback((issueId) => {
    setState((current) => {
      const issue = current.bookIssues.find((entry) => entry.id === issueId);
      return {
        ...current,
        bookIssues: current.bookIssues.map((entry) =>
          entry.id === issueId ? { ...entry, status: 'returned', returned_at: new Date().toISOString().slice(0, 10) } : entry,
        ),
        books: issue
          ? current.books.map((book) =>
              book.id === issue.book_id ? { ...book, available_copies: book.available_copies + 1 } : book,
            )
          : current.books,
      };
    });
    notify('Book returned.');
  }, [notify]);

  const reserveBook: AppDataContextValue['reserveBook'] = useCallback((bookId, studentId) => {
    setState((current) => ({
      ...current,
      bookIssues: [
        {
          id: uid('reserve'),
          book_id: bookId,
          student_id: studentId,
          issued_at: new Date().toISOString().slice(0, 10),
          due_at: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          status: 'reserved',
        },
        ...current.bookIssues,
      ],
      books: current.books.map((book) =>
        book.id === bookId ? { ...book, available_copies: Math.max(0, book.available_copies - 1) } : book,
      ),
    }));
    notify('Book reserved.');
  }, [notify]);

  const addReportCard: AppDataContextValue['addReportCard'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      reportCards: [{ ...input, id: uid('report'), generated_at: new Date().toISOString() }, ...current.reportCards],
    }));
    notify('Report card generated and assigned.');
  }, [notify]);

  const saveAttendance: AppDataContextValue['saveAttendance'] = useCallback((records) => {
    setState((current) => {
      const remaining = current.attendance.filter(
        (entry) => !records.some((record) => record.student_id === entry.student_id && record.date === entry.date),
      );
      return {
        ...current,
        attendance: [...remaining, ...records.map((record) => ({ ...record, id: uid('att') }))],
      };
    });
    notify('Attendance saved.');
  }, [notify]);

  const recordPayment: AppDataContextValue['recordPayment'] = useCallback((invoiceId, amount) => {
    setState((current) => ({
      ...current,
      fees: current.fees.map((invoice) => {
        if (invoice.id !== invoiceId) return invoice;
        const paid = Math.min(invoice.amount - invoice.discount, invoice.paid + amount);
        const payable = invoice.amount - invoice.discount;
        return {
          ...invoice,
          paid,
          status: paid >= payable ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
        };
      }),
    }));
    notify('Payment recorded.');
  }, [notify]);

  const linkSibling: AppDataContextValue['linkSibling'] = useCallback((studentId, siblingId, discount) => {
    setState((current) => ({
      ...current,
      siblings: [
        ...current.siblings.filter((link) => link.student_id !== studentId && link.sibling_id !== siblingId),
        { id: uid('sibling'), student_id: studentId, sibling_id: siblingId, discount_percent: discount },
      ],
      fees: current.fees.map((invoice) =>
        invoice.student_id === siblingId
          ? { ...invoice, discount: Math.round((invoice.amount * discount) / 100), sibling_of: studentId }
          : invoice,
      ),
    }));
    notify('Sibling discount linked.');
  }, [notify]);

  const markNotificationRead: AppDataContextValue['markNotificationRead'] = useCallback((id) => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((current) => ({
      ...current,
      notifications: current.notifications.map((notification) => ({ ...notification, read: true })),
    }));
  }, []);

  const sendMessage: AppDataContextValue['sendMessage'] = useCallback((threadId, senderId, body) => {
    setState((current) => ({
      ...current,
      threads: current.threads.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              messages: [
                ...thread.messages,
                { id: uid('msg'), sender_id: senderId, body, created_at: new Date().toISOString() },
              ],
            }
          : thread,
      ),
    }));
    notify('Message sent.');
  }, [notify]);

  const createThread: AppDataContextValue['createThread'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      threads: [
        {
          id: uid('thread'),
          subject: input.subject,
          participant_ids: [input.sender_id, ...input.participant_ids],
          created_at: new Date().toISOString(),
          messages: [
            { id: uid('msg'), sender_id: input.sender_id, body: input.body, created_at: new Date().toISOString() },
          ],
        },
        ...current.threads,
      ],
    }));
    notify('Message sent.');
  }, [notify]);

  const addCircular: AppDataContextValue['addCircular'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      circulars: [{ ...input, id: uid('circular') }, ...current.circulars],
    }));
    notify('Circular published.');
  }, [notify]);

  const resetDemoData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialData());
    notify('Demo data reset.');
  }, [notify]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      ...state,
      toast,
      notify,
      addPerson,
      importPeople,
      applyLeave,
      reviewLeave,
      addProgress,
      signDeclaration,
      createPoll,
      votePoll,
      addEvent,
      addAssignment,
      submitAssignment,
      reviewSubmission,
      addStudyMaterial,
      addBook,
      issueBook,
      returnBook,
      reserveBook,
      addReportCard,
      saveAttendance,
      recordPayment,
      linkSibling,
      markNotificationRead,
      markAllNotificationsRead,
      sendMessage,
      createThread,
      addCircular,
      resetDemoData,
    }),
    [
      state,
      toast,
      notify,
      addPerson,
      importPeople,
      applyLeave,
      reviewLeave,
      addProgress,
      signDeclaration,
      createPoll,
      votePoll,
      addEvent,
      addAssignment,
      submitAssignment,
      reviewSubmission,
      addStudyMaterial,
      addBook,
      issueBook,
      returnBook,
      reserveBook,
      addReportCard,
      saveAttendance,
      recordPayment,
      linkSibling,
      markNotificationRead,
      markAllNotificationsRead,
      sendMessage,
      createThread,
      addCircular,
      resetDemoData,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-xl bg-ink px-5 py-3 text-sm text-white shadow-2xl">
          {toast}
        </div>
      )}
    </AppDataContext.Provider>
  );
}

export { ACADEMIC_YEAR };
