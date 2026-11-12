import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { isDemoPath } from '../lib/demo';
import { useAuth } from '../contexts/AuthContext';
import { useAppData } from '../lib/appData';
import { cn, initials } from '../lib/utils';
import { Badge, Breadcrumbs, NotificationsDropdown, RoleSwitcher } from './ui';
import {
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiFolder,
  FiHome,
  FiImage,
  FiLayout,
  FiLogOut,
  FiMenu,
  FiPieChart,
  FiSend,
  FiShield,
  FiUsers,
  FiX,
} from 'react-icons/fi';

type Role = 'admin' | 'teacher' | 'student';
type NavGroup = 'today' | 'academics' | 'community' | 'admin';

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  group: NavGroup;
  labelByRole?: Partial<Record<Role, string>>;
  roles: Role[];
};

const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: FiHome, group: 'today', roles: ['admin', 'teacher', 'student'] },
  {
    to: '/approvals',
    label: 'Approvals',
    labelByRole: { student: 'My Leaves', teacher: 'Leave Approvals', admin: 'Leave Approvals' },
    icon: FiClipboard,
    group: 'today',
    roles: ['admin', 'teacher', 'student'],
  },
  { to: '/events', label: 'Events & Calendar', icon: FiCalendar, group: 'today', roles: ['admin', 'teacher', 'student'] },
  {
    to: '/attendance',
    label: 'My Attendance',
    labelByRole: { teacher: 'Attendance', admin: 'Attendance' },
    icon: FiPieChart,
    group: 'today',
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/course-progress',
    label: 'Course Progress',
    labelByRole: { student: 'My Progress', teacher: 'Course Progress', admin: 'Course Progress' },
    icon: FiBarChart2,
    group: 'academics',
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/assignments',
    label: 'Assignments',
    labelByRole: { student: 'Assignments / Homework', teacher: 'Class Assignments', admin: 'Assignments' },
    icon: FiFileText,
    group: 'academics',
    roles: ['admin', 'teacher', 'student'],
  },
  { to: '/study-room', label: 'Study Room', icon: FiFolder, group: 'academics', roles: ['admin', 'teacher', 'student'] },
  {
    to: '/report-card',
    label: 'My Report Card',
    labelByRole: { teacher: 'Report Cards', admin: 'Report Cards' },
    icon: FiAward,
    group: 'academics',
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/communications',
    label: 'Communications',
    labelByRole: { student: 'Inbox', teacher: 'Communications', admin: 'Communications' },
    icon: FiSend,
    group: 'community',
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/library',
    label: 'My Library',
    labelByRole: { teacher: 'Library', admin: 'Library' },
    icon: FiBookOpen,
    group: 'community',
    roles: ['admin', 'teacher', 'student'],
  },
  {
    to: '/fees',
    label: 'My Fee',
    labelByRole: { teacher: 'Fees', admin: 'Fee Collection' },
    icon: FiCreditCard,
    group: 'community',
    roles: ['admin', 'teacher', 'student'],
  },
  { to: '/gallery', label: 'School Gallery', icon: FiImage, group: 'community', roles: ['admin', 'teacher', 'student'] },
  { to: '/people', label: 'People', icon: FiUsers, group: 'admin', roles: ['admin'] },
  { to: '/classes', label: 'Classes', icon: FiLayout, group: 'admin', roles: ['admin'] },
  { to: '/subjects', label: 'Subjects', icon: FiBookOpen, group: 'admin', roles: ['admin'] },
  { to: '/teaching-assignments', label: 'Teaching Assignments', icon: FiSend, group: 'admin', roles: ['admin'] },
  { to: '/enrollments', label: 'Enrollments', icon: FiClipboard, group: 'admin', roles: ['admin'] },
  { to: '/audit-log', label: 'Audit Log', icon: FiShield, group: 'admin', roles: ['admin'] },
];

const GROUPS: { id: NavGroup; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'academics', label: 'Academics' },
  { id: 'community', label: 'Community' },
  { id: 'admin', label: 'Administration' },
];

const SCHOOL_AREAS = [
  { label: 'Today', to: '/dashboard', paths: ['/dashboard', '/approvals', '/events', '/attendance'] },
  { label: 'Academics', to: '/assignments', paths: ['/course-progress', '/assignments', '/study-room', '/report-card'] },
  { label: 'Community', to: '/communications', paths: ['/communications', '/library', '/fees', '/gallery'] },
  { label: 'Administration', to: '/people', paths: ['/people', '/classes', '/subjects', '/teaching-assignments', '/enrollments', '/audit-log'], adminOnly: true },
];

