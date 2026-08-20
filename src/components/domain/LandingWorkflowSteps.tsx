"use client";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui";

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Xác thực hồ sơ",
<<<<<<< HEAD
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
=======
    description: "Xác thực qua MSSV FPT hoặc tải ảnh thẻ sinh viên để mở khóa quyền tạo đội.",
  },
  {
    step: "02",
    title: "Thành lập đội thi",
    description: "Mời đồng đội, ghép đội và đăng ký thông tin đội vào hạng mục (3–5 thành viên).",
  },
  {
    step: "03",
    title: "Nộp bài sản phẩm",
    description: "Nộp link repository, tài liệu và video demo trước hạn chót.",
  },
  {
    step: "04",
    title: "Chấm điểm minh bạch",
    description: "Hội đồng giám khảo độc lập chấm theo ma trận tiêu chí chuẩn.",
  },
];

/** Narrative Workflow — vertical process, not a 4-card grid. */
export function LandingWorkflowSteps() {
  return (
    <section className="px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto grid w-full max-w-[var(--container-max)] gap-12 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="landing-section-kicker text-sm font-medium text-[var(--accent-primary)]">
            Quy trình
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">
            Từ đăng ký đến công bố kết quả
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--text-muted)]">
            Bốn giai — mỗi bước mở khóa bước tiếp theo trên hệ thống SEAL.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button>Bắt đầu từ bước 01</Button>
>>>>>>> parent of 384ee5c (merge: integrate full project audit, bugfixes and email workflows into dev)
            </Link>
          </div>
        </div>

<<<<<<< HEAD
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
=======
        <ol className="space-y-0 border-t border-[var(--border-muted)]">
          {WORKFLOW_STEPS.map((s) => (
            <li
              key={s.step}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-5 border-b border-[var(--border-muted)] py-8 sm:gap-8"
            >
              <span className="font-display text-2xl font-semibold tabular-nums text-[var(--accent-primary)] sm:text-3xl">
                {s.step}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
                  {s.description}
                </p>
              </div>
>>>>>>> parent of 384ee5c (merge: integrate full project audit, bugfixes and email workflows into dev)
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
