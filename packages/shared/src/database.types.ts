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
  kind: 'HOMEWORK' | 'ASSIGNMENT';
  subject_id: string | null;
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
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile>; Relationships: [] };
      classes: { Row: Class; Insert: Partial<Class>; Update: Partial<Class>; Relationships: [] };
      sections: { Row: Section; Insert: Partial<Section>; Update: Partial<Section>; Relationships: [] };
      subjects: { Row: Subject; Insert: Partial<Subject>; Update: Partial<Subject>; Relationships: [] };
      teaching_assignments: { Row: TeachingAssignment; Insert: Partial<TeachingAssignment>; Update: Partial<TeachingAssignment>; Relationships: [] };
      enrollments: { Row: Enrollment; Insert: Partial<Enrollment>; Update: Partial<Enrollment>; Relationships: [] };
      assignments: { Row: Assignment; Insert: Partial<Assignment>; Update: Partial<Assignment>; Relationships: [] };
      assignment_sections: { Row: AssignmentSection; Insert: Partial<AssignmentSection>; Update: Partial<AssignmentSection>; Relationships: [] };
      assignment_students: { Row: AssignmentStudent; Insert: Partial<AssignmentStudent>; Update: Partial<AssignmentStudent>; Relationships: [] };
      submissions: { Row: Submission; Insert: Partial<Submission>; Update: Partial<Submission>; Relationships: [] };
      threads: { Row: Thread; Insert: Partial<Thread>; Update: Partial<Thread>; Relationships: [] };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message>; Relationships: [] };
      notices: { Row: Notice; Insert: Partial<Notice>; Update: Partial<Notice>; Relationships: [] };
      notice_recipients: { Row: NoticeRecipient; Insert: Partial<NoticeRecipient>; Update: Partial<NoticeRecipient>; Relationships: [] };
      push_tokens: { Row: PushToken; Insert: Partial<PushToken>; Update: Partial<PushToken>; Relationships: [] };
      notification_jobs: { Row: NotificationJob; Insert: Partial<NotificationJob>; Update: Partial<NotificationJob>; Relationships: [] };
      audit_log: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog>; Relationships: [] };
    };
    Views: {
      assignment_recipients: { Row: { student_id: string }; Relationships: [] };
      unread_counts: { Row: { user_id: string; unread_notices: number; unread_messages: number }; Relationships: [] };
    };
    Functions: {
      app_role: { Args: never; Returns: string };
      is_admin: { Args: never; Returns: boolean };
      teaches_section: { Args: { p_section_id: string }; Returns: boolean };
      is_enrolled: { Args: { p_student_id: string }; Returns: boolean };
      is_thread_participant: { Args: { p_thread_id: string }; Returns: boolean };
      is_assignment_recipient: {
        Args: { p_assignment_id: string; p_student_id: string };
        Returns: boolean;
      };
      publish_assignment: {
        Args: {
          p_title: string;
          p_instructions: string | null;
          p_due_at: string;
          p_kind: 'HOMEWORK' | 'ASSIGNMENT';
          p_subject_id: string;
          p_section_ids: string[];
          p_student_ids: string[];
          p_attachment_path: string | null;
        };
        Returns: Assignment;
      };
      submit_assignment: {
        Args: { p_assignment_id: string; p_body: string | null; p_file_path: string | null };
        Returns: Submission;
      };
      review_submission: { Args: { p_submission_id: string }; Returns: Submission };
    };
    CompositeTypes: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
}
