"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button, Card } from "@/components/ui";
import { useMyEvents, useEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetPrizesByEvent } from "@/repositories/results/prizesRepository";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { PagedResult } from "@/models/types";
import { SubmitResultListItem } from "@/repositories/submitResultsRepository";
import { AdminMonitoringBanner } from "@/components/domain/AdminMonitoringBanner";

export const CoordinatorDashboardView: React.FC = () => {
  const searchParams = useSearchParams();
  const queryEventId = searchParams.get("eventId") || "";

  const { user: currentUser } = useAuth();
  const { data: myEvents = [] } = useMyEvents();
  const { data: rawAllEvents = [] } = useEvents();
  const allEvents = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];
  const eventsList = (currentUser?.isAdmin || currentUser?.IsAdmin)
    ? allEvents
    : myEvents;

  const [selectedEventId, setSelectedEventId] = useState<string>(queryEventId);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  useEffect(() => {
    if (queryEventId) {
      setSelectedEventId(queryEventId);
    } else if (eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id || eventsList[0].Id || eventsList[0].eventId || eventsList[0].EventId || "");
    }
  }, [queryEventId, eventsList, selectedEventId]);

  const { data: tracks = [] } = useGetTracksByEvent(selectedEventId || undefined);
  const { data: teams = [] } = useGetTeamsByEvent(selectedEventId || undefined);
  const { data: prizes = [] } = useGetPrizesByEvent(selectedEventId || undefined);

  const selectedEventObj = eventsList.find(
    (e: any) => (e.id || e.Id || e.eventId || e.EventId) === selectedEventId
  );
  const selectedEventName = selectedEventObj?.eventName || selectedEventObj?.EventName || "";

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return eventsList;
    const q = searchQuery.toLowerCase().trim();
    return eventsList.filter((ev: any) => {
      const name = (ev.eventName || ev.EventName || "").toLowerCase();
      const season = (ev.season || ev.Season || "").toLowerCase();
      const year = String(ev.year || ev.Year || "");
      const id = (ev.id || ev.Id || ev.eventId || ev.EventId || "").toLowerCase();
      return name.includes(q) || season.includes(q) || year.includes(q) || id.includes(q);
    });
  }, [eventsList, searchQuery]);

  // Query submissions
  const {
    data: rawSubmissions = [],
    isLoading: isLoadingSubmissions,
  } = useQuery({
    queryKey: ["all-submissions", selectedEventId, eventsList.map((e: any) => e.id || e.Id || e.eventId).join(",")],
    queryFn: async () => {
      const params: Record<string, any> = { PageSize: 200 };
      if (selectedEventId) {
        params.EventId = selectedEventId;
      }
      const res = await apiClient.get<PagedResult<SubmitResultListItem>>("/SubmitResults", { params });
      return res.data?.data ?? [];
    },
  });

  const allSubmissions = Array.isArray(rawSubmissions) ? rawSubmissions : [];
  const allowedEventIds = new Set(eventsList.map((e: any) => e.id || e.Id || e.eventId || e.EventId));
  const submissions = (currentUser?.isAdmin || currentUser?.IsAdmin)
    ? allSubmissions
    : allSubmissions.filter((sub: any) => {
        const evId = sub.eventId || sub.EventId;
        return evId ? allowedEventIds.has(evId) : true;
      });

  const currentEvent = selectedEventObj || eventsList[0];

  const MODULES = [
    {
      num: "01",
      title: "QUẢN LÝ SỰ KIỆN & NHÂN SỰ",
      desc: "Mời & phân bổ Giám khảo, Cố vấn vào các Hạng mục (Tracks) và cấu hình thể lệ.",
      href: `/coordinator/staff?eventId=${selectedEventId}`,
      accent: "text-[#a855f7]",
      border: "hover:border-[#a855f7]",
      tag: "Vòng thi & Nhân sự",
    },
    {
      num: "02",
      title: "QUẢN LÝ ĐỘI THI",
      desc: "Xem roster đội hình, duyệt đăng ký tham gia thi đấu và theo dõi sĩ số thành viên.",
      href: "/coordinator/teams",
      accent: "text-[var(--accent-team)]",
      border: "hover:border-[var(--accent-team)]",
      tag: `${teams.length} Đội tham gia`,
    },
    {
      num: "03",
      title: "DUYỆT HỒ SƠ THÍ SINH",
      desc: "Xét duyệt ảnh thẻ sinh viên 3x4, xác minh mã số sinh viên MSSV toàn diện.",
      href: "/coordinator/profiles",
      accent: "text-emerald-400",
      border: "hover:border-emerald-400",
      tag: "Hồ sơ thẻ SV",
    },
    {
      num: "04",
      title: "KHO BỘ TIÊU CHÍ (RUBRICS)",
      desc: "Soạn thảo ngân hàng mẫu tiêu chí chấm điểm, đảm bảo phân bổ trọng số 100%.",
      href: "/coordinator/templates",
      accent: "text-blue-400",
      border: "hover:border-blue-400",
      tag: "Ngân hàng Rubric",
    },
    {
      num: "05",
      title: "QUẢN LÝ BÀI NỘP (SUBMISSIONS)",
      desc: "Tổng hợp mã nguồn GitHub, Live Demo và Slide thuyết trình từ tất cả các đội thi.",
      href: "/coordinator/submissions",
      accent: "text-[#f59e0b]",
      border: "hover:border-[#f59e0b]",
      tag: `${submissions.length} Bài nộp`,
    },
    {
      num: "06",
      title: "XÉT KẾT QUẢ & CÔNG BỐ",
      desc: "Tự động tính điểm xếp hạng Top N, gán cơ cấu giải thưởng và công bố công khai.",
      href: "/coordinator/publish-results",
      accent: "text-amber-400",
      border: "hover:border-amber-400",
      tag: `${prizes.length} Giải thưởng`,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      {/* Banner Giám sát nổi bật khi Admin truy cập */}
      <AdminMonitoringBanner
        eventId={selectedEventId || undefined}
        eventName={selectedEventName || undefined}
      />

      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb Navigation with Back Links */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          <Link href="/admin/events" className="text-[var(--color-danger)] font-bold hover:underline">
            [ SEAL ADMIN ]
          </Link>
          <span>&gt;</span>
          <Link href="/admin/events" className="text-[var(--text-muted)] hover:text-white transition-colors">
            QUẢN LÝ SỰ KIỆN
          </Link>
          {selectedEventId && (
            <>
              <span>&gt;</span>
              <Link href={`/admin/events/${selectedEventId}`} className="text-red-400 hover:text-white transition-colors truncate max-w-xs">
                {selectedEventName || selectedEventId}
              </Link>
            </>
          )}
          <span>&gt;</span>
          <span className="text-[var(--text-primary)] font-bold">[ GIÁM SÁT BÀI THI &amp; SUBMISSIONS ]</span>
        </div>

        {/* Header with Searchable Tactical Combobox */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
              <span className="font-mono text-[10px] text-[#a855f7] font-bold tracking-widest uppercase">
                [ COORDINATOR CONTROL DECK v2.0 ]
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase tracking-wider mt-1 flex items-center gap-2.5">
              Trung Tâm Điều Hành Sự Kiện &amp; Ban Tổ Chức
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Quản lý toàn bộ 6 phân hệ cốt lõi: Sự kiện, Nhân sự, Đội thi, Tiêu chí Rubric, Bài nộp và Công bố kết quả.
            </p>
          </div>

          {/* Searchable Tactical Combobox */}
          <div className="relative w-full md:w-80 font-mono text-xs">
            <div className="flex items-center gap-2 bg-[#10171a] border border-zinc-700 focus-within:border-[#a855f7] px-3 py-2 hud-clipped transition-colors">
              <span className="text-[#a855f7] font-bold text-[11px] shrink-0">[ TÌM SK: ]</span>
              <input
                type="text"
                value={isComboboxOpen ? searchQuery : (selectedEventName || "Chọn sự kiện điều phối...")}
                onFocus={() => {
                  setIsComboboxOpen(true);
                  setSearchQuery("");
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsComboboxOpen(true);
                }}
                placeholder="Gõ tên sự kiện, mùa giải..."
                className="w-full bg-transparent text-white font-mono text-xs focus:outline-none placeholder:text-zinc-500"
              />
              {isComboboxOpen && (
                <button
                  type="button"
                  onClick={() => setIsComboboxOpen(false)}
                  className="text-zinc-400 hover:text-white text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  [ ĐÓNG ]
                </button>
              )}
            </div>

            {/* Popover Dropdown Results */}
            {isComboboxOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-full md:w-96 bg-[#0c1215] border border-[#a855f7]/50 shadow-2xl z-50 hud-clipped max-h-72 overflow-y-auto divide-y divide-zinc-800/80">
                <div className="p-2 bg-[#10171a] border-b border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>DANH SÁCH SỰ KIỆN ({filteredEvents.length}/{eventsList.length})</span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-[#a855f7] hover:underline cursor-pointer"
                    >
                      [ Xem tất cả ]
                    </button>
                  )}
                </div>

                {filteredEvents.length === 0 ? (
                  <div className="p-4 text-center text-zinc-500 text-xs">
                    [ KHÔNG TÌM THẤY SỰ KIỆN NÀO ]
                  </div>
                ) : (
                  filteredEvents.map((ev: any) => {
                    const id = ev.id || ev.Id || ev.eventId || ev.EventId;
                    const name = ev.eventName || ev.EventName || "Sự kiện không tên";
                    const season = ev.season || ev.Season || "Mùa giải";
                    const year = ev.year || ev.Year || 2026;
                    const isSelected = id === selectedEventId;
                    const isEnded = ev.status === false || (ev.endDate && new Date(ev.endDate).getTime() < Date.now());

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedEventId(id);
                          setIsComboboxOpen(false);
                          setSearchQuery("");
                          if (typeof window !== "undefined") {
                            const url = new URL(window.location.href);
                            url.searchParams.set("eventId", id);
                            window.history.replaceState(null, "", url.toString());
                          }
                        }}
                        className={`w-full p-3 text-left transition-colors flex flex-col gap-1 cursor-pointer ${
                          isSelected
                            ? "bg-[#a855f7]/15 text-white border-l-2 border-[#a855f7]"
                            : "hover:bg-zinc-800/60 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs truncate uppercase">
                            {name}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 hud-clipped ${
                            isEnded ? "bg-zinc-800 text-zinc-400" : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                          }`}>
                            {isEnded ? "[ ĐÃ ĐÓNG ]" : "[ ĐANG MỞ ]"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span>{season} {year}</span>
                          {isSelected && (
                            <span className="text-[#a855f7] font-bold">[ ĐANG CHỌN ]</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          <Card className="p-4 bg-[var(--bg-panel)] border border-[#a855f7]/40 hud-clipped space-y-1">
            <span className="text-[10px] text-[#a855f7] uppercase block font-bold">Sự Kiện Đang Phụ Trách</span>
            <div className="text-2xl font-bold text-[var(--text-primary)] truncate">
              {currentEvent?.eventName || currentEvent?.EventName || "Chưa chọn sự kiện"}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] block">
              Mùa giải: {currentEvent?.season || "Spring"} {currentEvent?.year || "2026"}
            </span>
          </Card>

          <Card className="p-4 bg-[var(--bg-panel)] border border-[var(--accent-team)]/30 hud-clipped space-y-1">
            <span className="text-[10px] text-[var(--accent-team)] uppercase block font-bold">Tổng Số Đội Thi</span>
            <div className="text-2xl font-bold text-[var(--accent-team)]">{teams.length} Đội</div>
            <span className="text-[10px] text-[var(--text-muted)] block">
              Phân bổ trên {tracks.length} Hạng mục (Tracks)
            </span>
          </Card>

          <Card className="p-4 bg-[var(--bg-panel)] border border-emerald-500/30 hud-clipped space-y-1">
            <span className="text-[10px] text-emerald-400 uppercase block font-bold">Bài Nộp Thu Thập</span>
            <div className="text-2xl font-bold text-emerald-400">{submissions.length} Bài nộp</div>
            <span className="text-[10px] text-[var(--text-muted)] block">
              Gồm GitHub repo, Live Demo &amp; Slides
            </span>
          </Card>

          <Card className="p-4 bg-[var(--bg-panel)] border border-amber-500/30 hud-clipped space-y-1">
            <span className="text-[10px] text-amber-400 uppercase block font-bold">Cơ Cấu Giải Thưởng</span>
            <div className="text-2xl font-bold text-amber-400">{prizes.length} Giải thưởng</div>
            <span className="text-[10px] text-[var(--text-muted)] block">
              Sẵn sàng gán cho Top N khi công bố
            </span>
          </Card>
        </div>

        {/* 6 Core Modules Quick Action Deck */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-2 font-mono text-xs">
            <span className="font-bold text-[#a855f7] uppercase tracking-wider flex items-center gap-2">
              [ LUỒNG CÔNG VIỆC ĐIỀU PHỐI (6 MODULES WORKFLOW) ]
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Bấm vào từng module để truy cập nhanh</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((mod) => {
              return (
                <Link
                  key={mod.num}
                  href={mod.href}
                  className={`p-5 bg-[var(--bg-panel)] border border-[var(--border-muted)] ${mod.border} transition-all duration-200 hud-clipped flex flex-col justify-between space-y-4 group hover:bg-[var(--bg-input)]`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#a855f7]/20 text-[#a855f7] font-mono text-xs font-bold border border-[#a855f7]/40">
                          {mod.num}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          {mod.tag}
                        </span>
                      </div>
                      <span className={`font-mono text-xs font-bold ${mod.accent}`}>[ MOD-{mod.num} ]</span>
                    </div>

                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wide group-hover:text-white transition-colors">
                      {mod.title}
                    </h3>

                    <p className="font-mono text-xs text-[var(--text-muted)] leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-muted)] flex items-center justify-between font-mono text-[11px] text-[var(--text-muted)] group-hover:text-white">
                    <span>[ TRUY CẬP MODULE &gt; ]</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Submissions Quick Table */}
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                [ BÀI NỘP MỚI NHẤT ({submissions.slice(0, 5).length}/{submissions.length}) ]
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Các sản phẩm dự thi mới nộp gần đây nhất của các đội.
              </p>
            </div>

            <Link href="/coordinator/submissions">
              <Button
                variant="ghost"
                className="text-xs font-mono border border-[var(--border-muted)] flex items-center gap-1.5 cursor-pointer hover:border-white hud-clipped"
              >
                <span>[ XEM TOÀN BỘ BÀI NỘP &gt; ]</span>
              </Button>
            </Link>
          </div>

          {isLoadingSubmissions ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              [ Đang tải danh sách bài làm... ]
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-input)] border border-[var(--border-muted)]">
              [ Chưa có bài nộp nào trong sự kiện này. ]
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-muted)] uppercase text-[10px]">
                    <th className="w-[30%] p-3">ĐỘI THI</th>
                    <th className="w-[20%] p-3">HẠNG MỤC</th>
                    <th className="w-[35%] p-3">LIÊN KẾT BÀI LÀM</th>
                    <th className="w-[15%] p-3 text-right">THỜI GIAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-muted)]">
                  {submissions.slice(0, 5).map((sub: any, idx: number) => {
                    const teamName = sub.teamName || sub.TeamName || `Đội #${idx + 1}`;
                    const trackName = sub.trackName || sub.TrackName || "Chung";
                    const repoUrl = sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl;
                    const demoUrl = sub.demoUrl || sub.DemoUrl;
                    const slideUrl = sub.slideUrl || sub.SlideUrl;

                    return (
                      <tr key={sub.id || idx} className="hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-3 font-bold text-[var(--text-primary)] truncate">{teamName}</td>
                        <td className="p-3 text-[var(--accent-team)] truncate">{trackName}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {repoUrl && (
                              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-muted)] text-[10px] flex items-center gap-1 hover:text-white">
                                [ REPO ]
                              </a>
                            )}
                            {demoUrl && (
                              <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] flex items-center gap-1 hover:bg-emerald-500/20">
                                [ DEMO ]
                              </a>
                            )}
                            {slideUrl && (
                              <a href={slideUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] flex items-center gap-1 hover:bg-purple-500/20">
                                [ SLIDES ]
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right text-[11px] text-[var(--text-muted)]">
                          {sub.createdTime ? new Date(sub.createdTime).toLocaleDateString("vi-VN") : "Vừa xong"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};
