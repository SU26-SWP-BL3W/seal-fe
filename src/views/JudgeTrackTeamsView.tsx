"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetScoresByEventRole } from "@/repositories/scoresRepository";
import { Link } from "@/i18n/routing";
import {
  ShieldAlert,
  ArrowLeft,
  Scale,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, EmptyState, Table, TableHeader, TableRow, TableHead, TableCell, Pagination } from "@/components/ui";
import { usePagination } from "@/hooks/usePagination";

export function JudgeTrackTeamsView() {
  const params = useParams();
  const trackId = (params?.trackId as string) || "";
  const { user, activeRole } = useAuth();
  const eventId = activeRole?.eventId || activeRole?.EventId || "";

  const { data: tracks = [] } = useGetTracksByEvent(eventId || undefined);
  const currentTrack = tracks.find((t) => (t.id || t.Id) === trackId);
  const trackName = currentTrack?.trackName || (currentTrack as { TrackName?: string })?.TrackName || "Hạng mục chuyên môn";

  const { data: rawSubmissions = [], isLoading: isLoadingSubs } = useGetSubmitResultsByTrack(trackId, eventId);
  const submissions = useMemo(() => {
    return Array.isArray(rawSubmissions) ? rawSubmissions : [];
  }, [rawSubmissions]);

  const {
    paginatedItems: paginatedSubmissions,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(submissions, 8);

  const eventRoleId = activeRole?.id || activeRole?.eventRoleId || "";

  const { data: myScores = [] } = useGetScoresByEventRole(eventRoleId || undefined);
  const submittedIds = useMemo(
    () => new Set(myScores.filter((s) => s.isSubmitted).map((s) => s.submitResultId)),
    [myScores],
  );

  const evaluatedCount = submissions.filter((s: { id?: string; Id?: string }) =>
    submittedIds.has(s.id || s.Id || ""),
  ).length;
  const pendingCount = submissions.length - evaluatedCount;

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
        breadcrumb={
          <Link
            href="/judge/tracks"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent-judge)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về danh sách hạng mục
          </Link>
        }
        title="Danh sách bài dự thi"
        description={`Hạng mục: ${trackName}`}
        actions={
          <>
            <Badge tone="neutral">
              Tổng bài nộp: <span className="font-semibold">{submissions.length}</span>
            </Badge>
            {submissions.length > 0 && (
              <Badge tone="judge">
                Chờ đánh giá: <span className="font-semibold">{pendingCount}</span>
              </Badge>
            )}
          </>
        }
      />

      <Card className="border-[var(--accent-judge)]/30 bg-[var(--accent-judge)]/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-judge)]" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Chế độ chấm điểm ẩn danh
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Theo quy chế thi đấu, thông tin tên đội thi, thành viên và trường học được ẩn danh để đảm bảo tính khách quan và công bằng tuyệt đối.
            </p>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Bài làm cần đánh giá
          </h2>
          <span className="text-xs text-[var(--text-muted)]">
            {evaluatedCount} / {submissions.length} đã chấm
          </span>
        </div>

        {isLoadingSubs ? (
          <Card className="py-12 text-center">
            <p className="animate-pulse text-sm text-[var(--text-muted)]">
              Đang tải bài nộp ẩn danh…
            </p>
          </Card>
        ) : submissions.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Chưa có bài nộp"
            description="Chưa có bài nộp nào được ghi nhận trong hạng mục này."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Mã bài nộp</TableHead>
                    <TableHead>Vòng thi</TableHead>
                    <TableHead>Thời gian nộp</TableHead>
                    <TableHead>Bài nộp</TableHead>
                    <TableHead align="center">Trạng thái</TableHead>
                    <TableHead align="right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <tbody>
                  {paginatedSubmissions.map((sub: {
                    id?: string;
                    Id?: string;
                    submissionUrl?: string;
                    SubmissionUrl?: string;
                    createdTime?: string;
                    CreatedTime?: string;
                  }, idx: number) => {
                    const subId = sub.id || sub.Id || "";
                    const code = `SUB-${subId.slice(0, 8).toUpperCase()}`;
                    const submissionUrl = sub.submissionUrl || sub.SubmissionUrl || "";
                    const submitTime = sub.createdTime || sub.CreatedTime;
                    const isEvaluated = submittedIds.has(subId);

                    return (
                      <TableRow key={subId}>
                        <TableCell className="text-[var(--text-muted)]">{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                        <TableCell>
                          <span className="font-medium text-[var(--accent-judge)]">{code}</span>
                        </TableCell>
                        <TableCell className="text-[var(--text-muted)]">Vòng đánh giá</TableCell>
                        <TableCell className="text-[var(--text-muted)]">
                          {submitTime ? new Date(submitTime).toLocaleString("vi-VN") : "N/A"}
                        </TableCell>
                        <TableCell>
                          {submissionUrl ? (
                            <a
                              href={submissionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline"
                            >
                              Xem bài nộp
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">Chưa có link</span>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {isEvaluated ? (
                            <Badge tone="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Đã chốt điểm
                            </Badge>
                          ) : (
                            <Badge tone="warning" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Chờ đánh giá
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Link href={`/judge/scoring?subId=${subId}`}>
                            <Button accent="judge" className="text-xs">
                              <FileCheck2 className="h-3.5 w-3.5" />
                              Chấm điểm
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {paginatedSubmissions.map((sub: {
                id?: string;
                Id?: string;
                submissionUrl?: string;
                SubmissionUrl?: string;
                createdTime?: string;
                CreatedTime?: string;
              }, idx: number) => {
                const subId = sub.id || sub.Id || "";
                const code = `SUB-${subId.slice(0, 8).toUpperCase()}`;
                const submissionUrl = sub.submissionUrl || sub.SubmissionUrl || "";
                const submitTime = sub.createdTime || sub.CreatedTime;
                const isEvaluated = submittedIds.has(subId);

                return (
                  <Card key={subId} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs text-[var(--text-muted)]">#{(currentPage - 1) * pageSize + idx + 1}</span>
                        <p className="font-medium text-[var(--accent-judge)]">{code}</p>
                      </div>
                      {isEvaluated ? (
                        <Badge tone="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã chốt
                        </Badge>
                      ) : (
                        <Badge tone="warning" className="gap-1">
                          <Clock className="h-3 w-3" />
                          Chờ chấm
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-[var(--text-muted)]">
                      <p>
                        Thời gian nộp:{" "}
                        <span className="text-[var(--text-primary)]">
                          {submitTime ? new Date(submitTime).toLocaleString("vi-VN") : "N/A"}
                        </span>
                      </p>
                      {submissionUrl ? (
                        <a
                          href={submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--accent-primary)] hover:underline"
                        >
                          Xem bài nộp
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span>Chưa có link bài nộp</span>
                      )}
                    </div>

                    <Link href={`/judge/scoring?subId=${subId}`}>
                      <Button accent="judge" className="w-full">
                        Chấm điểm
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </Card>
                );
              })}
            </div>

            {submissions.length > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="bài nộp"
                />
              </div>
            )}
          </>
        )}
      </section>
    </PageShell>
  );
}
