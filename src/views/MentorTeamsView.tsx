"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useMentorWorkspaceViewModel } from "@/viewModels/useMentorWorkspaceViewModel";
import { Button } from "@/components/ui";

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

  const handleTrackChange = (newTrackId: string) => {
    setSelectedTrackId(newTrackId);
    router.push(`/mentor/teams?trackId=${newTrackId}`);
  };

  // Helper to check submission status for a team
  const getTeamSubmissionStatus = (teamId: string) => {
    const subs = submissions.filter((s) => (s.teamId || s.TeamId) === teamId);
    if (subs.length === 0) return { label: "CHƯA NỘP", color: "text-zinc-500 bg-zinc-800/40 border-zinc-700", count: 0 };
    return { label: "ĐÃ NỘP BÀI", color: "text-amber-400 bg-amber-950/40 border-amber-500/40", count: subs.length };
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans p-4 md:p-6 flex flex-col space-y-4">
      <div className="max-w-[1600px] w-full mx-auto space-y-4 flex-1 flex flex-col">

        {/* ── TẦNG 1: BREADCRUMB & HEADER ── */}
        <header className="bg-[#10171a] border border-zinc-800 p-4 hud-clipped flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="space-y-1">
            <div className="font-mono text-xs text-zinc-400 flex flex-wrap items-center gap-2">
              {eventId ? (
                <Link href={`/events/${eventId}`} className="text-zinc-400 hover:text-white font-bold transition-colors">
                  [ &lt; CHI TIẾT SỰ KIỆN ]
                </Link>
              ) : null}
              <span className="text-zinc-600">/</span>
              <Link href="/mentor/tracks" className="text-teal-400 hover:underline font-bold">
                [ CÁC HẠNG MỤC CỐ VẤN ]
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-white font-bold">{currentTrack?.trackName || currentTrack?.TrackName || "Hạng mục phụ trách"}</span>
            </div>
            <h1 className="font-display text-xl md:text-2xl text-white font-extrabold tracking-wider uppercase">
              DANH SÁCH ĐỘI THI ĐƯỢC HỖ TRỢ
            </h1>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="text-teal-300 bg-teal-950/50 px-3 py-1.5 border border-teal-500/40 hud-clipped font-bold">
              [ TRẠNG THÁI: ĐANG ĐỒNG HÀNH ]
            </div>
            <Button variant="ghost" accent="mentor" onClick={() => refetchAll()} className="text-xs uppercase font-mono font-bold">
              [ LÀM MỚI ]
            </Button>
          </div>
        </header>

        {/* ── TẦNG 2: TRACK SELECTOR ── */}
        {myTracks.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs bg-[#10171a] p-3 border border-zinc-800 hud-clipped">
            <span className="text-zinc-400 uppercase font-bold">[ CHỌN HẠNG MỤC: ]</span>
            <div className="flex flex-wrap items-center gap-2">
              {myTracks.map((t) => {
                const tid = (t.id || t.Id) as string;
                const isSelected = tid === currentTrackId;
                return (
                  <button
                    key={tid}
                    type="button"
                    onClick={() => handleTrackChange(tid)}
                    className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all cursor-pointer hud-clipped ${
                      isSelected
                        ? "bg-teal-500 text-black font-extrabold shadow-sm"
                        : "bg-[#141f23] text-zinc-400 border border-zinc-700 hover:text-white hover:border-teal-500/40"
                    }`}
                  >
                    [ {t.trackName || t.TrackName} ]
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TẦNG 3: BẢNG DANH SÁCH ĐỘI THI ── */}
        <div className="flex-1 bg-[#10171a] border border-zinc-800 hud-clipped flex flex-col overflow-hidden shadow-md">
          {/* Header Bảng */}
          <div className="h-10 bg-teal-950/40 border-b border-teal-500/20 flex items-center px-4 justify-between font-mono text-xs">
            <span className="text-teal-300 font-bold tracking-wider">[ DANH SÁCH ĐỘI THI TRONG HẠNG MỤC ]</span>
            <span className="text-zinc-400 text-[11px]">{teamsInTrack.length} ĐỘI THI GHI DANH</span>
          </div>

          {/* Nội dung bảng */}
          <div className="flex-1 overflow-x-auto p-4">
            {isLoading ? (
              <div className="flex justify-center py-20 font-mono text-xs text-teal-400 animate-pulse">
                [ ĐANG TẢI DỮ LIỆU ĐỘI THI... ]
              </div>
            ) : teamsInTrack.length === 0 ? (
              <div className="text-center py-16 font-mono text-xs text-zinc-400">
                [ Chưa có đội thi nào ghi danh thuộc Hạng mục này ]
              </div>
            ) : (
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="text-[11px] text-zinc-400 uppercase border-b border-zinc-800 bg-[#090e11]">
                  <tr>
                    <th className="py-3 px-4 font-bold">TÊN ĐỘI THI</th>
                    <th className="py-3 px-4 font-bold">TRẠNG THÁI</th>
                    <th className="py-3 px-4 font-bold text-right">TIẾN ĐỘ BÀI NỘP</th>
                    <th className="py-3 px-4 font-bold text-center">TÁC VỤ CỐ VẤN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {teamsInTrack.map((team) => {
                    const tid = (team.id || team.Id) as string;
                    const name = team.name || team.Name || `Đội #${tid}`;
                    const statusVal = team.status !== undefined ? String(team.status) : "Registered";
                    const subStatus = getTeamSubmissionStatus(tid);

                    return (
                      <tr key={tid} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-4 px-4 align-middle">
                          <div className="flex flex-col">
                            <span className="text-white font-bold">
                              {name}
                            </span>
                            <span className="text-[10px] text-zinc-500">ID: TM-{tid.substring(0, 8)}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold hud-clipped">
                            [ {statusVal.toUpperCase()} ]
                          </span>
                        </td>

                        <td className="py-4 px-4 align-middle text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] border px-2 py-0.5 font-bold hud-clipped ${subStatus.color}`}>
                              [ {subStatus.label}: {subStatus.count} BÀI ]
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 align-middle text-center">
                          <Link href={`/mentor/submissions?teamId=${tid}&trackId=${currentTrackId}`}>
                            <button className="px-3.5 py-1.5 bg-teal-500/15 border border-teal-500/40 text-teal-300 hover:bg-teal-500 hover:text-black text-xs font-bold hud-clipped transition-all cursor-pointer">
                              [ XEM BÀI NỘP &amp; HỖ TRỢ &gt; ]
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

      </div>
    </main>
  );
}
