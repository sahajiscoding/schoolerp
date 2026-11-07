import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from './appData';
import { isDemoSession } from './demoSession';
import { loadCourseProgressData, type MappedCourseProgressData } from './courseProgressLive';
import { supabase } from './supabase';
import type { CourseProgressEntry } from './types';

const EMPTY_COURSE_PROGRESS_DATA: MappedCourseProgressData = { entries: [] };

export function useCourseProgressData() {
  const demo = useAppData();
  const { profile, inDemo } = useAuth();
  const [liveData, setLiveData] = useState<MappedCourseProgressData>(EMPTY_COURSE_PROGRESS_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const liveEnabled = Boolean(profile && !inDemo && !isDemoSession() && supabase);

  const demoEntries = useMemo<CourseProgressEntry[]>(() => demo.courseProgress, [
    demo.courseProgress,
  ]);

  const fetchLiveData = useCallback(async () => {
    if (!liveEnabled || !profile || !supabase) return null;
    return loadCourseProgressData(supabase, profile.id, profile.role);
  }, [liveEnabled, profile]);

  useEffect(() => {
    if (!liveEnabled) return undefined;
    let active = true;
    void fetchLiveData()
      .then((next) => {
        if (active && next) setLiveData(next);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : 'Could not load course progress.');
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

  const addCourseGoal = useCallback(
    async (input: {
      student_id: string;
      subject_id: string;
      title: string;
      description: string | null;
      percent: number;
      grade: string | null;
      remarks: string | null;
      due_date: string | null;
    }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.addProgress({
          student_id: input.student_id,
          subject: input.subject_id,
          title: input.title,
          percent: input.percent,
          grade: input.grade ?? '',
          remarks: input.remarks ?? '',
          teacher_id: profile?.id ?? '',
        });
        return;
      }
      if (!supabase || (profile?.role !== 'admin' && profile?.role !== 'teacher')) {
        throw new Error('Only staff may add course goals.');
      }
      const { error } = await (supabase.rpc as any)('goal_add', {
        p_student_id: input.student_id,
        p_subject_id: input.subject_id,
        p_title: input.title.trim(),
        p_description: input.description,
        p_percent: input.percent,
        p_grade: input.grade,
        p_remarks: input.remarks,
        p_due_date: input.due_date,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [demo, liveEnabled, profile?.role, refresh, supabase]
  );

  const updateCourseGoal = useCallback(
    async (input: { goal_id: string; current_percent: number | null; grade: string | null; remarks: string | null }) => {
      if (!liveEnabled || isDemoSession()) {
        demo.updateCourseGoal(
          input.goal_id,
          input.current_percent,
          input.grade,
          input.remarks,
        );
        return;
      }
      if (!supabase || (profile?.role !== 'admin' && profile?.role !== 'teacher')) {
        throw new Error('Only staff may update course goals.');
      }
      const { error } = await (supabase.rpc as any)('goal_update', {
        p_goal_id: input.goal_id,
        p_current_percent: input.current_percent,
        p_grade: input.grade,
        p_remarks: input.remarks,
      });
      if (error) throw new Error(error.message);
      await refresh();
    },
    [demo, liveEnabled, profile?.role, refresh, supabase]
  );

  const entries = useMemo(() => (liveEnabled ? liveData.entries : demoEntries), [
    liveEnabled,
    liveData.entries,
    demoEntries,
  ]);

  return {
    entries,
    loading: liveEnabled ? loading : false,
    error: liveEnabled ? error : null,
    isLive: liveEnabled,
    notify: demo.notify,
    addCourseGoal,
    updateCourseGoal,
    refresh,
  };
}
