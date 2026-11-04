import { eachDayOfInterval, format, isSunday } from 'date-fns';
import type {
  AppNotification,
  AuditEntry,
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
  LeaveRequest,
  Person,
  Poll,
  ReportCard,
  SchoolClass,
  SchoolEvent,
  SiblingLink,
  StudyMaterial,
  Subject,
  Submission,
} from './types';

export const ACADEMIC_YEAR = '2026-27';

export const seedClasses: SchoolClass[] = [
  { id: 'cls-5', name: 'V', sortOrder: 1, sections: ['A'] },
  { id: 'cls-6', name: 'VI', sortOrder: 2, sections: ['A', 'B'] },
  { id: 'cls-7', name: 'VII', sortOrder: 3, sections: ['A', 'B'] },
  { id: 'cls-8', name: 'VIII', sortOrder: 4, sections: ['A', 'B', 'C'] },
  { id: 'cls-9', name: 'IX', sortOrder: 5, sections: ['A', 'B', 'C', 'D', 'E'] },
  { id: 'cls-10', name: 'X', sortOrder: 6, sections: ['A', 'B', 'C'] },
  { id: 'cls-11', name: 'XI', sortOrder: 7, sections: ['Science', 'Commerce', 'Humanities'] },
  { id: 'cls-12', name: 'XII', sortOrder: 8, sections: ['Science', 'Commerce', 'Humanities'] },
];

export const seedAudit: AuditEntry[] = [
  { id: 'aud-1', actorId: 'p-admin', action: 'Imported roster from CSV', target: '38 students', at: '2026-11-03T09:40:00.000Z' },
  { id: 'aud-2', actorId: 'p-admin', action: 'Linked sibling (50% discount)', target: 'Vivaan Chugh → Sahaj Chugh', at: '2026-11-02T14:20:00.000Z' },
  { id: 'aud-3', actorId: 'p-teacher-1', action: 'Approved leave', target: 'Aarav Mehta · 12–13 Nov', at: '2026-11-03T09:15:00.000Z' },
  { id: 'aud-4', actorId: 'p-teacher-2', action: 'Published assignment', target: 'Quadratic equations worksheet', at: '2026-11-01T06:15:00.000Z' },
  { id: 'aud-5', actorId: 'p-admin', action: 'Generated report card', target: 'Sahaj Chugh · HALF YEARLY', at: '2026-11-03T01:11:00.000Z' },
];

export const SUBJECT_NAMES = [
  'Artificial Intelligence',
  'Mathematics',
  'English',
  'Science',
  'Social Science',
  'Hindi',
] as const;

export const seedSubjects: Subject[] = [
  { id: 'sub-ai', name: 'Artificial Intelligence', code: 'AI', color: '#4B5D2A' },
  { id: 'sub-math', name: 'Mathematics', code: 'MATH', color: '#D2691E' },
  { id: 'sub-eng', name: 'English', code: 'ENG', color: '#7C3AED' },
  { id: 'sub-sci', name: 'Science', code: 'SCI', color: '#0F766E' },
  { id: 'sub-sst', name: 'Social Science', code: 'SST', color: '#B45309' },
  { id: 'sub-hin', name: 'Hindi', code: 'HIN', color: '#BE123C' },
];

