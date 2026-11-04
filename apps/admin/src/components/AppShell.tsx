import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import { cn, initials } from '../lib/utils';
import { Badge, Breadcrumbs, NotificationsDropdown, RoleSwitcher } from './ui';
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
  FiAward,
  FiX,
} from 'react-icons/fi';

type Role = 'admin' | 'teacher' | 'student';

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  /** Labels change with the viewer so a student never sees "All students". */
  labelByRole?: Partial<Record<Role, string>>;
  roles: Role[];
};

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: FiHome, roles: ['admin', 'teacher', 'student'] },
  {
    to: '/approvals',
    label: 'Approvals',
    labelByRole: { student: 'My Leaves', teacher: 'Leave Approvals', admin: 'Leave Approvals' },
    icon: FiClipboard,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/course-progress',
    label: 'Course Progress',
    labelByRole: { student: 'My Progress', teacher: 'Course Progress', admin: 'Course Progress' },
    icon: FiBarChart2,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/communications',
    label: 'Communications',
    labelByRole: { student: 'Inbox', teacher: 'Communications', admin: 'Communications' },
    icon: FiSend,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/events',
    label: 'Events & Calendar',
    icon: FiCalendar,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/assignments',
    label: 'Assignments',
    labelByRole: {
      student: 'Assignments / Homework',
      teacher: 'Class Assignments',
      admin: 'Assignments',
    },
    icon: FiFileText,
    roles: ['admin', 'teacher', 'student'],
  },
  { to: '/study-room', label: 'Study Room', icon: FiFolder, roles: ['admin', 'teacher', 'student'] },
  {
    to: '/library',
    label: 'My Library',
    labelByRole: { teacher: 'Library', admin: 'Library' },
    icon: FiBookOpen,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/report-card',
    label: 'My Report Card',
    labelByRole: { teacher: 'Report Cards', admin: 'Report Cards' },
    icon: FiAward,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/attendance',
    label: 'My Attendance',
    labelByRole: { teacher: 'Attendance', admin: 'Attendance' },
    icon: FiPieChart,
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/fees',
    label: 'My Fee',
    labelByRole: { teacher: 'Fees', admin: 'Fee Collection' },
    icon: FiCreditCard,
    roles: ['admin', 'teacher', 'student'],
  },
  { to: '/gallery', label: 'School Gallery', icon: FiImage, roles: ['admin', 'teacher', 'student'] },
  // Administration — never shown to student view.
  { to: '/people', label: 'People', icon: FiUsers, roles: ['admin'] },
  { to: '/classes', label: 'Classes', icon: FiLayout, roles: ['admin'] },
  { to: '/subjects', label: 'Subjects', icon: FiBookOpen, roles: ['admin'] },
  {
    to: '/teaching-assignments',
    label: 'Teaching Assignments',
    icon: FiSend,
    roles: ['admin'],
  },
  { to: '/enrollments', label: 'Enrollments', icon: FiClipboard, roles: ['admin'] },
  { to: '/audit-log', label: 'Audit Log', icon: FiShield, roles: ['admin'] },
];

const GROUP_LABEL: Record<string, string> = {
  main: 'My school',
  admin: 'Administration',
};

