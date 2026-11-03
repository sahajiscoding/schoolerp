import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FiPlus, FiTrash2, FiEdit3, FiLock, FiRefreshCw } from 'react-icons/fi';

type Person = { id: string; full_name: string; login_id: string; role: string; is_active: boolean };

export default function People() {
  const { isAdmin } = useAuth();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: '', login_id: '', role: 'student' as const, password: '' });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setPeople(data ?? []);
      setLoading(false);
    });
  }, []);

  const createPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = `${form.login_id.toLowerCase()}@pws.local`;
    const { data, error } = await supabase.auth.admin
      ? await supabase.auth.admin.createUser({ email, password: form.password || 'Schoolerpc2026!', user_metadata: { full_name: form.full_name } })
      : { data: null, error: new Error('admin client unavailable') };
    if (error) { alert(error.message); return; }
    await supabase.from('profiles').insert({ id: data.user!.id, role: form.role, full_name: form.full_name, login_id: form.login_id, is_active: true, must_change_password: true });
    setPeople([...people, { id: data.user!.id, full_name: form.full_name, login_id: form.login_id, role: form.role, is_active: true }]);
    setForm({ full_name: '', login_id: '', role: 'student', password: '' });
    setOpen(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('profiles').update({ is_active: active }).eq('id', id);
    setPeople(people.map((p) => p.id === id ? { ...p, is_active: active } : p));
  };

  if (!isAdmin()) return <div className="p-4 text-terracotta">Admin only</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-ink">People</h1>
        <button onClick={() => setOpen(true)} className="bg-terracotta text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <FiPlus size={16} /> Add person
        </button>
      </div>
      {loading ? <div className="text-muted">Loading...</div> : (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl border border-sand/30">
            <thead>
              <tr className="border-b border-sand/20">
                <th className="text-left p-3 text-sm font-medium text-muted">Name</th>
                <th className="text-left p-3 text-sm font-medium text-muted">Login ID</th>
                <th className="text-left p-3 text-sm font-medium text-muted">Role</th>
                <th className="text-left p-3 text-sm font-medium text-muted">Status</th>
                <th className="text-right p-3 text-sm font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id} className="border-b border-sand/10 hover:bg-cream/50">
                  <td className="p-3 text-sm">{p.full_name}</td>
                  <td className="p-3 text-sm text-muted">{p.login_id}</td>
                  <td className="p-3 text-sm">{p.role}</td>
                  <td className="p-3 text-sm">
                    <button onClick={() => toggleActive(p.id, !p.is_active)} className="flex items-center gap-1 text-xs">
                      {p.is_active ? 'Active' : 'Inactive'} <FiLock size={12} />
                    </button>
                  </td>
                  <td className="p-3 text-sm text-right">
                    <button className="text-muted hover:text-ink" title="Edit"><FiEdit3 size={14} /></button>
                    <button className="ml-2 text-terracotta hover:text-terracotta/80" title="Delete"><FiTrash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-ink mb-4">Create person</h2>
            <form onSubmit={createPerson} className="space-y-3">
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Login ID (e.g. ADMIN001)" value={form.login_id} onChange={(e) => setForm({ ...form, login_id: e.target.value })} />
              <select className="w-full px-3 py-2 border rounded-lg" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
              <input type="password" className="w-full px-3 py-2 border rounded-lg" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-terracotta text-white rounded-lg text-sm">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