export const seedPeople: Person[] = [
  {
    id: 'p-admin',
    login_id: 'ADMIN001',
    full_name: 'School Administrator',
    role: 'admin',
    is_active: true,
    email: 'admin@pws.local',
    phone: '+91 98100 00001',
  },
  {
    id: 'p-teacher-1',
    login_id: 'TCH001',
    full_name: 'Anuradha Gupta',
    role: 'teacher',
    is_active: true,
    email: 'anuradha.gupta@pws.local',
    phone: '+91 98100 11223',
    class_label: 'IX',
    section_label: 'E',
    class_teacher_of: 'IX - E',
  },
  {
    id: 'p-teacher-2',
    login_id: 'TCH002',
    full_name: 'Radhika Malhotra',
    role: 'teacher',
    is_active: true,
    email: 'radhika.malhotra@pws.local',
    phone: '+91 98100 44556',
    class_label: 'IX',
    section_label: 'E',
  },
  {
    id: 'p-student-1',
    login_id: '0185/18',
    full_name: 'Sahaj Chugh',
    role: 'student',
    is_active: true,
    email: 'sahaj.chugh@pws.local',
    phone: '+91 99909 23008',
    dob: '2010-05-14',
    admission_no: '0185/18',
    class_label: 'IX',
    section_label: 'E',
    password: 'Student@14052010',
    sibling_id: 'p-student-6',
  },
  {
    id: 'p-student-2',
    login_id: '0186/18',
    full_name: 'Aarav Mehta',
    role: 'student',
    is_active: true,
    email: 'aarav.mehta@pws.local',
    dob: '2010-08-22',
    admission_no: '0186/18',
    class_label: 'IX',
    section_label: 'E',
  },
  {
    id: 'p-student-3',
    login_id: '0187/18',
    full_name: 'Diya Sharma',
    role: 'student',
    is_active: true,
    email: 'diya.sharma@pws.local',
    dob: '2010-02-09',
    admission_no: '0187/18',
    class_label: 'IX',
    section_label: 'E',
  },
  {
    id: 'p-student-4',
    login_id: '0188/18',
    full_name: 'Kabir Singh',
    role: 'student',
    is_active: true,
    email: 'kabir.singh@pws.local',
    dob: '2010-11-30',
    admission_no: '0188/18',
    class_label: 'IX',
    section_label: 'E',
  },
  {
    id: 'p-student-5',
    login_id: '0189/18',
    full_name: 'Ishita Verma',
    role: 'student',
    is_active: true,
    email: 'ishita.verma@pws.local',
    dob: '2010-06-18',
    admission_no: '0189/18',
    class_label: 'IX',
    section_label: 'E',
  },
  {
    id: 'p-student-6',
    login_id: '0201/18',
    full_name: 'Vivaan Chugh',
    role: 'student',
    is_active: true,
    email: 'vivaan.chugh@pws.local',
    dob: '2015-03-11',
    admission_no: '0201/18',
    class_label: 'V',
    section_label: 'A',
    password: 'Student@11032015',
    sibling_id: 'p-student-1',
  },
  {
    id: 'p-student-7',
    login_id: '0190/18',
    full_name: 'Meera Nair',
    role: 'student',
    is_active: true,
    email: 'meera.nair@pws.local',
    dob: '2010-09-05',
    admission_no: '0190/18',
    class_label: 'IX',
    section_label: 'D',
  },
];

export const seedHomework: Homework[] = [
  {
    id: 'hw-1',
    title: 'AI practical file work',
    description:
      'Dear Students,\n\nKindly find the attached documents to complete the AI practical file.\n\nThanks',
    teacher_id: 'p-teacher-1',
    subject: 'Artificial Intelligence',
    section_label: 'IX - E',
    due_date: '2026-10-05',
    type: 'HOMEWORK',
    attachments: [
      { id: 'att-1', name: 'System Map Practical 2.pdf', size: '302.28 KB' },
      { id: 'att-2', name: 'Practical-1.pdf', size: '127.66 KB' },
    ],
    created_at: '2026-09-28T09:30:00.000Z',
  },
  {
    id: 'hw-2',
    title: 'Quadratic equations worksheet',
    description: 'Complete exercises 4.1 to 4.4 in the worksheet. Show all steps.',
    teacher_id: 'p-teacher-2',
    subject: 'Mathematics',
    section_label: 'IX - E',
    due_date: '2026-11-08',
    type: 'HOMEWORK',
    attachments: [{ id: 'att-3', name: 'Quadratic-equations.pdf', size: '184.10 KB' }],
    created_at: '2026-11-01T06:15:00.000Z',
  },
  {
    id: 'hw-3',
    title: 'Character sketch of Anne Frank',
    description: 'Write a 250-word character sketch. Use evidence from the text.',
    teacher_id: 'p-teacher-2',
    subject: 'English',
    section_label: 'IX - E',
    due_date: '2026-11-12',
    type: 'ASSIGNMENT',
    attachments: [],
    created_at: '2026-11-02T08:00:00.000Z',
  },
  {
    id: 'hw-4',
    title: 'Science lab report - Ohm\u2019s law',
    description: 'Submit the observation table, graph, and conclusion from the lab session.',
    teacher_id: 'p-teacher-1',
    subject: 'Science',
    section_label: 'IX - E',
    due_date: '2026-11-15',
    type: 'ASSIGNMENT',
    attachments: [{ id: 'att-4', name: 'Lab-format.pdf', size: '96.44 KB' }],
    created_at: '2026-11-03T05:45:00.000Z',
  },
];

