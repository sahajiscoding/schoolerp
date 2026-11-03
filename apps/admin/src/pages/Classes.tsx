import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Classes() {
  const { isAdmin } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  useEffect(() => {
    supabase.from('classes').select('*').order('sort_order').then(({ data }) => setClasses(data ?? []));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await (supabase.from('classes') as any).insert({ name, sort_order: parseInt(sortOrder) });
    if (error) { alert(error.message); return; }
    setName(''); setSortOrder('0');
    supabase.from('classes').select('*').order('sort_order').then(({ data }) => setClasses(data ?? []));
  };

  if (!isAdmin()) return <div className="p-4 text-terracotta">Admin only</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-ink">Classes</h1>
      <form onSubmit={add} className="flex gap-2 items-end">
        <input className="px-3 py-2 border rounded-lg flex-1" placeholder="Class name (e.g. Grade 8)" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="number" className="px-3 py-2 border rounded-lg w-20" placeholder="Order" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        <button className="bg-terracotta text-white px-4 py-2 rounded-lg text-sm"><FiPlus size={16} /></button>
      </form>
      <div className="bg-white rounded-xl border border-sand/30 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-sand/20 bg-sand/20">
              <th className="text-left p-3 text-sm font-medium text-muted">Name</th>
              <th className="text-left p-3 text-sm font-medium text-muted">Sort order</th>
              <th className="text-right p-3 text-sm font-medium text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id} className="border-b border-sand/10 hover:bg-cream/50">
                <td className="p-3 text-sm">{c.name}</td>
                <td className="p-3 text-sm text-muted">{c.sort_order}</td>
                <td className="p-3 text-sm text-right"><button className="text-terracotta hover:text-terracotta/80"><FiTrash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
