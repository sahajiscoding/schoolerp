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
import { isDemoPath, readDemoRole, saveDemoRole } from '../lib/demo';
import { seedPeople } from '../lib/seed';
import type { Profile, Role } from '@schoolerp/shared';

/**
 * Passwordless demo entry maps each role to a real seeded profile (`seed.ts`).
 * The `id` MUST be the seeded person id — every "my …" screen looks the
 * signed-in user up by id, so a synthetic id would leave the student's fees,
 * attendance and leaves empty.
 *
 * No credentials exist anywhere in the client: the demo button picks a seeded
 * identity only inside the isolated /demo app, where no Supabase client is
 * created. School-account identity always comes from Supabase Auth.
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
  /** Opens the isolated showcase; never creates a real auth session. */
  signInAsDemo: (role: Role) => { error: string | null };
  signOut: () => Promise<void>;
  requireRole: (roles: Role[]) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
  viewAsRole: (role: Role | null) => void;
  viewingRole: Role | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(() => {
    const role = readDemoRole();
    return role ? demoProfileFor(role) : null;
  });
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  // Without a Supabase client there is no session to wait for, so start out
  // resolved rather than flipping `loading` inside an effect (which cascades
  // renders on mount).
  const [loading, setLoading] = useState(() => !!supabase);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);

  const demoMode = isDemoPath || missingSupabaseConfig();
  const configError = isDemoPath ? null : configHint();

  useEffect(() => {
    if (!isDemoPath) return;
    saveDemoRole(profile?.role ?? null);
    // The entry URL works even without storage; subsequent navigation uses
    // tab-local sessionStorage, not the real account's persisted session.
    const url = new URL(window.location.href);
    if (url.searchParams.has('role')) {
      url.searchParams.delete('role');
      window.history.replaceState(window.history.state, '', url);
    }
  }, [profile]);

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
    // Read through a closure: this can change while a profile query awaits.
    const isMounted = () => mounted;
    const client = supabase;
    if (!client) {
      // `loading` already starts false in this case; nothing to await.
      return undefined;
    }

    client.auth.getSession().then(async ({ data, error }) => {
      if (!isMounted()) return;
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
        if (isMounted()) setProfile(prof ?? null);
      }
      setLoading(false);
    }).catch(() => {
      if (isMounted()) setLoading(false);
    });

    const { data: sub } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted()) return;
      setSessionUserId(session?.user.id ?? null);
      if (session?.user) {
        const { data: prof } = await client
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (isMounted()) setProfile(prof ?? null);
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
      // Without a Supabase client there is no real authentication to perform.
      // Demo identities are local and never passed to Supabase Auth.
      if (isDemoPath) {
        return { error: 'You are in the demo. Use School sign in for your real account.' };
      }
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

  /** Enter via a full load so live auth callbacks cannot overwrite demo state. */
  const signInAsDemo = useCallback((role: Role): { error: string | null } => {
    const demoProfile = demoProfileFor(role);
    if (!demoProfile) {
      return { error: `No demo ${role} account is seeded.` };
    }
    if (!isDemoPath) {
      window.location.assign(`/demo/dashboard?role=${role}`);
      return { error: null };
    }
    setSessionUserId(null); // No authenticated backend user in a demo.
    setViewingRole(null);
    setProfile(demoProfile);
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (isDemoPath) saveDemoRole(null);
    else if (supabase) await supabase.auth.signOut();
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
