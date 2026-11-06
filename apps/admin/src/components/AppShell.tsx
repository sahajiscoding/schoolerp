import { useState, useMemo, type ReactNode } from "react";
import { useNavigate, useLocation, Link, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAppData } from "../lib/appData";
import { useTheme } from "../lib/theme";
import { cn, initials } from "../lib/utils";
import { Badge, Breadcrumbs, NotificationsDropdown, RoleSwitcher } from "./ui";
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
  FiLayout,
  FiBarChart2,
  FiPieChart,
  FiLogOut,
  FiMenu,
  FiAward,
  FiX,
  FiSun,
  FiMoon,
  FiMessageSquare,
  FiLayers,
  FiBook,
  FiUser,
} from "react-icons/fi";

type Role = "admin" | "teacher" | "student";

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  /** Labels change with the viewer so a student never sees "All students". */
  labelByRole?: Partial<Record<Role, string>>;
  roles: Role[];
};

// Canonical report nav (spec §2). Old URLs are redirect-only now.
const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: FiHome, roles: ["admin", "teacher", "student"] },
  {
    to: "/approvals",
    label: "Approvals",
    labelByRole: { student: "My Leaves", teacher: "Leave Approvals", admin: "Leave Approvals" },
    icon: FiClipboard,
    roles: ["admin", "teacher", "student"],
  },
  {
    to: "/course-progress",
    label: "Course Progress",
    labelByRole: { student: "My Progress", teacher: "Course Progress", admin: "Course Progress" },
    icon: FiBarChart2,
    roles: ["admin", "teacher", "student"],
  },
  { to: "/events", label: "Events & Calendar", icon: FiCalendar, roles: ["admin", "teacher", "student"] },
  {
    to: "/homeworks",
    label: "Homeworks",
    labelByRole: { student: "My Homework", teacher: "Class Homework", admin: "Homeworks" },
    icon: FiFileText,
    roles: ["admin", "teacher", "student"],
  },
  { to: "/study-room", label: "Study Room", icon: FiFolder, roles: ["admin", "teacher", "student"] },
  {
    to: "/my-library",
    label: "My Library",
    labelByRole: { teacher: "Library", admin: "Library" },
    icon: FiBookOpen,
    roles: ["admin", "teacher", "student"],
  },
  { to: "/issue-book?member_able_type=students", label: "Issue Book", icon: FiBook, roles: ["admin", "teacher", "student"] },
  { to: "/digital-library", label: "Digital Library", icon: FiLayers, roles: ["admin", "teacher", "student"] },
  {
    to: "/examination-report-cards?page=1&limit=10",
    label: "Report Cards",
    labelByRole: { student: "My Report Card", teacher: "Report Cards", admin: "Report Cards" },
    icon: FiAward,
    roles: ["admin", "teacher", "student"],
  },
  {
    to: "/my-attendance",
    label: "My Attendance",
    labelByRole: { teacher: "Attendance", admin: "Attendance" },
    icon: FiPieChart,
    roles: ["admin", "teacher", "student"],
  },
  {
    to: "/fee-collections/create",
    label: "Fee Collections",
    labelByRole: { student: "My Fee", teacher: "Fees", admin: "Fee Collection" },
    icon: FiCreditCard,
    roles: ["admin", "teacher", "student"],
  },
  { to: "/school-gallery?page=1", label: "School Gallery", icon: FiImage, roles: ["admin", "teacher", "student"] },
  { to: "/circulars?page=1&limit=10", label: "Circulars", icon: FiSend, roles: ["admin", "teacher", "student"] },
  { to: "/declaration-forms?page=1&limit=10", label: "Declaration Forms", icon: FiClipboard, roles: ["admin", "teacher", "student"] },
  {
    to: "/messages?box=inbox&page=1&limit=10",
    label: "Messages",
    labelByRole: { student: "Inbox", teacher: "Messages", admin: "Messages" },
    icon: FiMessageSquare,
    roles: ["admin", "teacher", "student"],
  },
  { to: "/polls", label: "Polls", icon: FiLayout, roles: ["admin", "teacher", "student"] },
  { to: "/profile", label: "Profile", icon: FiUser, roles: ["admin", "teacher", "student"] },
];

/** Breadcrumb/sidebar labels for a role. */
function labelFor(role: Role): Record<string, string> {
  return {
    "/dashboard": "Dashboard",
    "/approvals": role === "student" ? "My Leaves" : "Leave Approvals",
    "/course-progress": role === "student" ? "My Progress" : "Course Progress",
    "/events": "Events & Calendar",
    "/homeworks": "Homeworks",
    "/study-room": "Study Room",
    "/my-library": "Library",
    "/issue-book": "Issue Book",
    "/digital-library": "Digital Library",
    "/examination-report-cards": "Report Cards",
    "/my-attendance": "Attendance",
    "/fee-collections/create": role === "student" ? "My Fee" : "Fee Collection",
    "/school-gallery": "School Gallery",
    "/circulars": "Circulars",
    "/declaration-forms": "Declaration Forms",
    "/messages": "Messages",
    "/polls": "Polls",
    "/profile": "Profile",
  };
}

