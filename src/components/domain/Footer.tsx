import { Link } from "@/i18n/routing";

// Footer toàn cục — chỉ trỏ tới route CÓ THẬT (/, /login, /register). Không
// thêm cột "Kết nối"/mạng xã hội kiểu Devpost vì SEAL chưa có kênh nào thật —
// bịa link dẫn tới đâu đó không tồn tại còn tệ hơn là không có footer.
export function Footer() {
  return (
    <footer className="border-t border-[var(--border-muted)] bg-[var(--bg-panel)]/60">
      <div className="mx-auto grid w-full max-w-[var(--container-max)] grid-cols-2 gap-[var(--space-xl)] px-[var(--space-xl)] py-[var(--space-xl)] sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-[var(--space-sm)]">
            <svg viewBox="0 0 100 100" className="h-6 w-6" aria-hidden="true">
              <polygon
                points="50,4 92,27 92,73 50,96 8,73 8,27"
                fill="none"
                stroke="var(--accent-primary)"
                strokeWidth="5"
              />
              <polygon points="50,30 68,40 68,60 50,70 32,60 32,40" fill="var(--accent-primary)" opacity="0.35" />
            </svg>
            <span className="font-display text-base font-bold text-[color:var(--text-primary)]">SEAL</span>
          </div>
          <p className="mt-[var(--space-sm)] max-w-xs text-sm text-[color:var(--text-muted)]">
            Nền tảng tổ chức &amp; chấm thi hackathon — đồ án SWP391, nhóm BL3W, SU26.
          </p>
        </div>

        <div>
          <h3 className="mb-[var(--space-sm)] text-sm font-semibold text-[color:var(--text-primary)]">Sự kiện</h3>
          <ul className="flex flex-col gap-[var(--space-xs)] text-sm text-[color:var(--text-muted)]">
            <li>
              <Link href="/events" className="hover:text-[color:var(--accent-primary)]">
                Khám phá sự kiện
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-[var(--space-sm)] text-sm font-semibold text-[color:var(--text-primary)]">Tài khoản</h3>
          <ul className="flex flex-col gap-[var(--space-xs)] text-sm text-[color:var(--text-muted)]">
            <li>
              <Link href="/login" className="hover:text-[color:var(--accent-primary)]">
                Đăng nhập
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-[color:var(--accent-primary)]">
                Đăng ký
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--border-muted)] px-[var(--space-xl)] py-[var(--space-md)]">
        <p className="mx-auto w-full max-w-[var(--container-max)] text-xs text-[color:var(--text-muted)]">
          © 2026 SEAL — Đồ án SWP391, nhóm BL3W.
        </p>
      </div>
    </footer>
  );
}
