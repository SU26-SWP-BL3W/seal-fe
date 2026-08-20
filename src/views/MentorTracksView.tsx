"use client";

import { Link } from "@/i18n/routing";
import { useMentorWorkspaceViewModel } from "@/viewModels/useMentorWorkspaceViewModel";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, EmptyState, StatCard, Pagination } from "@/components/ui";
import { usePagination } from "@/hooks/usePagination";
import { FolderOpen, RefreshCw, Users } from "lucide-react";

export function MentorTracksView() {
  const { myTracks, totalTeamsCount, totalSubmissionsCount, trackStatsMap, isLoading, refetchAll, eventId } =
    useMentorWorkspaceViewModel();

  const {
    paginatedItems: paginatedTracks,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(myTracks, 5);

  const breadcrumb = (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-muted)]">
      {eventId ? (
        <Link href={`/events/${eventId}`} className="hover:text-[var(--text-primary)] transition-colors">
          Chi tiết sự kiện
        </Link>
      ) : (
        <Link href="/events" className="hover:text-[var(--text-primary)] transition-colors">
          Khám phá sự kiện
        </Link>
      )}
      <span>/</span>
      <span className="text-[var(--accent-mentor)]">Không gian cố vấn</span>
      <span>/</span>
      <span className="text-[var(--text-primary)]">Hạng mục phụ trách</span>
    </nav>
  );

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] flex flex-1 flex-col">
      <PageHeader
        breadcrumb={breadcrumb}
        title={`Hạng mục đang hỗ trợ (${myTracks.length})`}
        description="Theo dõi các hạng mục bạn được phân công cố vấn và truy cập không gian hỗ trợ đội thi."
        actions={
          <Button variant="ghost" accent="mentor" onClick={() => refetchAll()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Tổng đội phụ trách"
          value={totalTeamsCount}
          accent="var(--accent-mentor)"
        />
        <StatCard
          label="Bài nộp gần đây"
          value={totalSubmissionsCount}
          accent="var(--accent-primary)"
        />
      </div>

      {isLoading ? (
        <EmptyState
          icon={RefreshCw}
          title="Đang tải dữ liệu"
          description="Đang kết nối dữ liệu hạng mục cố vấn..."
        />
      ) : myTracks.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Chưa có hạng mục được phân công"
          description="Ban tổ chức sẽ phân công tài khoản của bạn vào hạng mục trong danh mục nhân sự để bắt đầu hỗ trợ các đội thi."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {paginatedTracks.map((track, idx) => {
              const trackId = (track.id || track.Id || "") as string;
              const trackName = track.trackName || track.TrackName || "Hạng mục";
              const description = track.description || track.Description || "";
              const mentors = track.mentors || track.Mentors || [];
              const stats = trackStatsMap.get(trackId) || {
                totalTeams: 0,
                submissionCount: 0,
                progressPct: 0,
                mentorNames: [] as string[],
              };
              const progressPct = stats.progressPct;
              const mentorNames =
                stats.mentorNames.length > 0
                  ? stats.mentorNames.join(", ")
                  : mentors.length > 0
                    ? mentors.map((m) => m.fullName || m.FullName).join(", ")
                    : "Chính bạn";

              return (
                <Card
                  key={trackId}
                  className="flex flex-col gap-6 border-[var(--accent-mentor)]/20 p-5 transition-colors hover:border-[var(--accent-mentor)]/40 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1 space-y-3">
                    <Badge tone="mentor">Hạng mục {(currentPage - 1) * pageSize + idx + 1}</Badge>

                    <h3 className="font-display text-lg font-semibold text-[var(--text-primary)] sm:text-xl">
                      {trackName}
                    </h3>

                    {description && (
                      <p className="max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
                      <span>
                        Quy mô:{" "}
                        <strong className="text-[var(--accent-mentor)]">{stats.totalTeams} đội</strong>
                      </span>
                      <span className="hidden text-[var(--border-muted)] sm:inline">·</span>
                      <span>
                        Bài nộp:{" "}
                        <strong className="text-[var(--accent-primary)]">{stats.submissionCount} bài</strong>
                      </span>
                      <span className="hidden text-[var(--border-muted)] sm:inline">·</span>
                      <span>
                        Cố vấn cùng hạng mục:{" "}
                        <strong className="text-[var(--text-primary)]">{mentorNames}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Tiến độ đội đã nộp bài</span>
                      <span className="font-medium text-[var(--accent-mentor)]">{progressPct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full border border-[var(--border-muted)] bg-[var(--bg-input)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent-mentor)] transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <Link href={`/mentor/teams?trackId=${trackId}`}>
                      <Button accent="mentor" className="w-full">
                        <Users className="h-4 w-4" />
                        Vào không gian hỗ trợ
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>

          {myTracks.length > 0 && (
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
    </PageShell>
  );
}
