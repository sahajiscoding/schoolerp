import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiLogOut, FiUsers, FiGrid, FiBookOpen, FiSend, FiEye, FiClipboard } from 'react-icons/fi';

export default function Layout() {
  const { signOut, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
    ...(isAdmin()
      ? [
          { to: '/people', label: 'People', icon: FiUsers },
          { to: '/classes', label: 'Classes', icon: FiGrid },
          { to: '/subjects', label: 'Subjects', icon: FiBookOpen },
          { to: '/teaching-assignments', label: 'Teaching Assignments', icon: FiSend },
          { to: '/enrollments', label: 'Enrollments', icon: FiClipboard },
          { to: '/broadcast', label: 'Broadcast Notice', icon: FiSend },
          { to: '/oversight', label: 'Oversight', icon: FiEye },
          { to: '/audit-log', label: 'Audit Log', icon: FiClipboard },
        ]
      : [
          { to: '/teacher/assignments', label: 'Assignments', icon: FiBookOpen },
          { to: '/teacher/threads', label: 'Threads', icon: FiSend },
        ]),
    { to: '/logout', label: 'Logout', icon: FiLogOut, isLogout: true },
  ];

  return (
    <div className="flex h-screen bg-sand text-ink overflow-hidden">
      <aside className="w-64 bg-olive text-white flex flex-col">
        <div className="p-6 font-bold text-xl border-b border-terracotta/30">
          Pacific World
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.to}
              onClick={() => {
                if (item.isLogout) {
                  signOut();
                  navigate('/login');
                } else {
                  navigate(item.to);
                }
              }}
              className={`flex items-center gap-3 px-6 py-3 text-left rounded-lg transition ${
                item.isLogout ? 'text-white/80 hover:bg-brand-hover' : 'text-white hover:bg-brand-hover'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 text-xs text-white/60 border-t border-white/10">
          {profile?.full_name} · {profile?.role}
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-cream p-6">
        <Outlet />
      </main>
    </div>
  );
}
