import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase, configHint, missingSupabaseConfig } from '../lib/supabase';
import { toAuthEmail } from '../lib/utils';
import type { Profile, Role } from '@schoolerp/shared';
import { useAppData } from '../lib/appData';

/**
 * Demo accounts map to real seeded profiles (`seed.ts`). The `id` MUST be the
 * seeded person id — every "my …" screen looks the signed-in user up by id, so
 * a synthetic id would leave the student's fees, attendance and leaves empty.
 */
const DEMO_LOGINS: Record<
  string,
  { password: string; role: Role; full_name: string; login_id: string; id: string }
> = {
  ADMIN001: {
    password: 'Admin@1234',
    role: 'admin',
    full_name: 'School Administrator',
    login_id: 'ADMIN001',
    id: 'p-admin',
  },
  TCH001: {
    password: 'Teacher@1234',
    role: 'teacher',
    full_name: 'Anuradha Gupta',
    login_id: 'TCH001',
    id: 'p-teacher-1',
  },
  '0185/18': {
    password: 'Student@14052010',
    role: 'student',
    full_name: 'Sahaj Chugh',
    login_id: '0185/18',
    id: 'p-student-1',
  },
};

interface AuthContextType {
  profile: Profile | null;
  sessionUserId: string | null;
  loading: boolean;
  demoMode: boolean;
  configError: string | null;
  signIn: (loginId: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  requireRole: (roles: Role[]) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
  viewAsRole: (role: Role | null) => void;
  viewingRole: Role | null;
}

export { useAppData };

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  // Without a Supabase client there is no session to wait for, so start out
  // resolved rather than flipping `loading` inside an effect (which cascades
  // renders on mount).
  const [loading, setLoading] = useState(() => !missingSupabaseConfig());
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  const demoMode = missingSupabaseConfig();
  const configError = demoMode ? configHint() : null;

  // Resolve the "effective" role for display/authorisation: explicit view-as
  // override wins, then the real profile role.
  const effectiveRole = useMemo(() => {
    if (viewingRole) return viewingRole;
    return profile?.role ?? null;
  }, [viewingRole, profile]);

  const isAdmin = () => effectiveRole === 'admin';
  const isTeacher = () => effectiveRole === 'teacher';
  const isStudent = () => effectiveRole === 'student';
  const requireRole = (roles: Role[]) => !!effectiveRole && roles.includes(effectiveRole);

  useEffect(() => {
    let mounted = true;
    const client = supabase;
    if (!client) {
      // `loading` already starts false in this case; nothing to await.
      return undefined;
    }

    client.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setLoading(false);
        return;
      }
      setSessionUserId(data.session?.user.id ?? null);
      if (data.session?.user) {
        const { data: prof } = await client
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
        setProfile(prof ?? null);
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    const { data: sub } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSessionUserId(session?.user.id ?? null);
      if (session?.user) {
        const { data: prof } = await client
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(prof ?? null);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (loginId: string, password: string) => {
      // Demo path: exact credentials without hitting Supabase.
      const demo = DEMO_LOGINS[loginId];
      if (demo && demo.password === password) {
        setSessionUserId(demo.id);
        setProfile({
          id: demo.id,
          role: demo.role,
          full_name: demo.full_name,
          login_id: demo.login_id,
          must_change_password: false,
          is_active: true,
          avatar_path: null,
          created_at: new Date().toISOString(),
        });
        return { error: null };
      }

      if (!supabase) {
        return { error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.' };
      }

      const email = toAuthEmail(loginId);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase],
  );

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setSessionUserId(null);
    setViewingRole(null);
  }, [supabase]);

  const viewAsRole = useCallback((role: Role | null) => {
    setViewingRole(role);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        profile,
        sessionUserId,
        loading,
        demoMode,
        configError,
        signIn,
        signOut,
        requireRole,
        isAdmin,
        isTeacher,
        isStudent,
        viewAsRole,
        viewingRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
