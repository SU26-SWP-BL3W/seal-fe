"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useMentorWorkspaceViewModel } from "@/viewModels/useMentorWorkspaceViewModel";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { ChevronRight, RefreshCw, Users } from "lucide-react";

export function MentorTeamsView() {
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
    refetchAll,
    eventId,
  } = useMentorWorkspaceViewModel();

  const currentTrackId = trackIdQuery || selectedTrackId || (myTracks[0]?.id || myTracks[0]?.Id || "");
  const currentTrack = myTracks.find((t) => (t.id || t.Id) === currentTrackId);
  const trackName = currentTrack?.trackName || currentTrack?.TrackName || "Hạng mục phụ trách";

  const handleTrackChange = (newTrackId: string) => {
    setSelectedTrackId(newTrackId);
    router.push(`/mentor/teams?trackId=${newTrackId}`);
  };

  const getTeamSubmissionStatus = (teamId: string) => {
    const subs = submissions.filter((s) => (s.teamId || s.TeamId) === teamId);
    if (subs.length === 0) {
      return { label: "Chưa nộp", tone: "neutral" as const, count: 0 };
    }
    return { label: "Đã nộp bài", tone: "warning" as const, count: subs.length };
  };

  const breadcrumb = (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-muted)]">
      {eventId ? (
        <>
          <Link href={`/events/${eventId}`} className="hover:text-[var(--text-primary)] transition-colors">
            Chi tiết sự kiện
          </Link>
          <span>/</span>
        </>
      ) : null}
      <Link href="/mentor/tracks" className="hover:text-[var(--text-primary)] transition-colors">
        Hạng mục cố vấn
      </Link>
      <span>/</span>
      <span className="text-[var(--text-primary)]">{trackName}</span>
    </nav>
  );

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] flex flex-1 flex-col">
      <PageHeader
        breadcrumb={breadcrumb}
        title="Danh sách đội thi được hỗ trợ"
        description={`Theo dõi và hỗ trợ các đội thi trong hạng mục ${trackName}.`}
        actions={
          <>
            <Badge tone="mentor">Đang đồng hành</Badge>
            <Button variant="ghost" accent="mentor" onClick={() => refetchAll()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </>
        }
      />

      {myTracks.length > 0 && (
        <Card className="mb-6 p-4">
          <p className="mb-3 text-xs font-medium text-[var(--text-muted)]">Chọn hạng mục</p>
          <div className="flex flex-wrap gap-2">
            {myTracks.map((t) => {
              const tid = (t.id || t.Id) as string;
              const isSelected = tid === currentTrackId;
              return (
                <Button
                  key={tid}
                  type="button"
                  variant={isSelected ? "primary" : "secondary"}
                  accent="mentor"
                  onClick={() => handleTrackChange(tid)}
                  className="text-xs"
                >
                  {t.trackName || t.TrackName}
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[var(--border-muted)] px-4 py-3">
          <span className="text-sm font-medium text-[var(--text-primary)]">Đội thi trong hạng mục</span>
          <span className="text-xs text-[var(--text-muted)]">{teamsInTrack.length} đội ghi danh</span>
        </div>

        <div className="flex-1 overflow-x-auto p-4">
          {isLoading ? (
            <EmptyState
              icon={RefreshCw}
              title="Đang tải dữ liệu"
              description="Đang tải danh sách đội thi..."
            />
          ) : teamsInTrack.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Chưa có đội thi"
              description="Chưa có đội thi nào ghi danh thuộc hạng mục này."
            />
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-muted)] text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Tên đội thi</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-medium">Tiến độ bài nộp</th>
                  <th className="px-4 py-3 text-center font-medium">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-muted)]/60">
                {teamsInTrack.map((team) => {
                  const tid = (team.id || team.Id) as string;
                  const name = team.name || team.Name || `Đội #${tid}`;
                  const statusVal = team.status !== undefined ? String(team.status) : "Registered";
                  const subStatus = getTeamSubmissionStatus(tid);

                  return (
                    <tr key={tid} className="transition-colors hover:bg-[var(--bg-input)]/50">
                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-[var(--text-primary)]">{name}</span>
                          <span className="text-xs text-[var(--text-muted)]">ID: {tid.substring(0, 8)}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <Badge tone="success">{statusVal}</Badge>
                      </td>

                      <td className="px-4 py-4 align-middle text-right">
                        <Badge tone={subStatus.tone}>
                          {subStatus.label}: {subStatus.count} bài
                        </Badge>
                      </td>

                      <td className="px-4 py-4 align-middle text-center">
                        <Link href={`/mentor/submissions?teamId=${tid}&trackId=${currentTrackId}`}>
                          <Button variant="secondary" accent="mentor" className="gap-1 text-xs">
                            Xem bài nộp
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </PageShell>
  );
}
