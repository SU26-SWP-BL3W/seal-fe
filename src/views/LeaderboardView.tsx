"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { ApiMissingDataBadge } from "@/components/ui";
import { useEvents } from "@/repositories/eventsRepository";
import { LandingLeaderboardPodium } from "@/components/domain/LandingLeaderboardPodium";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";
import { Trophy, Target, Download, FileSpreadsheet, ArrowLeft, SlidersHorizontal } from "lucide-react";

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

const OFFICIAL_TABLE_RESULTS: TableTeam[] = [
  { rank: 1, teamCode: "#TM-001", teamName: "CyberShield_FPT", projectName: "RBL Inter-Rater Reliability Platform", school: "Đại học FPT", track: "AI & Machine Learning", roundName: "Vòng 3: Chung Kết", score: 9.85, status: "QUÁN QUÂN" },
  { rank: 2, teamCode: "#TM-002", teamName: "ByteKnights", projectName: "Autonomous Threat Scanner", school: "Đại học Bách Khoa", track: "Bảo mật & An ninh mạng", roundName: "Vòng 3: Chung Kết", score: 9.42, status: "Á QUÂN 1" },
  { rank: 3, teamCode: "#TM-003", teamName: "NexusCore", projectName: "Smart Campus IoT Grid", school: "Đại học Công nghệ - ĐHQGHN", track: "IoT & Phần cứng thông minh", roundName: "Vòng 3: Chung Kết", score: 9.15, status: "Á QUÂN 2" },
  { rank: 4, teamCode: "#TM-004", teamName: "DevPulse_HQ", projectName: "Automated Code Review Bot", school: "Đại học FPT", track: "Phát triển Web", roundName: "Vòng 3: Chung Kết", score: 8.90, status: "TOP 5" },
  { rank: 5, teamCode: "#TM-005", teamName: "GreenPulse", projectName: "Eco Tracker App", school: "Đại học KHTN HCM", track: "Phát triển Web", roundName: "Vòng 3: Chung Kết", score: 8.75, status: "TOP 5" },
  { rank: 6, teamCode: "#TM-006", teamName: "DeepVision", projectName: "Medical Imaging Diagnostic", school: "Đại học Y Dược HCM", track: "AI & Machine Learning", roundName: "Vòng 2: Bán Kết", score: 8.50, status: "BÁN KẾT" },
  { rank: 7, teamCode: "#TM-007", teamName: "SecureCloud", projectName: "Zero Trust Mesh Sentinel", school: "Học viện Bưu chính Viễn thông", track: "Bảo mật & An ninh mạng", roundName: "Vòng 2: Bán Kết", score: 8.35, status: "BÁN KẾT" },
  { rank: 8, teamCode: "#TM-008", teamName: "SmartAgri", projectName: "IoT Crop Sensor Array", school: "Đại học Nông Lâm", track: "IoT & Phần cứng thông minh", roundName: "Vòng 2: Bán Kết", score: 8.10, status: "BÁN KẾT" },
];

