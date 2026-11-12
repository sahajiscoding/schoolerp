import * as React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Role } from '../lib/types';
import { cn } from '../lib/utils';
import {
  FiBell,
  FiAlertCircle,
  FiUser,
  FiChevronDown,
} from 'react-icons/fi';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'olive' | 'terracotta' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({
  className,
  variant = 'olive',
  size = 'md',
  children,
  ...props
}: ButtonProps) {
  const base =
    'campus-button focus-ring inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-50';
  const variants: Record<string, string> = {
    primary: 'bg-olive text-white shadow-sm hover:bg-deep-olive active:bg-olive-800',
    olive: 'bg-olive text-white shadow-sm hover:bg-deep-olive active:bg-olive-800',
    secondary: 'bg-terracotta text-ink shadow-sm hover:bg-terracotta-600 active:bg-terracotta-700',
    terracotta: 'bg-terracotta text-ink shadow-sm hover:bg-terracotta-600 active:bg-terracotta-700',
    outline: 'border border-olive/25 bg-paper text-deep-olive hover:border-olive/45 hover:bg-daylight active:bg-leaf/35',
    ghost: 'bg-transparent text-deep-olive hover:bg-leaf/35 active:bg-leaf/55',
    danger: 'bg-red-700 text-white shadow-sm hover:bg-red-800 active:bg-red-900',
  };
  const sizes: Record<string, string> = {
    sm: 'min-h-9 px-3 py-1.5 text-xs',
    md: 'min-h-11 px-4 py-2 text-sm',
    lg: 'min-h-12 px-6 py-3 text-base',
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
    <div className={cn('surface-paper', padded ? 'p-5 sm:p-6' : 'p-0', className)}>
      {header && <div className="mb-4">{header}</div>}
      <div className="min-w-0 overflow-x-auto">{children}</div>
      {footer && <div className="mt-4 border-t border-olive/10 pt-4">{footer}</div>}
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
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div>
        {children ?? (
          <>
            {title && <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm leading-5 text-muted">{subtitle}</p>}
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

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-full border px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.06em]';
  const variants: Record<string, string> = {
    default: 'border-olive/15 bg-daylight text-muted',
    olive: 'border-olive/20 bg-leaf/45 text-deep-olive',
    terracotta: 'border-terracotta/25 bg-terracotta-100 text-terracotta-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    pending: 'border-stone-200 bg-stone-50 text-stone-700',
    neutral: 'border-stone-200 bg-stone-50 text-stone-700',
  };
  return <span className={cn(base, variants[variant], className)} {...props}>{children}</span>;
}

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode;
  striped?: boolean;
}

export function Table({ children, className, striped = true, ...props }: TableProps) {
  return (
    <table
      className={cn('w-full min-w-[38rem] border-separate border-spacing-0 text-sm', striped ? '' : '', className)}
      {...props}
    >
      {children}
    </table>
  );
}

export function TableHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <thead className={cn('bg-daylight/70 [&_tr]:border-b [&_tr]:border-olive/10', className)}>
      {children}
    </thead>
  );
}

export function TableRow({ className, children, ...props }: { className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('[&_td]:border-b [&_td]:border-olive/[0.08] [&_td]:px-4 [&_td]:py-3.5 [&_td]:align-top transition-colors hover:bg-leaf/15', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <th
      className={cn('px-4 py-3 text-left text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted', className)}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, colSpan, rowSpan, ...props }: { className?: string; children?: React.ReactNode; colSpan?: number; rowSpan?: number } & React.HTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('text-sm text-ink', className)} colSpan={colSpan} rowSpan={rowSpan} {...props}>{children}</td>;
}

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  delta?: string;
  icon?: React.ElementType;
   variant?: 'olive' | 'terracotta' | 'neutral' | 'warning';
}