function labelFor(role: Role): Record<string, string> {
  return {
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
}

export default function AppShell({ children }: { children?: ReactNode }) {
  const { profile, viewAsRole, viewingRole, demoMode, configError, signOut } = useAuth();
  const data = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const closeDrawerRef = useRef<HTMLButtonElement>(null);
  const openDrawerRef = useRef<HTMLButtonElement>(null);

  const role: Role = viewingRole ?? profile?.role ?? 'student';
  const visibleNav = useMemo(() => NAV.filter((item) => item.roles.includes(role)), [role]);
  const routeLabels = useMemo(() => labelFor(role), [role]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    const openButton = openDrawerRef.current;
    document.body.style.overflow = 'hidden';
    closeDrawerRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSidebarOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !drawerRef.current) return;
      const controls = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      );
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      openButton?.focus();
    };
  }, [sidebarOpen]);

  const breadcrumbItems = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const parts: { label: string; to?: string }[] = [{ label: 'Home', to: '/dashboard' }];
    let path = '';
    for (const segment of segments) {
      path += `/${segment}`;
      parts.push({
        label: routeLabels[path] ?? segment.charAt(0).toUpperCase() + segment.slice(1),
        to: path,
      });
    }
    return parts;
  }, [location.pathname, routeLabels]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const pendingLeaves = data.leaves.filter((leave) => leave.status === 'pending').length;
  const me = data.people.find((person) => person.id === profile?.id);
  const mySectionLabel = me?.class_label && me.section_label ? `${me.class_label} - ${me.section_label}` : undefined;
  const visibleNotifications = data.notifications.filter(
    (notification) => role !== 'student' || !notification.audience || notification.audience === mySectionLabel,
  );
  const unread = visibleNotifications.filter((notification) => !notification.read).length;

  const renderNav = (items: NavItem[]) => items.map((item) => {
    const active = location.pathname === item.to || (location.pathname === '/' && item.to === '/dashboard');
    const label = item.labelByRole?.[role] ?? item.label;
    const count = item.to === '/approvals' && role !== 'student' && pendingLeaves > 0 ? pendingLeaves : undefined;
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={() => setSidebarOpen(false)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'focus-ring group flex min-h-10 items-center gap-3 rounded-[11px] px-3 py-2 text-[0.82rem] font-semibold transition-[background-color,color,box-shadow] duration-150',
          active ? 'bg-olive text-white shadow-sm' : 'text-muted hover:bg-leaf/35 hover:text-deep-olive',
        )}
      >
        <item.icon className={cn('h-[17px] w-[17px] shrink-0', active ? 'text-white' : 'text-olive/70')} aria-hidden="true" />
        <span className="truncate">{label}</span>
        {count !== undefined && (
          <span className={cn('ml-auto rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold', active ? 'bg-white/20 text-white' : 'bg-clay text-terracotta-700')}>
            {count}
          </span>
        )}
      </Link>
    );
  });

  return (
    <div className="min-h-screen bg-daylight text-ink">
      <a href="#main-content" className="focus-ring fixed left-3 top-2 z-[100] -translate-y-20 rounded-lg bg-paper px-4 py-2 text-sm font-bold text-deep-olive shadow-lift transition-transform focus:translate-y-0">
        Skip to content
      </a>

      <header className="sticky top-0 z-50 flex h-16 items-center gap-3 bg-olive px-3 text-white shadow-[0_8px_24px_rgba(47,61,42,0.16)] sm:px-5 lg:px-6">
        <button
          ref={openDrawerRef}
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="touch-target focus-ring inline-flex items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden"
          aria-label="Open navigation"
          aria-expanded={sidebarOpen}
          aria-controls="campus-navigation"
        >
          <FiMenu size={21} aria-hidden="true" />
        </button>

        <Link to="/dashboard" className="focus-ring flex min-w-0 items-center gap-2.5 rounded-lg" aria-label="Pacific World School home">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper p-1 shadow-sm">
            <img src="/brand/pws-logo.png" alt="" width="40" height="40" className="h-full w-full object-contain" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate font-display text-base font-semibold leading-tight tracking-[-0.01em]">Pacific World School</span>
            <span className="block text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/65">Living campus</span>
          </span>
        </Link>

        <nav aria-label="School areas" className="ml-5 hidden h-full items-stretch gap-1 lg:flex">
          {SCHOOL_AREAS.filter((area) => !area.adminOnly || role === 'admin').map((area) => {
            const active = area.paths.includes(location.pathname) || (location.pathname === '/' && area.to === '/dashboard');
            return (
              <Link
                key={area.label}
                to={area.to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring relative flex items-center rounded-lg px-3 text-xs font-semibold text-white/72 transition-colors hover:text-white',
                  active && 'text-white after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-terracotta',
                )}
              >
                {area.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {configError && <Badge variant="terracotta" className="hidden cursor-help md:inline-flex" title={configError}>Config</Badge>}
          {!isDemoPath && <a href="/demo/login" className="focus-ring hidden rounded-full px-2 py-1 text-xs font-semibold text-white/80 underline decoration-white/35 underline-offset-4 hover:text-white sm:inline">Try a demo</a>}
          {profile?.role === 'admin' && (
            <RoleSwitcher roles={['admin', 'teacher', 'student']} current={viewingRole} onChange={viewAsRole} />
          )}
          <NotificationsDropdown
            notifications={visibleNotifications}
            onMarkRead={data.markNotificationRead}
            onMarkAllRead={data.markAllNotificationsRead}
            open={notifOpen}
            onToggle={() => setNotifOpen((value) => !value)}
          />
          {unread === 0 && <span className="sr-only">No unread notifications</span>}
          <span className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-bold sm:flex" aria-hidden="true">
            {initials(profile?.full_name ?? 'U')}
          </span>
        </div>
      </header>

      <div className="campus-shell flex min-h-[calc(100dvh-4rem)]">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 top-16 z-30 bg-ink/50 backdrop-blur-[2px] lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation backdrop"
          />
        )}

        <aside
          id="campus-navigation"
          ref={drawerRef}
          role={sidebarOpen ? 'dialog' : undefined}
          aria-modal={sidebarOpen ? 'true' : undefined}
          aria-label="Contextual navigation"
          className={cn(
            'fixed inset-y-0 left-0 top-16 z-40 flex w-[17rem] flex-col border-r border-olive/10 bg-paper shadow-lift transition-transform duration-200 ease-[var(--ease-drawer)] lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100dvh-4rem)] lg:w-56 lg:translate-x-0 lg:shadow-none',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center gap-3 border-b border-olive/10 px-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf/60 text-xs font-bold text-deep-olive">
              {initials(profile?.full_name ?? 'U')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{profile?.full_name ?? 'User'}</p>
              <p className="truncate text-[0.68rem] text-muted">{profile?.login_id ?? ''}</p>
            </div>
            <Badge variant="olive" className="text-[0.58rem] capitalize">{role}</Badge>
            <button
              ref={closeDrawerRef}
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="touch-target focus-ring -mr-2 inline-flex items-center justify-center rounded-full text-muted hover:bg-daylight hover:text-ink lg:hidden"
              aria-label="Close navigation"
            >
              <FiX size={19} aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Primary navigation" className="scroll-slim flex-1 overflow-y-auto px-3 py-4">
            {GROUPS.map((group) => {
              const items = visibleNav.filter((item) => item.group === group.id);
              if (!items.length) return null;
              return (
                <div key={group.id} className="mb-4 last:mb-0">
                  <p id={`nav-${group.id}`} className="px-3 pb-1.5 text-[0.63rem] font-bold uppercase tracking-[0.16em] text-muted/75">
                    {group.label}
                  </p>
                  <div className="space-y-0.5" role="group" aria-labelledby={`nav-${group.id}`}>
                    {renderNav(items)}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-olive/10 px-3 py-3">
            {demoMode && (
              <div className="mb-2 rounded-[11px] border border-amber-200 bg-amber-50 p-3 text-amber-900">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em]">Demo data</p>
                <p className="mt-1 text-[0.68rem] leading-4">Changes stay in this browser and never affect school records.</p>
                <button type="button" onClick={() => data.resetDemoData()} className="focus-ring mt-2 rounded text-[0.68rem] font-bold underline decoration-amber-400 underline-offset-2">
                  Reset demo data
                </button>
              </div>
            )}
            <button type="button" onClick={handleLogout} className="focus-ring flex min-h-10 w-full items-center gap-2 rounded-[10px] px-3 text-xs font-semibold text-terracotta-700 transition-colors hover:bg-clay/35">
              <FiLogOut size={15} aria-hidden="true" /> Sign out
            </button>
          </div>
        </aside>

        <div className="campus-workspace flex min-w-0 flex-1 flex-col">
          {isDemoPath && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-950 sm:px-6">
              <span><strong>Demo mode</strong> · Sample data only — no school records are changed.</span>
              <a href="/login" className="focus-ring rounded font-bold underline decoration-amber-500 underline-offset-2">Exit demo · School sign in</a>
            </div>
          )}

          <div className="px-4 pt-3 sm:px-6 lg:px-8">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <main id="main-content" className="page-reveal scroll-slim min-w-0 flex-1 overflow-y-auto px-4 pb-10 pt-3 sm:px-6 lg:px-8 lg:pb-12">
            {children ?? <Outlet />}
          </main>
          <footer className="border-t border-olive/10 bg-paper/70 px-4 py-2 text-[0.65rem] text-muted sm:px-6 lg:px-8">
            Pacific World School · School console
          </footer>
        </div>
      </div>
    </div>
  );
}
