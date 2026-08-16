"use client";

import { useState, useMemo } from "react";
import { useMyAssignedTracks } from "@/viewModels/useMyAssignedTracks";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { Card, Badge, Button } from "@/components/ui";
import { Users, RefreshCw, Compass, Info } from "lucide-react";

export function MentorTeamsView() {
  const { myTracks, eventId, isLoading: isLoadingTracks } = useMyAssignedTracks();
  const [explicitTrackId, setExplicitTrackId] = useState<string>("");
  const selectedTrackId = explicitTrackId || myTracks[0]?.id || myTracks[0]?.Id || "";

  const { data: submissions = [], isLoading: isLoadingSubs, refetch } = useGetSubmitResultsByTrack(
    selectedTrackId,
    eventId
  );
  const { data: teams = [] } = useGetTeamsByEvent(eventId);

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((t) => map.set((t.id || t.Id) as string, t.name || t.Name || "Đội thi"));
    return map;
  }, [teams]);

  const teamsInTrack = useMemo(() => {
    const byTeam = new Map<string, { teamId: string; count: number; lastSubmittedAt?: string }>();
    submissions.forEach((s) => {
      const teamId = (s.teamId || s.TeamId || "") as string;
      if (!teamId) return;
      const createdAt = s.createdTime || s.CreatedTime;
      const existing = byTeam.get(teamId);
      if (!existing) {
        byTeam.set(teamId, { teamId, count: 1, lastSubmittedAt: createdAt });
      } else {
        existing.count += 1;
        if (createdAt && (!existing.lastSubmittedAt || createdAt > existing.lastSubmittedAt)) {
          existing.lastSubmittedAt = createdAt;
        }
      }
    });
    return Array.from(byTeam.values());
  }, [submissions]);

  const isLoading = isLoadingTracks || (!!selectedTrackId && isLoadingSubs);

  return (
    <div className="hud-lattice min-h-[calc(100vh-4rem)]">
      <div className="max-w-[var(--container-max)] mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-muted)]">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--accent-mentor)] tracking-widest uppercase font-bold">
              <Compass className="w-3.5 h-3.5" />
              MENTOR WORKSPACE
            </div>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-[var(--text-primary)] mt-1">
              Đội Thi Cần Hỗ Trợ
            </h1>
            <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
              Đội thi đã có bài nộp trong Hạng mục bạn phụ trách.
            </p>
          </div>
          <Button variant="ghost" accent="mentor" onClick={() => refetch()} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </Button>
        </div>

        {myTracks.length === 0 && !isLoadingTracks ? (
          <Card className="p-10 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped text-center flex flex-col items-center gap-3">
            <Info className="w-8 h-8 text-[var(--text-muted)] opacity-60" />
            <p className="font-mono text-sm text-[var(--text-muted)] tracking-wide">
              Bạn chưa được phân công Cố vấn cho Hạng mục nào — chưa có Đội thi để hiển thị.
            </p>
          </Card>
        ) : (
          <>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-[var(--text-muted)] uppercase">Hạng mục:</span>
              <select
                value={selectedTrackId}
                onChange={(e) => setExplicitTrackId(e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-muted)] px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-mentor)]"
              >
                {myTracks.map((t) => (
                  <option key={t.id || t.Id} value={t.id || t.Id}>
                    {t.trackName || t.TrackName}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16 font-mono text-xs text-[var(--text-muted)]">
                Đang tải danh sách đội thi...
              </div>
            ) : teamsInTrack.length === 0 ? (
              <Card className="p-10 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped text-center">
                <p className="font-mono text-sm text-[var(--text-muted)]">
                  Chưa có Đội thi nào nộp bài trong Hạng mục này.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamsInTrack.map((team) => (
                  <Card
                    key={team.teamId}
                    className="p-6 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped flex items-center justify-between gap-4 hover:border-[var(--accent-mentor)]/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-[var(--accent-mentor)]" />
                      <div>
                        <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                          {teamNameById.get(team.teamId) || `Đội #${team.teamId}`}
                        </h3>
                        <p className="font-mono text-[10px] text-[var(--text-muted)]">
                          {team.lastSubmittedAt
                            ? `Nộp gần nhất: ${new Date(team.lastSubmittedAt).toLocaleString("vi-VN")}`
                            : "Chưa rõ thời gian nộp"}
                        </p>
                      </div>
                    </div>
                    <Badge tone="mentor">{team.count} BÀI NỘP</Badge>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
