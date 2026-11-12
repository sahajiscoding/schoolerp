import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { isDemoPath } from '../lib/demo';
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
  FiChevronRight,
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

/** Breadcrumb/sidebar labels for a role. Extracted so the memo can depend on it. */
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
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const role: Role = viewingRole ?? profile?.role ?? 'student';

  // Closing the mobile drawer / notification popover on navigation is handled by
  // keying this component on the pathname in its parent (a state reset), which
  // avoids a synchronous setState inside an effect.

  const mainNav = useMemo(
    () => NAV.filter((item) => item.roles.includes(role) && !item.to.match(/^\/(people|classes|subjects|teaching-assignments|enrollments|audit-log)$/)),
    [role],
  );
  const adminNav = useMemo(
    () => NAV.filter((item) => item.roles.includes(role) && item.to.match(/^\/(people|classes|subjects|teaching-assignments|enrollments|audit-log)$/)),
    [role],
  );

  const routeLabels = labelFor(role);

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
  }, [location.pathname, routeLabels]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const pendingLeaves = data.leaves.filter((l) => l.status === 'pending').length;
  // Broadcasts target a section: students only see notifications addressed to
  // their own section (or to everyone). Admins and teachers see everything.
  const mySectionLabel = (() => {
    const me = data.people.find((p) => p.id === profile?.id);
    return me?.class_label && me?.section_label ? `${me.class_label} - ${me.section_label}` : undefined;
  })();
  const visibleNotifications = data.notifications.filter(
    (n) => role !== 'student' || !n.audience || n.audience === mySectionLabel,
  );
  const unread = visibleNotifications.filter((n) => !n.read).length;

  const badgeFor = (to: string) => {
    if (to === '/approvals' && role !== 'student' && pendingLeaves > 0) return pendingLeaves;
    return undefined;
  };

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        sidebarRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen]);

  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const active = location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/');
      const label = item.labelByRole?.[role] ?? item.label;
      const count = badgeFor(item.to);
      return (
        <Link
          key={item.to}
          to={item.to}
          aria-current={active ? 'page' : undefined}
          className={cn(
            'group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 md:justify-center md:px-2 xl:justify-start xl:px-3',
            active
              ? 'bg-gold text-forest-950 shadow-sm'
              : 'text-paper/70 hover:bg-white/[0.07] hover:text-paper',
          )}
        >
          <item.icon
            className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-forest-950' : 'text-paper/45 group-hover:text-gold')}
          />
          <span className="truncate md:sr-only xl:not-sr-only">{label}</span>
          {count !== undefined && (
            <span
              className={cn(
                'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-extrabold md:absolute md:right-1 md:top-1 xl:static xl:ml-auto',
                active ? 'bg-forest/10 text-forest' : 'bg-terracotta text-white',
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
      <div className="relative flex min-h-[88px] items-center gap-3 border-b border-white/10 px-4 xl:px-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper shadow-sm">
          <img src="/brand/pws-logo.png" alt="" width="36" height="36" className="h-9 w-9 object-contain" />
        </div>
        <div className="min-w-0 md:sr-only xl:not-sr-only">
          <div className="truncate font-display text-lg font-medium leading-tight text-paper">Pacific World</div>
          <div className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-gold">School ERP</div>
        </div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="touch-target ml-auto inline-flex items-center justify-center rounded-full text-paper/60 transition-colors duration-150 hover:bg-white/10 hover:text-paper md:hidden"
          aria-label="Close navigation"
        >
          <FiX size={20} />
        </button>
      </div>

      <nav aria-label="Primary navigation" className="scroll-slim flex-1 space-y-6 overflow-y-auto px-3 py-5">
        <div>
          <div className="px-3 pb-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-paper/35 md:sr-only xl:not-sr-only">
            {GROUP_LABEL.main}
          </div>
          <div className="space-y-1">{renderNav(mainNav)}</div>
        </div>
        {adminNav.length > 0 && (
          <div>
            <div className="px-3 pb-2 text-[9px] font-extrabold uppercase tracking-[0.18em] text-paper/35 md:sr-only xl:not-sr-only">
              {GROUP_LABEL.admin}
            </div>
            <div className="space-y-1">{renderNav(adminNav)}</div>
          </div>
        )}
      </nav>

      <div className="border-t border-white/10 px-3 py-3 xl:px-4">
        {demoMode && (
          <div className="mb-3 rounded-xl border border-gold/30 bg-gold/10 p-3 md:hidden xl:block">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-gold">Demo data</div>
            <div className="mt-1 text-[10px] leading-relaxed text-paper/60">
              Sample data only. Changes stay in this browser and never affect school records.
            </div>
            <button
              onClick={() => data.resetDemoData()}
              className="mt-1 min-h-9 text-[10px] font-bold text-gold underline decoration-gold/40 underline-offset-4"
            >
              Reset demo data
            </button>
          </div>
        )}
        <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.06] p-2 md:justify-center xl:justify-start">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold text-[10px] font-extrabold text-forest-950">
            {initials(profile?.full_name ?? 'U')}
          </div>
          <div className="min-w-0 flex-1 md:sr-only xl:not-sr-only">
            <div className="truncate text-xs font-bold text-paper">{profile?.full_name ?? 'User'}</div>
            <div className="truncate text-[10px] text-paper/45">{profile?.login_id ?? ''}</div>
          </div>
          <Badge variant="olive" className="text-[9px] capitalize md:hidden xl:inline-flex">
            {role}
          </Badge>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-xl px-2.5 text-xs font-bold text-paper/60 transition-colors duration-150 hover:bg-white/[0.07] hover:text-paper md:justify-center xl:justify-start"
        >
          <FiLogOut size={15} /> <span className="md:sr-only xl:not-sr-only">Sign out</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-parchment text-ink">
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-forest-950 transition-transform duration-150 focus:translate-y-0">
        Skip to main content
      </a>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-forest-950/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        ref={sidebarRef}
        aria-label="School navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col overflow-hidden border-r border-white/10 bg-forest-900 text-paper shadow-rail transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] md:w-20 md:translate-x-0 xl:w-[248px]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="pointer-events-none absolute -right-28 -top-28 h-64 w-64 rounded-full border border-gold/10" aria-hidden="true" />
        {sidebarBody}
      </aside>

      <div className="app-workspace relative flex min-h-screen min-w-0 flex-col md:ml-20 xl:ml-[248px]">
        <header role="banner" className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-border bg-paper/95 px-4 backdrop-blur-md sm:px-5 lg:px-7">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="focus-ring touch-target inline-flex items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-parchment hover:text-ink md:hidden"
            aria-label="Open navigation"
            aria-expanded={sidebarOpen}
          >
            <FiMenu size={20} />
          </button>

          <div className="min-w-0 flex-1">
            <Breadcrumbs items={breadcrumbItems} />
            <div className="mt-0.5 truncate text-xs font-extrabold uppercase tracking-[0.12em] text-forest sm:hidden">
              {routeLabels[location.pathname] ?? 'Dashboard'}
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {configError && (
              <Badge variant="terracotta" className="hidden cursor-help text-[10px] lg:inline-flex" title={configError}>
                Config
              </Badge>
            )}
            {!isDemoPath && (
              <a href="/demo/login" className="hidden min-h-11 items-center text-xs font-bold text-forest underline decoration-gold underline-offset-4 sm:inline-flex">Try a demo</a>
            )}
            {/* Gate on the real profile so an admin can always switch back. */}
            {profile?.role === 'admin' && (
              <RoleSwitcher
                roles={['admin', 'teacher', 'student']}
                current={viewingRole}
                onChange={viewAsRole}
              />
            )}
            <div className="relative">
              <NotificationsDropdown
                notifications={visibleNotifications}
                onMarkRead={data.markNotificationRead}
                onMarkAllRead={data.markAllNotificationsRead}
                open={notifOpen}
                onToggle={() => setNotifOpen((v) => !v)}
              />
              {unread === 0 && <span className="sr-only">No unread notifications</span>}
            </div>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-forest text-xs font-extrabold text-gold sm:flex" aria-hidden="true">
              {initials(profile?.full_name ?? 'U')}
            </div>
          </div>
        </header>

        {isDemoPath && (
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gold/40 bg-gold/20 px-4 py-2 text-xs text-forest-950 sm:px-5 lg:px-7">
            <span><strong>Demo mode</strong> · Sample data only — no school records are changed.</span>
            <a href="/login" className="inline-flex min-h-9 items-center gap-1 font-extrabold underline decoration-forest/20 underline-offset-4">Exit demo · School sign in <FiChevronRight size={13} aria-hidden="true" /></a>
          </div>
        )}

        <main id="main-content" tabIndex={-1} className="page-reveal min-w-0 flex-1 px-4 pb-10 pt-5 outline-none sm:px-5 sm:pt-6 lg:px-7 lg:pt-7">
          {children ?? <Outlet />}
        </main>

        <footer className="shrink-0 border-t border-border bg-paper/70 px-5 py-2.5 text-[10px] font-semibold text-muted lg:px-7">
          Pacific World School ERP · {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}
