export type Role = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  login_id: string;
  must_change_password: boolean;
  is_active: boolean;
  avatar_path: string | null;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Section {
  id: string;
  class_id: string;
  name: string;
  academic_year: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface TeachingAssignment {
  id: string;
  teacher_id: string;
  section_id: string;
  subject_id: string;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  section_id: string;
  roll_no: string | null;
  academic_year: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  teacher_id: string;
  title: string;
  instructions: string | null;
  due_at: string | null;
  attachment_path: string | null;
  published_at: string;
  created_at: string;
}

export interface AssignmentSection {
  assignment_id: string;
  section_id: string;
}

export interface AssignmentStudent {
  assignment_id: string;
  student_id: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  body: string | null;
  file_path: string | null;
  submitted_at: string;
  status: 'submitted' | 'reviewed';
  reviewed_at: string | null;
}

export interface Thread {
  id: string;
  teacher_id: string;
  student_id: string;
  subject: string;
  campaign_id: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export interface Notice {
  id: string;
  created_by: string;
  title: string;
  body: string;
  published_at: string;
  created_at: string;
}

export interface NoticeRecipient {
  notice_id: string;
  user_id: string;
  read_at: string | null;
}

export interface PushToken {
  id: string;
  user_id: string;
  expo_token: string;
  platform: 'ios' | 'android';
  created_at: string;
}

export interface NotificationJob {
  id: string;
  kind: string;
  entity_id: string;
  recipient_id: string;
  idempotency_key: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      classes: { Row: Class; Insert: Partial<Class>; Update: Partial<Class> };
      sections: { Row: Section; Insert: Partial<Section>; Update: Partial<Section> };
      subjects: { Row: Subject; Insert: Partial<Subject>; Update: Partial<Subject> };
      teaching_assignments: { Row: TeachingAssignment; Insert: Partial<TeachingAssignment>; Update: Partial<TeachingAssignment> };
      enrollments: { Row: Enrollment; Insert: Partial<Enrollment>; Update: Partial<Enrollment> };
      assignments: { Row: Assignment; Insert: Partial<Assignment>; Update: Partial<Assignment> };
      assignment_sections: { Row: AssignmentSection; Insert: Partial<AssignmentSection>; Update: Partial<AssignmentSection> };
      assignment_students: { Row: AssignmentStudent; Insert: Partial<AssignmentStudent>; Update: Partial<AssignmentStudent> };
      submissions: { Row: Submission; Insert: Partial<Submission>; Update: Partial<Submission> };
      threads: { Row: Thread; Insert: Partial<Thread>; Update: Partial<Thread> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      notices: { Row: Notice; Insert: Partial<Notice>; Update: Partial<Notice> };
      notice_recipients: { Row: NoticeRecipient; Insert: Partial<NoticeRecipient>; Update: Partial<NoticeRecipient> };
      push_tokens: { Row: PushToken; Insert: Partial<PushToken>; Update: Partial<PushToken> };
      notification_jobs: { Row: NotificationJob; Insert: Partial<NotificationJob>; Update: Partial<NotificationJob> };
      audit_log: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
    };
    Views: {
      assignment_recipients: { Row: { student_id: string } };
      unread_counts: { Row: { user_id: string; unread_notices: number; unread_messages: number } };
    };
    Functions: {
      current_role: { Returns: string };
      is_admin: { Returns: boolean };
      teaches_section: { Args: { section_id: string }; Returns: boolean };
      is_enrolled: { Args: { student_id: string }; Returns: boolean };
      is_thread_participant: { Args: { thread_id: string }; Returns: boolean };
    };
  };
}
