"use client";

import { Link } from "@/i18n/routing";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "XÁC THỰC PROFILE",
    badge: "FPT / NON-FPT",
    accent: "var(--accent-team)",
    description: "Xác thực tự động qua MSSV FPT hoặc tải ảnh thẻ sinh viên để mở khóa quyền tạo đội.",
  },
  {
    step: "02",
    title: "THÀNH LẬP ĐỘI THI",
    badge: "3 - 5 THÀNH VIÊN",
    accent: "var(--accent-mentor)",
    description: "Mời đồng đội, ghép đội tự động và đăng ký thông tin đội thi chính thức vào hạng mục.",
  },
  {
    step: "03",
    title: "NỘP BÀI SẢN PHẨM",
    badge: "GIT & DOCUMENTATION",
    accent: "var(--accent-primary)",
    description: "Nộp link GitHub repository, tài liệu kiến trúc và video demo trước hạn chót.",
  },
  {
    step: "04",
    title: "CHẤM ĐIỂM MINH BẠCH RBL",
    badge: "4 GIÁM KHẢO ĐỘC LẬP",
    accent: "var(--accent-judge)",
    description: "Hội đồng 4 giám khảo độc lập chấm theo ma trận tiêu chuẩn, kiểm toán độ lệch RBL minh bạch.",
  },
];

export function LandingWorkflowSteps() {
  return (
    <section className="border-t border-[var(--border-muted)] px-[var(--space-xl)] py-[calc(var(--space-xl)*1.5)]">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-[var(--space-xl)]">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-primary)]">
            {"// "}OPERATIONAL PROTOCOL
          </span>

          <h2 className="font-display text-2xl font-bold uppercase text-[var(--text-primary)] md:text-4xl">
            LUỒNG THI ĐẤU <span className="text-[var(--accent-primary)]">TACTICAL</span> HẠNG MỤC SEAL
          </h2>
          <p className="max-w-2xl text-sm text-[var(--text-muted)]">
            Hành trình 4 bước tinh gọn giúp sinh viên chuyển hóa ý tưởng công nghệ thành sản phẩm thực tế được công nhận.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((s, idx) => (
            <div
              key={s.step}
              className="hud-clipped hud-glow-cyan group relative flex flex-col justify-between border border-[var(--border-muted)] bg-[var(--bg-panel)] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--accent-primary)]/50"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="font-mono text-3xl font-extrabold tracking-tighter"
                    style={{ color: s.accent }}
                  >
                    {s.step}
                  </span>
                  <span className="border border-[var(--border-muted)] bg-[var(--bg-input)] px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--text-muted)] uppercase">
                    {s.badge}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                  {s.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                  {s.description}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1 font-mono text-[10px] uppercase text-[var(--text-muted)] group-hover:text-[var(--accent-primary)]">
                <span>GIAI ĐOẠN {idx + 1}</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <Link href="/register">
            <button className="hud-clipped relative px-8 py-3 bg-[var(--accent-primary)] text-[var(--bg-base)] font-mono font-bold tracking-wider uppercase text-sm transition-all duration-200 hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] focus:outline-none">
              {"// "}ĐĂNG KÝ VÀ TẠO ĐỘI NGAY &gt;
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
