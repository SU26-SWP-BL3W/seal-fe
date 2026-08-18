"use client";

import React, { useState } from "react";
import { Button, Card, Badge, Input, ApiMissingDataBadge } from "@/components/ui";
import { useMyEvents, useEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetPrizesByEvent } from "@/repositories/results/prizesRepository";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { PagedResult } from "@/models/types";
import { SubmitResultListItem } from "@/repositories/submitResultsRepository";
import { Link } from "@/i18n/routing";
import {
  FileCode,
  Globe,
  FileSpreadsheet,
  RefreshCw,
  Code2,
  Filter,
  Layers,
  AlertTriangle,
  ExternalLink,
  Users,
  Shield,
  FolderGit2,
  Award,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
  Search,
} from "lucide-react";

export const CoordinatorDashboardView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { data: myEvents = [] } = useMyEvents();
  const { data: rawAllEvents = [] } = useEvents();
  const allEvents = Array.isArray(rawAllEvents) ? rawAllEvents : (rawAllEvents as any)?.data ?? [];
  const eventsList = (currentUser?.isAdmin || currentUser?.IsAdmin)
    ? allEvents
    : myEvents;

  const [selectedEventId, setSelectedEventId] = useState<string>("");

  React.useEffect(() => {
    if (eventsList.length > 0 && !selectedEventId) {
      setSelectedEventId(eventsList[0].id || eventsList[0].eventId || "");
    }
  }, [eventsList, selectedEventId]);

  const { data: tracks = [] } = useGetTracksByEvent(selectedEventId);
  const { data: teams = [] } = useGetTeamsByEvent(selectedEventId);
  const { data: prizes = [] } = useGetPrizesByEvent(selectedEventId);

  // Query submissions
  const {
    data: rawSubmissions = [],
    isLoading: isLoadingSubmissions,
    refetch: refetchSubmissions,
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

  const currentEvent = eventsList.find((e: any) => (e.id || e.Id || e.eventId || e.EventId) === selectedEventId) || eventsList[0];

  const MODULES = [
    {
      num: "01",
      title: "QUẢN LÝ SỰ KIỆN & NHÂN SỰ",
      desc: "Mời & phân bổ Giám khảo, Cố vấn vào các Hạng mục (Tracks) và cấu hình thể lệ.",
      href: `/coordinator/staff?eventId=${selectedEventId}`,
      icon: Shield,
      accent: "text-[#a855f7]",
      border: "hover:border-[#a855f7]",
      tag: "Vòng thi & Nhân sự",
    },
    {
      num: "02",
      title: "QUẢN LÝ ĐỘI THI",
      desc: "Xem roster đội hình, duyệt đăng ký tham gia thi đấu và theo dõi sĩ số thành viên.",
      href: "/coordinator/teams",
      icon: Users,
      accent: "text-[var(--accent-team)]",
      border: "hover:border-[var(--accent-team)]",
      tag: `${teams.length} Đội tham gia`,
    },
    {
      num: "03",
      title: "DUYỆT HỒ SƠ THÍ SINH",
      desc: "Xét duyệt ảnh thẻ sinh viên 3x4, xác minh mã số sinh viên MSSV toàn diện.",
      href: "/coordinator/profiles",
      icon: CheckCircle2,
      accent: "text-emerald-400",
      border: "hover:border-emerald-400",
      tag: "Hồ sơ thẻ SV",
    },
    {
      num: "04",
      title: "KHO BỘ TIÊU CHÍ (RUBRICS)",
      desc: "Soạn thảo ngân hàng mẫu tiêu chí chấm điểm, đảm bảo phân bổ trọng số 100%.",
      href: "/coordinator/templates",
      icon: FolderGit2,
      accent: "text-blue-400",
      border: "hover:border-blue-400",
      tag: "Ngân hàng Rubric",
    },
    {
      num: "05",
      title: "QUẢN LÝ BÀI NỘP (SUBMISSIONS)",
      desc: "Tổng hợp mã nguồn GitHub, Live Demo và Slide thuyết trình từ tất cả các đội thi.",
      href: "/coordinator/submissions",
      icon: FileCode,
      accent: "text-[#f59e0b]",
      border: "hover:border-[#f59e0b]",
      tag: `${submissions.length} Bài nộp`,
    },
    {
      num: "06",
      title: "XÉT KẾT QUẢ & CÔNG BỐ",
      desc: "Tự động tính điểm xếp hạng Top N, gán cơ cấu giải thưởng và công bố công khai.",
      href: "/coordinator/publish-results",
      icon: Award,
      accent: "text-amber-400",
      border: "hover:border-amber-400",
      tag: `${prizes.length} Giải thưởng`,
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          <span className="text-[#a855f7] font-bold">SEAL SYSTEM</span>
          <span>&gt;</span>
          <span className="text-[var(--text-primary)] font-bold">COORDINATOR COMMAND CENTER</span>
        </div>

        {/* Header with Event Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
              <span className="font-mono text-[10px] text-[#a855f7] font-bold tracking-widest uppercase">
                COORDINATOR CONTROL DECK v2.0
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase tracking-wider mt-1 flex items-center gap-2.5">
              <Zap className="w-6 h-6 text-[#a855f7]" />
              Trung Tâm Điều Hành Sự Kiện &amp; Ban Tổ Chức
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Quản lý toàn bộ 6 phân hệ cốt lõi: Sự kiện, Nhân sự, Đội thi, Tiêu chí Rubric, Bài nộp và Công bố kết quả.
            </p>
          </div>

          {/* Event Dropdown */}
          <div className="flex items-center gap-2 bg-[var(--bg-panel)] border border-[var(--border-muted)] px-3 py-2 hud-clipped font-mono text-xs">
            <Calendar className="w-4 h-4 text-[#a855f7] shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-transparent text-[var(--text-primary)] font-bold focus:outline-none cursor-pointer max-w-[260px] truncate"
            >
              {eventsList.map((ev: any) => {
                const id = ev.id || ev.Id || ev.eventId || ev.EventId;
                const name = ev.eventName || ev.EventName || "Sự kiện";
                return (
                  <option key={id} value={id} className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                    {name} ({ev.season || ev.Season || ""} {ev.year || ev.Year || ""})
                  </option>
                );
              })}
            </select>
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
              <Sparkles className="w-4 h-4 text-[#a855f7]" />
              LUỒNG CÔNG VIỆC ĐIỀU PHỐI (6 MODULES WORKFLOW)
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Bấm vào từng module để truy cập nhanh</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.num}
                  href={mod.href}
                  className={`p-5 bg-[var(--bg-panel)] border border-[var(--border-muted)] ${mod.border} transition-all duration-200 hud-clipped flex flex-col justify-between space-y-4 group hover:bg-[var(--bg-input)]`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#a855f7]/20 text-[#a855f7] font-mono text-xs font-bold rounded">
                          {mod.num}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          {mod.tag}
                        </span>
                      </div>
                      <Icon className={`w-5 h-5 ${mod.accent}`} />
                    </div>

                    <h3 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wide group-hover:text-white transition-colors">
                      {mod.title}
                    </h3>

                    <p className="font-mono text-xs text-[var(--text-muted)] leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border-muted)] flex items-center justify-between font-mono text-[11px] text-[var(--text-muted)] group-hover:text-white">
                    <span>Truy cập module</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
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
                <FileCode className="w-4 h-4 text-[#f59e0b]" />
                Bài Nộp Mới Nhất ({submissions.slice(0, 5).length}/{submissions.length})
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Các sản phẩm dự thi mới nộp gần đây nhất của các đội.
              </p>
            </div>

            <Link href="/coordinator/submissions">
              <Button
                variant="ghost"
                className="text-xs font-mono border border-[var(--border-muted)] flex items-center gap-1.5 cursor-pointer hover:border-white"
              >
                <span>Xem Toàn Bộ Bài Nộp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {isLoadingSubmissions ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              Đang tải danh sách bài làm...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-input)] rounded">
              Chưa có bài nộp nào trong sự kiện này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-input)] text-[var(--text-muted)] uppercase text-[10px]">
                    <th className="w-[30%] p-3">Đội Thi</th>
                    <th className="w-[20%] p-3">Hạng Mục</th>
                    <th className="w-[35%] p-3">Liên Kết Bài Làm</th>
                    <th className="w-[15%] p-3 text-right">Thời Gian</th>
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
                              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-[var(--bg-base)] border border-[var(--border-muted)] rounded text-[10px] flex items-center gap-1 hover:text-white">
                                <Code2 className="w-3 h-3 text-blue-400" /> Repo
                              </a>
                            )}
                            {demoUrl && (
                              <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-[10px] flex items-center gap-1 hover:bg-emerald-500/20">
                                <Globe className="w-3 h-3" /> Demo
                              </a>
                            )}
                            {slideUrl && (
                              <a href={slideUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded text-[10px] flex items-center gap-1 hover:bg-purple-500/20">
                                <FileSpreadsheet className="w-3 h-3" /> Slides
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
