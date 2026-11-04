import { useState, useMemo, type ReactNode } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { cn, initials } from '../lib/utils';
import {
  Button,
  Badge,
  Breadcrumbs,
  NotificationsDropdown,
  RoleSwitcher,
} from './ui';
import {
  FiHome,
  FiClipboard,
  FiBookOpen,
  FiSend,
  FiCalendar,
  FiFileText,
  FiCreditCard,
  FiFolder,
  FiImage,
  FiUsers,
  FiLayout,
  FiBarChart2,
  FiPieChart,
  FiLogOut,
  FiShield,
  FiMenu,
} from 'react-icons/fi';

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'teacher' | 'student')[];
};

const ADMIN_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: FiHome, roles: ['admin', 'teacher', 'student'] },
  { to: '/approvals', label: 'Approvals', icon: FiClipboard, roles: ['admin', 'teacher', 'student'] },
  { to: '/course-progress', label: 'Course Progress', icon: FiBarChart2, roles: ['admin', 'teacher', 'student'] },
  { to: '/communications', label: 'Communications', icon: FiSend, roles: ['admin', 'teacher', 'student'] },
  { to: '/events', label: 'Events & Calendars', icon: FiCalendar, roles: ['admin', 'teacher', 'student'] },
  { to: '/assignments', label: 'Assignments / Homework', icon: FiFileText, roles: ['admin', 'teacher', 'student'] },
  { to: '/study-room', label: 'Study Room', icon: FiFolder, roles: ['admin', 'teacher', 'student'] },
  { to: '/library', label: 'My Library', icon: FiBookOpen, roles: ['admin', 'teacher', 'student'] },
  { to: '/report-card', label: 'My Report Card', icon: FiGraduationCap, roles: ['admin', 'teacher', 'student'] },
  { to: '/attendance', label: 'My Attendance', icon: FiPieChart, roles: ['admin', 'teacher', 'student'] },
  { to: '/fees', label: 'My Fee', icon: FiCreditCard, roles: ['admin', 'teacher', 'student'] },
  { to: '/gallery', label: 'School Gallery', icon: FiImage, roles: ['admin', 'teacher', 'student'] },
  { to: '/people', label: 'People', icon: FiUsers, roles: ['admin'] },
  { to: '/classes', label: 'Classes', icon: FiLayout, roles: ['admin'] },
  { to: '/audit-log', label: 'Audit Log', icon: FiShield, roles: ['admin'] },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const {
    profile,
    viewAsRole,
    viewingRole,
    demoMode,
    configError,
    signOut,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = viewingRole ?? profile?.role ?? 'student';

  const navItems = useMemo(() => {
    return ADMIN_NAV.filter((item) => item.roles.includes(role as any));
  }, [role]);

  const breadcrumbItems = useMemo(() => {
    const labelByRoute: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/approvals': 'Approvals',
      '/course-progress': 'Course Progress',
      '/communications': 'Communications',
      '/events': 'Events & Calendars',
      '/assignments': 'Assignments / Homework',
      '/study-room': 'Study Room',
      '/library': 'My Library',
      '/report-card': 'My Report Card',
      '/attendance': 'My Attendance',
      '/fees': 'My Fee',
      '/gallery': 'School Gallery',
      '/people': 'People',
      '/classes': 'Classes',
      '/audit-log': 'Audit Log',
    };
    const parts: { label: string; to?: string }[] = [];
    const segments = location.pathname.split('/').filter(Boolean);
    let path = '';
    for (const seg of segments) {
      path += `/${seg}`;
      parts.push({ label: labelByRoute[path] ?? seg.charAt(0).toUpperCase() + seg.slice(1), to: path });
    }
    return parts;
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-sand text-ink overflow-hidden">
      {/* Mobile sidebar overlay */}
      <aside
        className={cn(
          'fixed inset-0 z-40 bg-ink/90 text-white flex flex-col w-72 transform transition-transform duration-200',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:translate-x-0 md:z-0 md:bg-transparent md:text-ink md:block',
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 md:border-b-0 md:py-0 md:px-0 md:hidden">
          <span className="text-sm font-bold tracking-wider uppercase">PWS</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white/60 hover:text-white"
          >
            <FiMenu size={20} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-1 md:px-6 md:space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-olive text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white',
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-olive flex items-center justify-center text-xs font-bold">
              {initials(profile?.full_name ?? 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{profile?.full_name ?? 'User'}</div>
              <div className="text-xs text-slate-400 truncate">{profile?.login_id ?? ''}</div>
            </div>
            <Badge variant="olive" className="text-[10px]">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="w-full mt-3 text-sm text-slate-300 hover:text-white">
            <FiLogOut size={16} className="mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-sand/30 bg-white">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sand/20">
          <span className="text-xl font-bold text-ink tracking-tight">PACIFIC WORLD</span>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-olive/5 text-olive font-medium border-r-2 border-olive'
                    : 'text-slate-600 hover:bg-sand/50 hover:text-ink',
                )}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sand/20">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-olive flex items-center justify-center text-xs font-bold text-white">
              {initials(profile?.full_name ?? 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-ink truncate">{profile?.full_name ?? 'User'}</div>
              <div className="text-xs text-muted truncate">{profile?.login_id ?? ''}</div>
            </div>
            <Badge variant="olive" className="text-[10px]">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          </div>
          {demoMode && (
            <div className="mt-3 p-2 rounded-lg bg-amber-50 border border-amber-100">
              <div className="text-xs text-amber-700 font-medium">Demo mode</div>
              <div className="text-[10px] text-amber-600 mt-0.5">
                Supabase not configured — using demo credentials.
              </div>
            </div>
          )}
          <Button variant="outline" onClick={handleLogout} className="w-full mt-3 text-sm text-terracotta border-terracotta/20 hover:bg-terracotta/5">
            <FiLogOut size={16} className="mr-2" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="flex items-center justify-between px-6 py-4 border-b border-sand/30 bg-white z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen((open) => !open)}
              className="md:hidden p-2 text-slate-500 hover:text-ink"
              aria-label="Toggle sidebar"
            >
              <FiMenu size={20} />
            </button>
            <span className="text-lg font-bold text-ink hidden md:block">Pacific World School</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {configError && (
              <Badge variant="terracotta" className="text-[10px] cursor-help" title={configError}>
                ⚠ Config
              </Badge>
            )}
            <NotificationsDropdown
              notifications={[]}
              onMarkRead={() => {}}
              onMarkAllRead={() => {}}
            />
            <RoleSwitcher
              roles={['admin', 'teacher', 'student']}
              current={viewingRole}
              onChange={viewAsRole}
            />
            <div className="flex items-center gap-2 pl-2 border-l border-sand/20">
              <div className="w-8 h-8 rounded-full bg-olive flex items-center justify-center text-[10px] font-bold text-white">
                {initials(profile?.full_name ?? 'U')}
              </div>
            </div>
          </div>
        </header>

        <div className="px-6 py-3 shrink-0">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

        <footer className="px-6 py-3 border-t border-sand/30 bg-white text-xs text-muted shrink-0">
          Pacific World School ERP &nbsp;·&nbsp; {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
