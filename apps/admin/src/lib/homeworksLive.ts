import type {
  Assignment,
  AssignmentSection,
  Class,
  Section,
  Subject,
  Submission as DatabaseSubmission,
  TeachingAssignment,
  Database,
} from '@schoolerp/shared';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Homework, Submission } from './types';

const MAX_SUBMISSION_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_SUBMISSION_FILES: Record<string, readonly string[]> = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export type LiveAssignmentRow = Assignment & {
  kind: 'HOMEWORK' | 'ASSIGNMENT';
  subject_id: string | null;
};

export interface AssignmentTargetOption {
  sectionId: string;
  sectionLabel: string;
  subjectId: string;
  subject: string;
}

export interface LiveHomeworkRows {
  assignments: LiveAssignmentRow[];
  assignmentSections: AssignmentSection[];
  sections: Section[];
  classes: Class[];
  subjects: Subject[];
  submissions: DatabaseSubmission[];
  teachingAssignments: TeachingAssignment[];
}

export interface MappedLiveHomeworkRows {
  homework: Homework[];
  submissions: Submission[];
  targets: AssignmentTargetOption[];
}

export interface PublishLiveAssignmentInput {
  title: string;
  description: string;
  dueDate: string;
  kind: 'HOMEWORK' | 'ASSIGNMENT';
  target: AssignmentTargetOption;
}

export interface SubmitLiveAssignmentInput {
  assignmentId: string;
  studentId: string;
  body: string;
  file?: File;
  existingFilePath?: string;
}

type HomeworksClient = SupabaseClient<Database>;
type RpcCall = (
  functionName: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

const rpcCall = (client: HomeworksClient): RpcCall => client.rpc.bind(client) as unknown as RpcCall;

function fileNameFromPath(path: string): string {
  return path.split('/').filter(Boolean).at(-1) ?? 'attachment';
}

export function mapLiveHomeworkRows(rows: LiveHomeworkRows): MappedLiveHomeworkRows {
  const classes = new Map(rows.classes.map((entry) => [entry.id, entry]));
  const sections = new Map(rows.sections.map((entry) => [entry.id, entry]));
  const subjects = new Map(rows.subjects.map((entry) => [entry.id, entry]));

  const sectionLabel = (sectionId: string) => {
    const section = sections.get(sectionId);
    const schoolClass = section ? classes.get(section.class_id) : undefined;
    return section && schoolClass ? `${schoolClass.name} - ${section.name}` : 'Individual';
  };

  const homework = rows.assignments.map<Homework>((assignment) => {
    const target = rows.assignmentSections.find((entry) => entry.assignment_id === assignment.id);
    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.instructions ?? '',
      teacher_id: assignment.teacher_id,
      subject: assignment.subject_id ? subjects.get(assignment.subject_id)?.name ?? 'General' : 'General',
      section_label: target ? sectionLabel(target.section_id) : 'Individual',
      due_date: assignment.due_at?.slice(0, 10) ?? assignment.created_at.slice(0, 10),
      type: assignment.kind,
      attachments: assignment.attachment_path
        ? [
            {
              id: assignment.attachment_path,
              name: fileNameFromPath(assignment.attachment_path),
              size: '',
            },
          ]
        : [],
      created_at: assignment.created_at,
    };
  });

  const submissions = rows.submissions.map<Submission>((submission) => ({
    id: submission.id,
    assignment_id: submission.assignment_id,
    student_id: submission.student_id,
    body: submission.body ?? '',
    file_name: submission.file_path ? fileNameFromPath(submission.file_path) : undefined,
    file_path: submission.file_path ?? undefined,
    submitted_at: submission.submitted_at,
    status: submission.status,
  }));

  const targets = rows.teachingAssignments
    .map<AssignmentTargetOption | null>((entry) => {
      const subject = subjects.get(entry.subject_id);
      const section = sections.get(entry.section_id);
      const schoolClass = section ? classes.get(section.class_id) : undefined;
      if (!subject || !section || !schoolClass) return null;
      return {
        sectionId: section.id,
        sectionLabel: `${schoolClass.name} - ${section.name}`,
        subjectId: subject.id,
        subject: subject.name,
      };
    })
    .filter((entry): entry is AssignmentTargetOption => entry !== null);

  return { homework, submissions, targets };
}