export const seedSubmissions: Submission[] = [
  {
    id: 'sub-1',
    assignment_id: 'hw-2',
    student_id: 'p-student-1',
    body: 'Completed all four exercises and attached the scanned pages.',
    file_name: 'quadratic-worksheet-sahaj.pdf',
    submitted_at: '2026-11-03T10:20:00.000Z',
    status: 'submitted',
  },
];

export const seedLeaveRequests: LeaveRequest[] = [
  {
    id: 'leave-1',
    student_id: 'p-student-2',
    start_date: '2026-11-12',
    end_date: '2026-11-13',
    leave_type: 'Sick Leave',
    reason: 'Fever and throat infection. Doctor advised two days of rest.',
    status: 'pending',
    created_at: '2026-11-03T07:10:00.000Z',
  },
  {
    id: 'leave-2',
    student_id: 'p-student-3',
    start_date: '2026-11-18',
    end_date: '2026-11-18',
    leave_type: 'Casual Leave',
    reason: 'Family function outside the city.',
    status: 'pending',
    created_at: '2026-11-03T12:40:00.000Z',
  },
];

export const seedCourseProgress: CourseProgressEntry[] = [
  {
    id: 'cp-1',
    student_id: 'p-student-1',
    subject: 'Artificial Intelligence',
    title: 'Python and data handling',
    percent: 78,
    grade: 'A2',
    remarks: 'Consistent work. Needs to improve documentation.',
    teacher_id: 'p-teacher-1',
    updated_at: '2026-11-02T09:00:00.000Z',
  },
  {
    id: 'cp-2',
    student_id: 'p-student-1',
    subject: 'Mathematics',
    title: 'Polynomials and quadratic equations',
    percent: 85,
    grade: 'A1',
    remarks: 'Strong problem-solving. Keep practising word problems.',
    teacher_id: 'p-teacher-2',
    updated_at: '2026-11-01T09:00:00.000Z',
  },
  {
    id: 'cp-3',
    student_id: 'p-student-1',
    subject: 'English',
    title: 'Reading and writing skills',
    percent: 72,
    grade: 'B1',
    remarks: 'Good comprehension. Work on essay structure.',
    teacher_id: 'p-teacher-2',
    updated_at: '2026-10-28T09:00:00.000Z',
  },
  {
    id: 'cp-4',
    student_id: 'p-student-1',
    subject: 'Science',
    title: 'Motion, force and electricity',
    percent: 68,
    grade: 'B1',
    remarks: 'Practical work is improving. Revise numericals.',
    teacher_id: 'p-teacher-1',
    updated_at: '2026-10-26T09:00:00.000Z',
  },
];

export const seedDeclarations: DeclarationForm[] = [
  {
    id: 'dec-1',
    name: 'Transport Norms Declaration',
    description: 'Transport Norms Declaration',
    type: 'Transport',
    status: 'pending',
  },
  {
    id: 'dec-2',
    name: 'UNATTENDED FORM OF UNDERTAKING',
    description: 'UNATTENDED DEPARTURE CONSENT FORM',
    type: 'Transport',
    status: 'pending',
  },
  {
    id: 'dec-3',
    name: 'SELF-PICKUP FORM OF UNDERTAKING',
    description: 'Self-Pickup Authorization Form',
    type: 'Transport',
    status: 'signed',
    signed_at: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'dec-4',
    name: 'Declaration Form',
    description: 'Declaration Form',
    type: 'Registration',
    status: 'pending',
  },
  {
    id: 'dec-5',
    name: 'HEALTH CARD',
    description: 'HEALTH CARD',
    type: 'Registration',
    status: 'signed',
    signed_at: '2026-10-21T10:00:00.000Z',
  },
];