export default function AppShell({ children }: { children?: ReactNode }) {
  const { profile, viewAsRole, viewingRole, demoMode, configError, signOut, isAdmin } = useAuth();
  const data = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const role: Role = viewingRole ?? profile?.role ?? 'student';

  useEffect(() => {
    setSidebarOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const mainNav = useMemo(
    () => NAV.filter((item) => item.roles.includes(role) && !item.to.match(/^\/(people|classes|subjects|teaching-assignments|enrollments|audit-log)$/)),
    [role],
  );
  const adminNav = useMemo(
    () => NAV.filter((item) => item.roles.includes(role) && item.to.match(/^\/(people|classes|subjects|teaching-assignments|enrollments|audit-log)$/)),
    [role],
  );

  const routeLabels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/approvals': role === 'student' ? 'My Leaves' : 'Leave Approvals',
    '/course-progress': role === 'student' ? 'My Progress' : 'Course Progress',
    '/communications': role === 'student' ? 'Inbox' : 'Communications',
    '/events': 'Events & Calendar',
    '/assignments': 'Assignments',
    '/study-room': 'Study Room',
    '/library': 'Library',
    '/report-card': 'Report Cards',
    '/attendance': 'Attendance',
    '/fees': role === 'student' ? 'My Fee' : 'Fee Collection',
    '/gallery': 'School Gallery',
    '/people': 'People',
    '/classes': 'Classes',
    '/subjects': 'Subjects',
    '/teaching-assignments': 'Teaching Assignments',
    '/enrollments': 'Enrollments',
    '/audit-log': 'Audit Log',
  };

  const breadcrumbItems = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const parts: { label: string; to?: string }[] = [{ label: 'Home', to: '/dashboard' }];
    let path = '';
    for (const seg of segments) {
      path += `/${seg}`;
      parts.push({
        label: routeLabels[path] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
        to: path,
      });
    }
    return parts;
  }, [location.pathname, role]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const pendingLeaves = data.leaves.filter((l) => l.status === 'pending').length;
  const unread = data.notifications.filter((n) => !n.read).length;

  const badgeFor = (to: string) => {
    if (to === '/approvals' && role !== 'student' && pendingLeaves > 0) return pendingLeaves;
    return undefined;
  };

  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const active = location.pathname === item.to;
      const label = item.labelByRole?.[role] ?? item.label;
      const count = badgeFor(item.to);
      return (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
            active
              ? 'bg-olive text-white shadow-sm'
              : 'text-slate-600 hover:bg-olive/5 hover:text-olive',
          )}
        >
          <item.icon
            className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-olive')}
          />
          <span className="truncate">{label}</span>
          {count !== undefined && (
            <span
              className={cn(
                'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                active ? 'bg-white/20 text-white' : 'bg-terracotta/10 text-terracotta',
              )}
            >
              {count}
            </span>
          )}
        </Link>
      );
    });

  const sidebarBody = (
    <>
      <div className="flex items-center gap-3 border-b border-sand/60 px-5 py-5">
        <img src="/brand/pws-logo.png" alt="" className="h-9 w-9 rounded-full object-contain" />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight text-ink">Pacific World</div>
          <div className="truncate text-[10px] uppercase tracking-wider text-muted">School ERP</div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto text-slate-400 hover:text-ink md:hidden"
          aria-label="Close menu"
        >
          <FiX size={18} />
        </button>
      </div>

      <nav className="scroll-slim flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {GROUP_LABEL.main}
          </div>
          <div className="space-y-0.5">{renderNav(mainNav)}</div>
        </div>
        {adminNav.length > 0 && (
          <div>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {GROUP_LABEL.admin}
            </div>
            <div className="space-y-0.5">{renderNav(adminNav)}</div>
          </div>
        )}
      </nav>

      <div className="border-t border-sand/60 px-4 py-3">
        {demoMode && (
          <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 p-2.5">
            <div className="text-[11px] font-semibold text-amber-800">Demo data</div>
            <div className="mt-0.5 text-[10px] leading-snug text-amber-700">
              Supabase keys are not set, so the console runs on the seeded school.
            </div>
            <button
              onClick={() => data.resetDemoData()}
              className="mt-1.5 text-[10px] font-medium text-amber-800 underline decoration-amber-300 underline-offset-2"
            >
              Reset demo data
            </button>
          </div>
        )}
        <div className="flex items-center gap-2.5 rounded-lg bg-sand/50 px-2.5 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-olive text-[10px] font-bold text-white">
            {initials(profile?.full_name ?? 'U')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-ink">{profile?.full_name ?? 'User'}</div>
            <div className="truncate text-[10px] text-muted">{profile?.login_id ?? ''}</div>
          </div>
          <Badge variant="olive" className="text-[9px] capitalize">
            {role}
          </Badge>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-terracotta transition-colors hover:bg-terracotta/5"
        >
          <FiLogOut size={14} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-sand text-ink">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-sand/60 bg-white transition-transform duration-200 md:relative md:z-0 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarBody}
      </aside>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <header className="z-20 flex shrink-0 items-center gap-3 border-b border-sand/60 bg-white px-4 py-3 md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-sand hover:text-ink md:hidden"
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>

          <div className="hidden md:block">
            <div className="text-[10px] uppercase tracking-widest text-muted">Pacific World School</div>
            <div className="text-sm font-semibold text-ink">
              {routeLabels[location.pathname] ?? 'Dashboard'}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {configError && (
              <Badge variant="terracotta" className="hidden cursor-help text-[10px] sm:inline-flex" title={configError}>
                Config
              </Badge>
            )}
            {isAdmin() && (
              <RoleSwitcher
                roles={['admin', 'teacher', 'student']}
                current={viewingRole}
                onChange={viewAsRole}
              />
            )}
            <div className="relative">
              <NotificationsDropdown
                notifications={data.notifications}
                onMarkRead={data.markNotificationRead}
                onMarkAllRead={data.markAllNotificationsRead}
                open={notifOpen}
                onToggle={() => setNotifOpen((v) => !v)}
              />
              {unread === 0 && <span className="sr-only">No unread notifications</span>}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-olive/10 text-xs font-bold text-olive">
              {initials(profile?.full_name ?? 'U')}
            </div>
          </div>
        </header>

        <div className="shrink-0 px-4 pt-3 md:px-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <main className="scroll-slim flex-1 overflow-y-auto px-4 pb-8 pt-2 md:px-6">
          {children ?? <Outlet />}
        </main>

        <footer className="shrink-0 border-t border-sand/60 bg-white px-6 py-2 text-[10px] text-muted">
          Pacific World School ERP · {new Date().getFullYear()} · Demo build
        </footer>
      </div>
    </div>
  );
}
