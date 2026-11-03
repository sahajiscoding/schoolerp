import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { profile, isAdmin, isTeacher } = useAuth();
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    supabase
      .from('profiles')
      .select('role', { count: 'exact' })
      .then(({ count }) => setStats((s) => ({ ...s, users: count })));
  }, []);

  const roleView = isAdmin() ? 'Admin' : isTeacher() ? 'Teacher' : 'Student';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-muted">Role: {profile?.role}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-sand/30 shadow-sm">
          <div className="text-muted text-sm">Total users</div>
          <div className="text-2xl font-bold text-ink">{stats.users ?? '—'}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-sand/30 shadow-sm">
          <div className="text-muted text-sm">Your role</div>
          <div className="text-2xl font-bold text-terracotta">{roleView}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-sand/30 shadow-sm">
          <div className="text-muted text-sm">Status</div>
          <div className="text-2xl font-bold text-ink">{profile?.is_active ? 'Active' : 'Inactive'}</div>
        </div>
      </div>
    </div>
  );
}
