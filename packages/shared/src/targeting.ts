export type AudienceType = 'school' | 'role' | 'section' | 'user';

export interface SectionTarget {
  sectionId: string;
}

export interface UserTarget {
  userId: string;
}

export interface RoleTarget {
  role: 'admin' | 'teacher' | 'student';
}

export interface AssignmentTarget {
  sections: SectionTarget[];
  students: UserTarget[];
}

export interface MessageTarget {
  students: UserTarget[];
}

export interface NoticeTarget {
  type: AudienceType;
  role?: 'admin' | 'teacher' | 'student';
  sectionId?: string;
  userIds: string[];
}

export function validateAssignmentTarget(
  target: AssignmentTarget,
  teachingAssignments: { teacherId: string; sectionId: string }[],
  enrollments: { studentId: string; sectionId: string }[],
  teacherId: string,
): { valid: boolean; error?: string } {
  for (const s of target.sections) {
    const teaches = teachingAssignments.some(
      (ta) => ta.teacherId === teacherId && ta.sectionId === s.sectionId,
    );
    if (!teaches) {
      return { valid: false, error: `Teacher does not teach section ${s.sectionId}` };
    }
  }

  const teachableSectionIds = new Set(
    teachingAssignments
      .filter((ta) => ta.teacherId === teacherId)
      .map((ta) => ta.sectionId),
  );

  for (const u of target.students) {
    const enrolledInTeachable = enrollments.some(
      (e) => e.studentId === u.userId && teachableSectionIds.has(e.sectionId),
    );
    if (!enrolledInTeachable) {
      return { valid: false, error: `Student ${u.userId} not enrolled in a taught section` };
    }
  }

  return { valid: true };
}

export function dedupeStudents(target: AssignmentTarget): string[] {
  const sectionStudentIds = new Set<string>();
  for (const s of target.sections) {
    // resolved at query time via view; here we just track section intent
    sectionStudentIds.add(s.sectionId);
  }
  const studentIds = target.students.map((u) => u.userId);
  return Array.from(new Set(studentIds));
}

export function expandNoticeAudience(target: NoticeTarget, users: { id: string; role: string }[]): string[] {
  switch (target.type) {
    case 'school':
      return users.map((u) => u.id);
    case 'role':
      return users.filter((u) => u.role === target.role).map((u) => u.id);
    case 'section':
      return target.userIds;
    case 'user':
      return target.userIds;
    default:
      return [];
  }
}

export function validateMessageTarget(
  target: MessageTarget,
  enrollments: { studentId: string; sectionId: string }[],
  teachingAssignments: { teacherId: string; sectionId: string }[],
  teacherId: string,
): { valid: boolean; error?: string } {
  const teachableSectionIds = new Set(
    teachingAssignments
      .filter((ta) => ta.teacherId === teacherId)
      .map((ta) => ta.sectionId),
  );

  for (const u of target.students) {
    const enrolled = enrollments.some(
      (e) => e.studentId === u.userId && teachableSectionIds.has(e.sectionId),
    );
    if (!enrolled) {
      return { valid: false, error: `Student ${u.userId} not reachable by teacher` };
    }
  }

  return { valid: true };
}