export const seedPolls: Poll[] = [];

export const seedEvents: SchoolEvent[] = [
  {
    id: 'ev-1',
    title: 'DEEPAWALI',
    description: 'DEEPAWALI',
    type: 'holiday',
    start_date: '2026-11-07',
    end_date: '2026-11-07',
    audience: 'Whole school',
    created_by: 'p-admin',
  },
  {
    id: 'ev-2',
    title: 'DEEPAWALI',
    description: 'DEEPAWALI',
    type: 'holiday',
    start_date: '2026-11-09',
    end_date: '2026-11-11',
    audience: 'Whole school',
    created_by: 'p-admin',
  },
  {
    id: 'ev-3',
    title: 'Parent Teacher Meeting',
    description: 'Term 1 parent-teacher meeting for Grades IX to XII.',
    type: 'meeting',
    start_date: '2026-11-14',
    end_date: '2026-11-14',
    audience: 'Grades IX-XII',
    created_by: 'p-admin',
  },
  {
    id: 'ev-4',
    title: 'Annual Sports Day',
    description: 'Inter-house athletics and team events.',
    type: 'event',
    start_date: '2026-11-21',
    end_date: '2026-11-21',
    audience: 'Whole school',
    created_by: 'p-admin',
  },
  {
    id: 'ev-5',
    title: 'GURU NANAK JAYANTI',
    description: 'GURU NANAK JAYANTI',
    type: 'holiday',
    start_date: '2026-11-24',
    end_date: '2026-11-24',
    audience: 'Whole school',
    created_by: 'p-admin',
  },
  {
    id: 'ev-6',
    title: 'GURU TEG BAHADUR MARTYRDOM DAY',
    description: 'GURU TEG BAHADUR MARTYRDOM DAY',
    type: 'holiday',
    start_date: '2026-11-25',
    end_date: '2026-11-25',
    audience: 'Whole school',
    created_by: 'p-admin',
  },
];

export const seedStudyMaterials: StudyMaterial[] = [];

export const seedBooks: Book[] = [
  {
    id: 'book-1',
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    accession_no: 'LIB-001',
    category: 'Fiction',
    total_copies: 5,
    available_copies: 4,
  },
  {
    id: 'book-2',
    title: 'Wings of Fire',
    author: 'A. P. J. Abdul Kalam',
    accession_no: 'LIB-002',
    category: 'Biography',
    total_copies: 3,
    available_copies: 2,
  },
  {
    id: 'book-3',
    title: 'NCERT Mathematics IX',
    author: 'NCERT',
    accession_no: 'LIB-003',
    category: 'Textbook',
    total_copies: 10,
    available_copies: 8,
  },
  {
    id: 'book-4',
    title: 'The Diary of a Young Girl',
    author: 'Anne Frank',
    accession_no: 'LIB-004',
    category: 'Biography',
    total_copies: 2,
    available_copies: 2,
  },
  {
    id: 'book-5',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    accession_no: 'LIB-005',
    category: 'Science',
    total_copies: 4,
    available_copies: 3,
  },
];

export const seedBookIssues: BookIssue[] = [
  {
    id: 'issue-1',
    book_id: 'book-1',
    student_id: 'p-student-1',
    issued_at: '2026-10-28',
    due_at: '2026-11-11',
    status: 'issued',
  },
];

