import type { HTMLAttributes, ReactNode, ElementType } from 'react';
import { cn } from '../lib/utils';

export function Page({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[1480px] space-y-6', className)} {...props} />;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-olive/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <p className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-[0.19em] text-terracotta-700">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[clamp(2rem,4vw,3.35rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-ink">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-[0.95rem]">{description}</p>}
        {meta && <div className="mt-3 text-xs font-medium text-deep-olive">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>}
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-[-0.015em] text-ink">{title}</h2>
        {description && <p className="mt-1 text-sm leading-5 text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ElementType;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-campus border border-dashed border-olive/20 bg-daylight/55 px-5 py-10 text-center">
      {Icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-leaf/65 text-deep-olive" aria-hidden="true">
          <Icon size={19} />
        </span>
      )}
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm leading-5 text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function MetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4', className)}>{children}</div>;
}
