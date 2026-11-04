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

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'olive' | 'terracotta' | 'outline' | 'ghost' | 'danger';
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
    'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50';
  const variants: Record<string, string> = {
    olive: 'bg-olive text-white hover:bg-olive/90 active:bg-olive/80',
    terracotta: 'bg-terracotta text-white hover:bg-terracotta/90 active:bg-terracotta/80',
    outline: 'border border-slate-300 bg-white text-ink hover:bg-sand active:bg-sand/80',
    ghost: 'bg-transparent text-ink hover:bg-sand active:bg-sand/60',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
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
    <div className={cn('bg-white rounded-xl border border-sand/30 shadow-sm', padded ? 'p-6' : 'p-0', className)}>
      {header && <div className="mb-4">{header}</div>}
      <div className="overflow-auto">{children}</div>
      {footer && <div className="mt-4 pt-4 border-t border-sand/20">{footer}</div>}
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
    <div className={cn('flex items-center justify-between gap-2 mb-4', className)}>
      <div>
        {children ?? (
          <>
            {title && <h3 className="text-lg font-bold text-ink">{title}</h3>}
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

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const base =
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors';
  const variants: Record<string, string> = {
    default: 'border-slate-200 text-slate-600 bg-slate-50',
    olive: 'border-olive/20 text-olive bg-olive/5',
    terracotta: 'border-terracotta/20 text-terracotta bg-terracotta/5',
    success: 'border-green-200 text-green-700 bg-green-50',
    warning: 'border-amber-200 text-amber-700 bg-amber-50',
    pending: 'border-slate-200 text-slate-600 bg-slate-50',
    neutral: 'border-slate-200 text-slate-600 bg-slate-50',
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
      className={cn('w-full text-sm border-collapse', striped ? '' : '', className)}
      {...props}
    >
      {children}
    </table>
  );
}

export function TableHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <thead className={cn('[&_tr]:border-b [&_tr]:border-sand/20', className)}>
      {children}
    </thead>
  );
}

export function TableRow({ className, children, ...props }: { className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('[&_td]:border-b [&_td]:border-sand/10 [&_td]:p-3 [&_td]:align-top hover:bg-cream/50 transition-colors', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <th
      className={cn('text-left text-xs font-medium text-muted uppercase tracking-wider pb-2', className)}
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
    olive: 'text-olive bg-olive/5 border-olive/10',
    terracotta: 'text-terracotta bg-terracotta/5 border-terracotta/10',
    neutral: 'text-ink bg-slate-50 border-slate-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-100',
  };
  return (
    <div className={cn('rounded-xl border p-5 flex flex-col', colorMap[variant], className)} {...props}>
      <div className="flex items-center justify-between mb-3">
        {Icon && <Icon className="w-5 h-5 shrink-0" style={{ opacity: 0.5 }} />}
        {delta && <span className="text-xs font-medium">{delta}</span>}
      </div>
      <div className="text-2xl font-bold text-ink">{value}</div>
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
              <span className={last ? 'font-medium text-ink' : 'text-muted'}>{item.label}</span>
            ) : (
              <Link to={item.to} className="transition-colors hover:text-olive">
                {item.label}
              </Link>
            )}
            {!last && <span className="mx-1 text-slate-300">/</span>}
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
    notice: 'bg-slate-100 text-slate-700',
    message: 'bg-blue-100 text-blue-700',
    assignment: 'bg-olive/10 text-olive',
    fee: 'bg-terracotta/10 text-terracotta',
    approval: 'bg-amber-100 text-amber-700',
  };
  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative shrink-0 rounded-lg p-2 text-slate-500 transition-colors hover:bg-sand hover:text-ink"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <FiBell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {isOpen && (
      <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
          <span className="text-xs font-semibold text-ink uppercase">Notifications</span>
          {unread > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-olive hover:text-olive/80 underline decoration-1 decoration-olive/30 underline-offset-2"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto py-1">
          {notifications.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-muted">
              No new notifications
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn('flex gap-2 p-2 rounded-lg hover:bg-sand/50 cursor-pointer transition-colors', !n.read ? 'bg-olive/5' : '')}
                onClick={() => onMarkRead(n.id)}
              >
                <div className="shrink-0">
                  <span className={`rounded p-1 ${kindColor[n.kind] ?? kindColor.notice}`}>
                    <FiAlertCircle size={12} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-ink truncate">{n.title}</div>
                  <div className="text-[10px] text-muted truncate">{n.body}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</div>
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
  const labels: Record<Role, string> = {
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student',
  };
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-ink transition-colors hover:bg-sand"
        aria-expanded={open}
      >
        <FiUser size={14} />
        <span>{current ? labels[current] : 'View as'}</span>
        <FiChevronDown size={12} className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          <div className="px-3 pb-1 pt-1 text-[10px] uppercase tracking-wider text-slate-400">
            Preview as
          </div>
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => {
                onChange(role);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors',
                current === role ? 'bg-sand font-medium text-ink' : 'text-slate-600 hover:bg-slate-50',
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
              className="mt-1 w-full border-t border-slate-100 px-3 py-1.5 text-left text-xs text-terracotta hover:bg-terracotta/5"
            >
              Back to my role
            </button>
          )}
        </div>
      )}
    </div>
  );
}
