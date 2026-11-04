export type Role = 'admin' | 'teacher' | 'student';

export interface Person {
  id: string;
  login_id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  email: string;
  phone?: string;
  dob?: string;
  admission_no?: string;
  class_label?: string;
  section_label?: string;
  /** Students only: initial password (`Student@DDMMYYYY`). */
  password?: string;
  /** Teachers only: owns leave approvals for this section. */
  class_teacher_of?: string;
  /** Sibling profile id, when the family has two children in school. */
  sibling_id?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  color: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  url?: string;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  subject: string;
  section_label: string;
  due_date: string;
  type: 'HOMEWORK' | 'ASSIGNMENT';
  attachments: Attachment[];
  created_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  body: string;
  file_name?: string;
  submitted_at: string;
  status: 'submitted' | 'reviewed';
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type LeaveType = 'Sick Leave' | 'Casual Leave' | 'Medical Leave' | 'Emergency Leave' | 'Long Leave';

export interface LeaveRequest {
  id: string;
  student_id: string;
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  reason: string;
  status: LeaveStatus;
  attachment_name?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_note?: string;
  created_at: string;
}

export interface CourseProgressEntry {
  id: string;
  student_id: string;
  subject: string;
  title: string;
  percent: number;
  grade: string;
  remarks: string;
  teacher_id: string;
  updated_at: string;
}

export interface DeclarationForm {
  id: string;
  name: string;
  description: string;
  type: string;
  status: 'pending' | 'signed';
  signed_at?: string;
}

export interface PollOption {
  id: string;
  label: string;
}

export interface Poll {
  id: string;
  question: string;
  audience: string;
  created_by: string;
  created_at: string;
  closes_at: string;
  options: PollOption[];
  votes: Record<string, string>;
}

export type EventType = 'holiday' | 'event' | 'exam' | 'meeting';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  start_date: string;
  end_date: string;
  audience: string;
  created_by: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  subject: string;
  section_label: string;
  file_name: string;
  file_size: string;
  type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  accession_no: string;
  category: string;
  total_copies: number;
  available_copies: number;
}

export interface BookIssue {
  id: string;
  book_id: string;
  student_id: string;
  issued_at: string;
  due_at: string;
  returned_at?: string;
  status: 'issued' | 'returned' | 'reserved';
}

export interface ReportSubject {
  subject: string;
  marks: number;
  max_marks: number;
}

export interface ReportCard {
  id: string;
  student_id: string;
  term: string;
  academic_year: string;
  class_label: string;
  section_label: string;
  subjects: ReportSubject[];
  total: number;
  max_total: number;
  percentage: number;
  grade: string;
  generated_at: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'holiday' | 'medical' | 'prep';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
}

export interface FeeInvoice {
  id: string;
  student_id: string;
  term: string;
  academic_year: string;
  amount: number;
  discount: number;
  paid: number;
  due_date: string;
  status: 'paid' | 'partial' | 'unpaid';
  sibling_of?: string;
}

export interface SiblingLink {
  id: string;
  student_id: string;
  sibling_id: string;
  discount_percent: number;
}

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string;
  cover: string;
  photos: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: 'notice' | 'message' | 'assignment' | 'fee' | 'approval';
  created_at: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface ChatThread {
  id: string;
  subject: string;
  participant_ids: string[];
  messages: ChatMessage[];
  created_at: string;
}

export interface ImportRow {
  full_name: string;
  admission_no: string;
  dob: string;
  class_label?: string;
  section_label?: string;
  password: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  sortOrder: number;
  sections: string[];
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  target: string;
  at: string;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  body: string;
  section_label: string;
  created_by: string;
  created_at: string;
}
