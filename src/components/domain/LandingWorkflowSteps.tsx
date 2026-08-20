"use client";

import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui";

const WORKFLOW_STEPS = [
  {
    step: "1",
    title: "Xác thực hồ sơ",
    description: "Xác thực qua MSSV FPT hoặc tải ảnh thẻ sinh viên để mở khóa quyền tạo đội.",
  },
  {
    step: "2",
    title: "Thành lập đội thi",
    description: "Mời đồng đội, ghép đội và đăng ký thông tin đội vào hạng mục (3–5 thành viên).",
  },
  {
    step: "3",
    title: "Nộp bài sản phẩm",
    description: "Nộp link repository, tài liệu và video demo trước hạn chót.",
  },
  {
    step: "4",
    title: "Chấm điểm minh bạch",
    description: "Hội đồng giám khảo độc lập chấm theo ma trận tiêu chí chuẩn.",
  },
];

export function LandingWorkflowSteps() {
  return (
    <section className="border-t border-[var(--border-muted)] px-4 py-12 sm:px-6 md:py-16">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
            Quy trình thi đấu
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Bốn bước từ đăng ký đến công bố kết quả.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((s) => (
            <div
              key={s.step}
              className="flex flex-col rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] p-5"
            >
              <span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-input)] text-sm font-semibold text-[var(--accent-primary)]">
                {s.step}
              </span>
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{s.description}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link href="/register">
            <Button>Đăng ký và tạo đội</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
