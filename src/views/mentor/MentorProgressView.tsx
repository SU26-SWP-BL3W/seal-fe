"use client";

import { Link } from "@/i18n/routing";
import { Button, Card, Input, Badge, EmptyState } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Search, BarChart2, ArrowLeft } from "lucide-react";
import { useMentorProgressViewModel } from "@/viewModels/mentor/useMentorProgressViewModel";

type ScoreDetail = {
  criteriaId?: string;
  criteriaName?: string;
  scoreValue?: number;
  maxScore?: number;
  weight?: number;
};

export function MentorProgressView() {
  const { state, data, actions } = useMentorProgressViewModel();
  const { inputTeamId, isLoading } = state;
  const { scoreBreakdown, user } = data;

  if (!user) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <EmptyState
            icon={BarChart2}
            title="Yêu cầu quyền cố vấn"
            description="Vui lòng đăng nhập với tài khoản Cố vấn để tra cứu tiến độ đội thi."
            action={
              <Link href="/login">
                <Button accent="mentor">Đến trang đăng nhập</Button>
              </Link>
            }
          />
        </Card>
      </PageShell>
    );
  }

  const details: ScoreDetail[] = Array.isArray(scoreBreakdown?.details) ? scoreBreakdown.details : [];

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        breadcrumb={
          <Link
            href="/mentor/tracks"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-mentor)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về danh sách hạng mục
          </Link>
        }
        title="Theo dõi tiến độ đội thi"
        description="Tra cứu phân rã điểm theo tiêu chí của đội bạn đang hỗ trợ."
        actions={
          <form onSubmit={actions.handleSearch} className="flex items-center gap-2">
            <div className="w-48">
              <Input
                type="text"
                placeholder="Mã đội thi"
                value={inputTeamId}
                onChange={(e) => actions.setInputTeamId(e.target.value)}
              />
            </div>
            <Button type="submit" accent="mentor" className="text-xs">
              <Search className="h-3.5 w-3.5" />
              Tra cứu
            </Button>
          </form>
        }
      />

      {isLoading ? (
        <Card className="py-12 text-center">
          <p className="animate-pulse text-sm text-[var(--text-muted)]">Đang tải bảng điểm…</p>
        </Card>
      ) : !scoreBreakdown ? (
        <EmptyState
          icon={BarChart2}
          title="Chưa chọn đội thi"
          description="Nhập mã đội thi để xem phân rã điểm theo từng tiêu chí."
        />
      ) : (
        <Card className="space-y-6">
          <div className="flex flex-col gap-4 border-b border-[var(--border-muted)] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Badge tone="mentor">Đội thi</Badge>
              <h2 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                {scoreBreakdown.teamName || `Đội #${scoreBreakdown.teamId}`}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Hạng mục: {scoreBreakdown.trackName || "—"}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-[var(--text-muted)]">Tổng điểm trung bình</p>
              <p className="font-display text-3xl font-semibold text-[var(--accent-mentor)]">
                {scoreBreakdown.totalScore} / 10
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
              Phân rã điểm theo tiêu chí
            </h3>

            {details.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Chưa có chi tiết tiêu chí cho đội này.</p>
            ) : (
              details.map((item) => {
                const max = item.maxScore || 10;
                const value = item.scoreValue || 0;
                const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;

                return (
                  <div key={item.criteriaId || item.criteriaName} className="space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-[var(--text-primary)]">{item.criteriaName}</span>
                      <span className="shrink-0 text-[var(--accent-mentor)]">
                        {value} / {max}
                        {item.weight != null ? ` · ${item.weight}%` : ""}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full border border-[var(--border-muted)] bg-[var(--bg-base)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent-mentor)] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}
    </PageShell>
  );
}
