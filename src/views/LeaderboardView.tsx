"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/routing";
import { useEvents, useGetEventById, useEventRounds } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useLeaderboard } from "@/repositories/leaderboardRepository";
import { LandingLeaderboardPodium } from "@/components/domain/LandingLeaderboardPodium";
import { Trophy, Target, FileSpreadsheet, SlidersHorizontal } from "lucide-react";

interface TableTeam {
  rank: number;
  teamCode: string;
  teamName: string;
  projectName: string;
  school: string;
  track: string;
  roundName: string;
  score: number;
  status: string;
}

export function LeaderboardView({ eventId }: { eventId?: string }) {
  const { data: eventsList = [] } = useEvents();
  const isEventScoped = Boolean(eventId && eventId !== "all");
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "all");

  const activeEventId = isEventScoped ? eventId! : selectedEventId !== "all" ? selectedEventId : undefined;

  const { data: eventDetail } = useGetEventById(activeEventId);
  const { data: dbRounds = [] } = useEventRounds(activeEventId || "");
  const { data: dbTracks = [] } = useGetTracksByEvent(activeEventId);
  const { data: dbTeams = [] } = useGetTeamsByEvent(activeEventId);

  const evObj = (eventDetail as any) ?? {};
  const event = {
    id: eventId || evObj.id || evObj.Id || "event-seal-2026",
    eventName: evObj.eventName || evObj.EventName || evObj.name || (isEventScoped ? "Sự kiện SEAL" : "SEAL Hackathon 2026"),
    totalPrizeVnd: (() => {
      const raw = evObj.totalPrizeVnd ?? evObj.TotalPrizeVnd;
      if (typeof raw === "number") return raw;
      if (typeof raw === "string") {
        const digits = raw.replace(/[^\d]/g, "");
        return digits ? Number(digits) : 0;
      }
      return 0;
    })(),
    season: evObj.season || evObj.Season || "MÙA HÈ 2026",
  };

  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [selectedRound, setSelectedRound] = useState<string>("all");

  const roundsList = dbRounds.map((r: any) => ({ id: r.id || r.Id, name: r.roundName || r.RoundName || "Vòng thi" }));
  const tracksList = dbTracks.map((t: any) => ({ id: t.id || t.Id || t.trackId, name: t.trackName || t.Name || "Hạng mục" }));

  const teamById = useMemo(() => {
    const map = new Map<string, any>();
    for (const t of dbTeams as any[]) map.set(t.id, t);
    return map;
  }, [dbTeams]);

  const trackNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tracksList) map.set(t.id, t.name);
    return map;
  }, [tracksList]);

  const roundsToQuery = selectedRound === "all" ? roundsList : roundsList.filter((r) => r.id === selectedRound);

  // Bảng xếp hạng: Lấy dữ liệu điểm từ 4 vòng thi
  const r0 = useLeaderboard(roundsToQuery[0]?.id || "");
  const r1 = useLeaderboard(roundsToQuery[1]?.id || "");
  const r2 = useLeaderboard(roundsToQuery[2]?.id || "");
  const r3 = useLeaderboard(roundsToQuery[3]?.id || "");

  const realResults: TableTeam[] = useMemo(() => {
    const entries = [
      { round: roundsToQuery[0], data: r0.data },
      { round: roundsToQuery[1], data: r1.data },
      { round: roundsToQuery[2], data: r2.data },
      { round: roundsToQuery[3], data: r3.data },
    ];
    const rows: TableTeam[] = [];
    for (const { round, data } of entries) {
      if (!round || !data) continue;
      for (const entry of data as any[]) {
        if (entry.isPublished === false) continue;
        const team = teamById.get(entry.teamId);
        rows.push({
          rank: entry.rank || 0,
          teamCode: (entry.teamId || "").slice(0, 8).toUpperCase(),
          teamName: team?.name || team?.teamName || entry.teamName || entry.teamId,
          projectName: team?.description || "",
          school: team?.schoolName || team?.SchoolName || "",
          track: trackNameById.get(team?.trackId) || entry.trackName || "",
          roundName: round.name,
          score: entry.finalScore ?? entry.totalScore ?? entry.TotalScore ?? 0,
          status: entry.isAdvanced ? "Thăng hạng" : "Bị loại",
        });
      }
    }
    return rows;
  }, [roundsToQuery, r0.data, r1.data, r2.data, r3.data, teamById, trackNameById]);

  const filteredResults = realResults.filter((r) => {
    if (selectedTrack !== "all" && r.track !== selectedTrack) return false;
    return true;
  });

  const topPodiumTeams = useMemo(() => {
    if (filteredResults.length === 0) return [];
    return filteredResults.slice(0, 3).map((r, idx) => ({
      eventName: event.eventName,
      season: event.season,
      teamName: r.teamName,
      projectName: r.projectName,
      school: r.school || "SEAL Candidate",
      track: r.track,
      score: r.score,
      prizeTitle: (idx + 1) === 1 ? "QUÁN QUÂN" : (idx + 1) === 2 ? "Á QUÂN 1" : "Á QUÂN 2",
      prizeVnd: (idx + 1) === 1 ? 50_000_000 : (idx + 1) === 2 ? 30_000_000 : 20_000_000,
      rank: (idx + 1) as 1 | 2 | 3,
    }));
  }, [filteredResults, event.eventName, event.season]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans pb-16 flex flex-col">
      
      {/* ── Header Bảng Xếp Hạng ── */}
      <section className="border-b border-zinc-800 bg-[#10171a]/70">
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 py-8 space-y-4">
          
          {isEventScoped ? (
            <>
              <div className="flex items-center gap-2 font-mono text-[11px] text-amber-400 tracking-wider uppercase font-bold">
                <Link href="/events" className="hover:underline">SỰ KIỆN</Link>
                <span>›</span>
                <Link href={`/events/${event.id}`} className="hover:underline">{event.eventName}</Link>
                <span>›</span>
                <span className="text-white">BẢNG XẾP HẠNG</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white">
                    Bảng Xếp Hạng Kết Quả Thi Đấu
                  </h1>
                  <p className="font-mono text-xs text-zinc-400 mt-1">
                    Sự kiện: <strong className="text-emerald-400">{event.eventName}</strong>
                    {event.totalPrizeVnd > 0 && (
                      <span> · Tổng giải thưởng: <strong className="text-amber-300">{(event.totalPrizeVnd).toLocaleString("vi-VN")} ₫</strong></span>
                    )}
                  </p>
                </div>

                {/* View Mode Segmented Tabs Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-[#0b1013] border border-zinc-800 rounded-xl font-mono text-xs shadow-sm">
                  <Link href={`/events/${event.id}`}>
                    <button className="px-4 py-2 rounded-lg font-bold transition-all cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-800/60">
                      THỂ LỆ &amp; CHI TIẾT
                    </button>
                  </Link>
                  <button className="px-4 py-2 rounded-lg font-bold transition-all cursor-default bg-zinc-800 text-amber-300 shadow-sm border border-zinc-700">
                    BẢNG XẾP HẠNG
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 font-mono text-[11px] text-amber-400 tracking-wider uppercase font-bold">
                <Link href="/" className="hover:underline">TRANG CHỦ</Link>
                <span>›</span>
                <span className="text-white">BẢNG VINH DANH HỆ THỐNG (HALL OF FAME)</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-wide text-white flex items-center gap-3">
                    <Trophy className="w-7 h-7 text-amber-400 shrink-0" />
                    <span>BẢNG VINH DANH CÁC MÙA GIẢI (HALL OF FAME)</span>
                  </h1>
                  <p className="font-mono text-xs text-zinc-400 mt-1">
                    Vinh danh Top Đội Thi Xuất Sắc Nhất đạt giải cao tại các Cuộc thi Hackathon toàn quốc.
                  </p>
                </div>

                {/* Dropdown Chọn Sự Kiện Để Xem Vinh Danh (Chỉ hiện ở trang công khai ngoài) */}
                <div className="flex items-center gap-2 bg-[#0b1013] p-2 border border-zinc-800 rounded-xl font-mono text-xs">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> CHỌN SỰ KIỆN:
                  </span>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="bg-[#10171a] text-white font-mono text-xs font-bold px-3 py-1.5 border border-zinc-700 rounded-lg focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Tất Cả Mùa Giải (Hall of Fame)</option>
                    {eventsList.map((ev: any) => {
                      const id = ev.id || ev.Id || ev.eventId || ev.EventId;
                      const name = ev.eventName || ev.EventName || "Sự kiện";
                      return (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Top 3 E-Sports Podium Section ── */}
      <LandingLeaderboardPodium
        eventName={selectedEventId === "all" ? "HỆ THỐNG XẾP HẠNG TOÀN QUỐC" : event.eventName}
        season={event.season}
        podiumTeams={topPodiumTeams}
      />

      {/* ── Full Score Table Section ── */}
      <section className="mx-auto w-full max-w-7xl px-4 md:px-8 py-8 space-y-6">
        
        {/* Filters & Export */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[#10171a] border border-zinc-800 rounded-xl font-mono text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-amber-400 uppercase flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              BỘ LỌC ĐIỂM SỐ:
            </span>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="px-3 py-1.5 bg-[#0b1013] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
            >
              <option value="all">Tất cả Vòng thi</option>
              {roundsList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="px-3 py-1.5 bg-[#0b1013] border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
            >
              <option value="all">Tất cả Hạng mục (Tracks)</option>
              {tracksList.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                import("@/lib/exportUtils").then(({ exportToCsv }) => {
                  exportToCsv(`Leaderboard_${event.eventName.replace(/\s+/g, "_")}`, filteredResults, [
                    { key: "rank", label: "Hạng" },
                    { key: "teamCode", label: "Mã Đội" },
                    { key: "teamName", label: "Tên Đội Thi" },
                    { key: "projectName", label: "Tên Dự Án" },
                    { key: "school", label: "Trường Học" },
                    { key: "track", label: "Hạng Mục Track" },
                    { key: "roundName", label: "Vòng Thi" },
                    { key: "score", label: "Điểm Số" },
                    { key: "status", label: "Thành Tích" },
                  ]);
                });
              }}
              className="px-4 py-2 bg-[#0b1013] border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>XUẤT EXCEL BẢNG XẾP HẠNG</span>
            </button>
            <span className="text-zinc-400">
              Hiển thị: <strong className="text-amber-300">{filteredResults.length}</strong> / {realResults.length} đội
            </span>
          </div>
        </div>

        {/* Data Grid Table / Elegant Empty State */}
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center border border-zinc-800 bg-[#10171a] rounded-xl space-y-3 shadow-sm">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-display text-lg font-bold text-white uppercase">
              Chưa Có Kết Quả Xếp Hạng Chính Thức
            </h3>
            <p className="font-mono text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Ban Tổ Chức và Hội Đồng Giám Khảo đang trong quá trình chấm thi và tổng hợp bảng điểm. Danh sách xếp hạng chính thức sẽ được công bố công khai tại đây ngay khi hoàn tất.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto border border-zinc-800 bg-[#10171a] rounded-xl shadow-sm">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#0b1013] text-zinc-400 uppercase text-[11px]">
                  <th className="p-4 text-center w-16">HẠNG</th>
                  <th className="p-4">MÃ ĐỘI</th>
                  <th className="p-4">TÊN ĐỘI THI &amp; DỰ ÁN</th>
                  <th className="p-4">TRƯỜNG</th>
                  <th className="p-4">HẠNG MỤC</th>
                  <th className="p-4">VÒNG THI</th>
                  <th className="p-4 text-right">ĐIỂM SỐ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredResults.map((row, idx) => (
                  <tr key={`${row.teamCode}-${row.roundName}-${idx}`} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 font-bold text-xs rounded border ${
                        row.rank === 1 ? "bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold" :
                        row.rank === 2 ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold" :
                        row.rank === 3 ? "bg-orange-500/20 border-orange-400 text-orange-300 font-bold" :
                        "bg-zinc-900 border-zinc-700 text-zinc-400"
                      }`}>
                        {row.rank < 10 ? `0${row.rank}` : row.rank}
                      </span>
                    </td>
                    <td className="p-4 text-cyan-300 font-semibold">{row.teamCode}</td>
                    <td className="p-4">
                      <div className="text-sm font-bold text-white hover:text-amber-300 transition-colors">
                        {row.teamName}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">{row.projectName}</div>
                    </td>
                    <td className="p-4 text-zinc-400">{row.school}</td>
                    <td className="p-4">
                      <span className="border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-zinc-300 rounded text-[11px]">
                        {row.track}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-400">{row.roundName}</td>
                    <td className="p-4 font-bold text-base text-right text-amber-400">
                      {row.score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </main>
  );
}
