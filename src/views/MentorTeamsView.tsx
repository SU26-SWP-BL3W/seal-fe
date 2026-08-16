"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMentorWorkspaceViewModel } from "@/viewModels/useMentorWorkspaceViewModel";
import { Card, Button } from "@/components/ui";
import { Users, RefreshCw, ChevronRight, Eye, Info } from "lucide-react";

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
    teamById,
    isLoading,
    refetchAll,
  } = useMentorWorkspaceViewModel();

  const currentTrackId = trackIdQuery || selectedTrackId || (myTracks[0]?.id || myTracks[0]?.Id || "");
  const currentTrack = myTracks.find((t) => (t.id || t.Id) === currentTrackId);

  const handleTrackChange = (newTrackId: string) => {
    setSelectedTrackId(newTrackId);
    router.push(`/mentor/teams?trackId=${newTrackId}`);
  };

  // Helper to check submission status for a team
  const getTeamSubmissionStatus = (teamId: string) => {
    const subs = submissions.filter((s) => (s.teamId || s.TeamId) === teamId);
    if (subs.length === 0) return { label: "NOT_SUBMITTED", color: "text-on-surface-variant bg-surface-container border-outline-variant", count: 0 };
    return { label: "SUBMITTED", color: "text-yellow-400 bg-yellow-900/20 border-yellow-500/30", count: subs.length };
  };

  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen p-6 flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        {/* Context Header Panel (HUD Style) */}
        <header className="w-full bg-surface-container-low border border-outline-variant p-5 relative rounded-lg shadow-sm">
          {/* Breadcrumb */}
          <div className="font-mono text-xs text-on-surface-variant flex items-center gap-2 mb-2">
            <Link href="/mentor/tracks" className="text-[#2dd4bf] hover:underline">
              Bàn Làm Việc Cố Vấn
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{currentTrack?.trackName || currentTrack?.TrackName || "Hạng mục phụ trách"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-on-surface font-bold">Danh sách đội</span>
          </div>

          {/* Title Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant pb-3 gap-3">
            <div>
              <h1 className="font-display text-2xl md:text-3xl text-on-surface font-extrabold tracking-wider uppercase">
                DANH SÁCH ĐỘI HỖ TRỢ
              </h1>
              <p className="font-mono text-xs text-on-surface-variant mt-1">
                READ_ONLY: NO MODIFICATION ACCESS GRANTED
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-mono text-xs text-[#2dd4bf] bg-[#2dd4bf]/10 px-3 py-1 border border-[#2dd4bf]/30 rounded">
                [ STATUS: ACTIVE_MONITORING ]
              </div>
              <Button variant="ghost" accent="mentor" onClick={() => refetchAll()} className="text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Làm mới
              </Button>
            </div>
          </div>
        </header>

        {/* Track Selector Bar */}
        {myTracks.length > 0 && (
          <div className="flex items-center gap-3 font-mono text-xs bg-surface-container-low p-3 border border-outline-variant rounded-md">
            <span className="text-on-surface-variant uppercase font-bold">Hạng mục:</span>
            <select
              value={currentTrackId}
              onChange={(e) => handleTrackChange(e.target.value)}
              className="bg-surface-container border border-outline-variant px-3 py-1.5 text-on-surface font-mono rounded focus:outline-none focus:border-[#2dd4bf]"
            >
              {myTracks.map((t) => {
                const tid = (t.id || t.Id) as string;
                return (
                  <option key={tid} value={tid}>
                    {t.trackName || t.TrackName} (ID: {tid})
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Data Table Panel (HUD Style) */}
        <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-lg flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="h-8 bg-[#2dd4bf]/10 border-b border-[#2dd4bf]/20 flex items-center px-4 justify-between font-mono text-xs">
            <span className="text-[#2dd4bf] font-bold tracking-wider">TEAM_ARRAY_DATABANK</span>
            <span className="text-on-surface-variant text-[11px]">{teamsInTrack.length} TEAMS LOADED</span>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-x-auto p-4">
            {isLoading ? (
              <div className="flex justify-center py-20 font-mono text-xs text-[#2dd4bf] animate-pulse">
                LOADING TEAM DATABANK...
              </div>
            ) : teamsInTrack.length === 0 ? (
              <div className="text-center py-16 font-mono text-xs text-on-surface-variant">
                <Info className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/60" />
                Chưa có đội thi nào thuộc Hạng mục này.
              </div>
            ) : (
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="text-[11px] text-on-surface-variant uppercase border-b border-outline-variant bg-surface-container-lowest sticky top-0">
                  <tr>
                    <th className="py-3 px-4 font-semibold">TEAM_IDENTIFIER</th>
                    <th className="py-3 px-4 font-semibold">STATUS</th>
                    <th className="py-3 px-4 font-semibold">PERSONNEL</th>
                    <th className="py-3 px-4 font-semibold text-right">SUBMISSION_PROGRESS</th>
                    <th className="py-3 px-4 font-semibold text-center">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {teamsInTrack.map((team) => {
                    const tid = (team.id || team.Id) as string;
                    const name = team.name || team.Name || `Đội #${tid}`;
                    const statusVal = team.status !== undefined ? String(team.status) : "Registered";
                    const subStatus = getTeamSubmissionStatus(tid);

                    return (
                      <tr key={tid} className="hover:bg-surface-variant/30 transition-colors group">
                        <td className="py-4 px-4 align-middle">
                          <div className="flex flex-col">
                            <span className="text-on-surface font-bold group-hover:text-[#2dd4bf] transition-colors">
                              {name}
                            </span>
                            <span className="text-[10px] text-on-surface-variant">TM-{tid.substring(0, 8)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-900/30 border border-green-500/30 text-green-400 text-[11px] font-bold rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            {statusVal.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-4 px-4 align-middle">
                          <div className="flex items-center gap-1 text-on-surface-variant">
                            <Users className="w-4 h-4 text-[#2dd4bf]" />
                            <span>Thành viên</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] border px-2 py-0.5 font-bold ${subStatus.color}`}>
                              {subStatus.label} ({subStatus.count})
                            </span>
                            <div className="w-24 h-1.5 bg-surface-variant flex rounded overflow-hidden">
                              <div
                                className={`h-full ${
                                  subStatus.count > 0 ? "bg-[#2dd4bf] w-full" : "bg-surface-container-highest w-0"
                                }`}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle text-center">
                          <Link href={`/mentor/submissions?teamId=${tid}&trackId=${currentTrackId}`}>
                            <button className="px-3 py-1.5 bg-surface border border-[#2dd4bf]/40 text-[#2dd4bf] hover:bg-[#2dd4bf] hover:text-[#080f11] text-[11px] font-bold rounded transition-colors inline-flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" /> Chi tiết
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Bottom HUD Decorator */}
        <div className="h-8 w-full mt-2 flex items-center justify-between border-t border-outline-variant/30 px-2 font-mono text-[10px] text-on-surface-variant">
          <div className="flex gap-1.5">
            <div className="w-4 h-1 bg-[#2dd4bf]/50" />
            <div className="w-2 h-1 bg-[#2dd4bf]/30" />
            <div className="w-8 h-1 bg-[#2dd4bf]/10" />
          </div>
          <div>SYS.CONN: STABLE // ENCRYPTION: LEVEL_4</div>
        </div>
      </div>
    </div>
  );
}
