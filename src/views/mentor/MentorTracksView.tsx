"use client";

import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMentorWorkspaceViewModel } from "@/viewModels/mentor/useMentorWorkspaceViewModel";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, EmptyState, StatCard, Pagination } from "@/components/ui";
import { usePagination } from "@/hooks/usePagination";
import { FolderOpen, RefreshCw, Users, ChevronRight } from "lucide-react";

function TrackProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = total > 0 && done === total;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">Tiến độ đội đã nộp bài</span>
        <span className="font-medium text-[var(--accent-mentor)]">
          Đã nộp {done}/{total} đội ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full border border-[var(--border-muted)] bg-[var(--bg-input)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: isComplete ? "var(--color-success)" : "var(--accent-mentor)",
          }}
        />
      </div>
    </div>
  );
}

export function MentorTracksView() {
  const { user } = useAuth();
  const {
    myTracks,
    totalTeamsCount,
    totalSubmissionsCount,
    trackStatsMap,
    isLoading,
    hasSubmissionFetchError,
    refetchAll,
  } = useMentorWorkspaceViewModel();

  const {
    paginatedItems: paginatedTracks,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(myTracks, 5);

  const pendingTeams = [...trackStatsMap.values()].reduce(
    (sum, s) => sum + Math.max(0, s.totalTeams - s.teamsWithSubmission),
    0,
  );

  if (!user) {
    return (
      <PageShell className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <EmptyState
            icon={Users}
            title="Yêu cầu quyền cố vấn"
            description="Vui lòng đăng nhập với tài khoản Cố vấn để tiếp tục."
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

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title="Hạng mục phân công cố vấn"
        description="Danh sách hạng mục thi đấu bạn được phân công hỗ trợ đội thi."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" accent="mentor" onClick={() => refetchAll()} className="gap-1.5">
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
            {myTracks[0] && (
              <Link href={`/mentor/teams?trackId=${myTracks[0].id || myTracks[0].Id}`}>
                <Button accent="mentor">
                  Không gian hỗ trợ
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Hạng mục đang phụ trách"
          value={isLoading ? "…" : myTracks.length}
          subtext="Phân công trực tiếp từ Ban Tổ Chức"
          accent="var(--accent-mentor)"
        />
        <StatCard
          label="Đội chưa nộp bài"
          value={isLoading ? "…" : pendingTeams}
          subtext="Cần theo dõi trước hạn đóng cổng"
          accent="var(--color-warning)"
        />
        <StatCard
          label="Bài nộp đã nhận"
          value={isLoading ? "…" : totalSubmissionsCount}
          subtext={`${totalTeamsCount} đội trong các hạng mục`}
          accent="var(--color-success)"
        />
      </div>

      {hasSubmissionFetchError && (
        <Card className="border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5">
          <p className="text-sm text-[var(--color-danger)]">
            Không tải được danh sách bài nộp. Bấm Làm mới; nếu vẫn lỗi hãy đăng nhập lại vai trò Cố vấn.
          </p>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--text-primary)]">
            Hạng mục thi đấu phân công ({myTracks.length})
          </h2>
          <p className="text-sm text-[var(--text-muted)]">Hỗ trợ chuyên môn và góp ý cho đội thi</p>
        </div>

        {isLoading ? (
          <Card className="py-12 text-center">
            <p className="animate-pulse text-sm text-[var(--text-muted)]">
              Đang tải dữ liệu hạng mục phân công…
            </p>
          </Card>
        ) : myTracks.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Chưa có hạng mục phân công"
            description="Bạn hiện chưa được phân công cố vấn cho hạng mục nào trong sự kiện này."
          />
        ) : myTracks.length === 1 ? (
          (() => {
            const track = myTracks[0];
            const trackId = (track.id || track.Id || "") as string;
            const stats = trackStatsMap.get(trackId) || {
              totalTeams: 0,
              submissionCount: 0,
              teamsWithSubmission: 0,
              progressPct: 0,
              mentorNames: [] as string[],
            };
            const hasTeams = stats.totalTeams > 0;

            return (
              <Card className="transition-colors hover:border-[var(--accent-mentor)]/40">
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                  <div className="max-w-2xl space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="mentor">Hạng mục chính</Badge>
                      {stats.mentorNames.length > 0 && (
                        <span className="text-xs text-[var(--text-muted)]">
                          Cố vấn cùng hạng mục: {stats.mentorNames.join(", ")}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
                      {track.trackName || track.TrackName}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      {track.description || track.Description ||
                        "Hạng mục thi đấu chuyên môn. Cố vấn được xem tên đội thật để hỗ trợ kỹ thuật."}
                    </p>
                    <TrackProgressBar done={stats.teamsWithSubmission} total={stats.totalTeams} />
                  </div>

                  <div className="flex min-w-[240px] shrink-0 flex-col gap-3">
                    {hasTeams ? (
                      <Link href={`/mentor/teams?trackId=${trackId}`}>
                        <Button accent="mentor" className="w-full">
                          Xem danh sách đội
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button accent="mentor" className="w-full" disabled>
                        Chưa có đội để hỗ trợ
                      </Button>
                    )}
                    <Button variant="secondary" accent="mentor" className="w-full" disabled>
                      {stats.submissionCount} bài nộp đã nhận
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })()
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {paginatedTracks.map((track, idx) => {
                const trackId = (track.id || track.Id || "") as string;
                const stats = trackStatsMap.get(trackId) || {
                  totalTeams: 0,
                  submissionCount: 0,
                  teamsWithSubmission: 0,
                  progressPct: 0,
                  mentorNames: [] as string[],
                };
                const hasTeams = stats.totalTeams > 0;

                return (
                  <Card
                    key={trackId}
                    className="flex flex-col justify-between gap-4 transition-colors hover:border-[var(--accent-mentor)]/40"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge tone="mentor">Hạng mục {(currentPage - 1) * pageSize + idx + 1}</Badge>
                        <span className="text-xs text-[var(--text-muted)]">{stats.totalTeams} đội</span>
                      </div>
                      <h3 className="font-display text-xl font-semibold text-[var(--text-primary)]">
                        {track.trackName || track.TrackName}
                      </h3>
                      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--text-muted)]">
                        {track.description || track.Description ||
                          "Hạng mục thi đấu chuyên môn được cố vấn theo dõi và góp ý."}
                      </p>
                      <TrackProgressBar done={stats.teamsWithSubmission} total={stats.totalTeams} />
                    </div>
                    <div className="flex flex-col gap-2 border-t border-[var(--border-muted)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs text-[var(--text-muted)] sm:flex-1">
                        {stats.submissionCount} bài nộp
                      </span>
                      {hasTeams ? (
                        <Link href={`/mentor/teams?trackId=${trackId}`} className="sm:flex-1">
                          <Button accent="mentor" className="w-full">
                            Xem đội
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Button accent="mentor" className="w-full sm:flex-1" disabled>
                          Chưa có đội
                        </Button>
                      )}
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
                  accent="mentor"
                />
              </div>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}
