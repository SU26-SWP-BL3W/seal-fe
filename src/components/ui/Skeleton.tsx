// Khung xám thay cho chữ "đang tải" — giữ đúng chiều cao khối thật để layout
// không nhảy khi dữ liệu về.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-[var(--bg-input)] motion-reduce:animate-none ${className}`}
    />
  );
}

export function SkeletonRows({ rows = 3, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-[var(--space-sm)] ${className}`} role="status" aria-label="Đang tải dữ liệu">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
