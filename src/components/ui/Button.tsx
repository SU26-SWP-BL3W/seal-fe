import { ButtonHTMLAttributes, CSSProperties, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Accent = "primary" | "team" | "mentor" | "judge" | "coordinator";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Tô theo màu vai trò (Team/Mentor/Judge/Coordinator) — mặc định dùng accent chính hệ thống. */
  accent?: Accent;
}

const ACCENT_VALUE: Record<Accent, string> = {
  primary: "var(--accent-primary)",
  team: "var(--accent-team)",
  mentor: "var(--accent-mentor)",
  judge: "var(--accent-judge)",
  coordinator: "var(--accent-coordinator)",
};

// --btn-accent được set qua inline style (xem bên dưới) rồi các class Tailwind
// arbitrary-value dưới đây đọc lại — bắt buộc viết class là chuỗi TĨNH
// (var(--btn-accent)) để Tailwind sinh đúng CSS lúc build, không được nội suy
// thẳng màu vào className (Tailwind sẽ không nhận ra class động).
// Hint "color:" trong text-[color:var(--x)] chỉ để rõ ý — Tailwind vẫn sinh
// đúng "color: var(--x)" dù có hint hay không. Lỗi mất màu chữ thật sự nằm ở
// globals.css (rule "body{color}" viết trần, không nằm trong @layer base, nên
// unlayered luôn đè lên mọi utility — đã sửa ở đó).
const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    "border-transparent bg-[var(--btn-accent)] text-[color:var(--bg-base)] hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.4)]",
  secondary:
    "border-[var(--border-muted)] bg-[var(--bg-panel)] text-[color:var(--text-primary)] hover:bg-[var(--bg-input)]",
  ghost:
    "border-[var(--border-muted)] bg-transparent text-[color:var(--text-primary)] hover:border-[var(--btn-accent)] hover:bg-white/5 hover:text-white",
};

// Component UI dùng chung DUY NHẤT cho toàn app — feature KHÔNG được tự định nghĩa
// Button riêng (đây chính là vấn đề FE cũ mắc phải).
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", accent = "primary", className = "", style, ...props }, ref) => (
    <button
      ref={ref}
      style={{ "--btn-accent": ACCENT_VALUE[accent], ...style } as CSSProperties}
      className={`hud-clipped inline-flex items-center justify-center gap-[var(--space-sm)] border px-[var(--space-lg)] py-[var(--space-sm)] font-mono text-sm font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--btn-accent)] disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
