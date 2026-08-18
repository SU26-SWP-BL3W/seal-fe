"use client";

import React, { useState } from "react";
import { Button, Card, Badge, Input, ApiMissingDataBadge } from "@/components/ui";
import { useEvents } from "@/repositories/eventsRepository";
<<<<<<< Updated upstream
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { PagedResult } from "@/models/types";
import { SubmitResultListItem } from "@/repositories/submitResultsRepository";
=======
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import { PagedResult } from "@/models/types";
import { SubmitResultListItem } from "@/repositories/scoring/submitResultsRepository";
>>>>>>> Stashed changes
import {
  FileCode,
  Globe,
  FileSpreadsheet,
  RefreshCw,
  Code2,
  Filter,
<<<<<<< Updated upstream
  Layers,
  Search,
} from "lucide-react";
=======
  Search,
  ExternalLink,
} from "lucide-react";

function pickId(item: any): string {
  return item?.id || item?.Id || item?.eventId || item?.EventId || "";
}
>>>>>>> Stashed changes

export const CoordinatorDashboardView: React.FC = () => {
  const { data: rawEvents = [] } = useEvents();
  const eventsList = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];

  const [selectedEventId, setSelectedEventId] = useState<string>("");
<<<<<<< Updated upstream
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { data: rawTracks = [] } = useGetTracksByEvent(selectedEventId || undefined);
  const tracksList = Array.isArray(rawTracks) ? rawTracks : (rawTracks as any)?.data ?? [];

  const handleEventChange = (newEvId: string) => {
    setSelectedEventId(newEvId);
    setSelectedTrackId("");
  };

=======
  const [searchTerm, setSearchTerm] = useState<string>("");

>>>>>>> Stashed changes
  // Query submissions
  const {
    data: rawSubmissions = [],
    isLoading: isLoadingSubmissions,
    refetch: refetchSubmissions,
  } = useQuery({
    queryKey: ["all-submissions", selectedEventId],
    queryFn: async () => {
      const params: Record<string, any> = { PageSize: 200 };
      if (selectedEventId) params.EventId = selectedEventId;
      const res = await apiClient.get<PagedResult<SubmitResultListItem>>("/SubmitResults", { params });
      return res.data?.data ?? [];
    },
  });
