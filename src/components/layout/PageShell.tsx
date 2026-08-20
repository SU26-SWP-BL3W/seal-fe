import { ReactNode } from "react";

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[var(--container-max)] px-4 py-6 sm:px-6 sm:py-8 ${className}`}>
      {children}
    </div>
  );
}
