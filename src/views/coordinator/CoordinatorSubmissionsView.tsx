"use client";

import React from "react";
import { Button, Card, Input, ApiMissingDataBadge } from "@/components/ui";
import { Link } from "@/i18n/routing";
import { Pagination } from "@/components/ui/Pagination";
import { SubmissionJudgeScoresModal } from "@/components/domain/SubmissionJudgeScoresModal";
import { useCoordinatorSubmissionsViewModel } from "@/viewModels/coordinator/useCoordinatorSubmissionsViewModel";
import {
  FileCode,
  Globe,
  FileSpreadsheet,
  RefreshCw,
  Code2,
  Filter,
  Layers,
  AlertTriangle,
  Download,
  Award,
  ArrowRight,
  Eye,
} from "lucide-react";

export const CoordinatorSubmissionsView: React.FC = () => {
  const { state, data, pagination, actions } = useCoordinatorSubmissionsViewModel();

  const { selectedEventId, selectedTrackId, searchTerm, inspectScoresModal } = state;
  const { eventsList, tracks, displaySubmissions, metrics, isLoading } = data;
  const {
    paginatedItems: paginatedSubmissions,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = pagination;

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
          <Link href="/coordinator/dashboard" className="text-[#a855f7] hover:underline font-bold">
            COORDINATOR HUB
          </Link>
          <span>&gt;</span>
          <span className="text-[var(--text-primary)] font-bold">QUẢN LÝ BÀI NỘP &amp; DELIVERABLES</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
              <span className="font-mono text-[10px] text-[#a855f7] font-bold tracking-widest uppercase">
                QUẢN LÝ BÀI NỘP
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl text-[var(--text-primary)] uppercase tracking-wider mt-1 flex items-center gap-2.5">
              <FileCode className="w-6 h-6 text-[#a855f7]" />
              Quản Lý Bài Nộp Của Các Đội Thi
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Kiểm tra trực tiếp toàn bộ mã nguồn GitHub, bản chạy thử Demo URL, Slide thuyết trình và soi chi tiết phiếu chấm của từng Giám khảo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/coordinator/appeals${selectedEventId ? `?eventId=${selectedEventId}` : ""}`}>
              <Button
                variant="ghost"
                className="font-mono text-xs border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer relative"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Phúc Khảo Điểm</span>
                {metrics.pendingAppealsCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-amber-500 text-black text-[10px] font-bold rounded-full">
                    {metrics.pendingAppealsCount}
                  </span>
                )}
              </Button>
            </Link>

            <Button
              variant="ghost"
              onClick={actions.handleExportCSV}
              className="font-mono text-xs border border-[var(--border-muted)] flex items-center gap-1.5 cursor-pointer hover:border-white"
            >
              <Download className="w-3.5 h-3.5" /> Xuất CSV
            </Button>
            <Button
              variant="ghost"
              onClick={actions.handleRefetchAll}
              className="font-mono text-xs border border-[var(--border-muted)] flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Làm Mới
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
          <Card className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-1">
            <span className="text-[10px] text-[var(--text-muted)] uppercase block">Tổng Số Lượt Nộp</span>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{metrics.totalSubmissions} Lượt</div>
          </Card>
          <Card className="p-4 bg-[var(--bg-panel)] border border-[var(--color-success)]/30 hud-clipped space-y-1">
            <span className="text-[10px] text-[var(--color-success)] uppercase block font-bold">Số Đội Đã Nộp</span>
            <div className="text-2xl font-bold text-[var(--color-success)]">{metrics.uniqueTeamsCount} Đội</div>
          </Card>
          <Card className="p-4 bg-[var(--bg-panel)] border border-blue-500/30 hud-clipped space-y-1">
            <span className="text-[10px] text-blue-400 uppercase block font-bold">GitHub Repos</span>
            <div className="text-2xl font-bold text-blue-400">{metrics.reposCount} Kho mã nguồn</div>
          </Card>
          <Card className="p-4 bg-[var(--bg-panel)] border border-purple-500/30 hud-clipped space-y-1">
            <span className="text-[10px] text-purple-300 uppercase block font-bold">Demo &amp; Slides</span>
            <div className="text-2xl font-bold text-purple-300">{metrics.demosCount} Demo / {metrics.slidesCount} Slide</div>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center gap-3 bg-[var(--bg-panel)] p-3 border border-[var(--border-muted)] hud-clipped font-mono text-xs">
          <div className="flex items-center gap-2 w-full md:w-1/3">
            <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            <select
              value={selectedEventId}
              onChange={(e) => {
                actions.setSelectedEventId(e.target.value);
                actions.setSelectedTrackId("");
              }}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] hud-clipped cursor-pointer"
            >
              {eventsList.length > 0 ? (
                eventsList.map((ev: any, idx: number) => {
                  const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-${idx}`;
                  const name = ev.eventName || ev.EventName || ev.name || ev.Name || "Sự kiện";
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })
              ) : (
                <option value="">Chưa có sự kiện nào được phân công</option>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-1/3">
            <Layers className="w-4 h-4 text-[#a855f7] shrink-0" />
            <select
              value={selectedTrackId}
              onChange={(e) => actions.setSelectedTrackId(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] hud-clipped cursor-pointer"
            >
              <option value="">— Tất cả Hạng Mục / Track ({tracks.length}) —</option>
              {tracks.map((t: any) => {
                const tId = t.id || t.Id || t.trackId || t.TrackId;
                const tName = t.trackName || t.TrackName || t.name || t.Name || "Track";
                return (
                  <option key={tId} value={tId}>
                    {tName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="w-full md:w-1/3 flex items-center gap-2">
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên đội, bài nộp..."
              value={searchTerm}
              onChange={(e) => actions.setSearchTerm(e.target.value)}
              className="w-full text-xs"
            />
          </div>
        </div>

        {/* Submissions Table */}
        <Card className="p-6 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
            <h3 className="font-display font-bold text-sm text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#a855f7]" />
              Danh Sách Bài Nộp Chi Tiết ({displaySubmissions.length})
            </h3>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">
              Bấm vào nút "Soi Điểm GK" để xem chi tiết phiếu chấm của từng Giám khảo
            </span>
          </div>

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2 font-mono text-xs text-[#a855f7]">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>Đang tải danh sách bài làm từ hệ thống...</span>
            </div>
          ) : displaySubmissions.length === 0 ? (
            <ApiMissingDataBadge
              endpoint="GET /api/SubmitResults"
              title="CHƯA CÓ BÀI NỘP NÀO ĐƯỢC GHI NHẬN"
              message="Chưa có đội thi nào nộp bài làm trong phạm vi sự kiện đã chọn. Khi các thí sinh nộp liên kết GitHub/Demo/Slides, dữ liệu sẽ hiển thị ngay tại đây."
            />
          ) : (
            <div className="w-full overflow-x-auto border border-[var(--border-muted)] bg-[var(--bg-input)] hud-clipped">
              <table className="w-full table-fixed min-w-[850px] text-left border-collapse font-mono text-xs">
                <thead className="bg-[var(--bg-panel)] border-b border-[var(--border-muted)]">
                  <tr>
                    <th className="w-[20%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      ĐỘI THI
                    </th>
                    <th className="w-[15%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      HẠNG MỤC (TRACK)
                    </th>
                    <th className="w-[30%] px-4 py-3.5 text-left text-[var(--text-muted)] uppercase tracking-wider">
                      LIÊN KẾT BÀI LÀM (DELIVERABLES)
                    </th>
                    <th className="w-[17%] px-4 py-3.5 text-right text-[var(--text-muted)] uppercase tracking-wider">
                      THỜI GIAN NỘP
                    </th>
                    <th className="w-[18%] px-4 py-3.5 text-center text-[var(--text-muted)] uppercase tracking-wider">
                      ĐIỂM GIÁM KHẢO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSubmissions.map((sub: any, idx: number) => {
                    const subId = sub.id || sub.Id || `sub-${idx}`;
                    const teamId = sub.teamId || sub.TeamId;
                    const teamName = sub.teamName || sub.TeamName || `Đội #${(teamId)?.slice(-4) || idx + 1}`;
                    const trackName = sub.trackName || sub.TrackName || "Chung";
                    const repoUrl = sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl;
                    const demoUrl = sub.demoUrl || sub.DemoUrl;
                    const slideUrl = sub.slideUrl || sub.SlideUrl;
                    const createdTime = sub.createdTime || sub.CreatedTime;

                    return (
                      <tr key={subId} className="hover:bg-[#a855f7]/5 transition-colors border-t border-[var(--border-muted)]/50">
                        <td className="px-4 py-3.5 align-middle font-bold text-[var(--text-primary)] truncate" title={teamName}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--accent-team)] shrink-0" />
                            <span className="truncate">{teamName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-[var(--accent-team)] truncate font-semibold" title={trackName}>
                          {trackName}
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-2 flex-wrap">
                            {repoUrl ? (
                              <a
                                href={repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-[var(--bg-base)] border border-[var(--border-muted)] text-[var(--text-primary)] hover:border-white hover:text-white rounded flex items-center gap-1 text-[11px] font-bold transition-colors"
                                title={repoUrl}
                              >
                                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                                <span>GitHub Repo</span>
                              </a>
                            ) : null}

                            {demoUrl ? (
                              <a
                                href={demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-[rgba(16,185,129,0.1)] border border-[var(--color-success)]/40 text-[var(--color-success)] hover:bg-[var(--color-success)]/20 rounded flex items-center gap-1 text-[11px] font-bold transition-colors"
                                title={demoUrl}
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Live Demo</span>
                              </a>
                            ) : null}

                            {slideUrl ? (
                              <a
                                href={slideUrl}
                                target="_blank"
                                rel="noopener noreferrer"
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
                        </td>
                        <td className="px-4 py-3.5 align-middle text-center">
                          <Button
                            variant="ghost"
                            onClick={() => actions.handleOpenInspectScores(teamId, teamName, subId)}
                            className="font-mono text-xs border border-[#a855f7]/40 text-[#a855f7] hover:bg-[#a855f7]/15 flex items-center gap-1.5 mx-auto font-bold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Soi Điểm GK</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {displaySubmissions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="bài nộp"
            />
          )}
        </Card>

        {/* Bottom Quick Hub Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <Link href="/coordinator/publish-results" className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hover:border-[#a855f7] transition-all hud-clipped flex items-center justify-between group">
            <div>
              <span className="text-[10px] text-[#a855f7] font-bold uppercase block">TIẾP THEO</span>
              <span className="font-bold text-sm text-[var(--text-primary)]">Tính Điểm &amp; Công Bố Kết Quả</span>
            </div>
            <ArrowRight className="w-5 h-5 text-[#a855f7] group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/coordinator/prizes" className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hover:border-amber-400 transition-all hud-clipped flex items-center justify-between group">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase block">CƠ CẤU</span>
              <span className="font-bold text-sm text-[var(--text-primary)]">Quản Lý Danh Sách Giải Thưởng</span>
            </div>
            <Award className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link href="/coordinator/appeals" className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hover:border-red-400 transition-all hud-clipped flex items-center justify-between group">
            <div>
              <span className="text-[10px] text-red-400 font-bold uppercase block">KHIẾU NẠI</span>
              <span className="font-bold text-sm text-[var(--text-primary)]">Xử Lý Đơn Phúc Khảo Điểm</span>
            </div>
            <AlertTriangle className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      {/* Modal Soi Chi Tiết Điểm Giám Khảo */}
      <SubmissionJudgeScoresModal
        open={inspectScoresModal.open}
        onClose={actions.handleCloseInspectScores}
        teamId={inspectScoresModal.teamId}
        teamName={inspectScoresModal.teamName}
        submitResultId={inspectScoresModal.submitResultId}
      />
    </div>
  );
};
