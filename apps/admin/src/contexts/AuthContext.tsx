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
import { seedPeople } from '../lib/seed';
import { clearDemoSession, getDemoRole, isDemoSession, setDemoSession } from '../lib/demoSession';
import type { Profile, Role } from '@schoolerp/shared';

/**
 * Passwordless demo entry maps each role to a real seeded profile (`seed.ts`).
 * The `id` MUST be the seeded person id — every "my …" screen looks the
 * signed-in user up by id, so a synthetic id would leave the student's fees,
 * attendance and leaves empty.
 *
 * No credentials exist anywhere in the client: the demo button picks a seeded
 * identity directly. A demo session is browser-only (`sessionStorage` flag +
 * `localStorage` demo store) and never touches Supabase — see
 * `lib/demoSession.ts` and `lib/supabase.ts`. It is available whether or not
 * Supabase is configured; a live build can offer both a real sign-in and an
 * isolated demo, and the two never share a session.
 */
function demoProfileFor(role: Role): Profile | null {
  const person = seedPeople.find((p) => p.role === role && p.is_active);
  if (!person) return null;
  return {
    id: person.id,
    role: person.role,
    full_name: person.full_name,
    login_id: person.login_id,
    must_change_password: false,
    is_active: true,
    avatar_path: null,
    created_at: new Date().toISOString(),
  };
}

interface AuthContextType {
  profile: Profile | null;
  sessionUserId: string | null;
  loading: boolean;
  demoMode: boolean;
  configError: string | null;
  signIn: (loginId: string, password: string) => Promise<{ error: string | null }>;
  /** Passwordless demo entry; browser-only session, never touches Supabase. */
  signInAsDemo: (role: Role) => { error: string | null };
  signOut: () => Promise<void>;
  requireRole: (roles: Role[]) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
  viewAsRole: (role: Role | null) => void;
  viewingRole: Role | null;
  /** True while this tab is in a browser-only demo session. */
  inDemo: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // A persisted demo session restores its seeded profile without touching
  // Supabase, so a reload mid-demo stays browser-only.
  const [inDemo, setInDemo] = useState<boolean>(() => isDemoSession());
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (!isDemoSession()) return null;
    const role = getDemoRole();
    return role ? demoProfileFor(role) : null;
  });
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => profile?.id ?? null);
  // Without a Supabase client (unconfigured build or demo session) there is no
  // session to wait for, so start out resolved rather than flipping `loading`
  // inside an effect (which cascades renders on mount).
  const [loading, setLoading] = useState<boolean>(() => !isDemoSession() && Boolean(supabase));
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  // `demoMode` keeps its historic meaning for callers (demo-only build), while
  // `inDemo` is the explicit browser-only session flag. Banner/entry UI show
  // for either; real Supabase auth only runs when neither applies.
  const demoMode = missingSupabaseConfig() || inDemo;
  const configError = missingSupabaseConfig() && !inDemo ? configHint() : null;

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
    // Demo sessions never init Supabase auth — no getSession, no listener, no
    // network. The seeded profile from the initial state is the whole session,
    // and `loading` already starts false (see above).
    if (inDemo || isDemoSession()) {
      return undefined;
    }
    let mounted = true;
    const client = supabase;
    if (!client) {
      // `loading` already starts false in this case; nothing to await.
      return undefined;
    }

    client.auth.getSession().then(async ({ data, error }) => {
      if (!mounted || isDemoSession()) return;
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
      if (!mounted || isDemoSession()) return;
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
  }, [inDemo]);

  const signIn = useCallback(
    async (loginId: string, password: string) => {
      // Demo sessions are browser-only: never start a real auth session
      // while one is active. Exit the demo first.
      if (isDemoSession()) {
        return {
          error: 'You are in demo mode. Exit the demo (sign out) to sign in with your school account.',
        };
      }
      // Without a Supabase client there is no real authentication to perform.
      // The passwordless demo button is the only way in — the client must never
      // decide identity against a live backend in demo mode.
      if (!supabase) {
        return {
          error:
            'Supabase is not configured. Use "Try a demo" below to explore with sample data, or set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env.',
        };
      }
      const email = toAuthEmail(loginId);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [],
  );

  /**
   * Passwordless demo sign-in for showcasing the console. Always available
   * (even when Supabase is configured) because it never creates a Supabase
   * session: the profile is local UI state over the browser-local demo store
   * (`appData.tsx` + `localStorage`), the `sessionStorage` demo flag blocks
   * every Supabase call, and no real data is reachable. Exiting the demo
   * clears the flag and returns to the real sign-in.
   */
  const signInAsDemo = useCallback((role: Role): { error: string | null } => {
    const demoProfile = demoProfileFor(role);
    if (!demoProfile) {
      return { error: `No demo ${role} account is seeded.` };
    }
    setDemoSession(role);
    setInDemo(true);
    setSessionUserId(demoProfile.id);
    setProfile(demoProfile);
    setViewingRole(null);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoSession()) {
      // Exit demo: clear the browser-only flag, never touch Supabase auth.
      clearDemoSession();
      setInDemo(false);
      setProfile(null);
      setSessionUserId(null);
      setViewingRole(null);
      return;
    }
    if (supabase) await supabase.auth.signOut();
    setProfile(null);
    setSessionUserId(null);
    setViewingRole(null);
  }, []);

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
        signInAsDemo,
        signOut,
        requireRole,
        isAdmin,
        isTeacher,
        isStudent,
        viewAsRole,
        viewingRole,
        inDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
