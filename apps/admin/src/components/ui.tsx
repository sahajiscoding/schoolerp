import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Role } from '../lib/types';
import { cn } from '../lib/utils';
import { FiAlertCircle, FiBell, FiChevronDown, FiUser } from 'react-icons/fi';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'olive' | 'terracotta' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ className, variant = 'primary', size = 'md', children, ...props }: ButtonProps) {
  const base = 'focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-[background-color,color,border-color,box-shadow,transform] duration-150 disabled:pointer-events-none disabled:opacity-50';
  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'border border-forest bg-forest text-paper shadow-sm hover:bg-forest-900 active:translate-y-px',
    olive: 'border border-forest bg-forest text-paper shadow-sm hover:bg-forest-900 active:translate-y-px',
    secondary: 'border border-moss bg-moss text-white shadow-sm hover:bg-moss/90 active:translate-y-px',
    terracotta: 'border border-terracotta bg-terracotta text-white shadow-sm hover:bg-terracotta/90 active:translate-y-px',
    outline: 'border border-forest/20 bg-paper text-forest hover:border-forest/35 hover:bg-parchment/55 active:translate-y-px',
    ghost: 'border border-transparent bg-transparent text-forest hover:bg-forest/[0.07] active:translate-y-px',
    danger: 'border border-red-700 bg-red-700 text-white hover:bg-red-800 active:translate-y-px',
  };
  const sizes = {
    sm: 'min-h-9 px-3 py-1.5 text-xs',
    md: 'min-h-11 px-4 py-2.5 text-sm',
    lg: 'min-h-12 px-6 py-3 text-base',
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
}

export function Card({ children, className, header, footer, padded = true, ...props }: CardProps) {
  return (
    <div className={cn('surface-paper min-w-0', padded ? 'p-5 sm:p-6' : 'p-0', className)} {...props}>
      {header && <div className="mb-4">{header}</div>}
      <div className="min-w-0 overflow-x-auto">{children}</div>
      {footer && <div className="mt-4 border-t border-border pt-4">{footer}</div>}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ className, title, subtitle, action, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...props}>
      <div className="min-w-0">
        {children ?? (
          <>
            {title && <h2 className="font-display text-xl font-medium text-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
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
  const base = 'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold leading-none tracking-[0.02em]';
  const variants: Record<string, string> = {
    default: 'border-forest/15 bg-parchment/50 text-muted',
    olive: 'border-moss/30 bg-moss/10 text-[#4f5f28]',
    terracotta: 'border-terracotta/25 bg-terracotta/10 text-[#8f3d29]',
    success: 'border-emerald-700/20 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-700/20 bg-amber-50 text-amber-900',
    danger: 'border-red-700/20 bg-red-50 text-red-800',
    info: 'border-blue-700/20 bg-blue-50 text-blue-800',
    pending: 'border-forest/15 bg-parchment/50 text-muted',
    neutral: 'border-forest/15 bg-parchment/50 text-muted',
  };
  return <span className={cn(base, variants[variant] ?? variants.default, className)} {...props}>{children}</span>;
}

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children?: React.ReactNode;
  striped?: boolean;
}

export function Table({ children, className, ...props }: TableProps) {
  return <table className={cn('w-full min-w-[640px] border-collapse text-sm', className)} {...props}>{children}</table>;
}

export function TableHeader({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <thead className={cn('border-b border-forest/15 bg-parchment/45', className)}>{children}</thead>;
}

export function TableRow({ className, children, ...props }: { className?: string; children?: React.ReactNode } & React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('border-b border-forest/10 transition-colors duration-150 last:border-b-0 hover:bg-parchment/35 [&_td]:p-3.5 [&_td]:align-top', className)} {...props}>{children}</tr>;
}

export function TableHead({ className, children, ...props }: { className?: string; children?: React.ReactNode } & React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-3.5 py-3 text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted', className)} {...props}>{children}</th>;
}

export function TableCell({ className, children, colSpan, rowSpan, ...props }: { className?: string; children?: React.ReactNode; colSpan?: number; rowSpan?: number } & React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('text-sm text-ink', className)} colSpan={colSpan} rowSpan={rowSpan} {...props}>{children}</td>;
}

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  delta?: string;
  icon?: React.ElementType;
  variant?: 'olive' | 'terracotta' | 'neutral' | 'warning';
}

export function StatCard({ className, label, value, delta, icon: Icon, variant = 'olive', ...props }: StatCardProps) {
  const accents = {
    olive: 'border-moss/25 [&_.metric-icon]:bg-moss/10 [&_.metric-icon]:text-moss',
    terracotta: 'border-terracotta/20 [&_.metric-icon]:bg-terracotta/10 [&_.metric-icon]:text-terracotta',
    neutral: 'border-forest/15 [&_.metric-icon]:bg-forest/[0.08] [&_.metric-icon]:text-forest',
    warning: 'border-amber-700/20 [&_.metric-icon]:bg-amber-100 [&_.metric-icon]:text-amber-800',
  };
  return (
    <div className={cn('surface-paper hover-lift relative flex min-h-36 flex-col overflow-hidden p-5', accents[variant], className)} {...props}>
      <div className="flex items-start justify-between gap-3">
        {Icon && <span className="metric-icon flex h-9 w-9 items-center justify-center rounded-xl" aria-hidden="true"><Icon size={17} /></span>}
        {delta && <span className="text-xs font-bold text-muted">{delta}</span>}
      </div>
      <div className="mt-auto pt-4 font-display text-3xl font-medium leading-none tracking-[-0.025em] text-ink">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted">{label}</div>
    </div>
  );
}

