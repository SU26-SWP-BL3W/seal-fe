import { HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-panel)] hud-clipped">
      <table className={`w-full text-left border-collapse ${className || ""}`} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`border-b border-[var(--border-muted)] bg-[var(--bg-base)] ${className || ""}`} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`hover:bg-[rgba(0,217,255,0.02)] transition-colors duration-150 group border-b border-[var(--border-muted)] last:border-0 ${className || ""}`}
      {...props}
    />
  );
}

export function TableHead({
  className,
  align = "left",
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "center" | "right" }) {
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      className={`p-4 font-mono text-xs text-[var(--text-muted)] tracking-wider uppercase ${alignClass} ${className || ""}`}
      {...props}
    />
  );
}

export function TableCell({
  className,
  align = "left",
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "center" | "right" }) {
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <td
      className={`p-4 font-mono text-sm text-[var(--text-primary)] group-hover:translate-x-1 transition-transform duration-150 ${alignClass} ${className || ""}`}
      {...props}
    />
  );
}
