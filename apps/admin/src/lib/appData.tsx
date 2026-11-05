import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ACADEMIC_YEAR,
  seedAttendance,
  seedBookIssues,
  seedBooks,
  seedCourseProgress,
  seedDeclarations,
  seedEvents,
  seedFees,
  seedGallery,
  seedHomework,
  seedLeaveRequests,
  seedNotifications,
  seedPeople,
  seedPolls,
  seedReportCards,
  seedSiblingLinks,
  seedStudyMaterials,
  seedAudit,
  seedClasses,
  seedSubjects,
  seedSubmissions,
  seedTeachingAssignments,
  seedThreads,
} from './seed';
import type {
  AppNotification,
  AuditEntry,
  AttendanceRecord,
  Book,
  BookIssue,
  ChatThread,
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
  SchoolClass,
  SchoolEvent,
  SiblingLink,
  StudyMaterial,
  Subject,
  Submission,
  TeachingAssignment,
} from './types';
import { passwordFromDob, uid } from './utils';
import { useAuth } from '../contexts/AuthContext';

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
  subjects: Subject[];
  classes: SchoolClass[];
  teachingAssignments: TeachingAssignment[];
  audit: AuditEntry[];
}

const STORAGE_KEY = 'pws.demo.data.v4';
const PREVIOUS_STORAGE_KEY = 'pws.demo.data.v3';

/** Class teacher for IX-E owns door-to-door leave approvals in the demo. */
export const CLASS_TEACHER_ID = 'p-teacher-1';

/** Sections whose leaves the class teacher is allowed to action. */
export function teacherSections(people: Person[], teacherId: string): string[] {
  return people
    .filter((p) => p.id === teacherId)
    .flatMap((p) => (p.section_label ? [p.section_label] : []));
}


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
    subjects: seedSubjects,
    classes: seedClasses,
    teachingAssignments: seedTeachingAssignments,
    audit: seedAudit,
  };
}