export function StatCard({
  className,
  label,
  value,
  delta,
  icon: Icon,
  variant = 'olive',
  ...props
}: StatCardProps) {
  const colorMap: Record<string, string> = {
    olive: 'border-olive/10 bg-leaf/45 text-deep-olive',
    terracotta: 'border-terracotta/15 bg-clay/55 text-terracotta-700',
    neutral: 'border-olive/10 bg-paper text-ink',
    warning: 'border-amber-200/70 bg-amber-50 text-amber-800',
  };
  return (
    <div className={cn('surface-interactive flex min-h-36 flex-col rounded-campus border p-5', colorMap[variant], className)} {...props}>
      <div className="mb-4 flex items-center justify-between">
        {Icon && <span className="flex h-9 w-9 items-center justify-center rounded-full bg-paper/70"><Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" /></span>}
        {delta && <span className="text-xs font-medium">{delta}</span>}
      </div>
      <div className="font-display text-3xl font-semibold leading-none tracking-[-0.025em] text-ink">{value}</div>
      <div className="mt-2 text-xs font-semibold text-muted">{label}</div>
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
    <nav className="flex min-w-0 items-center gap-1 overflow-hidden text-[0.7rem] font-medium text-muted" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {last || !item.to ? (
              <span className={cn('truncate', last ? 'text-deep-olive' : 'text-muted')} aria-current={last ? 'page' : undefined}>{item.label}</span>
            ) : (
              <Link to={item.to} className="shrink-0 rounded-sm transition-colors hover:text-deep-olive">
                {item.label}
              </Link>
            )}
            {!last && <span className="mx-1 text-olive/30" aria-hidden="true">/</span>}
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
  const popoverId = React.useId();
  const isOpen = open ?? internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((v) => !v));
  const unread = notifications.filter((n) => !n.read).length;
  const kindColor: Record<string, string> = {
    notice: 'bg-stone-100 text-stone-700',
    message: 'bg-sky-100 text-sky-800',
    assignment: 'bg-leaf/60 text-deep-olive',
    fee: 'bg-clay/70 text-terracotta-700',
    approval: 'bg-amber-100 text-amber-800',
  };
  return (
    <div className="relative">
      <button
        onClick={toggle}
        type="button"
        className="touch-target focus-ring relative inline-flex shrink-0 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={isOpen ? popoverId : undefined}
      >
        <FiBell size={18} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-olive bg-terracotta" aria-hidden="true">
          </span>
        )}
      </button>
      {isOpen && (
      <div id={popoverId} role="region" aria-label="Notifications panel" className="dialog-reveal absolute right-0 z-50 mt-2 w-[min(21rem,calc(100vw-2rem))] rounded-campus border border-olive/10 bg-paper p-2 text-ink shadow-lift">
        <div className="flex items-center justify-between border-b border-olive/10 px-3 py-2">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-deep-olive">Notifications</span>
          {unread > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="focus-ring rounded text-xs font-semibold text-deep-olive underline decoration-olive/30 underline-offset-2 hover:text-olive"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="scroll-slim max-h-[320px] overflow-y-auto py-1">
          {notifications.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted">
              No new notifications
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                className={cn('focus-ring flex w-full gap-2 rounded-[10px] p-2.5 text-left transition-colors hover:bg-daylight', !n.read ? 'bg-leaf/25' : '')}
                onClick={() => onMarkRead(n.id)}
              >
                <div className="shrink-0">
                  <span className={`rounded p-1 ${kindColor[n.kind] ?? kindColor.notice}`}>
                    <FiAlertCircle size={12} aria-hidden="true" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-ink">{n.title}</div>
                  <div className="truncate text-[0.68rem] text-muted">{n.body}</div>
                  <div className="mt-0.5 text-[0.65rem] text-muted/80">{new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              </button>
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
  const menuId = React.useId();
  const labels: Record<Role, string> = {
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
  };
  return (
    <div className="relative inline-block" onKeyDown={(event) => {
      if (event.key === 'Escape') setOpen(false);
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex min-h-10 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/15"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
      >
        <FiUser size={14} aria-hidden="true" />
        <span>{current ? labels[current] : 'View as'}</span>
        <FiChevronDown size={12} className="text-white/70" aria-hidden="true" />
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label="Preview role" className="dialog-reveal absolute right-0 top-full z-50 mt-2 w-44 rounded-campus border border-olive/10 bg-paper py-1.5 text-ink shadow-lift">
          <div className="px-3 pb-1 pt-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted">
            Preview as
          </div>
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              role="menuitemradio"
              aria-checked={current === role}
              onClick={() => {
                onChange(role);
                setOpen(false);
              }}
              className={cn(
                'focus-ring flex min-h-10 w-full items-center gap-2 px-3 text-left text-xs transition-colors',
                current === role ? 'bg-leaf/50 font-semibold text-deep-olive' : 'text-muted hover:bg-daylight hover:text-ink',
              )}
            >
              {labels[role]}
            </button>
          ))}
          {current && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="focus-ring mt-1 min-h-10 w-full border-t border-olive/10 px-3 text-left text-xs font-semibold text-terracotta-700 hover:bg-clay/35"
            >
              Back to my role
            </button>
          )}
        </div>
      )}
    </div>
  );
}
