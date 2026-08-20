"use client";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Xác thực hồ sơ",
    badge: "FPT / Non-FPT",
    description: "MSSV FPT hoặc ảnh thẻ SV — mở khóa quyền tạo đội.",
  },
  {
    step: "02",
    title: "Thành lập đội",
    badge: "3–5 thành viên",
    description: "Mời đồng đội, ghép đội, đăng ký track.",
  },
  {
    step: "03",
    title: "Nộp sản phẩm",
    badge: "Git · Docs · Demo",
    description: "Repo, tài liệu và video trước hạn chót.",
  },
  {
    step: "04",
    title: "Chấm minh bạch",
    badge: "4 giám khảo",
    description: "Rubric chuẩn + kiểm soát độ lệch điểm.",
  },
];

/** Vertical process rail — not the old 4 identical glow cards. */
export function LandingWorkflowSteps() {
  return (
    <section className="border-b border-[var(--border-muted)] px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-12 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent-primary)]">
            // protocol
          </p>
          <h2 className="mt-3 font-display text-3xl font-extrabold uppercase leading-tight text-[var(--text-primary)] md:text-4xl">
            4 bước
            <br />
            <span className="text-[var(--accent-primary)]">tới nộp bài</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">
            Cùng một pipeline trên SEAL — không nhảy tool ngoài.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button>Bắt đầu bước 01</Button>
            </Link>
          </div>
        </div>

        <ol className="border border-[var(--border-muted)] bg-[var(--bg-panel)]">
          {WORKFLOW_STEPS.map((s, idx) => (
            <li
              key={s.step}
              className={`grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 border-b border-[var(--border-muted)] p-5 last:border-b-0 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-6 ${
                idx % 2 === 1 ? "bg-[var(--bg-base)]/40" : ""
              }`}
            >
              <span className="font-display text-3xl font-extrabold tabular-nums text-[var(--accent-primary)] sm:text-4xl">
                {s.step}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold uppercase text-[var(--text-primary)]">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{s.description}</p>
              </div>
              <span className="hidden border border-[var(--border-muted)] bg-[var(--bg-input)] px-2 py-1 font-mono text-[10px] font-bold uppercase text-[var(--text-muted)] sm:inline-block">
                {s.badge}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
