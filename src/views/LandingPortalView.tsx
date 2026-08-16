import {
  ArrowRight,
  Bell,
  CheckCircle2,
  House,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";

const navItems = [
  { label: "Trang chủ", icon: House, active: true },
  { label: "Khám phá Sự kiện", icon: Search, active: false },
];

const metrics = [
  {
    label: "Tổng Sự Kiện",
    value: "0 Sự kiện",
    sub: "Đang & chuẩn bị diễn ra",
    accent: "cyan",
    tag: "#EVENTS",
  },
  {
    label: "Tổng Giải Thưởng",
    value: "0 VNĐ",
    sub: "Quỹ thưởng chính thức từ BTC",
    accent: "amber",
    tag: "#PRIZES",
  },
  {
    label: "Tiêu Chí Đánh Giá",
    value: "100% RBL",
    sub: "Chấm điểm mù & Minh bạch",
    accent: "emerald",
    tag: "#EVALUATION",
  },
  {
    label: "Nền Tảng",
    value: "SEAL System",
    sub: "Tự động phân công & Hiệu chuẩn",
    accent: "purple",
    tag: "#PLATFORM",
  },
] as const;

const protocolSteps = [
  {
    number: "01",
    tag: "FPT / NON-FPT",
    title: "XÁC THỰC PROFILE",
    description:
      "Xác thực tự động qua MSSV FPT hoặc tải ảnh thẻ sinh viên để mở khóa quyền tạo đội.",
  },
  {
    number: "02",
    tag: "ĐỘI THI",
    title: "THÀNH LẬP ĐỘI",
    description:
      "Sắp xếp thành viên theo năng lực, chọn lĩnh vực và giới hạn nhóm hoạt động để chuẩn bị chiến đấu.",
  },
  {
    number: "03",
    tag: "THỰC TẾ",
    title: "XÂY DỰNG SẢN PHẨM",
    description:
      "Mỗi đội làm việc theo chuẩn tinh gọn, nhận phản hồi Mentor và kiểm thử qua hệ thống đánh giá.",
  },
  {
    number: "04",
    tag: "TRÌNH DIỄN",
    title: "CÔNG BỐ & VÀO CHUNG KẾT",
    description:
      "Đăng tải bài nộp, nhận điểm theo RBL, và tiến hành trao giải minh bạch, công bằng.",
  },
] as const;

const quickLinks = ["[ ĐỘI THI ]", "[ GIÁM KHẢO ]", "[ BAN TỔ CHỨC ]"];

const accentClasses: Record<string, string> = {
  cyan: "border-cyan-500/70 text-cyan-500",
  amber: "border-amber-500/70 text-amber-500",
  emerald: "border-emerald-500/70 text-emerald-400",
  purple: "border-purple-500/70 text-purple-400",
};

export function LandingPortalView() {
  return (
    <main className="min-h-screen bg-[#070b14] text-white antialiased">
      <nav className="sticky top-0 z-50 border-b border-cyan-500/20 bg-[#0b1220]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8">
            <a href="#" className="flex items-center gap-2 text-xl font-bold tracking-wider text-cyan-500 font-display">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-cyan-500/60 bg-cyan-500/5">
                <Sparkles className="h-4 w-4" />
              </div>
              SEAL
            </a>

            <div className="hidden items-center space-x-6 md:flex">
              {navItems.map(({ label, icon: Icon, active }) => (
                <a
                  key={label}
                  href="#"
                  className={[
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    active ? "text-cyan-500" : "text-slate-400 hover:text-cyan-400",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button aria-label="Notifications" className="rounded p-2 text-slate-400 transition hover:text-cyan-400">
              <Bell className="h-5 w-5" />
            </button>
            <a
              href="#"
              className="clip-br border border-cyan-500/30 bg-[#111827] px-4 py-1.5 text-sm font-mono uppercase tracking-wider text-cyan-500 transition hover:bg-cyan-500/10"
            >
              // Đăng nhập &gt;
            </a>
            <a
              href="#"
              className="clip-br bg-cyan-500 px-4 py-1.5 text-sm font-mono font-bold uppercase tracking-wider text-[#09111d] transition hover:bg-cyan-400"
            >
              // Đăng ký &gt;
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        <section className="relative overflow-hidden border-b border-cyan-500/10 bg-[radial-gradient(circle_at_center,_rgba(34,211,238,0.12),_rgba(7,11,20,0)_55%)] py-24">
          <div className="absolute left-1/2 top-1/2 h-[48rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />

          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <div className="mb-8 inline-flex h-24 w-24 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
              <div className="relative h-12 w-12 rotate-45 rounded-sm border-2 border-cyan-500 bg-cyan-500/5" />
            </div>

            <div className="mb-6 flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-cyan-500/50" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-500">
                System Operational // SEAL Hackathon Platform
              </span>
              <div className="h-px w-12 bg-cyan-500/50" />
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl font-display">
              <span className="block text-white">NƠI Ý TƯỞNG CÔNG NGHỆ</span>
              <span className="block text-cyan-500 drop-shadow-[0_0_20px_rgba(34,211,238,0.45)]">BỨT PHÁ GIỚI HẠN</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
              Đấu trường hackathon dành cho sinh viên toàn quốc — tranh tài xây dựng sản phẩm thực tế,
              nhận tư vấn từ Mentor và nhận đánh giá minh bạch theo chuẩn khoa học RBL.
            </p>

            <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#"
                className="clip-br w-full bg-cyan-500 px-8 py-3 text-sm font-mono font-bold uppercase tracking-wider text-[#09111d] transition hover:bg-cyan-400 sm:w-auto"
              >
                // KHÁM PHÁ SỰ KIỆN &gt;
              </a>
              <a
                href="#"
                className="clip-tl w-full border border-cyan-500/50 px-8 py-3 text-sm font-mono uppercase tracking-wider text-cyan-400 transition hover:bg-cyan-500/10 sm:w-auto"
              >
                [ ĐĂNG KÝ THAM GIA ]
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-mono text-slate-500">
              <span>TRUY CẬP NHANH:</span>
              {quickLinks.map((item) => (
                <a key={item} href="#" className="border border-slate-700 px-3 py-1 transition hover:border-cyan-500/50 hover:text-cyan-400">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-cyan-500/10 bg-[#0f172a]/60">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-500">
                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                System Metrics // Thống kê Tổng quan
              </div>
              <div className="text-xs font-mono text-slate-500">CẬP NHẬT THỜI GIAN THỰC TỪ BACKEND</div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              {metrics.map(({ label, value, sub, accent, tag }) => (
                <div
                  key={label}
                  className={[
                    "hud-border bg-[#111827] p-5",
                    accent === "cyan" && "border-l-2 border-cyan-500",
                    accent === "amber" && "border-l-2 border-amber-500",
                    accent === "emerald" && "border-l-2 border-emerald-500",
                    accent === "purple" && "border-l-2 border-purple-500",
                  ].join(" ")}
                  style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="text-xs font-mono uppercase text-slate-400">{label}</span>
                    <span className="rounded border border-slate-700 bg-[#0b1220] px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                      {tag}
                    </span>
                  </div>
                  <div className={[
                    "mb-1 text-3xl font-bold font-display",
                    accentClasses[accent],
                  ].join(" ")}>
                    {value}
                  </div>
                  <div className="text-xs text-slate-500">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-b border-cyan-500/10 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <div className="mb-4 text-sm font-mono uppercase tracking-[0.2em] text-cyan-500">
                // OPERATIONAL PROTOCOL
              </div>
              <h2 className="font-display text-4xl font-bold md:text-5xl">
                LUỒNG THI ĐẤU <span className="text-cyan-500">TACTICAL</span> HẠNG MỤC SEAL
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-400">
                Hành trình 4 bước tinh gọn giúp sinh viên chuyển hóa ý tưởng công nghệ thành sản phẩm thực tế được công nhận.
              </p>
            </div>

            <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {protocolSteps.map(({ number, tag, title, description }) => (
                <div
                  key={number}
                  className="group flex h-full flex-col border border-slate-700 bg-[#101827]/70 p-6 transition hover:border-cyan-500/50"
                  style={{ clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))" }}
                >
                  <div className="mb-8 flex items-start justify-between">
                    <span className="text-4xl font-bold text-slate-600 transition group-hover:text-cyan-500 font-display">{number}</span>
                    <span className="rounded border border-slate-700 bg-[#0b1220] px-2 py-1 text-[10px] font-mono text-slate-400">
                      {tag}
                    </span>
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold text-white">{title}</h3>
                  <p className="mb-8 flex-grow text-sm leading-relaxed text-slate-400">{description}</p>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-500">GIAI ĐOẠN {number} →</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-2 lg:grid-cols-3 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-cyan-500/20 bg-[#0d1728] p-8 shadow-[0_0_25px_rgba(34,211,238,0.08)]">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-2xl font-display font-bold text-white">Quản lý minh bạch</h3>
              <p className="text-slate-400">
                Mọi đánh giá, quy tắc chấm và tiến độ nộp bài được lưu và phân quyền rõ ràng trong hệ thống.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-[#0d1728] p-8 shadow-[0_0_25px_rgba(251,191,36,0.08)]">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-2xl font-display font-bold text-white">Trao giải chuyên nghiệp</h3>
              <p className="text-slate-400">
                Tang thưởng, công bố kết quả và phần thưởng được tổ chức theo luồng rõ ràng, dễ đối chiếu.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1728] p-8 shadow-[0_0_25px_rgba(16,185,129,0.08)]">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-2xl font-display font-bold text-white">Chuẩn hóa hoạt động</h3>
              <p className="text-slate-400">
                Từ đăng ký, phân đội đến chấm điểm, mọi bước đều đi theo vùng tỷ lệ và tiêu chí đánh giá chuẩn.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-cyan-500/10 bg-[#0b1220] py-10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 lg:flex-row lg:text-left lg:px-8">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-cyan-500">// Ready to Launch</p>
              <h3 className="mt-2 font-display text-3xl font-bold text-white">Bắt đầu hành trình của bạn ngay hôm nay</h3>
            </div>

            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-none border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-mono uppercase tracking-wider text-cyan-400 transition hover:bg-cyan-500/20"
            >
              Đăng ký tham gia
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>
    </main>
  );
}

export default LandingPortalView;
