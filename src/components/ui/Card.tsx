import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 ${className}`}
      {...props}
    />
  );
}