function loadData(): AppState {
  const fresh = initialData();
  try {
    const currentRaw = localStorage.getItem(STORAGE_KEY);
    const raw = currentRaw ?? localStorage.getItem(PREVIOUS_STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // Any collection that is empty in storage but seeded by a newer build is
    // back-filled, so a stale demo never hides new modules.
    const merged: AppState = { ...fresh, ...parsed };
    for (const key of Object.keys(fresh) as (keyof AppState)[]) {
      const stored = parsed[key];
      const seeded = fresh[key];
      if (
        Array.isArray(stored) &&
        stored.length === 0 &&
        Array.isArray(seeded) &&
        seeded.length > 0
      ) {
        (merged as unknown as Record<string, unknown>)[key] = seeded;
      }
    }
    // Carry existing demo edits forward, but refresh the seeded teacher label
    // and its sample notification without resetting the rest of the demo.
    if (!currentRaw) {
      merged.people = merged.people.map((person) =>
        person.id === 'p-teacher-1' ? { ...person, full_name: 'Teacher' } : person,
      );
      const teacherNotification = fresh.notifications.find((n) => n.id === 'notif-2');
      if (teacherNotification) {
        merged.notifications = merged.notifications.map((notification) =>
          notification.id === 'notif-2'
            ? { ...notification, body: teacherNotification.body }
            : notification,
        );
      }
    }
    return merged;
  } catch {
    return fresh;
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
  signDeclaration: (id: string, studentId: string) => void;
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
  saveAttendance: (records: Array<Omit<AttendanceRecord, 'id' | 'note'> & { note?: string }>) => void;
  recordPayment: (invoiceId: string, amount: number) => void;
  linkSibling: (studentId: string, siblingId: string, discount: number) => void;
  unlinkSibling: (linkId: string) => void;
  removeReportCard: (id: string) => void;
  removeBook: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendMessage: (threadId: string, senderId: string, body: string) => void;
  createThread: (input: { subject: string; participant_ids: string[]; sender_id: string; body: string }) => void;
  addSubject: (input: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, input: Omit<Subject, 'id'>) => void;
  removeSubject: (id: string) => void;
  addTeachingAssignment: (input: Omit<TeachingAssignment, 'id'>) => void;
  updateTeachingAssignment: (id: string, input: Omit<TeachingAssignment, 'id'>) => void;
  removeTeachingAssignment: (id: string) => void;
  addClass: (input: { name: string; sections: string[] }) => void;
  removeClass: (id: string) => void;
  enrollStudent: (studentId: string, classId: string, sectionName: string) => void;
  logAudit: (entry: { action: string; target: string; actorId: string }) => void;
  addDeclaration: (input: { name: string; description: string; type: string }) => void;
  broadcastMessage: (input: { title: string; body: string; section_label: string; created_by: string }) => void;
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

  // AppDataProvider sits inside AuthProvider, so the store always knows who is
  // acting. Every management mutation below records an audit entry under this
  // identity — the Audit Log is a real trail, not just seeded samples.
  const { profile } = useAuth();
  const actorRef = useRef<string>('system');
  useEffect(() => {
    actorRef.current = profile?.id ?? 'system';
  }, [profile?.id]);

  const pushAudit = useCallback((action: string, target: string, actorId?: string) => {
    setState((current) => ({
      ...current,
      audit: [
        { id: uid('audit'), actorId: actorId ?? actorRef.current, action, target, at: new Date().toISOString() },
        ...current.audit,
      ],
    }));
  }, []);

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
    // Initial passwords are always derived from the date of birth (school
    // rule). No DOB → no initial password shown, never a hardcoded fallback.
    const generatedPassword = input.dob ? passwordFromDob(input.dob) : undefined;
    setState((current) => ({
      ...current,
      people: [
        ...current.people,
        {
          id: uid('person'),
          is_active: true,
          email:
            input.email ||
            `${input.login_id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@pws.local`,
          ...input,
          password: generatedPassword,
        },
      ],
    }));
    pushAudit('Added person', `${input.full_name} (${input.role})`);
    notify(
      input.role === 'student' && generatedPassword
        ? `${input.full_name} added. Password: ${generatedPassword}`
        : `${input.full_name} added.`,
    );
  }, [notify, pushAudit]);

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
          password: row.password || passwordFromDob(row.dob),
        })),
      ],
    }));
    pushAudit('Imported roster from CSV', `${rows.length} student${rows.length === 1 ? '' : 's'}`);
    notify(`${rows.length} student${rows.length === 1 ? '' : 's'} imported.`);
  }, [notify, pushAudit]);

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
    pushAudit(status === 'approved' ? 'Approved leave' : 'Rejected leave', `Leave request ${id}`);
    notify(`Leave ${status}.`);
  }, [addNotification, notify, pushAudit]);

  const addProgress: AppDataContextValue['addProgress'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      courseProgress: [
        { ...input, id: uid('progress'), updated_at: new Date().toISOString() },
        ...current.courseProgress,
      ],
    }));
    pushAudit('Updated course progress', `${input.subject} · ${input.title}`);
    notify('Course progress saved.');
  }, [notify, pushAudit]);

  const signDeclaration: AppDataContextValue['signDeclaration'] = useCallback((id, studentId) => {
    setState((current) => ({
      ...current,
      declarations: current.declarations.map((form) =>
        form.id === id
          ? {
              ...form,
              status: 'signed',
              signed_at: new Date().toISOString(),
              // Per-student signature: record this student without affecting others.
              signed_by: Array.from(new Set([...(form.signed_by ?? []), studentId])),
            }
          : form,
      ),
    }));
    pushAudit('Signed declaration', `Form ${id}`, studentId);
    notify('Declaration signed.');
  }, [notify, pushAudit]);

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
    pushAudit('Published poll', input.question);
    notify('Poll published.');
  }, [notify, pushAudit]);

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
    pushAudit('Added event', input.title);
    notify('Event added to the calendar.');
  }, [notify, pushAudit]);

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
    pushAudit('Published assignment', input.title);
    notify('Assignment published.');
  }, [addNotification, notify, pushAudit]);

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
    pushAudit('Reviewed submission', id);
    notify('Submission marked as reviewed.');
  }, [notify, pushAudit]);

  const addStudyMaterial: AppDataContextValue['addStudyMaterial'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      studyMaterials: [
        { ...input, id: uid('material'), created_at: new Date().toISOString() },
        ...current.studyMaterials,
      ],
    }));
    pushAudit('Shared study material', input.title);
    notify('Study material shared.');
  }, [notify, pushAudit]);

  const addBook: AppDataContextValue['addBook'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      books: [...current.books, { ...input, id: uid('book'), available_copies: input.total_copies }],
    }));
    pushAudit('Added library book', input.title);
    notify('Book added to the library.');
  }, [notify, pushAudit]);

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
    pushAudit('Issued library book', `Book ${input.book_id} → student ${input.student_id}`);
    notify('Book issued.');
  }, [notify, pushAudit]);

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
    pushAudit('Returned library book', `Issue ${issueId}`);
    notify('Book returned.');
  }, [notify, pushAudit]);

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
    pushAudit('Generated report card', `Student ${input.student_id} · ${input.term}`);
    notify('Report card generated and assigned.');
  }, [notify, pushAudit]);

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
    pushAudit('Saved attendance', `${records.length} record${records.length === 1 ? '' : 's'} · ${records[0]?.date ?? ''}`);
    notify('Attendance saved.');
  }, [notify, pushAudit]);

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
    pushAudit('Recorded fee payment', `Invoice ${invoiceId} · ₹${amount}`);
    notify('Payment recorded.');
  }, [notify, pushAudit]);

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
    pushAudit('Linked sibling discount', `${studentId} → ${siblingId} (${discount}%)`);
    notify('Sibling discount linked.');
  }, [notify, pushAudit]);

  const unlinkSibling: AppDataContextValue['unlinkSibling'] = useCallback((linkId) => {
    setState((current) => {
      const link = current.siblings.find((entry) => entry.id === linkId);
      return {
        ...current,
        siblings: current.siblings.filter((entry) => entry.id !== linkId),
        fees: link
          ? current.fees.map((invoice) =>
              invoice.student_id === link.sibling_id
                ? { ...invoice, discount: 0, sibling_of: undefined }
                : invoice,
            )
          : current.fees,
        people: link
          ? current.people.map((person) =>
              person.id === link.student_id || person.id === link.sibling_id
                ? { ...person, sibling_id: undefined }
                : person,
            )
          : current.people,
      };
    });
    pushAudit('Removed sibling link', linkId);
    notify('Sibling link removed.');
  }, [notify, pushAudit]);

  const removeReportCard: AppDataContextValue['removeReportCard'] = useCallback((id) => {
    setState((current) => ({
      ...current,
      reportCards: current.reportCards.filter((card) => card.id !== id),
    }));
    pushAudit('Withdrew report card', id);
    notify('Report card withdrawn.');
  }, [notify, pushAudit]);

  const removeBook: AppDataContextValue['removeBook'] = useCallback((id) => {
    setState((current) => ({
      ...current,
      books: current.books.filter((book) => book.id !== id),
      bookIssues: current.bookIssues.filter((issue) => issue.book_id !== id),
    }));
    pushAudit('Removed library book', id);
    notify('Book removed from the catalogue.');
  }, [notify, pushAudit]);

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

  const addSubject: AppDataContextValue['addSubject'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      subjects: [...current.subjects, { ...input, id: uid('subject') }],
    }));
    pushAudit('Added subject', input.name);
    notify(`${input.name} added to the subject list.`);
  }, [notify, pushAudit]);

  const updateSubject: AppDataContextValue['updateSubject'] = useCallback((id, input) => {
    setState((current) => ({
      ...current,
      subjects: current.subjects.map((subject) => (subject.id === id ? { ...subject, ...input } : subject)),
    }));
    pushAudit('Updated subject', input.name);
    notify(`${input.name} updated.`);
  }, [notify, pushAudit]);

  const removeSubject: AppDataContextValue['removeSubject'] = useCallback((id) => {
    setState((current) => ({
      ...current,
      subjects: current.subjects.filter((subject) => subject.id !== id),
    }));
    pushAudit('Removed subject', id);
    notify('Subject removed.');
  }, [notify, pushAudit]);

  const addTeachingAssignment: AppDataContextValue['addTeachingAssignment'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      teachingAssignments: [...current.teachingAssignments, { ...input, id: uid('ta') }],
    }));
    pushAudit('Added teaching assignment', `${input.subject} · ${input.section_label}`);
    notify('Teaching assignment saved.');
  }, [notify, pushAudit]);

  const updateTeachingAssignment: AppDataContextValue['updateTeachingAssignment'] = useCallback((id, input) => {
    setState((current) => ({
      ...current,
      teachingAssignments: current.teachingAssignments.map((entry) =>
        entry.id === id ? { ...entry, ...input } : entry,
      ),
    }));
    pushAudit('Updated teaching assignment', `${input.subject} · ${input.section_label}`);
    notify('Teaching assignment updated.');
  }, [notify, pushAudit]);

  const removeTeachingAssignment: AppDataContextValue['removeTeachingAssignment'] = useCallback((id) => {
    setState((current) => ({
      ...current,
      teachingAssignments: current.teachingAssignments.filter((entry) => entry.id !== id),
    }));
    pushAudit('Removed teaching assignment', id);
    notify('Teaching assignment removed.');
  }, [notify, pushAudit]);

  const addDeclaration: AppDataContextValue['addDeclaration'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      declarations: [
        {
          id: uid('dec'),
          name: input.name,
          description: input.description,
          type: input.type,
          status: 'pending',
          signed_by: [],
        },
        ...current.declarations,
      ],
    }));
    pushAudit('Published declaration form', input.name);
    notify('Declaration form published to students.');
  }, [notify, pushAudit]);

  const broadcastMessage: AppDataContextValue['broadcastMessage'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      notifications: [
        {
          id: uid('notif'),
          title: input.title,
          body: input.body,
          kind: 'notice',
          created_at: new Date().toISOString(),
          read: false,
          audience: input.section_label,
        },
        ...current.notifications,
      ],
    }));
    pushAudit('Broadcast message', `${input.title} → ${input.section_label}`);
    notify(`Message sent to ${input.section_label}.`);
  }, [notify, pushAudit]);

  const addClass: AppDataContextValue['addClass'] = useCallback((input) => {
    setState((current) => ({
      ...current,
      classes: [
        ...current.classes,
        {
          id: uid('class'),
          name: input.name,
          sortOrder: current.classes.length + 1,
          sections: input.sections.length ? input.sections : ['A'],
        },
      ],
    }));
    pushAudit('Added class', input.name);
    notify(`${input.name} added.`);
  }, [notify, pushAudit]);

  const removeClass: AppDataContextValue['removeClass'] = useCallback((id) => {
    setState((current) => ({
      ...current,
      classes: current.classes.filter((entry) => entry.id !== id),
    }));
    pushAudit('Removed class', id);
    notify('Class removed.');
  }, [notify, pushAudit]);

  const enrollStudent: AppDataContextValue['enrollStudent'] = useCallback(
    (studentId, classId, sectionName) => {
      setState((current) => {
        const target = current.classes.find((entry) => entry.id === classId);
        if (!target) return current;
        return {
          ...current,
          people: current.people.map((person) =>
            person.id === studentId
              ? { ...person, class_label: target.name, section_label: sectionName }
              : person,
          ),
        };
      });
      pushAudit('Updated enrollment', `Student ${studentId} → class ${classId} / ${sectionName}`);
      notify('Enrollment updated.');
    },
    [notify, pushAudit],
  );

  const logAudit: AppDataContextValue['logAudit'] = useCallback((entry) => {
    pushAudit(entry.action, entry.target, entry.actorId);
  }, [pushAudit]);

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
      unlinkSibling,
      removeReportCard,
      removeBook,
      markNotificationRead,
      markAllNotificationsRead,
      sendMessage,
      createThread,
      addSubject,
      updateSubject,
      removeSubject,
      addTeachingAssignment,
      updateTeachingAssignment,
      removeTeachingAssignment,
      addClass,
      removeClass,
      enrollStudent,
      logAudit,
      addDeclaration,
      broadcastMessage,
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
      unlinkSibling,
      removeReportCard,
      removeBook,
      markNotificationRead,
      markAllNotificationsRead,
      sendMessage,
      createThread,
      addSubject,
      updateSubject,
      removeSubject,
      addTeachingAssignment,
      updateTeachingAssignment,
      removeTeachingAssignment,
      addClass,
      removeClass,
      enrollStudent,
      logAudit,
      addDeclaration,
      broadcastMessage,
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