<<<<<<< Updated upstream

  const submissions = Array.isArray(rawSubmissions) ? rawSubmissions : [];

  // Filtered submissions by track and search term
  const displaySubmissions = submissions.filter((sub: any) => {
    if (selectedTrackId) {
      const sTrackId = sub.trackId || sub.TrackId || "";
      if (sTrackId !== selectedTrackId) return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const teamName = (sub.teamName || sub.TeamName || "").toLowerCase();
    const eventName = (sub.eventName || sub.EventName || "").toLowerCase();
    const trackName = (sub.trackName || sub.TrackName || "").toLowerCase();
    return teamName.includes(term) || eventName.includes(term) || trackName.includes(term);
  });

  const uniqueTeamsCount = new Set(displaySubmissions.map((s: any) => s.teamId || s.TeamId)).size;
=======

  const submissions = Array.isArray(rawSubmissions) ? rawSubmissions : [];

  // Filtered submissions by search term
  const displaySubmissions = submissions.filter((sub: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const teamName = (sub.teamName || sub.TeamName || "").toLowerCase();
    const eventName = (sub.eventName || sub.EventName || "").toLowerCase();
    const trackName = (sub.trackName || sub.TrackName || "").toLowerCase();
    return teamName.includes(term) || eventName.includes(term) || trackName.includes(term);
  });
>>>>>>> Stashed changes

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          <span className="text-[var(--color-danger)] font-bold">SEAL SYSTEM</span>
          <span>&gt;</span>
<<<<<<< Updated upstream
          <span className="text-[var(--text-primary)] font-bold">TỔNG HỢP BÀI THI &amp; SUBMISSIONS</span>
=======
          <span className="text-[var(--text-primary)] font-bold">COORDINATOR OPERATIONS</span>
          <span>&gt;</span>
          <span className="text-[var(--text-muted)]">TỔNG HỢP BÀI THI &amp; SUBMISSIONS</span>
>>>>>>> Stashed changes
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2">
<<<<<<< Updated upstream
              <span className="w-2 h-2 rounded-full bg-[var(--color-danger)] animate-pulse" />
              <span className="font-mono text-[10px] text-[var(--color-danger)] font-bold tracking-widest uppercase">
                SUBMISSIONS &amp; DELIVERABLES HUB
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase tracking-wider mt-1 flex items-center gap-2.5">
              <FileCode className="w-6 h-6 text-[var(--color-danger)]" />
              Tổng Hợp Bài Nộp Của Các Đội Thi
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Theo dõi trực tiếp toàn bộ mã nguồn GitHub, bản chạy thử Demo URL và Slide thuyết trình của các đội thi.
=======
              <span className="w-2 h-2 rounded-full bg-[var(--accent-coordinator)] animate-pulse" />
              <span className="font-mono text-[10px] text-[var(--accent-coordinator)] font-bold tracking-widest uppercase">
                COORDINATOR SUBMISSIONS HUB
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase tracking-wider mt-1 flex items-center gap-2.5">
              <FileCode className="w-6 h-6 text-[var(--accent-coordinator)]" />
              Tổng Hợp Bài Thi Các Đội Nộp
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Theo dõi trực tiếp toàn bộ source code GitHub, Live Demo, Slide Pitch PPT của từng đội thi theo sự kiện.
>>>>>>> Stashed changes
            </p>
          </div>

          <Button
            variant="ghost"
            onClick={() => refetchSubmissions()}
            className="font-mono text-xs border border-[var(--border-muted)] flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
<<<<<<< Updated upstream
            <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
          </Button>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
          <Card className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Tổng Số Lượt Nộp Bài</span>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{displaySubmissions.length} Lượt</div>
          </Card>
          <Card className="p-4 bg-[var(--bg-panel)] border border-[var(--color-success)]/30 hud-clipped space-y-1">
            <span className="text-[10px] text-[var(--color-success)] uppercase block font-bold">Số Đội Đã Nộp Dự Án</span>
            <div className="text-2xl font-bold text-[var(--color-success)]">{uniqueTeamsCount} Đội</div>
          </Card>
          <Card className="p-4 bg-[var(--bg-panel)] border border-[var(--accent-team)]/30 hud-clipped space-y-1">
            <span className="text-[10px] text-[var(--accent-team)] uppercase block font-bold">Phạm Vi Đang Lọc</span>
            <div className="text-sm font-bold text-[var(--accent-team)] truncate">
              {selectedTrackId
                ? tracksList.find((t: any) => (t.id || t.Id || t.trackId || t.TrackId) === selectedTrackId)?.trackName || "1 Hạng Mục"
                : selectedEventId
                ? eventsList.find((e: any) => (e.id || e.Id || e.eventId || e.EventId) === selectedEventId)?.eventName || "1 Sự Kiện"
                : `${eventsList.length} Sự Kiện`}
            </div>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[var(--bg-panel)] p-3 border border-[var(--border-muted)] hud-clipped font-mono text-xs">
          <div className="flex items-center gap-2 sm:col-span-4">
            <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] hud-clipped"
            >
              <option value="">— Tất cả sự kiện ({eventsList.length}) —</option>
              {eventsList.map((ev: any, idx: number) => {
                const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-${idx}`;
                const name = ev.eventName || ev.EventName || "Sự kiện";
                return (
                  <option key={id} value={id}>
                    {name}
=======
            <RefreshCw className="w-3.5 h-3.5" /> Làm Mới Dữ Liệu
          </Button>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-[var(--bg-panel)] p-3 border border-[var(--border-muted)] hud-clipped font-mono text-xs">
          <div className="flex items-center gap-2 w-full sm:w-1/2">
            <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] hud-clipped"
            >
              <option value="">— Tất Cả Sự Kiện ({eventsList.length}) —</option>
              {eventsList.map((ev: any) => {
                const id = pickId(ev);
                return (
                  <option key={id} value={id}>
                    {ev.eventName || ev.EventName || id}
>>>>>>> Stashed changes
                  </option>
                );
              })}
            </select>
          </div>

<<<<<<< Updated upstream
          <div className="flex items-center gap-2 sm:col-span-4">
            <Layers className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              disabled={!selectedEventId || tracksList.length === 0}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] hud-clipped disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedEventId
                  ? "— Chọn Sự Kiện Để Lọc Hạng Mục —"
                  : tracksList.length === 0
                  ? "— Sự Kiện Chưa Có Hạng Mục —"
                  : `— Tất Cả Hạng Mục (${tracksList.length}) —`}
              </option>
              {tracksList.map((tr: any) => {
                const trId = tr.id || tr.Id || tr.trackId || tr.TrackId;
                const trName = tr.trackName || tr.TrackName || "Hạng mục";
                return (
                  <option key={trId} value={trId}>
                    {trName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex items-center gap-2 sm:col-span-4">
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên đội, hạng mục..."
=======
          <div className="flex items-center gap-2 w-full sm:w-1/2">
            <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <Input
              type="text"
              placeholder="Tìm theo tên đội thi, sự kiện, chủ đề..."
>>>>>>> Stashed changes
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs"
            />
          </div>
        </div>

        {/* Submissions Table */}
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-4">
<<<<<<< Updated upstream
          <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[var(--color-danger)]" />
              Danh Sách Bài Nộp Chi Tiết ({displaySubmissions.length})
            </h3>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              Bấm vào các nút liên kết để kiểm tra trực tiếp sản phẩm của đội thi
=======
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-coordinator)]" />
              DANH SÁCH BÀI THI ĐÃ NỘP ({displaySubmissions.length})
            </h2>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              Cập nhật thời gian thực từ hệ thống
>>>>>>> Stashed changes
            </span>
          </div>

          {isLoadingSubmissions ? (
<<<<<<< Updated upstream
            <div className="py-16 flex flex-col items-center justify-center gap-2 font-mono text-xs text-[var(--color-danger)]">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Đang tải danh sách bài làm từ hệ thống...</span>
=======
            <div className="py-16 flex flex-col items-center justify-center gap-2 font-mono text-xs text-[var(--accent-coordinator)]">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Đang tải danh sách bài nộp từ server...</span>
>>>>>>> Stashed changes
            </div>
          ) : displaySubmissions.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/SubmitResults"
<<<<<<< Updated upstream
              title="CHƯA CÓ BÀI NỘP NÀO ĐƯỢC GHI NHẬN"
              message="Chưa có đội thi nào nộp bài làm trong phạm vi sự kiện đã chọn. Khi các thí sinh nộp liên kết GitHub/Demo/Slides, dữ liệu sẽ hiển thị ngay tại đây."
            />
          ) : (
            <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-input)] hud-clipped">
              <table className="w-full table-fixed min-w-[850px] text-left border-collapse font-mono text-xs">
                <thead className="bg-[var(--bg-panel)] border-b border-[var(--border-muted)]">
                  <tr>
                    <th className="w-[24%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      ĐỘI THI
                    </th>
                    <th className="w-[18%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      HẠNG MỤC (TRACK)
                    </th>
                    <th className="w-[38%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      LIÊN KẾT BÀI LÀM (DELIVERABLES)
                    </th>
                    <th className="w-[20%] px-4 py-3.5 text-right text-[var(--text-muted)] uppercase tracking-wider">
                      THỜI GIAN NỘP
=======
              title="CHƯA CÓ BÀI NỘP NÀO"
              message="Chưa có đội thi nào nộp bài trong sự kiện đã chọn."
            />
          ) : (
            <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-input)] hud-clipped">
              <table className="w-full table-fixed min-w-[950px] text-left border-collapse font-mono text-xs">
                <thead className="bg-[var(--bg-panel)] border-b border-[var(--border-muted)]">
                  <tr>
                    <th className="w-[24%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      TÊN ĐỘI THI
                    </th>
                    <th className="w-[20%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      SỰ KIỆN / CHỦ ĐỀ
                    </th>
                    <th className="w-[38%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      TÀI NGUYÊN BÀI NỘP (CODE / DEMO / SLIDES)
                    </th>
                    <th className="w-[18%] px-4 py-3.5 text-right text-[var(--text-muted)] uppercase tracking-wider">
                      THỜI ĐIỂM NỘP
>>>>>>> Stashed changes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displaySubmissions.map((sub: any, idx: number) => {
                    const subId = sub.id || sub.Id || `sub-${idx}`;
<<<<<<< Updated upstream
                    const teamName = sub.teamName || sub.TeamName || `Đội #${(sub.teamId || sub.TeamId)?.slice(-4) || idx + 1}`;
                    const trackName = sub.trackName || sub.TrackName || "Chung";
                    const repoUrl = sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl;
                    const demoUrl = sub.demoUrl || sub.DemoUrl;
                    const slideUrl = sub.slideUrl || sub.SlideUrl;
                    const createdTime = sub.createdTime || sub.CreatedTime;

                    return (
                      <tr key={subId} className="hover:bg-[var(--color-danger)]/5 transition-colors border-t border-[var(--border-muted)]/50">
                        <td className="px-4 py-3.5 align-middle font-bold text-[var(--text-primary)] truncate" title={teamName}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--accent-team)] shrink-0" />
                            <span className="truncate">{teamName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[var(--accent-team)] truncate font-semibold" title={trackName}>
                          {trackName}
=======
                    const teamName = sub.teamName || sub.TeamName || "Đội thi";
                    const eventName = sub.eventName || sub.EventName || "SEAL Hackathon";
                    const trackName = sub.trackName || sub.TrackName || "Bảng Chung";
                    const repoUrl = sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl;
                    const demoUrl = sub.demoUrl || sub.DemoUrl;
                    const slideUrl = sub.slideUrl || sub.SlideUrl;
                    const submittedAt = sub.createdTime || sub.CreatedTime || sub.lastUpdatedTime || sub.LastUpdatedTime;

                    return (
                      <tr key={subId} className="hover:bg-[var(--accent-coordinator)]/5 transition-colors border-t border-[var(--border-muted)]/50">
                        <td className="px-4 py-3.5 align-middle font-bold text-[var(--text-primary)] truncate" title={teamName}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--accent-coordinator)] shrink-0" />
                            <span className="truncate">{teamName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[var(--text-muted)] truncate">
                          <div className="truncate text-[var(--text-primary)] font-bold">{eventName}</div>
                          <div className="text-[10px] text-[var(--accent-coordinator)] truncate mt-0.5">{trackName}</div>
>>>>>>> Stashed changes
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-2 flex-wrap">
                            {repoUrl ? (
                              <a
                                href={repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
<<<<<<< Updated upstream
                                className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-muted)] text-[var(--text-primary)] hover:border-white hover:text-white rounded flex items-center gap-1 text-[11px] font-bold transition-colors"
                                title={repoUrl}
                              >
                                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                                <span>GitHub Repo</span>
                              </a>
                            ) : null}

                            {demoUrl ? (
=======
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/20 transition-colors"
                                title={repoUrl}
                              >
                                <Code2 className="w-3.5 h-3.5" />
                                <span>GitHub Repo</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-[var(--text-muted)] italic">Chưa nộp code</span>
                            )}

                            {demoUrl && (
>>>>>>> Stashed changes
                              <a
                                href={demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
<<<<<<< Updated upstream
                                className="px-2.5 py-1 bg-[rgba(16,185,129,0.1)] border border-[var(--color-success)]/40 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 rounded flex items-center gap-1 text-[11px] font-bold transition-colors"
=======
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/20 transition-colors"
>>>>>>> Stashed changes
                                title={demoUrl}
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Live Demo</span>
<<<<<<< Updated upstream
                              </a>
                            ) : null}

                            {slideUrl ? (
=======
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                              </a>
                            )}

                            {slideUrl && (
>>>>>>> Stashed changes
                              <a
                                href={slideUrl}
                                target="_blank"
                                rel="noopener noreferrer"
<<<<<<< Updated upstream
                                className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/40 text-purple-300 hover:bg-purple-500/20 rounded flex items-center gap-1 text-[11px] font-bold transition-colors"
                                title={slideUrl}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>Slides Pitch</span>
                              </a>
                            ) : null}

                            {!repoUrl && !demoUrl && !slideUrl && (
                              <span className="text-[11px] text-[var(--text-muted)] italic">Đang cập nhật link</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                          {createdTime ? new Date(createdTime).toLocaleString("vi-VN") : "Vừa xong"}
=======
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/20 transition-colors"
                                title={slideUrl}
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>Pitch Slide</span>
                                <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right text-[var(--text-muted)] font-mono text-[11px]">
                          {submittedAt ? new Date(submittedAt).toLocaleString("vi-VN") : "Gần đây"}
>>>>>>> Stashed changes
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