interface BreadcrumbItem { label: string; to?: string }

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex min-w-0 items-center gap-1 overflow-hidden text-[11px] font-semibold text-muted" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            {last || !item.to ? (
              <span className={cn('truncate', last && 'text-ink')} aria-current={last ? 'page' : undefined}>{item.label}</span>
            ) : (
              <Link to={item.to} className="shrink-0 transition-colors duration-150 hover:text-forest">{item.label}</Link>
            )}
            {!last && <span className="mx-1 text-forest/25" aria-hidden="true">/</span>}
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

export function NotificationsDropdown({ notifications, onMarkRead, onMarkAllRead, open, onToggle }: NotificationsDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const toggle = useCallback(() => {
    if (onToggle) onToggle();
    else setInternalOpen((value) => !value);
  }, [onToggle]);
  const unread = notifications.filter((notification) => !notification.read).length;
  const kindColor: Record<string, string> = {
    notice: 'bg-parchment text-forest',
    message: 'bg-blue-100 text-blue-800',
    assignment: 'bg-moss/10 text-moss',
    fee: 'bg-terracotta/10 text-terracotta',
    approval: 'bg-amber-100 text-amber-800',
  };

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') toggle(); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [isOpen, toggle]);

  return (
    <div className="relative">
      <button onClick={toggle} className="focus-ring touch-target relative inline-flex shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-forest/[0.08] hover:text-forest" aria-label="Notifications" aria-expanded={isOpen} aria-haspopup="dialog">
        <FiBell size={18} />
        {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-terracotta ring-2 ring-paper"><span className="sr-only">{unread} unread</span></span>}
      </button>
      {isOpen && (
        <div role="dialog" aria-label="Notifications panel" className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-dialog-in overflow-hidden rounded-editorial border border-border bg-paper shadow-lift">
          <div className="flex items-center justify-between border-b border-border bg-forest px-4 py-3 text-paper">
            <span className="font-display text-lg font-medium">Notifications</span>
            {unread > 0 && <button onClick={onMarkAllRead} className="min-h-9 text-xs font-bold text-gold underline decoration-gold/40 underline-offset-4">Mark all read</button>}
          </div>
          <div className="max-h-[340px] overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-muted">No new notifications</div>
            ) : notifications.map((notification) => (
              <button key={notification.id} type="button" onClick={() => onMarkRead(notification.id)} className={cn('flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors duration-150 hover:bg-parchment/60', !notification.read && 'bg-gold/10')}>
                <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', kindColor[notification.kind] ?? kindColor.notice)} aria-hidden="true"><FiAlertCircle size={13} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-ink">{notification.title}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-muted">{notification.body}</span>
                  <span className="mt-1 block text-[10px] font-semibold text-muted/75">{new Date(notification.created_at).toLocaleDateString()}</span>
                </span>
              </button>
            ))}
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
  const labels: Record<Role, string> = { admin: 'Admin', teacher: 'Teacher', student: 'Student' };
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [open]);
  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen((value) => !value)} className="focus-ring flex min-h-10 items-center gap-2 rounded-full border border-border bg-paper px-3 text-xs font-bold text-ink transition-colors duration-150 hover:bg-parchment/60" aria-expanded={open} aria-haspopup="menu">
        <FiUser size={14} aria-hidden="true" />
        <span>{current ? labels[current] : 'View as'}</span>
        <FiChevronDown size={12} className={cn('text-muted transition-transform duration-150', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" aria-label="Preview role" className="absolute right-0 top-full z-50 mt-2 w-44 animate-dialog-in overflow-hidden rounded-heritage border border-border bg-paper py-1 shadow-lift">
          <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">Preview as</div>
          {roles.map((role) => (
            <button key={role} role="menuitem" onClick={() => { onChange(role); setOpen(false); }} className={cn('flex w-full items-center px-3 py-2 text-left text-xs font-semibold transition-colors duration-150', current === role ? 'bg-gold/30 text-forest' : 'text-muted hover:bg-parchment/60 hover:text-ink')}>
              {labels[role]}
            </button>
          ))}
          {current && <button role="menuitem" onClick={() => { onChange(null); setOpen(false); }} className="mt-1 w-full border-t border-border px-3 py-2 text-left text-xs font-bold text-terracotta hover:bg-terracotta/5">Back to my role</button>}
        </div>
      )}
    </div>
  );
}