export const seedReportCards: ReportCard[] = [
  {
    id: 'rc-1',
    student_id: 'p-student-1',
    term: 'HALF YEARLY',
    academic_year: ACADEMIC_YEAR,
    class_label: 'IX',
    section_label: 'E',
    subjects: [
      { subject: 'Artificial Intelligence', marks: 88, max_marks: 100 },
      { subject: 'Mathematics', marks: 92, max_marks: 100 },
      { subject: 'English', marks: 84, max_marks: 100 },
      { subject: 'Science', marks: 79, max_marks: 100 },
      { subject: 'Social Science', marks: 81, max_marks: 100 },
    ],
    total: 424,
    max_total: 500,
    percentage: 84.8,
    grade: 'A2',
    generated_at: '2026-11-03T01:11:07.000Z',
  },
];

export const seedFees: FeeInvoice[] = [
  {
    id: 'fee-1',
    student_id: 'p-student-1',
    term: 'Term 1',
    academic_year: ACADEMIC_YEAR,
    amount: 60000,
    discount: 0,
    paid: 30000,
    due_date: '2026-11-15',
    status: 'partial',
  },
  {
    id: 'fee-2',
    student_id: 'p-student-6',
    term: 'Term 1',
    academic_year: ACADEMIC_YEAR,
    amount: 60000,
    discount: 30000,
    paid: 30000,
    due_date: '2026-11-15',
    status: 'paid',
    sibling_of: 'p-student-1',
  },
];

export const seedSiblingLinks: SiblingLink[] = [
  {
    id: 'sib-1',
    student_id: 'p-student-1',
    sibling_id: 'p-student-6',
    discount_percent: 50,
  },
];

export const seedAttendance: AttendanceRecord[] = (() => {
  const records: AttendanceRecord[] = [];
  const start = new Date(2026, 10, 1);
  const end = new Date(2026, 10, 4);
  const days = eachDayOfInterval({ start, end });
  for (const day of days) {
    const date = format(day, 'yyyy-MM-dd');
    const sunday = isSunday(day);
    for (const person of seedPeople.filter((candidate) => candidate.role === 'student')) {
      let status: AttendanceRecord['status'] = 'present';
      if (sunday) status = 'holiday';
      else if (date === '2026-11-04' && person.id === 'p-student-4') status = 'absent';
      records.push({
        id: `att-${person.id}-${date}`,
        student_id: person.id,
        date,
        status,
      });
    }
  }
  return records;
})();

export const seedNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Fee payment reminder',
    body: 'Term 1 balance is due on 15 November 2026.',
    kind: 'fee',
    created_at: '2026-11-03T04:00:00.000Z',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'New assignment published',
    body: 'Anuradha Gupta posted AI practical file work.',
    kind: 'assignment',
    created_at: '2026-11-02T08:30:00.000Z',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Report card published',
    body: 'Your Half Yearly report card is ready to download.',
    kind: 'notice',
    created_at: '2026-11-01T06:00:00.000Z',
    read: true,
  },
];

export const seedThreads: ChatThread[] = [
  {
    id: 'thread-1',
    subject: 'Reminder: Purchase of Social Science Textbook',
    participant_ids: ['p-teacher-2', 'p-student-1'],
    created_at: '2026-11-03T06:00:00.000Z',
    messages: [
      {
        id: 'msg-1',
        sender_id: 'p-teacher-2',
        body: 'Please purchase the Social Science textbook before Monday. We will begin the new chapter in the next class.',
        created_at: '2026-11-03T06:00:00.000Z',
      },
    ],
  },
];

export const seedCirculars: Circular[] = [];

export const seedGallery: GalleryAlbum[] = [
  {
    id: 'gal-1',
    title: 'Campus Life',
    description: 'A glimpse of everyday learning at Pacific World School.',
    cover: '/brand/campus-1.jpg',
    photos: ['/brand/campus-1.jpg', '/brand/campus-2.jpg'],
  },
  {
    id: 'gal-2',
    title: 'Annual Day',
    description: 'Performances, awards, and celebrations.',
    cover: '/brand/campus-2.jpg',
    photos: ['/brand/campus-2.jpg', '/brand/campus-1.jpg'],
  },
  {
    id: 'gal-3',
    title: 'Sports Meet',
    description: 'Inter-house athletics and team spirit.',
    cover: '/brand/campus-1.jpg',
    photos: ['/brand/campus-1.jpg'],
  },
];
