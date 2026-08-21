import { ReactNode } from "react";
import { SealShield } from "@/components/domain/SealShield";

export interface AuthLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Khung auth — flat, không shadow/glow (anti-AI slop). */
export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 sm:p-8">
          <div className="mb-6 flex flex-col items-center space-y-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)]">
              <SealShield className="h-7 w-7 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">{title}</h1>
              {description && <p className="mt-1.5 text-sm text-[var(--text-muted)]">{description}</p>}
            </div>
          </div>
          {children}
        </div>
        {footer && <div className="text-center text-sm text-[var(--text-muted)]">{footer}</div>}
      </div>
    </div>
  );
}
