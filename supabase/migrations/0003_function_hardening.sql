-- 0003_function_hardening.sql
--
-- Narrow EXECUTE on the SECURITY DEFINER helper functions.
--
-- `search_path` is already pinned inside `0001`/`0002` (`SET search_path = ''`
-- plus schema-qualified bodies). What remains is the default grant: Postgres
-- gives EXECUTE on a new function to PUBLIC, which includes `anon`. These
-- helpers all key off `auth.uid()`, so an unauthenticated caller gets `false`
-- or `null` rather than data — but there is no reason to expose them at all.
--
-- Revoking from PUBLIC and granting only to `authenticated` keeps the helpers
-- usable inside RLS policies (which evaluate as the querying role) while
-- removing them from the anonymous surface. Supabase's database linter reports
-- the un-narrowed version as "function_search_path_mutable" /
-- over-broad EXECUTE grants.

REVOKE ALL ON FUNCTION public.app_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.teaches_section(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_enrolled(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_thread_participant(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.class_teacher_of_section(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_class_teacher_of(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.teaches_student(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.teaches_section(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_enrolled(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_thread_participant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.class_teacher_of_section(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_teacher_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.teaches_student(uuid) TO authenticated;
