"use client";

import Link from "next/link";
import { useMentorWorkspaceViewModel } from "@/viewModels/useMentorWorkspaceViewModel";
import { Card, Button } from "@/components/ui";
import { Compass, RefreshCw, Users, Upload, ChevronRight, Info, Brain, Cpu, Code2 } from "lucide-react";

export function MentorTracksView() {
  const { myTracks, totalTeamsCount, totalSubmissionsCount, trackStatsMap, isLoading, refetchAll } =
    useMentorWorkspaceViewModel();

  const getTrackIcon = (index: number) => {
    const icons = [Brain, Cpu, Code2];
    const IconComp = icons[index % icons.length];
    return <IconComp className="w-8 h-8 text-[#2dd4bf]" />;
  };

  return (
    <div className="bg-[#0d1b1f] text-on-surface font-sans min-h-screen p-6 relative overflow-hidden scan-lines">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#2dd4bf]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto flex flex-col gap-6 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#2dd4bf]/20 pb-4 gap-4">
          <div>
            <div className="font-mono text-xs text-[#2dd4bf] mb-2 flex items-center gap-2 tracking-widest">
              <Compass className="w-3.5 h-3.5" />
              [ SYS_LOC: MENTOR_WORKSPACE / ACTIVE_TRACKS ]
            </div>
            <h1 className="font-display text-2xl md:text-3xl text-on-surface font-extrabold uppercase tracking-wide">
              CÁC HẠNG MỤC ĐANG HỖ TRỢ
            </h1>
            <p className="font-mono text-xs text-on-surface-variant/80 mt-1">
              Danh sách Hạng mục chuyên môn bạn đang đảm nhận vai trò Cố vấn.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-surface-container-high px-4 py-2 border-l-2 border-[#2dd4bf]">
              <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-0.5">TOTAL TEAMS</p>
              <p className="font-mono text-[#2dd4bf] text-xl font-bold">{String(totalTeamsCount).padStart(3, "0")}</p>
            </div>
            <div className="bg-surface-container-high px-4 py-2 border-l-2 border-[#00d9ff]">
              <p className="font-mono text-[10px] text-on-surface-variant uppercase mb-0.5">NEW SUBS</p>
              <p className="font-mono text-[#00d9ff] text-xl font-bold">{String(totalSubmissionsCount).padStart(3, "0")}</p>
            </div>
            <Button variant="ghost" accent="mentor" onClick={() => refetchAll()} className="text-xs ml-2">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Làm mới
            </Button>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <svg className="w-12 h-12 animate-spin text-[#2dd4bf]" viewBox="0 0 100 100">
              <polygon
                points="50,5 91,27.5 91,72.5 50,95 9,72.5 9,27.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="240"
                strokeDashoffset="60"
              />
            </svg>
            <span className="font-mono text-xs text-[#2dd4bf] tracking-widest animate-pulse">CONNECTING TO MENTOR DATABANK...</span>
          </div>
        ) : myTracks.length === 0 ? (
          <Card className="p-12 bg-surface-container-low/80 border border-[#2dd4bf]/20 hud-clipped text-center flex flex-col items-center gap-3">
            <Info className="w-10 h-10 text-[#2dd4bf] opacity-60" />
            <p className="font-mono text-sm text-on-surface font-semibold">
              Bạn chưa được phân công Cố vấn cho Hạng mục nào trong sự kiện này.
            </p>
            <p className="font-mono text-xs text-on-surface-variant max-w-md">
              Ban Tổ chức (Event Coordinator) cần gán tài khoản của bạn vào Track trong trang Quản lý Nhân sự để bắt đầu công việc cố vấn.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {myTracks.map((track, idx) => {
              const trackId = (track.id || track.Id || "") as string;
              const trackName = track.trackName || track.TrackName || "Hạng mục";
              const description = track.description || track.Description || "";
              const judges = track.judges || track.Judges || [];
              const mentors = track.mentors || track.Mentors || [];
              const stats = trackStatsMap.get(trackId) || { totalTeams: 0, submissionCount: 0 };

              const progressPct = Math.min(100, Math.max(25, (idx + 1) * 35));

              return (
                <div
                  key={trackId}
                  className="glass-panel hud-glow-mentor corner-accent-tl corner-accent-br bg-surface-container-low/80 relative group overflow-hidden border border-[#2dd4bf]/20 hover:border-[#2dd4bf]/50 transition-all"
                >
                  {/* Panel Header Bar */}
                  <div className="h-7 bg-[#2dd4bf]/10 border-b border-[#2dd4bf]/20 flex items-center px-4 justify-between font-mono text-xs">
                    <span className="text-[#2dd4bf] font-bold tracking-widest uppercase">
                      TRACK // {trackName}
                    </span>
                    <span className="text-on-surface-variant text-[11px]">ID: {trackId}</span>
                  </div>

                  <div className="p-6 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6">
                    {/* Track Info */}
                    <div className="flex-1 flex gap-6 items-center">
                      <div className="w-16 h-16 bg-surface-container-highest flex items-center justify-center border border-[#2dd4bf]/30 shrink-0">
                        {getTrackIcon(idx)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <h3 className="font-display text-xl font-bold text-on-surface">{trackName}</h3>
                        {description && (
                          <p className="font-sans text-xs text-on-surface-variant leading-relaxed max-w-xl">
                            {description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-2 font-mono text-xs">
                          <div className="flex items-center gap-1.5 text-on-surface">
                            <Users className="w-3.5 h-3.5 text-[#2dd4bf]" />
                            <span>{stats.totalTeams} đội thi</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#00d9ff]">
                            <Upload className="w-3.5 h-3.5" />
                            <span>[ {totalSubmissionsCount} bài nộp ]</span>
                          </div>
                        </div>

                        {/* Co-mentors and Judges info */}
                        <div className="flex flex-wrap gap-3 mt-2 text-[11px] font-mono text-on-surface-variant/80">
                          <span>Cố vấn: <strong className="text-on-surface">{mentors.length > 0 ? mentors.map((m) => m.fullName || m.FullName).join(", ") : "Bạn"}</strong></span>
                          <span>|</span>
                          <span>Giám khảo: <strong className="text-on-surface">{judges.length > 0 ? judges.map((j) => j.fullName || j.FullName).join(", ") : "Chưa phân công"}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="flex flex-col gap-3 w-full lg:w-72 shrink-0 justify-center">
                      <div className="w-full bg-[#152238] h-2 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-[#2dd4bf] transition-all duration-500" style={{ width: `${progressPct}%` }} />
                      </div>
                      <div className="flex justify-between items-center px-1 font-mono text-[11px]">
                        <span className="text-on-surface-variant">MENTORING PROGRESS</span>
                        <span className="text-[#2dd4bf] font-bold">{progressPct}%</span>
                      </div>

                      <Link href={`/mentor/teams?trackId=${trackId}`}>
                        <button className="w-full bg-transparent border border-[#2dd4bf] text-[#2dd4bf] hover:bg-[#2dd4bf] hover:text-[#080f11] font-mono text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-between gap-2 transition-all active:scale-[0.98]">
                          <span>XEM CHI TIẾT HỖ TRỢ</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
