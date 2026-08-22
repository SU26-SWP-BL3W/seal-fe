"use client";

import { Badge, Card } from "@/components/ui";
import { useBackendHealthViewModel } from "@/viewModels/public/useBackendHealthViewModel";

// View — chỉ render, không tự gọi API hay giữ state riêng. Toàn bộ dữ liệu
// và logic lấy từ ViewModel.
export function HomeView() {
  const { apiUrl, status, isLoading, isError } = useBackendHealthViewModel();

  return (
    <main className="mx-auto flex max-w-[var(--container-max)] flex-1 flex-col items-start gap-[var(--space-lg)] p-[var(--space-xl)]">
      <h1 className="font-display text-[length:var(--fs-heading-lg)] font-semibold uppercase tracking-wide text-[color:var(--text-primary)]">
        SEAL — Command Deck
      </h1>
      <Card className="flex items-center gap-[var(--space-md)]">
        <span className="font-mono text-[length:var(--fs-body-md)] text-[color:var(--text-muted)]">
          Kết nối tới backend ({apiUrl}):
        </span>
        {isLoading && <Badge tone="neutral">đang kiểm tra…</Badge>}
        {isError && <Badge tone="danger">không kết nối được</Badge>}
        {status && <Badge tone="success">{status}</Badge>}
      </Card>
    </main>
  );
}
