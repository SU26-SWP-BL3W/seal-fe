import { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "bordered" | "interactive";
}

export function Card({
  variant = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "border border-slate-800/80 bg-slate-900/70 shadow-xl",
    glass: "border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl",
    bordered: "border-2 border-slate-700/80 bg-slate-950/80 shadow-md",
    interactive:
      "border border-slate-800/80 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900/90 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer",
  };

  return (
    <div
      className={`rounded-2xl p-6 text-slate-100 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