export function LeaderboardView({ eventId }: { eventId?: string }) {
  const { data: eventsList = [] } = useEvents();
  const isEventScoped = Boolean(eventId && eventId !== "all");
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "all");
  
  const event = {
    id: eventId || "event-seal-2026",
    eventName: "SEAL Hackathon 2026",
    totalPrizeVnd: 200000000,
  };

  const [selectedTrack, setSelectedTrack] = useState<string>("all");
  const [selectedRound, setSelectedRound] = useState<string>("all");

  const realResults: TableTeam[] = [];

  const filteredResults = realResults.filter((r) => {
    if (selectedTrack !== "all" && r.track !== selectedTrack) return false;
    if (selectedRound !== "all" && !r.roundName.includes(selectedRound)) return false;
    return true;
  });

  const {
    paginatedItems: paginatedResults,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredResults, 10);

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
    <main className="hud-lattice flex flex-1 flex-col pb-16">
      
      {/* ── Header Bảng Xếp Hạng ── */}
      <section className="border-b border-[var(--border-muted)] bg-[var(--bg-panel)]/70">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-6 py-8">
          
          {isEventScoped ? (
            <>
              <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--accent-judge)] tracking-[0.25em] uppercase mb-2">
                <Link href="/events" className="hover:underline">SỰ KIỆN</Link>
                <span>›</span>
                <Link href={`/events/${event.id}`} className="hover:underline">{event.eventName}</Link>
                <span>›</span>
                <span className="text-[var(--accent-judge)]">BẢNG XẾP HẠNG</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-[var(--text-primary)]">
                    Bảng Xếp Hạng Kết Quả Thi Đấu
                  </h1>
                  <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
                    Sự kiện: <strong className="text-[var(--text-primary)]">{event.eventName}</strong> · Quỹ giải thưởng: <strong className="text-[var(--accent-judge)]">{event.totalPrizeVnd ? `${(event.totalPrizeVnd / 1_000_000).toLocaleString("vi-VN")} TRIỆU ₫` : "200.000.000 ₫"}</strong>
                  </p>
                </div>

                <Link href={`/events/${event.id}`}>
                  <button className="hud-clipped px-5 py-2.5 border border-[var(--border-muted)] font-mono text-xs text-[var(--text-muted)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer">
                    ← XEM THỂ LỆ & SỰ KIỆN
                  </button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--accent-judge)] tracking-[0.25em] uppercase mb-2">
                <Link href="/" className="hover:underline">TRANG CHỦ</Link>
                <span>›</span>
                <span className="text-[var(--accent-judge)]">BẢNG VINH DANH HỆ THỐNG (HALL OF FAME)</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-[var(--text-primary)] flex items-center gap-3">
                    <Trophy className="w-7 h-7 text-[var(--accent-judge)]" />
                    <span>BẢNG VINH DANH CÁC MÙA GIẢI (HALL OF FAME)</span>
                  </h1>
                  <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
                    Vinh danh Top Đội Thi Xuất Sắc Nhất đạt giải cao tại các Cuộc thi Hackathon toàn quốc.
                  </p>
                </div>

                {/* Dropdown Chọn Sự Kiện Để Xem Vinh Danh (Chỉ hiện ở trang công khai ngoài) */}
                <div className="flex items-center gap-2 bg-[var(--bg-input)] p-2 border border-[var(--accent-judge)]/50 hud-clipped">
                  <span className="font-mono text-xs text-[var(--accent-judge)] font-bold flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" /> CHỌN SỰ KIỆN:
                  </span>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="bg-[var(--bg-panel)] text-[var(--text-primary)] font-mono text-xs font-bold px-3 py-1.5 border border-[var(--border-muted)] focus:outline-none focus:border-[var(--accent-judge)]"
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
        season="MÙA HÈ 2026"
        totalPrizeVnd={selectedEventId === "all" ? 500_000_000 : (event.totalPrizeVnd || 200_000_000)}
      />

      {/* ── Full Score Table Section ── */}
      <section className="mx-auto w-full max-w-[var(--container-max)] px-6 py-8">
        
        {/* Filters & Export */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-xs font-bold text-[var(--accent-judge)] uppercase">
              BỘ LỌC ĐIỂM SỐ:
            </span>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-judge)]"
            >
              <option value="all">Tất cả Vòng thi</option>
              <option value="Chung Kết">Vòng 3: Chung Kết</option>
              <option value="Bán Kết">Vòng 2: Bán Kết</option>
              <option value="Sơ Loại">Vòng 1: Sơ Loại</option>
            </select>

            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-muted)] font-mono text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-judge)]"
            >
              <option value="all">Tất cả Hạng mục (Tracks)</option>
              <option value="AI &amp; Machine Learning">AI &amp; Machine Learning</option>
              <option value="Bảo mật &amp; An ninh mạng">Bảo mật &amp; An ninh mạng</option>
              <option value="IoT &amp; Phần cứng thông minh">IoT &amp; Phần cứng thông minh</option>
              <option value="Phát triển Web">Phát triển Web</option>
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
                    { key: "score", label: "Điểm Số RBL" },
                    { key: "status", label: "Thành Tích" },
                  ]);
                });
              }}
              className="px-4 py-2 bg-[var(--bg-input)] border border-[var(--accent-judge)]/50 hover:border-[var(--accent-judge)] text-[var(--accent-judge)] font-mono text-xs font-bold hud-clipped flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>📥</span> XUẤT EXCEL BẢNG XẾP HẠNG
            </button>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              Hiển thị: <strong className="text-[var(--accent-judge)]">{filteredResults.length}</strong> / {OFFICIAL_TABLE_RESULTS.length} đội
            </span>
          </div>
        </div>

        {/* Data Grid Table */}
        {filteredResults.length === 0 ? (
          <ApiMissingDataBadge
            title="CHƯA CÓ BẢNG XẾP HẠNG"
            message="Ban Tổ Chức chưa công bố kết quả thi đấu công khai cho sự kiện / vòng thi này."
          />
        ) : (
          <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-panel)] hud-clipped">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
                  <th className="p-4 font-mono text-xs text-[var(--text-muted)] tracking-wider uppercase text-center w-16">HẠNG</th>
                  <th className="p-4 font-mono text-xs text-[var(--text-muted)] tracking-wider uppercase">MÃ ĐỘI</th>
                  <th className="p-4 font-mono text-xs text-[var(--text-muted)] tracking-wider uppercase">TÊN ĐỘI THI & DỰ ÁN</th>
                  <th className="p-4 font-mono text-xs text-[var(--text-muted)] tracking-wider uppercase">TRƯỜNG</th>
                  <th className="p-4 font-mono text-xs text-[var(--text-muted)] tracking-wider uppercase">HẠNG MỤC</th>
                  <th className="p-4 font-mono text-xs text-[var(--text-muted)] tracking-wider uppercase">VÒNG THI</th>
                  <th className="p-4 font-mono text-xs text-[var(--text-muted)] tracking-wider uppercase text-right">ĐIỂM SỐ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {paginatedResults.map((row) => (
                  <tr key={row.teamCode} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 font-mono font-bold text-xs hud-clipped border ${
                        row.rank === 1 ? "bg-[var(--accent-judge)]/20 border-[var(--accent-judge)] text-[var(--accent-judge)] font-extrabold" :
                        row.rank === 2 ? "bg-[var(--accent-team)]/20 border-[var(--accent-team)] text-[var(--accent-team)] font-bold" :
                        row.rank === 3 ? "bg-[var(--color-warning)]/20 border-[var(--color-warning)] text-[var(--color-warning)] font-bold" :
                        "bg-[var(--bg-input)] border-[var(--border-muted)] text-[var(--text-muted)]"
                      }`}>
                        {row.rank < 10 ? `0${row.rank}` : row.rank}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-[var(--accent-team)] font-semibold">{row.teamCode}</td>
                    <td className="p-4 font-mono">
                      <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-judge)] transition-colors">
                        {row.teamName}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">{row.projectName}</div>
                    </td>
                    <td className="p-4 font-mono text-xs text-[var(--text-muted)]">{row.school}</td>
                    <td className="p-4 font-mono text-xs">
                      <span className="border border-[var(--border-muted)] bg-[var(--bg-input)] px-2 py-0.5 text-[var(--text-muted)]">
                        {row.track}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-[var(--text-muted)]">{row.roundName}</td>
                    <td className="p-4 font-mono text-base font-bold text-right text-[var(--accent-judge)]">
                      {row.score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResults.length > 0 && (
              <div className="p-4 border-t border-zinc-800 bg-[#0b1013]">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="đội thi"
                />
              </div>
            )}
          </div>
        )}
      </section>

    </main>
  );
}
