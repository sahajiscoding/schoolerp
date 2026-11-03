import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Role } from '@schoolerp/shared';

interface AuthContextType {
  profile: Profile | null;
  sessionUserId: string | null;
  loading: boolean;
  signIn: (loginId: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  requireRole: (roles: Role[]) => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isStudent: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSessionUserId(data.session?.user.id ?? null);
      if (data.session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single();
        setProfile(prof ?? null);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setSessionUserId(session?.user.id ?? null);
      if (session?.user) {
        const { data: prof } = await supabase
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
      sub.unsubscribe();
    };
  }, []);

  const signIn = async (loginId: string, password: string) => {
    const email = `${loginId.toLowerCase()}@pws.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSessionUserId(null);
  };

  const requireRole = (roles: Role[]) => !!profile && roles.includes(profile.role);
  const isAdmin = () => profile?.role === 'admin';
  const isTeacher = () => profile?.role === 'teacher';
  const isStudent = () => profile?.role === 'student';

  return (
    <AuthContext.Provider value={{ profile, sessionUserId, loading, signIn, signOut, requireRole, isAdmin, isTeacher, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
}
