"use client";

import { useState, useMemo } from "react";
import { useMyAssignedTracks } from "@/viewModels/useMyAssignedTracks";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { Card, Button } from "@/components/ui";
import { RefreshCw, Compass, Info, ExternalLink } from "lucide-react";

export function MentorSubmissionsView() {
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

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      const da = a.createdTime || a.CreatedTime || "";
      const db = b.createdTime || b.CreatedTime || "";
      return db.localeCompare(da);
    });
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
              Tiến Độ Bài Nộp
            </h1>
            <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
              Toàn bộ bài nộp trong Hạng mục bạn phụ trách, sắp xếp mới nhất trước.
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
              Bạn chưa được phân công Cố vấn cho Hạng mục nào — chưa có bài nộp để hiển thị.
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
                Đang tải danh sách bài nộp...
              </div>
            ) : sortedSubmissions.length === 0 ? (
              <Card className="p-10 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped text-center">
                <p className="font-mono text-sm text-[var(--text-muted)]">
                  Chưa có bài nộp nào trong Hạng mục này.
                </p>
              </Card>
            ) : (
              <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-panel)] hud-clipped">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-base)] text-[var(--text-muted)]">
                      <th className="p-3 uppercase">Đội thi</th>
                      <th className="p-3 uppercase">Liên kết bài nộp</th>
                      <th className="p-3 uppercase">Thời gian nộp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-muted)]/60">
                    {sortedSubmissions.map((s) => {
                      const id = s.id || s.Id;
                      const teamId = (s.teamId || s.TeamId || "") as string;
                      const url = s.submissionUrl || s.SubmissionUrl;
                      const createdAt = s.createdTime || s.CreatedTime;
                      return (
                        <tr key={id} className="hover:bg-[var(--accent-mentor)]/5 transition-colors">
                          <td className="p-3 font-bold text-[var(--text-primary)]">
                            {teamNameById.get(teamId) || `Đội #${teamId}`}
                          </td>
                          <td className="p-3">
                            {url ? (
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[var(--accent-mentor)] hover:underline flex items-center gap-1"
                              >
                                Xem bài nộp <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[var(--text-muted)]/50 italic">Không có liên kết</span>
                            )}
                          </td>
                          <td className="p-3 text-[var(--text-muted)]">
                            {createdAt ? new Date(createdAt).toLocaleString("vi-VN") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
