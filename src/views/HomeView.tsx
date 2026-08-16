import { Card, Badge } from "@/components/ui";

/**
 * Placeholder — chứng minh khung MVVM build/chạy được end-to-end
 * (i18n, design tokens, API client, React Query provider đã sẵn sàng).
 * Thay bằng View thật đầu tiên khi bắt đầu build feature.
 */
export function HomeView() {
  return (
    <main className="hud-lattice min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-lg p-8 space-y-4 text-center">
        <Badge tone="success">KHUNG MVVM SẴN SÀNG</Badge>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          SEAL FE
        </h1>
        <p className="text-sm text-[var(--text-muted)] font-sans">
          Skeleton dựng xong: i18n, design tokens, API client (circuit breaker + refresh-token),
          React Query, UI primitives. Xem <code>README.md</code> để biết quy ước thêm feature.
        </p>
      </Card>
    </main>
  );
}
