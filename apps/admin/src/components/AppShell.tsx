import { useState, type ReactNode } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Antenna,
  BarChart2,
  Book,
  BookOpen,
  BookText,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Ellipsis,
  FileText,
  GalleryVerticalEnd,
  Home,
  Layers3,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Send,
  ShieldCheck,
  Sparkles,
  SquareUser,
  Sun,
  UserCheck,
  UserCog,
  UserRound,
  Vote,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAppData } from "../lib/appData";
import { useTheme } from "../lib/theme";
import { cn, initials } from "../lib/utils";
import { Badge, NotificationsDropdown, RoleSwitcher } from "./ui";

type Role = "admin" | "teacher" | "student";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  labelByRole?: Partial<Record<Role, string>>;
};

const PRIMARY_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  {
    to: "/approvals",
    label: "Approvals",
    labelByRole: { teacher: "Leave Approvals", admin: "Leave Approvals" },
    icon: ShieldCheck,
  },
  { to: "/course-progress", label: "Course Progress", icon: BarChart2 },
  { to: "/events", label: "Events & Calendars", icon: CalendarDays },
  {
    to: "/homeworks",
    label: "Assignment/Homework",
    labelByRole: { teacher: "Class Homework", admin: "Homeworks" },
    icon: BookText,
  },
  { to: "/study-room", label: "Study Room", icon: FileText },
  {
    to: "/my-library",
    label: "My Library",
    labelByRole: { teacher: "Library", admin: "Library" },
    icon: Book,
  },
  {
    to: "/examination-report-cards?page=1&limit=10",
    label: "My Report Card",
    labelByRole: { teacher: "Report Cards", admin: "Report Cards" },
    icon: BookText,
  },
  {
    to: "/my-attendance",
    label: "My Attendance",
    labelByRole: { teacher: "Attendance", admin: "Attendance" },
    icon: UserCheck,
  },
  {
    to: "/fee-collections/create",
    label: "My Fee",
    labelByRole: { teacher: "Fees", admin: "Fee Collection" },
    icon: SquareUser,
  },
  { to: "/school-gallery?page=1", label: "School Gallery", icon: GalleryVerticalEnd },
];

const COMMUNICATION_NAV: NavItem[] = [
  { to: "/circulars?page=1&limit=10", label: "Circulars", icon: Send },
  { to: "/declaration-forms?page=1&limit=10", label: "Declaration Forms", icon: ClipboardCheck },
  { to: "/messages?box=inbox&page=1&limit=10", label: "Messages", icon: MessageSquare },
  { to: "/polls", label: "Polls", icon: Vote },
];

