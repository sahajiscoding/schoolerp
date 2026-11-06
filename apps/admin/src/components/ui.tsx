import * as React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Role } from "../lib/types";
import { cn } from "../lib/utils";
import { FiBell, FiAlertCircle, FiUser, FiChevronDown } from "react-icons/fi";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "olive" | "terracotta" | "navy" | "accent" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "olive", size = "md", children, ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50";
  const variants: Record<string, string> = {
    // Reference roles: primary olive + red hover; accent (lighter olive) darkens to primary.
    olive: "bg-brand-primary text-white hover:bg-brand-hover active:bg-brand-hover/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring/40",
    terracotta: "bg-brand-accent text-white hover:bg-brand-primary active:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring/40",
    navy: "bg-brand-primary text-white hover:bg-brand-hover active:bg-brand-hover/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring/40",
    accent: "bg-brand-accent text-white hover:bg-brand-primary active:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring/40",
    outline:
      "border border-slate-300 bg-white text-ink hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
    ghost: "bg-transparent text-ink hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800",
    danger: "bg-brand-hover text-white hover:bg-brand-hover/90 active:bg-brand-hover/80",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
}

export function Card({ children, className, header, footer, padded = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800",
        padded ? "p-6" : "p-0",
        className,
      )}
    >
      {header && <div className="mb-4">{header}</div>}
      <div className="overflow-auto">{children}</div>
      {footer && <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">{footer}</div>}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ className, title, subtitle, action, children }: CardHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-2", className)}>
      <div>
        {children ?? (
          <>
            {title && <h3 className="text-lg font-bold text-ink dark:text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </>
        )}
      </div>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: string;
  children?: React.ReactNode;
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors";
  const variants: Record<string, string> = {
    default: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    olive: "border-brand-primary/20 bg-brand-primary/5 text-brand-primary dark:text-olive-300",
    terracotta: "border-brand-accent/20 bg-brand-accent/10 text-brand-primary dark:text-olive-300",
    navy: "border-brand-primary/20 bg-brand-primary/5 text-brand-primary dark:text-olive-300",
    accent: "border-brand-accent/20 bg-brand-accent/10 text-brand-primary dark:text-olive-300",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    warning: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
    pending: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
    danger: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
    holiday: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
    neutral: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode;
  striped?: boolean;
}

export function Table({ children, className, striped = true, ...props }: TableProps) {
  void striped;
  return (
    <table className={cn("w-full border-collapse text-sm", className)} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <thead className={cn("[&_tr]:border-b [&_tr]:border-slate-200 dark:[&_tr]:border-slate-700", className)}>
      {children}
    </thead>
  );
}

export function TableRow({
  className,
  children,
  ...props
}: { className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "[&_td]:border-b [&_td]:border-slate-100 [&_td]:p-3 [&_td]:align-top transition-colors hover:bg-slate-50 dark:[&_td]:border-slate-800 dark:hover:bg-slate-800/50",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <th className={cn("pb-2 text-left text-xs font-medium uppercase tracking-wider text-muted", className)}>
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  colSpan,
  rowSpan,
  ...props
}: { className?: string; children?: React.ReactNode; colSpan?: number; rowSpan?: number } & React.HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("text-sm text-ink dark:text-slate-100", className)} colSpan={colSpan} rowSpan={rowSpan} {...props}>
      {children}
    </td>
  );
}

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  delta?: string;
  icon?: React.ElementType;
  variant?: "olive" | "terracotta" | "navy" | "accent" | "neutral" | "warning";
}

export function StatCard({ className, label, value, delta, icon: Icon, variant = "olive", ...props }: StatCardProps) {
  const colorMap: Record<string, string> = {
    olive: "border-brand-primary/10 bg-brand-primary/5 text-brand-primary dark:text-olive-300",
    terracotta: "border-brand-accent/20 bg-brand-accent/10 text-brand-primary dark:text-olive-300",
    navy: "border-brand-primary/10 bg-brand-primary/5 text-brand-primary dark:text-olive-300",
    accent: "border-brand-accent/20 bg-brand-accent/10 text-brand-primary dark:text-olive-300",
    neutral: "border-slate-200 bg-slate-50 text-ink dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
    warning: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  };
  return (
    <div className={cn("flex flex-col rounded-xl border p-5", colorMap[variant], className)} {...props}>
      <div className="mb-3 flex items-center justify-between">
        {Icon && <Icon className="h-5 w-5 shrink-0" style={{ opacity: 0.5 }} />}
        {delta && <span className="text-xs font-medium">{delta}</span>}
      </div>
      <div className="text-2xl font-bold text-ink dark:text-white">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="mb-1 flex items-center gap-1 text-xs text-muted" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {last || !item.to ? (
              <span className={last ? "font-medium text-ink dark:text-white" : "text-muted"}>{item.label}</span>
            ) : (
              <Link to={item.to} className="transition-colors hover:text-brand-primary dark:hover:text-olive-300">
                {item.label}
              </Link>
            )}
            {!last && <span className="mx-1 text-slate-300 dark:text-slate-600">/</span>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  kind: string;
  created_at: string;
  read: boolean;
}

interface NotificationsDropdownProps {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  open?: boolean;
  onToggle?: () => void;
}

export function NotificationsDropdown({
  notifications,
  onMarkRead,
  onMarkAllRead,
  open,
  onToggle,
}: NotificationsDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((v) => !v));
  const unread = notifications.filter((n) => !n.read).length;
  const kindColor: Record<string, string> = {
    notice: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    message: "bg-brand-accent/10 text-brand-primary dark:text-olive-300",
    assignment: "bg-brand-primary/10 text-brand-primary dark:text-olive-300",
    fee: "bg-brand-accent/10 text-brand-primary dark:text-olive-300",
    approval: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  };
  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <FiBell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-700">
            <span className="text-xs font-semibold uppercase text-ink dark:text-white">Notifications</span>
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-brand-primary underline decoration-1 decoration-brand-primary/30 underline-offset-2 hover:text-brand-hover dark:text-olive-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted">No new notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex cursor-pointer gap-2 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50",
                    !n.read ? "bg-brand-primary/5 dark:bg-brand-primary/20" : "",
                  )}
                  onClick={() => onMarkRead(n.id)}
                >
                  <div className="shrink-0">
                    <span className={cn("rounded p-1", kindColor[n.kind] ?? kindColor.notice)}>
                      <FiAlertCircle size={12} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-ink dark:text-white">{n.title}</div>
                    <div className="truncate text-[10px] text-muted">{n.body}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">
                      {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RoleSwitcherProps {
  roles: Role[];
  current: Role | null;
  onChange: (role: Role | null) => void;
}

export function RoleSwitcher({ roles, current, onChange }: RoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const labels: Record<Role, string> = { admin: "Admin", teacher: "Teacher", student: "Student" };
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-ink transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
        aria-expanded={open}
      >
        <FiUser size={14} />
        <span>{current ? labels[current] : "View as"}</span>
        <FiChevronDown size={12} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800">
          <div className="px-3 pb-1 pt-1 text-[10px] uppercase tracking-wider text-slate-400">Preview as</div>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => {
                onChange(role);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors",
                current === role
                  ? "bg-slate-100 font-medium text-ink dark:bg-slate-700 dark:text-white"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700",
              )}
            >
              {labels[role]}
            </button>
          ))}
          {current && (
            <button
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="mt-1 w-full border-t border-slate-100 px-3 py-1.5 text-left text-xs text-brand-primary hover:bg-brand-primary/5 dark:border-slate-700 dark:text-olive-300"
            >
              Back to my role
            </button>
          )}
        </div>
      )}
    </div>
  );
}
