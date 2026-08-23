"use client";

import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMentorWorkspaceViewModel } from "@/viewModels/mentor/useMentorWorkspaceViewModel";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Pagination,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { usePagination } from "@/hooks/usePagination";
import { TEAM_STATUS, resolveTeamStatus } from "@/components/domain/team/teamStatus";
import { ArrowLeft, Users, Info, ChevronRight, Clock } from "lucide-react";

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

export function MentorTeamsView() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const trackIdQuery = searchParams.get("trackId") || "";

  const {
    myTracks,
    selectedTrackId,
    setSelectedTrackId,
    teamsInTrack,
    submissions,
    isLoading,
    hasSubmissionFetchError,
  } = useMentorWorkspaceViewModel();

  const {
    paginatedItems: paginatedTeams,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(teamsInTrack, 6);

  const currentTrackId = trackIdQuery || selectedTrackId || (myTracks[0]?.id || myTracks[0]?.Id || "");
  const currentTrack = myTracks.find((t) => normalizeId(String(t.id || t.Id)) === normalizeId(currentTrackId));
  const trackName = currentTrack?.trackName || currentTrack?.TrackName || "Hạng mục phụ trách";

  const handleTrackChange = (newTrackId: string) => {
    setSelectedTrackId(newTrackId);
    router.push(`/mentor/teams?trackId=${newTrackId}`);
  };

  const getTeamSubmission = (teamId: string) => {
    const norm = normalizeId(teamId);
    const list = submissions.filter((s) => normalizeId(String(s.teamId || s.TeamId)) === norm);
    const latest = list[0];
    const created = latest?.createdTime || latest?.CreatedTime;
    return { count: list.length, created };
  };

  const pendingCount = teamsInTrack.filter((t) => getTeamSubmission(String(t.id || t.Id)).count === 0).length;

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
        breadcrumb={
          <Link
            href="/mentor/tracks"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-mentor)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về danh sách hạng mục
          </Link>
        }
        title="Danh sách đội hỗ trợ"
        description={`Hạng mục: ${trackName}`}
        actions={
          <>
            <Badge tone="neutral">
              Tổng đội: <span className="font-semibold">{teamsInTrack.length}</span>
            </Badge>
            {teamsInTrack.length > 0 && (
              <Badge tone="mentor">
                Chưa nộp: <span className="font-semibold">{pendingCount}</span>
              </Badge>
            )}
          </>
        }
      />

      <Card className="border-[var(--accent-mentor)]/30 bg-[var(--accent-mentor)]/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-mentor)]" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">Cố vấn xem tên đội thật</p>
            <p className="text-sm text-[var(--text-muted)]">
              Khác với giám khảo (ẩn danh khi chấm), cố vấn được xem tên đội để hỗ trợ kỹ thuật và góp ý chuyên môn.
            </p>
          </div>
        </div>
      </Card>

      {myTracks.length > 1 && (
        <Card className="flex flex-wrap items-center gap-2 p-3">
          <span className="text-xs font-medium text-[var(--text-muted)]">Chọn hạng mục:</span>
          {myTracks.map((t) => {
            const tid = String(t.id || t.Id || "");
            const isCurrent = normalizeId(tid) === normalizeId(currentTrackId);
            return (
              <Button
                key={tid}
                type="button"
                variant={isCurrent ? "primary" : "secondary"}
                accent="mentor"
                className="text-xs"
                onClick={() => handleTrackChange(tid)}
              >
                {t.trackName || t.TrackName}
              </Button>
            );
          })}
        </Card>
      )}

      {hasSubmissionFetchError && (
        <Card className="border-[var(--color-danger)]/40 bg-[var(--color-danger)]/5">
          <p className="text-sm text-[var(--color-danger)]">
            Không tải được danh sách bài nộp. Bấm Làm mới trên trang hạng mục hoặc đăng nhập lại vai trò Cố vấn.
          </p>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">Đội cần hỗ trợ</h2>
          <span className="text-xs text-[var(--text-muted)]">
            {teamsInTrack.length - pendingCount} / {teamsInTrack.length} đã nộp bài
          </span>
        </div>

        {isLoading ? (
          <Card className="py-12 text-center">
            <p className="animate-pulse text-sm text-[var(--text-muted)]">Đang tải danh sách đội thi…</p>
          </Card>
        ) : teamsInTrack.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Chưa có đội thi"
            description="Chưa có đội thi nào ghi danh thuộc hạng mục này."
          />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Tên đội thi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian nộp</TableHead>
                    <TableHead align="center">Bài nộp</TableHead>
                    <TableHead align="right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {paginatedTeams.map((team, idx) => {
                    const tid = String(team.id || team.Id || "");
                    const name = team.name || team.Name || `Đội #${tid}`;
                    const statusCfg = TEAM_STATUS[resolveTeamStatus(team.status ?? team.Status)];
                    const sub = getTeamSubmission(tid);

                    return (
                      <TableRow key={tid}>
                        <TableCell className="text-[var(--text-muted)]">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-[var(--text-primary)]">{name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-[var(--text-muted)]">
                          {sub.created ? new Date(sub.created).toLocaleString("vi-VN") : "—"}
                        </TableCell>
                        <TableCell align="center">
                          {sub.count > 0 ? (
                            <Badge tone="success">Đã nộp {sub.count} bài</Badge>
                          ) : (
                            <Badge tone="warning" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Chưa nộp
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {sub.count > 0 ? (
                            <Link href={`/mentor/submissions?teamId=${tid}&trackId=${currentTrackId}`}>
                              <Button accent="mentor" className="text-xs">
                                Xem bài nộp
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          ) : (
                            <Button accent="mentor" className="text-xs" disabled>
                              Chưa có bài nộp
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            <div className="space-y-3 md:hidden">
              {paginatedTeams.map((team, idx) => {
                const tid = String(team.id || team.Id || "");
                const name = team.name || team.Name || `Đội #${tid}`;
                const statusCfg = TEAM_STATUS[resolveTeamStatus(team.status ?? team.Status)];
                const sub = getTeamSubmission(tid);

                return (
                  <Card key={tid} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">
                          #{(currentPage - 1) * pageSize + idx + 1}
                        </span>
                        <p className="font-medium text-[var(--text-primary)]">{name}</p>
                      </div>
                      <Badge tone={statusCfg.tone}>{statusCfg.label}</Badge>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {sub.count > 0
                        ? `Đã nộp ${sub.count} bài${sub.created ? ` · ${new Date(sub.created).toLocaleString("vi-VN")}` : ""}`
                        : "Chưa nộp bài"}
                    </p>
                    {sub.count > 0 ? (
                      <Link href={`/mentor/submissions?teamId=${tid}&trackId=${currentTrackId}`}>
                        <Button accent="mentor" className="w-full">
                          Xem bài nộp
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button accent="mentor" className="w-full" disabled>
                        Chưa có bài nộp
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>

            {teamsInTrack.length > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="đội thi"
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
