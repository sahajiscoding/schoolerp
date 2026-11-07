import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import {
  createSubmissionDownloadUrl,
  loadLiveHomeworkRows,
  publishLiveAssignment,
  submitLiveAssignment,
  type AssignmentTargetOption,
  type MappedLiveHomeworkRows,
} from './homeworksLive';
import { supabase } from './supabase';
import type { Homework } from './types';

const EMPTY_LIVE_DATA: MappedLiveHomeworkRows = { homework: [], submissions: [], targets: [] };

export interface SubmitHomeworkInput {
  assignment_id: string;
  student_id: string;
  body: string;
  file?: File;
  existing_file_path?: string;
}

export function useHomeworksData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);
  const [liveData, setLiveData] = useState<MappedLiveHomeworkRows>(EMPTY_LIVE_DATA);
  const [loading, setLoading] = useState(liveEnabled);
  const [error, setError] = useState<string | null>(null);

  const demoHomework = useMemo(() => {
    if (profile?.role !== 'student') return demo.homework;
    const student = demo.people.find((person) => person.id === profile.id);
    const section = student?.class_label && student.section_label
      ? `${student.class_label} - ${student.section_label}`
      : null;
    return section ? demo.homework.filter((homework) => homework.section_label === section) : [];
  }, [demo.homework, demo.people, profile]);

  const demoTargets = useMemo<AssignmentTargetOption[]>(() => {
    if (profile?.role !== 'teacher') return [];
    return demo.teachingAssignments
      .filter((entry) => entry.teacher_id === profile.id)
      .map((entry) => ({
        sectionId: entry.section_label,
        sectionLabel: entry.section_label,
        subjectId: demo.subjects.find((subject) => subject.name === entry.subject)?.id ?? entry.subject,
        subject: entry.subject,
      }));
  }, [demo.subjects, demo.teachingAssignments, profile]);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadLiveHomeworkRows(supabase, profile.id, profile.role);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load homeworks.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchLiveData, liveEnabled]);

  const refresh = useCallback(async () => {
    const next = await fetchLiveData();
    if (next) setLiveData(next);
  }, [fetchLiveData]);

  const addAssignment = useCallback(
    async (input: Omit<Homework, 'id' | 'created_at'>) => {
      if (!liveEnabled || isDemoSession()) {
        demo.addAssignment(input);
        return;
      }
      if (!supabase || profile?.role !== 'teacher') {
        throw new Error('Only a teacher can publish homework.');
      }
      const target = liveData.targets.find(
        (entry) => entry.sectionLabel === input.section_label && entry.subject === input.subject,
      );
      if (!target) throw new Error('Choose a section and subject assigned to you.');

      await publishLiveAssignment(supabase, {
        title: input.title,
        description: input.description,
        dueDate: input.due_date,
        kind: input.type,
        target,
      });
      await refresh();
      demo.notify('Assignment published.');
    },
    [demo, liveData.targets, liveEnabled, profile?.role, refresh],
  );

  const submitAssignment = useCallback(
    async (input: SubmitHomeworkInput) => {
      if (!liveEnabled || isDemoSession()) {
        demo.submitAssignment({
          assignment_id: input.assignment_id,
          student_id: input.student_id,
          body: input.body,
          file_name: input.file?.name ?? input.existing_file_path?.split('/').at(-1),
        });
        return;
      }
      if (!supabase || profile?.role !== 'student' || profile.id !== input.student_id) {
        throw new Error('Only the targeted student can submit this homework.');
      }
      await submitLiveAssignment(supabase, {
        assignmentId: input.assignment_id,
        studentId: profile.id,
        body: input.body,
        file: input.file,
        existingFilePath: input.existing_file_path,
      });
      await refresh();
      demo.notify('Assignment submitted.');
    },
    [demo, liveEnabled, profile, refresh],
  );

  const openSubmissionFile = useCallback(async (path: string) => {
    if (!liveEnabled || !supabase || isDemoSession()) {
      throw new Error('Demo files are labels only and are not uploaded.');
    }
    return createSubmissionDownloadUrl(supabase, path);
  }, [liveEnabled]);

  return {
    homework: liveEnabled ? liveData.homework : demoHomework,
    submissions: liveEnabled ? liveData.submissions : demo.submissions,
    targets: liveEnabled ? liveData.targets : demoTargets,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addAssignment,
    submitAssignment,
    openSubmissionFile,
    refresh,
  };
}