export function validateSubmissionFile(file: File): void {
  if (file.size > MAX_SUBMISSION_FILE_SIZE) {
    throw new Error('Submission files must be 10 MB or smaller.');
  }

  const allowedExtensions = ALLOWED_SUBMISSION_FILES[file.type];
  if (!allowedExtensions) {
    throw new Error('Submission files must be PDF, JPEG, PNG, or DOCX.');
  }

  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension || !allowedExtensions.includes(extension)) {
    throw new Error('The file extension does not match its content type.');
  }
}

export function storagePathForSubmission(
  userId: string,
  file: File,
  uploadId: string = crypto.randomUUID(),
): string {
  validateSubmissionFile(file);
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  return `${userId}/${uploadId}-${safeName}`;
}

export async function loadLiveHomeworkRows(
  client: HomeworksClient,
  userId: string,
  role: 'admin' | 'teacher' | 'student',
): Promise<MappedLiveHomeworkRows> {
  const [assignmentsResult, submissionsResult, sectionsResult, classesResult, subjectsResult] = await Promise.all([
    client.from('assignments').select('*').order('published_at', { ascending: false }),
    client.from('submissions').select('*').order('submitted_at', { ascending: false }),
    client.from('sections').select('*'),
    client.from('classes').select('*'),
    client.from('subjects').select('*'),
  ]);

  if (
    assignmentsResult.error ||
    submissionsResult.error ||
    sectionsResult.error ||
    classesResult.error ||
    subjectsResult.error
  ) {
    throw new Error('Could not load homeworks. Please try again.');
  }

  const assignments = (assignmentsResult.data ?? []) as LiveAssignmentRow[];
  const assignmentIds = assignments.map((assignment) => assignment.id);
  const assignmentSectionsResult = assignmentIds.length
    ? await client.from('assignment_sections').select('*').in('assignment_id', assignmentIds)
    : { data: [] as AssignmentSection[], error: null };
  const teachingAssignmentsResult =
    role === 'teacher'
      ? await client.from('teaching_assignments').select('*').eq('teacher_id', userId)
      : { data: [] as TeachingAssignment[], error: null };

  if (assignmentSectionsResult.error || teachingAssignmentsResult.error) {
    throw new Error('Could not load homework targets. Please try again.');
  }

  return mapLiveHomeworkRows({
    assignments,
    assignmentSections: assignmentSectionsResult.data ?? [],
    sections: sectionsResult.data ?? [],
    classes: classesResult.data ?? [],
    subjects: subjectsResult.data ?? [],
    submissions: submissionsResult.data ?? [],
    teachingAssignments: teachingAssignmentsResult.data ?? [],
  });
}

export async function publishLiveAssignment(
  client: HomeworksClient,
  input: PublishLiveAssignmentInput,
): Promise<void> {
  const { error } = await rpcCall(client)('publish_assignment', {
    p_title: input.title.trim(),
    p_instructions: input.description.trim() || null,
    p_due_at: `${input.dueDate}T23:59:59.999Z`,
    p_kind: input.kind,
    p_subject_id: input.target.subjectId,
    p_section_ids: [input.target.sectionId],
    p_student_ids: [] as string[],
    p_attachment_path: null,
  });

  if (error) throw new Error('Could not publish the assignment. Please check the target and try again.');
}

export async function submitLiveAssignment(
  client: HomeworksClient,
  input: SubmitLiveAssignmentInput,
  createUploadId: () => string = () => crypto.randomUUID(),
): Promise<void> {
  let uploadedPath: string | null = null;

  if (input.file) {
    uploadedPath = storagePathForSubmission(input.studentId, input.file, createUploadId());
    const { error } = await client.storage.from('submission-files').upload(uploadedPath, input.file, {
      contentType: input.file.type,
      upsert: false,
    });
    if (error) throw new Error('Could not upload the submission file. Please try again.');
  }

  const { error } = await rpcCall(client)('submit_assignment', {
    p_assignment_id: input.assignmentId,
    p_body: input.body.trim() || null,
    p_file_path: uploadedPath,
  });

  if (error) {
    if (uploadedPath) await client.storage.from('submission-files').remove([uploadedPath]);
    throw new Error('Could not submit the assignment. Please try again.');
  }

  if (uploadedPath && input.existingFilePath && input.existingFilePath !== uploadedPath) {
    await client.storage.from('submission-files').remove([input.existingFilePath]);
  }
}

export async function createSubmissionDownloadUrl(client: HomeworksClient, path: string): Promise<string> {
  const { data, error } = await client.storage.from('submission-files').createSignedUrl(path, 60);
  if (error || !data?.signedUrl) throw new Error('Could not open the submission file. Please try again.');
  return data.signedUrl;
}
