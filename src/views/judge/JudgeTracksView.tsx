"use client";

import React from "react";
import { Scale, ChevronRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Link } from "@/i18n/routing";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, EmptyState, StatCard, Pagination } from "@/components/ui";
import { useJudgeTracksViewModel } from "@/viewModels/judge/useJudgeTracksViewModel";

function TrackProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">Tiến độ đánh giá của bạn</span>
        <span className="font-medium text-[var(--accent-judge)]">
          Đã chấm {done}/{total} bài ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-[var(--border-muted)] bg-[var(--bg-input)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: isComplete ? "var(--color-success)" : "var(--accent-judge)",
          }}
        />
      </div>
    </div>
  );
}

export const JudgeTracksView: React.FC = () => {
  const { user } = useAuth();
  const { state, data, pagination, actions } = useJudgeTracksViewModel();

  const {
    isLoading,
    isRefreshing,
    totalAssigned,
    totalPendingScoring,
    totalCompleted,
  } = state;

  const { assignedTracks } = data;
  const { paginatedItems: paginatedTracks, currentPage, totalPages, totalItems, pageSize, setCurrentPage, setPageSize } = pagination;

  if (!user) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <EmptyState
            icon={Scale}
            title="Yêu cầu quyền giám khảo"
            description="Vui lòng đăng nhập với tài khoản Giám khảo để tiếp tục."
            action={
              <Link href="/login">
                <Button accent="judge">Đến trang đăng nhập</Button>
              </Link>
            }
          />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title="Hạng mục phân công chấm điểm"
        description="Danh sách hạng mục thi đấu bạn được phân công đánh giá."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={actions.handleRefresh}
              disabled={isLoading || isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            <Link href="/judge/scoring">
              <Button accent="judge">
                Bàn chấm điểm trực tiếp
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Hạng mục đang phụ trách"
          value={isLoading ? "…" : totalAssigned}
          subtext="Phân công trực tiếp từ Ban Tổ Chức"
          accent="var(--accent-judge)"
        />
        <StatCard
          label="Bài nộp chờ đánh giá"
          value={isLoading ? "…" : totalPendingScoring}
          subtext="Cần hoàn tất trước hạn đóng cổng"
          accent="var(--color-warning)"
        />
        <StatCard
          label="Tiến độ hoàn thành"
          value={totalAssigned > 0 ? `${totalCompleted} bài` : "100%"}
          subtext="Tự động tính toán chỉ số đánh giá"
          accent="var(--color-success)"
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            Hạng mục thi đấu phân công ({assignedTracks.length})
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Đánh giá chuyên môn và chấm điểm độc lập
          </p>
        </div>

        {isLoading ? (
          <Card className="py-12 text-center">
            <p className="animate-pulse text-sm text-[var(--text-muted)]">
              Đang tải dữ liệu hạng mục phân công…
            </p>
          </Card>
        ) : assignedTracks.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Chưa có hạng mục phân công"
            description="Bạn hiện chưa được phân công chấm điểm cho hạng mục nào trong sự kiện này."
          />
        ) : assignedTracks.length === 1 ? (
          (() => {
            const track = assignedTracks[0];
            const done = track.scoredSubmissions;
            const hasSubmissions = track.totalSubmissions > 0;

            return (
              <Card className="transition-colors hover:border-[var(--accent-judge)]/40">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                  <div className="max-w-2xl space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="judge">Hạng mục chính</Badge>
                      <span className="text-xs text-[var(--text-muted)]">
                        {track.eventName} · {track.roundName}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
                      {track.trackName}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      Hạng mục thi đấu chuyên môn. Thông tin đội thi được ẩn danh để đảm bảo tính khách quan và công bằng.
                    </p>

                    <TrackProgressBar done={done} total={track.totalSubmissions} />
                  </div>

                  <div className="flex min-w-[240px] shrink-0 flex-col gap-3">
                    {hasSubmissions ? (
                      <Link href={`/judge/scoring?trackId=${track.trackId}`}>
                        <Button accent="judge" className="w-full">
                          Bắt đầu chấm điểm ngay
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button accent="judge" className="w-full" disabled>
                        Chưa có bài nộp để chấm
                      </Button>
                    )}
                    <Link href={`/judge/tracks/${track.trackId}/teams`}>
                      <Button variant="secondary" accent="judge" className="w-full">
                        Xem danh sách bài nộp ({track.totalSubmissions})
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })()
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paginatedTracks.map((track: any, idx: number) => {
                const done = track.scoredSubmissions;
                const hasSubmissions = track.totalSubmissions > 0;

                return (
                  <Card
                    key={track.trackId || idx}
                    className="flex flex-col justify-between gap-4 transition-colors hover:border-[var(--accent-judge)]/40"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge tone="judge">Hạng mục {(currentPage - 1) * pageSize + idx + 1}</Badge>
                        <span className="text-xs text-[var(--text-muted)]">{track.roundName}</span>
                      </div>

                      <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                        {track.trackName}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
                        {(track as any).description ||
                          "Hạng mục thi đấu chuyên môn được đánh giá theo thang điểm chuẩn mực."}
                      </p>

                      <TrackProgressBar done={done} total={track.totalSubmissions} />
                    </div>

                    <div className="flex flex-col gap-2 border-t border-[var(--border-muted)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <Link href={`/judge/tracks/${track.trackId}/teams`} className="sm:flex-1">
                        <Button variant="ghost" accent="judge" className="w-full">
                          Danh sách ({track.totalSubmissions} bài nộp)
                        </Button>
                      </Link>
                      {hasSubmissions ? (
                        <Link href={`/judge/scoring?trackId=${track.trackId}`} className="sm:flex-1">
                          <Button accent="judge" className="w-full">
                            Chấm hạng mục này
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button accent="judge" className="w-full sm:flex-1" disabled>
                          Chưa có bài nộp
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {assignedTracks.length > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="hạng mục"
                />
              </div>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
};
