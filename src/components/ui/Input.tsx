import { InputHTMLAttributes, forwardRef } from "react";

// HUD Text Input: nền tối phẳng, viền mờ, phát sáng viền khi focus, góc VUÔNG
// (không dùng .hud-clipped ở đây — đúng theo mẫu input của proposal, chỉ
// Button/Card/Dropzone mới vát góc).
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full border border-[var(--border-muted)] bg-[var(--bg-input)] px-[var(--space-md)] py-[var(--space-sm)] font-mono text-sm text-[color:var(--text-primary)] outline-none transition-all duration-150 placeholder:text-[color:var(--text-muted)]/50 focus:border-[var(--accent-primary)] focus:shadow-[0_0_8px_rgba(0,217,255,0.15)] ${className}`}
      {...props}
    />
  ),
);
Input.displayName = "Input";
