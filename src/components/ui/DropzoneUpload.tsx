import { HTMLAttributes } from "react";
import { UploadCloud } from "lucide-react";

export function DropzoneUpload({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative w-full p-6 border-2 border-dashed border-[var(--border-muted)] hover:border-[var(--accent-primary)] bg-[var(--bg-panel)]/50 transition-all duration-200 flex flex-col items-center justify-center text-center hud-clipped cursor-pointer ${className || ""}`}
      {...props}
    >
      <UploadCloud className="w-8 h-8 text-[var(--text-muted)] mb-3" />
      <span className="text-xs font-mono text-[var(--text-primary)] mb-1">
        DRAG & DROP HOẶC <span className="text-[var(--accent-primary)] underline cursor-pointer">CHỌN FILE</span>
      </span>
      <span className="text-[10px] font-mono text-[var(--text-muted)]">PNG, JPG up to 5MB</span>
    </div>
  );
}
