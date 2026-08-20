import { ReactNode } from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, breadcrumb, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        {breadcrumb}
        <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-[var(--text-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