export default function AppShell({ children }: { children?: ReactNode }) {
  const { profile, viewAsRole, viewingRole, demoMode, inDemo, configError, signOut } = useAuth();
  const { mode, toggle } = useTheme();
  const data = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const role: Role = viewingRole ?? profile?.role ?? "student";

  const mainNav = NAV.filter((item) => item.roles.includes(role));

  const routeLabels = labelFor(role);

  const breadcrumbItems = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const parts: { label: string; to?: string }[] = [{ label: "Home", to: "/dashboard" }];
    let path = "";
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
    navigate("/login");
  };

  const showDemoCard = inDemo || demoMode;

  const pendingLeaves = data.leaves.filter((l) => l.status === "pending").length;
  // Broadcasts target a section: students only see notifications addressed to
  // their own section (or to everyone). Admins and teachers see everything.
  const mySectionLabel = (() => {
    const me = data.people.find((p) => p.id === profile?.id);
    return me?.class_label && me?.section_label ? `${me.class_label} - ${me.section_label}` : undefined;
  })();
  const visibleNotifications = data.notifications.filter(
    (n) => role !== "student" || !n.audience || n.audience === mySectionLabel,
  );
  const unread = visibleNotifications.filter((n) => !n.read).length;

  const badgeFor = (to: string) => {
    if (to === "/approvals" && role !== "student" && pendingLeaves > 0) return pendingLeaves;
    return undefined;
  };

  const renderNav = (items: NavItem[]) =>
    items.map((item) => {
      const itemPath = item.to.split("?")[0];
      const active = location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
      const label = item.labelByRole?.[role] ?? item.label;
      const count = badgeFor(item.to);
      return (
        <Link
          key={item.to}
          to={item.to}
          className={cn(
            "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            active
              ? "bg-brand-primary text-white shadow-sm"
              : "text-slate-600 hover:bg-brand-hover hover:text-white dark:text-slate-300 dark:hover:bg-brand-hover dark:hover:text-white",
          )}
        >
          <item.icon
            className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-white dark:group-hover:text-white")}
          />
          <span className="truncate">{label}</span>
          {count !== undefined && (
            <span
              className={cn(
                "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                active ? "bg-white/20 text-white" : "bg-brand-accent/10 text-brand-primary dark:text-olive-300",
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
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800">
        <img src="/brand/pws-logo.png" alt="" className="h-9 w-9 rounded-full object-contain" />
        <div className="min-w-0">
          <div className="truncate text-sm font-bold leading-tight text-ink dark:text-white">Pacific World</div>
          <div className="truncate text-[10px] uppercase tracking-wider text-muted">School ERP</div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto text-slate-400 hover:text-ink dark:hover:text-white md:hidden"
          aria-label="Close menu"
        >
          <FiX size={18} />
        </button>
      </div>

      <nav className="scroll-slim flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            My school
          </div>
          <div className="space-y-0.5">{renderNav(mainNav)}</div>
        </div>
      </nav>

      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-800">
        {showDemoCard && (
          <div className="mb-3 rounded-lg border border-amber-100 bg-amber-50 p-2.5 dark:border-amber-900 dark:bg-amber-950">
            <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Demo mode</div>
            <div className="mt-0.5 text-[10px] leading-snug text-amber-700 dark:text-amber-400">
              Sample data only.
            </div>
            <div className="mt-1.5 flex flex-wrap gap-3">
              <button
                onClick={() => data.resetDemoData()}
                className="text-[10px] font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 dark:text-amber-300"
              >
                Reset demo data
              </button>
              <button
                onClick={handleLogout}
                className="text-[10px] font-medium text-amber-800 underline decoration-amber-300 underline-offset-2 dark:text-amber-300"
              >
                Exit demo
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-800">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
            {initials(profile?.full_name ?? "U")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-ink dark:text-white">{profile?.full_name ?? "User"}</div>
            <div className="truncate text-[10px] text-muted">{profile?.login_id ?? ""}</div>
          </div>
          <Badge variant="olive" className="text-[9px] capitalize">
            {role}
          </Badge>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-brand-primary transition-colors hover:bg-brand-hover/10 hover:text-brand-hover dark:text-olive-300"
        >
          <FiLogOut size={14} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-ink dark:bg-slate-900 dark:text-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-800 md:relative md:z-0 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarBody}
      </aside>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <header className="z-20 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-800 md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white md:hidden"
            aria-label="Open menu"
          >
            <FiMenu size={20} />
          </button>

          <div className="hidden md:block">
            <div className="text-[10px] uppercase tracking-widest text-muted">Pacific World School</div>
            <div className="text-sm font-semibold text-ink dark:text-white">
              {routeLabels[location.pathname] ?? "Dashboard"}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {configError && (
              <Badge variant="warning" className="hidden cursor-help text-[10px] sm:inline-flex" title={configError}>
                Config
              </Badge>
            )}
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
              aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={mode === "dark" ? "Light mode" : "Dark mode"}
            >
              {mode === "dark" ? <FiSun size={18} /> : <FiMoon size={18} />}
            </button>
            {/* Gate on the REAL profile role, not the view-as override, so an
                admin previewing another role can always switch back. */}
            {profile?.role === "admin" && (
              <RoleSwitcher roles={["admin", "teacher", "student"]} current={viewingRole} onChange={viewAsRole} />
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary/10 text-xs font-bold text-brand-primary dark:bg-olive-700 dark:text-olive-300">
              {initials(profile?.full_name ?? "U")}
            </div>
          </div>
        </header>

        <div className="shrink-0 px-4 pt-3 md:px-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <main className="scroll-slim flex-1 overflow-y-auto px-4 pb-8 pt-2 md:px-6">
          {children ?? <Outlet />}
        </main>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-2 text-[10px] text-muted dark:border-slate-800 dark:bg-slate-800">
          Pacific World School ERP · {new Date().getFullYear()}
          {showDemoCard ? " · Demo build" : ""}
        </footer>
      </div>
    </div>
  );
}
