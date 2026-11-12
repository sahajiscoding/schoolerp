import type { HTMLAttributes, ReactNode, ElementType } from 'react';
import { cn } from '../lib/utils';

export function Page({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-[1480px] space-y-6 pb-8', className)} {...props}>
      {children}
    </div>
  );
}

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn('relative overflow-hidden rounded-editorial border border-border bg-paper px-5 py-6 shadow-card sm:px-7 sm:py-7', className)}>
      <div className="absolute inset-y-0 left-0 w-1 bg-gold" aria-hidden="true" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-moss">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-3xl font-medium leading-[1.05] tracking-[-0.025em] text-ink sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">{description}</p>}
          {meta && <div className="mt-3 text-xs font-medium text-muted">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className="heritage-rule mt-5" aria-hidden="true" />
    </header>
  );
}

type SectionHeadingProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeading({ title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h2 className="font-display text-xl font-medium tracking-[-0.01em] text-ink sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-muted">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ElementType;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ title, description, icon: Icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex min-h-48 flex-col items-center justify-center rounded-heritage border border-dashed border-forest/20 bg-parchment/35 px-5 py-8 text-center', className)}>
      {Icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-forest text-gold" aria-hidden="true">
          <Icon size={18} />
        </span>
      )}
      <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
      {description && <p className="mt-1 max-w-md text-sm leading-5 text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function MetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('stagger-grid grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>;
}
