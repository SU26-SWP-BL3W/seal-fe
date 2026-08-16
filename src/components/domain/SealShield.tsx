// Khiên hexagon SEAL — vector SVG tự vẽ, 2 lớp hexagon lồng nhau. Dùng chung
// cho Landing Portal và các trang khác cần logo shield (spec §4.1, §15.1 —
// không nhân bản component đã có sẵn hình dạng này).
export function SealShield({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <polygon points="50,2 95,26 95,74 50,98 5,74 5,26" fill="none" stroke="var(--accent-primary)" strokeWidth="1.5" opacity="0.6" />
      <polygon points="50,16 82,33 82,67 50,84 18,67 18,33" fill="rgba(0,217,255,0.06)" stroke="var(--accent-primary)" strokeWidth="1" />
      <polygon points="50,32 68,42 68,62 50,72 32,62 32,42" fill="rgba(0,217,255,0.12)" />
    </svg>
  );
}
