"use client";

import { useId, type ReactNode } from "react";

export interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}

// Gói label + control + lỗi để mọi form dùng chung một cách nối id và báo lỗi,
// thay vì mỗi màn tự ghép label rời.
export function Field({ label, required = false, hint, error, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-[var(--space-xs)]">
      <label
        htmlFor={id}
        className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]"
      >
        {label}
        {required && <span className="ml-1 text-[color:var(--color-danger)]">*</span>}
      </label>

      {children({
        id,
        ...(error ? { "aria-invalid": true as const } : {}),
        ...(message ? { "aria-describedby": messageId } : {}),
      })}

      {message && (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={`font-mono text-[10px] text-pretty ${
            error ? "text-[color:var(--color-danger)]" : "text-[color:var(--text-muted)]/70"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