const STAFF_NAV: NavItem[] = [
  { to: "/issue-book?member_able_type=students", label: "Issue Book", icon: BookOpen },
  { to: "/digital-library", label: "Digital Library", icon: Layers3 },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const roleName = (role: Role) => role.charAt(0).toUpperCase() + role.slice(1);

export default function AppShell({ children }: { children?: ReactNode }) {
  const { profile, viewAsRole, viewingRole, demoMode, inDemo, configError, signOut } = useAuth();
  const { mode, toggle } = useTheme();
  const data = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [communicationsOpen, setCommunicationsOpen] = useState(() =>
    COMMUNICATION_NAV.some((item) => location.pathname === item.to.split("?")[0]),
  );
  const [assistantOpen, setAssistantOpen] = useState(false);

  const role: Role = viewingRole ?? profile?.role ?? "student";
  const showDemoCard = inDemo || demoMode;
  const pendingLeaves = data.leaves.filter((leave) => leave.status === "pending").length;
  const me = data.people.find((person) => person.id === profile?.id);
  const mySection = me?.class_label && me?.section_label ? `${me.class_label} - ${me.section_label}` : undefined;
  const visibleNotifications = data.notifications.filter(
    (notification) => role !== "student" || !notification.audience || notification.audience === mySection,
  );
  const unread = visibleNotifications.filter((notification) => !notification.read).length;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const targetFor = (item: NavItem) => {
    if (item.to === "/fee-collections/create" && role === "student" && profile?.id) {
      return `${item.to}?student=${encodeURIComponent(profile.id)}`;
    }
    return item.to;
  };

  const isActive = (item: NavItem) => {
    const path = item.to.split("?")[0];
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const badgeFor = (item: NavItem) =>
    item.to === "/approvals" && role !== "student" && pendingLeaves > 0 ? pendingLeaves : undefined;

  const renderLink = (item: NavItem, nested = false) => {
    const active = isActive(item);
    const Icon = item.icon;
    const count = badgeFor(item);
    const label = item.labelByRole?.[role] ?? item.label;

    return (
      <Link
        key={item.to}
        to={targetFor(item)}
        onClick={() => setMobileNavOpen(false)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          nested && "pl-9 text-xs",
          active
            ? "bg-brand-primary text-white shadow-sm"
            : "text-slate-500 hover:bg-brand-primary hover:text-white dark:text-slate-400 dark:hover:bg-brand-primary dark:hover:text-white",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{label}</span>
        {count !== undefined && (
          <span
            className={cn(
              "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              active ? "bg-white/20 text-white" : "bg-brand-primary/10 text-brand-primary dark:text-olive-300",
            )}
          >
            {count}
          </span>
        )}
      </Link>
    );
  };

  const communicationActive = COMMUNICATION_NAV.some(isActive);
  const sidebarBody = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-brand-darkBorder md:hidden">
        <img src="/brand/pws-logo.png" alt="" className="h-9 w-9 rounded-full object-contain" />
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-brand-foreground dark:text-slate-50">
          Pacific World School
        </span>
        <button
          type="button"
          onClick={() => setMobileNavOpen(false)}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="scroll-slim grid flex-1 content-start gap-y-0.5 overflow-y-auto px-2 py-3" aria-label="Main navigation">
        {PRIMARY_NAV.slice(0, 3).map((item) => renderLink(item))}

        <div className="relative">
          <button
            type="button"
            onClick={() => setCommunicationsOpen((open) => !open)}
            aria-expanded={communicationsOpen}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              communicationsOpen || communicationActive
                ? "bg-brand-primary text-white"
                : "text-slate-500 hover:bg-brand-primary hover:text-white dark:text-slate-400 dark:hover:bg-brand-primary dark:hover:text-white",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Antenna className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate text-left">Communications</span>
            </span>
            <Ellipsis className={cn("h-4 w-4 shrink-0", communicationsOpen ? "text-white" : "text-slate-400")} />
          </button>
          {communicationsOpen && (
            <div className="mt-0.5 grid gap-y-0.5">{COMMUNICATION_NAV.map((item) => renderLink(item, true))}</div>
          )}
        </div>

        {PRIMARY_NAV.slice(3).map((item) => renderLink(item))}
        {role !== "student" && (
          <div className="mt-2 grid gap-y-0.5 border-t border-slate-200 pt-2 dark:border-brand-darkBorder">
            {STAFF_NAV.map((item) => renderLink(item))}
          </div>
        )}
      </nav>

      {showDemoCard && (
        <div className="border-t border-slate-200 p-3 dark:border-brand-darkBorder">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-900 dark:bg-amber-950">
            <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Demo mode</p>
            <p className="mt-0.5 text-[10px] leading-snug text-amber-700 dark:text-amber-400">
              Sample data only. Changes stay in this browser and never write to Supabase.
            </p>
            <div className="mt-1.5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => data.resetDemoData()}
                className="text-[10px] font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 dark:text-amber-300"
              >
                Reset demo data
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[10px] font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 dark:text-amber-300"
              >
                Exit demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-white text-brand-foreground dark:bg-brand-dark dark:text-slate-50">
      <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center gap-2 bg-brand-primary px-3 text-white sm:gap-4 sm:px-4 lg:h-[60px] lg:px-6">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 md:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/dashboard" className="flex min-w-0 shrink items-center gap-2 text-white sm:gap-4">
          <img
            src="/brand/pws-logo.png"
            alt="Pacific World School"
            className="h-8 w-8 shrink-0 rounded-full object-contain sm:h-10 sm:w-10"
          />
          <span className="min-w-0 truncate text-xs font-bold uppercase leading-tight sm:text-sm lg:text-base">
            Pacific World School
          </span>
          <img
            src="/brand/pws-logo.png"
            alt=""
            className="hidden h-8 w-8 shrink-0 rounded-full bg-white object-contain p-0.5 sm:block sm:h-10 sm:w-10 sm:p-1"
          />
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 md:gap-2">
          {configError && (
            <Badge variant="warning" className="hidden cursor-help text-[10px] xl:inline-flex" title={configError}>
              Config
            </Badge>
          )}
          <NotificationsDropdown
            notifications={visibleNotifications}
            onMarkRead={data.markNotificationRead}
            onMarkAllRead={data.markAllNotificationsRead}
            open={notificationsOpen}
            onToggle={() => {
              setNotificationsOpen((open) => !open);
              setProfileOpen(false);
            }}
            showCount
            triggerClassName="h-9 w-9 rounded-full p-0 text-white hover:bg-white/10 hover:text-white dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
          />
          {unread === 0 && <span className="sr-only">No unread notifications</span>}

          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            aria-label={mode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={mode === "dark" ? "Light theme" : "Dark theme"}
          >
            {mode === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {profile?.role === "admin" && (
            <div className="hidden lg:block">
              <RoleSwitcher roles={["admin", "teacher", "student"]} current={viewingRole} onChange={viewAsRole} />
            </div>
          )}

          <div className="hidden min-w-0 max-w-[180px] flex-col items-center justify-center text-center text-sm leading-tight text-white sm:flex">
            <p className="max-w-full truncate text-sm font-semibold" title={profile?.full_name ?? "User"}>
              {profile?.full_name ?? "User"}
            </p>
            <p className="truncate text-xs font-medium tracking-wide opacity-90">({profile?.login_id ?? ""})</p>
            <p className="truncate text-xs font-normal tracking-wide opacity-90">{roleName(role)}</p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((open) => !open);
                setNotificationsOpen(false);
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-transparent"
              aria-label="Toggle user menu"
              aria-expanded={profileOpen}
            >
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white">
                {initials(profile?.full_name ?? "U")}
                <span
                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500"
                  title="Online"
                />
              </span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-md border border-slate-200 bg-white p-1 text-brand-foreground shadow-xl dark:border-brand-darkBorder dark:bg-brand-dark dark:text-slate-50">
                <p className="px-2 py-1.5 text-xs font-semibold">My Account</p>
                <div className="my-1 border-t border-slate-100 dark:border-brand-darkBorder" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    navigate("/profile");
                  }}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <UserCog className="h-4 w-4" /> Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {mobileNavOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-brand-dark/45 backdrop-blur-sm md:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          />
        )}

        <aside
          id="app-sidebar"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-slate-200 bg-brand-sidebar text-zinc-700 transition-all duration-300 dark:border-brand-darkBorder dark:bg-brand-dark dark:text-slate-300 md:bottom-0 md:top-[60px] md:z-20 md:h-[calc(100vh-60px)] md:w-[20%]",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full",
            sidebarCollapsed ? "md:w-0 md:-translate-x-full" : "md:translate-x-0",
          )}
        >
          {sidebarBody}
        </aside>

        <button
          type="button"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          className={cn(
            "fixed top-[68px] z-40 hidden h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-brand-foreground shadow-md transition-all duration-300 dark:border-brand-darkBorder dark:bg-brand-dark dark:text-slate-400 md:flex",
            sidebarCollapsed ? "left-2" : "left-[20%] -translate-x-1/2",
          )}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-controls="app-sidebar"
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        <section
          className={cn(
            "flex w-0 min-w-0 flex-1 flex-col transition-[margin] duration-300",
            sidebarCollapsed ? "md:ml-0" : "md:ml-[20%]",
          )}
        >
          <main className="flex flex-1 flex-col gap-4 p-4 pb-24 lg:gap-6 lg:p-6 lg:pb-24">
            {children ?? <Outlet />}
          </main>
        </section>
      </div>

      <footer
        className={cn(
          "fixed bottom-0 left-0 right-0 z-30 w-full border-t border-slate-200 bg-white/90 px-4 py-3 text-xs text-slate-500 backdrop-blur transition-all duration-300 dark:border-brand-darkBorder dark:bg-brand-dark/90 dark:text-slate-400 md:px-6",
          sidebarCollapsed ? "md:left-0 md:w-full" : "md:left-[20%] md:w-[80%]",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1600px] flex-col items-center justify-between gap-2 sm:flex-row">
          <a
            href="https://www.schoolforschools.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-base font-medium text-brand-primary hover:underline dark:text-olive-300"
          >
            © {new Date().getFullYear()} School For Schools. All rights reserved.
          </a>
          <div className="flex items-center gap-4">
            <a
              href="https://www.schoolforschools.ai/terms-and-conditions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium text-brand-primary hover:underline dark:text-olive-300"
            >
              T&amp;C
            </a>
            <span aria-hidden="true">|</span>
            <a
              href="https://www.schoolforschools.ai/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-base font-medium text-brand-primary hover:underline dark:text-olive-300"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>

      {!assistantOpen ? (
        <button
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="fixed bottom-16 right-0 z-30 flex h-10 w-6 items-center justify-center rounded-l-md bg-brand-primary text-white shadow-lg transition-all duration-300 motion-safe:hover:w-8 motion-safe:hover:-translate-x-1"
          aria-label="Open school assistant"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      ) : (
        <aside
          role="dialog"
          aria-label="School assistant"
          className="fixed bottom-16 right-3 z-50 flex h-[min(42rem,calc(100vh-7rem))] w-[min(40rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl dark:border-brand-darkBorder dark:bg-brand-dark sm:right-6 sm:w-[min(40rem,calc(100vw-3rem))]"
        >
          <button
            type="button"
            onClick={() => setAssistantOpen(false)}
            className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-white"
            aria-label="Close school assistant"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-white to-slate-100 p-8 text-center dark:from-brand-dark dark:to-slate-900">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary dark:text-olive-300">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-bold text-brand-foreground dark:text-slate-50">School assistant</h2>
            <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              The protected assistant service is not connected to this build. Use Messages to contact the school.
            </p>
            <Link
              to="/messages?box=inbox&page=1&limit=10"
              onClick={() => setAssistantOpen(false)}
              className="mt-5 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-olive-600"
            >
              Open Messages
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}
