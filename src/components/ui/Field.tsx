"use client";

import { useId, type ReactNode } from "react";

export interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}

export function Field({ label, required = false, hint, error, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const message = error ?? hint;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-[color:var(--text-primary)]">
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
          className={`text-xs ${error ? "text-[color:var(--color-danger)]" : "text-[color:var(--text-muted)]"}`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
