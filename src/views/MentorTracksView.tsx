"use client";

import { Link } from "@/i18n/routing";
import { useMentorWorkspaceViewModel } from "@/viewModels/useMentorWorkspaceViewModel";
import { Card } from "@/components/ui";

export function MentorTracksView() {
  const { myTracks, totalTeamsCount, totalSubmissionsCount, trackStatsMap, isLoading, refetchAll, eventId } =
    useMentorWorkspaceViewModel();

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans p-4 md:p-6 flex flex-col space-y-4">
      <div className="max-w-[1600px] w-full mx-auto space-y-4 flex-1 flex flex-col">
        {/* Breadcrumb */}
        <div className="bg-[#10171a] border border-zinc-800 p-3.5 hud-clipped flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {eventId ? (
              <Link href={`/events/${eventId}`} className="text-zinc-400 hover:text-white font-bold transition-colors">
                [ &lt; Quay lại chi tiết sự kiện ]
              </Link>
            ) : (
              <Link href="/events" className="text-zinc-400 hover:text-white font-bold transition-colors">
                [ &lt; Khám phá sự kiện ]
              </Link>
            )}
            <span className="text-zinc-600">/</span>
            <span className="text-teal-400 font-bold">Không gian cố vấn</span>
            <span className="text-zinc-600">/</span>
            <span className="text-white font-extrabold">Hạng mục phụ trách</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => refetchAll()}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-[11px] transition-all cursor-pointer hud-clipped"
            >
              [ Làm mới dữ liệu ]
            </button>
          </div>
        </div>

        {/* Stats header */}
        <div className="bg-[#10171a] border border-teal-500/30 p-4 hud-clipped flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="font-mono text-xs text-teal-400 font-bold tracking-wider mb-1">
              Thống kê hoạt động cố vấn
            </div>
            <h1 className="font-display text-xl md:text-2xl font-bold text-white">
              Hạng mục đang hỗ trợ ({myTracks.length})
            </h1>
            <p className="mt-1 text-xs text-zinc-400 font-sans max-w-xl">
              Chỉ liệt kê hạng mục bạn được phân công vai trò Cố vấn. Tiến độ = tỷ lệ đội đã có bài nộp.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-mono text-xs">
            <div className="bg-[#090e11] px-4 py-2 border-l-2 border-teal-400 hud-clipped">
              <span className="text-[10px] text-zinc-400 uppercase block">Đội trong hạng mục của bạn</span>
              <span className="text-teal-400 text-lg font-bold">{String(totalTeamsCount).padStart(2, "0")} đội</span>
            </div>
            <div className="bg-[#090e11] px-4 py-2 border-l-2 border-cyan-400 hud-clipped">
              <span className="text-[10px] text-zinc-400 uppercase block">Bài nộp (các hạng mục của bạn)</span>
              <span className="text-cyan-400 text-lg font-bold">{String(totalSubmissionsCount).padStart(2, "0")} bài</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 bg-[#10171a] border border-zinc-800 p-12 text-center flex flex-col items-center justify-center font-mono text-xs text-teal-400 animate-pulse hud-clipped">
            Đang tải dữ liệu hạng mục cố vấn...
          </div>
        ) : myTracks.length === 0 ? (
          <Card className="p-12 bg-[#10171a] border border-zinc-800 hud-clipped text-center flex flex-col items-center gap-3 font-mono">
            <span className="text-sm text-white font-bold">
              Bạn chưa được phân công cố vấn cho hạng mục nào trong sự kiện này
            </span>
            <p className="text-xs text-zinc-400 max-w-md leading-relaxed font-sans">
              Ban tổ chức sẽ phân công tài khoản của bạn vào hạng mục trong danh mục nhân sự để bắt đầu hỗ trợ các đội thi.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myTracks.map((track, idx) => {
              const trackId = (track.id || track.Id || "") as string;
              const trackName = track.trackName || track.TrackName || "Hạng mục";
              const description = track.description || track.Description || "";
              const stats = trackStatsMap.get(trackId) || {
                totalTeams: 0,
                submissionCount: 0,
                teamsWithSubmission: 0,
                progressPct: 0,
                mentorNames: [],
              };
              const progressPct = stats.progressPct;
              const mentorLabel =
                stats.mentorNames.length > 0 ? stats.mentorNames.join(", ") : "Chính bạn";

              return (
                <div
                  key={trackId}
                  className="bg-[#10171a] border border-teal-500/40 hover:border-teal-400 transition-all p-5 md:p-6 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 shadow-md hud-clipped"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/40 font-mono text-[10px] font-bold hud-clipped">
                        Hạng mục {idx + 1} · Cố vấn chuyên môn
                      </span>
                    </div>

                    <h3 className="font-display text-lg md:text-xl font-bold text-white">{trackName}</h3>
                    {description && (
                      <p className="font-sans text-xs text-zinc-300 leading-relaxed max-w-3xl">
                        {description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 pt-1 font-mono text-xs">
                      <span className="text-zinc-300">
                        Quy mô: <strong className="text-teal-400">{stats.totalTeams} đội thi</strong>
                      </span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-cyan-300">
                        Bài nộp: <strong className="text-cyan-400">{stats.submissionCount} bài</strong>
                      </span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-400">
                        Đội đã nộp:{" "}
                        <strong className="text-zinc-200">
                          {stats.teamsWithSubmission}/{stats.totalTeams}
                        </strong>
                      </span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-400">
                        Cố vấn cùng hạng mục: <strong className="text-zinc-200">{mentorLabel}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 w-full lg:w-72 shrink-0 justify-center font-mono">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-400">Tiến độ đội đã nộp bài</span>
                      <span className="text-teal-400 font-bold">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-[#090e11] h-2 hud-clipped overflow-hidden border border-zinc-800">
                      <div
                        className="h-full bg-teal-400 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      {stats.teamsWithSubmission}/{stats.totalTeams} đội trong hạng mục đã có bài nộp
                    </p>

                    <Link
                      href={
                        eventId
                          ? `/mentor/teams?eventId=${eventId}&trackId=${trackId}`
                          : `/mentor/teams?trackId=${trackId}`
                      }
                      className="pt-1"
                    >
                      <button className="w-full bg-teal-500 text-black hover:bg-white text-xs font-bold py-2.5 px-4 transition-all cursor-pointer hud-clipped shadow-sm">
                        [ Vào không gian hỗ trợ &gt; ]
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
