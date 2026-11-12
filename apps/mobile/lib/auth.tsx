import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getSupabaseClient, type SupabaseClient } from './supabase';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'pws.session';
const PROFILE_KEY = 'pws.profile';

export type Role = 'admin' | 'teacher' | 'student';

export interface AuthContextType {
  supabase: SupabaseClient | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (loginId: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  isAuthenticated: () => boolean;
}

interface Profile {
  id: string;
  role: Role;
  full_name: string;
  login_id: string;
  must_change_password: boolean;
  is_active: boolean;
  avatar_path: string | null;
  created_at: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const client = getSupabaseClient();
        if (!mounted) return;
        setSupabaseClient(client);

        // Restore session from secure store
        const stored = await SecureStore.getItemAsync(SESSION_KEY);
        if (client && stored) {
          const { data, error } = await client.auth.setSession({
            access_token: stored,
            refresh_token: stored,
          });
          if (!error && data.session) {
            const { data: prof } = await client
              .from('profiles')
              .select('*')
              .eq('id', data.session.user.id)
              .single();
            if (prof) setProfile(prof as Profile);
          }
        }
      } catch {
        // Demo mode or no config: client is null, no session
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = async (loginId: string, password: string) => {
    if (!supabaseClient) return { error: 'Supabase not configured' };
    // Map school login ID to internal email
    const email = `${loginId.toLowerCase()}@pws.local`;
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) return { error: error?.message ?? 'Login failed' };

    const { data: prof } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    if (!prof) return { error: 'Profile not found' };

    setProfile(prof as Profile);
    await SecureStore.setItemAsync(SESSION_KEY, data.session?.access_token ?? '');
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(prof));
    return { error: null };
  };

  const signOut = async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
    await SecureStore.deleteItemAsync(SESSION_KEY);
    await SecureStore.deleteItemAsync(PROFILE_KEY);
    setProfile(null);
  };

  const changePassword = async (newPassword: string) => {
    if (!supabaseClient) return { error: 'Supabase not configured' };
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    if (profile) {
      const updated = { ...profile, must_change_password: false };
      setProfile(updated);
      await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(updated));
    }
    return { error: null };
  };

  const isAuthenticated = () => !!profile;

  return (
    <AuthContext.Provider
      value={{ supabase: supabaseClient, profile, loading, signIn, signOut, changePassword, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
