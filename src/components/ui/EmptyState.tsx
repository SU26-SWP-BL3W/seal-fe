import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--border-muted)] bg-[var(--bg-panel)]/50 px-6 py-12 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-input)]">
          <Icon className="h-6 w-6 text-[var(--text-muted)]" />
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
