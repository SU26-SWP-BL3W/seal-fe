"use client";

import React from "react";
import { SubmissionJudgeScoresModal } from "@/components/domain/SubmissionJudgeScoresModal";
import { Link } from "@/i18n/routing";
import { Pagination } from "@/components/ui/Pagination";
import { useCoordinatorPublishResultsViewModel } from "@/viewModels/coordinator/useCoordinatorPublishResultsViewModel";
import {
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Award,
  ChevronDown,
  Filter,
  Layers,
  Download,
  Mail,
  Send,
  X,
  UserCheck,
  BarChart2,
  Clock,
} from "lucide-react";

export const CoordinatorPublishResultsView: React.FC = () => {
  const { state, data, pagination, actions } = useCoordinatorPublishResultsViewModel();

  const {
    selectedEventId,
    selectedRoundId,
    selectedTrackId,
    isSubmitting,
    errorMessage,
    successMessage,
    isPublishedState,
    inspectScoresModal,
    assignedPrizesMap,
    isEmailModalOpen,
    emailRecipientType,
    emailSubject,
    emailCustomMessage,
    isSendingEmail,
  } = state;

  const {
    eventsList,
    roundsList,
    tracksList,
    currentEvent,
    currentRound,
    availablePrizesList,
    teamNameById,
    displayResults,
    isLoading,
    calibration,
  } = data;

  const {
    paginatedItems: paginatedResults,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = pagination;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      {/* Main Container */}
      <div className="flex-1 p-6 space-y-6 max-w-[1600px] w-full mx-auto">
        
        {/* Cascade Filter Bar: Event, Round & Track */}
        <div className="bg-[#13191c] p-4 border border-[#263339] grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          
          {/* Filter 1: Event */}
          <div className="space-y-1">
            <label className="text-[#8b5cf6] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Filter className="w-3.5 h-3.5 text-[#8b5cf6]" />
              SỰ KIỆN PHỤ TRÁCH *
            </label>
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => actions.setSelectedEventId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#8b5cf6]"
              >
                {eventsList.length > 0 ? (
                  eventsList.map((ev: any, idx: number) => (
                    <option key={ev.id || ev.Id || ev.eventId || ev.EventId || idx} value={ev.id || ev.Id || ev.eventId || ev.EventId}>
                      {ev.eventName || ev.EventName || "Sự kiện"} ({ev.season || ev.Season || ""} {ev.year || ev.Year || ""})
                    </option>
                  ))
                ) : (
                  <option value="">Chưa có sự kiện nào trong hệ thống</option>
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Filter 2: Round */}
          <div className="space-y-1">
            <label className="text-[#8b5cf6] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-[#8b5cf6]" />
              VÒNG THI *
            </label>
            <div className="relative">
              <select
                value={selectedRoundId}
                onChange={(e) => actions.setSelectedRoundId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#8b5cf6]"
              >
                {roundsList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Filter 3: Track */}
          <div className="space-y-1">
            <label className="text-[#8b5cf6] font-bold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
              <Award className="w-3.5 h-3.5 text-[#8b5cf6]" />
              HẠNG MỤC THI ĐẤU *
            </label>
            <div className="relative">
              <select
                value={selectedTrackId}
                onChange={(e) => actions.setSelectedTrackId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#00d9ff] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#8b5cf6]"
              >
                {tracksList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* HUD Judge Progress Monitor Card (100% Real API Data) */}
        <div className="bg-[#13191c] border border-[#263339] p-5 space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263339] pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#00d9ff]" />
              <h3 className="font-bold text-sm text-[#e1e7ec] uppercase">
                TIẾN ĐỘ CHẤM BÀI CỦA GIÁM KHẢO (REALTIME MONITORING)
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8a9ba8]">TRẠNG THÁI TOÀN HẠNG MỤC:</span>
              {calibration.isCalibrationCompleted ? (
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-xs font-bold uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  100% GIÁM KHẢO ĐÃ CHỐT ĐIỂM
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  CÒN {calibration.pendingPairs} PHIẾU CHƯA CHỐT ĐIỂM (DRAFT)
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex justify-between text-[11px] text-[#8a9ba8]">
                <span>Tỷ lệ hoàn tất phiếu chấm ({calibration.submittedPairs}/{calibration.totalPairs})</span>
                <span className="font-bold text-[#00d9ff]">{calibration.progressPercent}%</span>
              </div>
              <div className="w-full bg-[#0a0e10] border border-[#263339] h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${calibration.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-[#0a0e10] border border-[#263339] flex items-center justify-between">
              <span className="text-[#8a9ba8] text-[11px]">Đã chốt chính thức:</span>
              <span className="font-bold text-emerald-400 text-sm">{calibration.submittedPairs} phiếu</span>
            </div>

            <div className="p-3 bg-[#0a0e10] border border-[#263339] flex items-center justify-between">
              <span className="text-[#8a9ba8] text-[11px]">Chưa chốt (Draft/Chờ):</span>
              <span className="font-bold text-amber-400 text-sm">{calibration.pendingPairs} phiếu</span>
            </div>
          </div>

          {/* Real API Judges Matrix Overview */}
          {calibration.scoresList.length > 0 && (
            <div className="pt-2 border-t border-[#263339]">
              <div className="text-[11px] text-[#8a9ba8] uppercase mb-2 flex items-center justify-between">
                <span>Chi tiết phân công tự động theo Hạng mục:</span>
                <Link href="/coordinator/calibration" className="text-[#00d9ff] hover:underline flex items-center gap-1">
                  <BarChart2 className="w-3.5 h-3.5" /> Xem Ma Trận Hiệu Chuẩn Chi Tiết (RBL) &rarr;
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {calibration.scoresList.map((sc: any, idx: number) => (
                  <div
                    key={idx}
                    className={`px-2.5 py-1 text-[11px] border flex items-center gap-1.5 ${
                      sc.isSubmitted || sc.IsSubmitted
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    }`}
                  >
                    <span className="font-bold">{sc.judgeName || sc.JudgeName}</span>
                    <span className="text-[#8a9ba8]">&rarr;</span>
                    <span>{sc.teamName || sc.TeamName}</span>
                    <span className="font-bold">
                      ({sc.isSubmitted || sc.IsSubmitted ? `${sc.totalScore || sc.TotalScore}đ` : "Draft"})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#263339] pb-4">
          <div>
            <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
              XÉT KẾT QUẢ VÒNG THI &amp; HẠNG MỤC
            </h1>
            <p className="font-sans text-xs text-[#8a9ba8] mt-1 max-w-2xl">
              Kiểm tra bảng điểm xếp hạng, gán Giải thưởng cho Đội thi đạt thứ hạng cao, xuất báo cáo và gửi email thông báo.
            </p>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={actions.handleExportCSV}
              className="px-3.5 py-2 bg-[#182024] border border-[#263339] text-[#e1e7ec] hover:border-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Xuất bảng điểm kết quả thành file Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>XUẤT CSV</span>
            </button>

            <button
              type="button"
              onClick={actions.handleOpenEmailModal}
              className="px-3.5 py-2 bg-[#182024] border border-[#263339] text-[#e1e7ec] hover:border-[#a855f7] font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Gửi email thông báo kết quả cho thí sinh"
            >
              <Mail className="w-3.5 h-3.5 text-[#a855f7]" />
              <span>GỬI EMAIL</span>
            </button>

            <Link href={`/coordinator/prizes?eventId=${selectedEventId}`}>
              <button
                type="button"
                className="px-4 py-2 bg-amber-500/10 border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>CƠ CẤU GIẢI THƯỞNG</span>
              </button>
            </Link>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={actions.handleCalculate}
              className="px-4 py-2 border border-[#263339] text-[#e1e7ec] hover:border-[#8b5cf6] font-mono text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-[#8b5cf6]" />
              <span>TÍNH ĐIỂM TỰ ĐỘNG</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={actions.handleTogglePublishStatus}
              className={`px-5 py-2 border font-mono text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                isPublishedState
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold"
                  : "bg-[#13191c] border-[#263339] text-[#f59e0b] hover:border-[#f59e0b]"
              }`}
            >
              {isPublishedState ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4 text-[#f59e0b]" />}
              <span>{isPublishedState ? "ẨN VỀ BẢN NHÁP" : "CÔNG BỐ KẾT QUẢ"}</span>
            </button>
          </div>
        </div>

        {/* Global Alert Messages */}
        {errorMessage && (
          <div className="p-4 bg-red-500/10 border border-[#ef4444]/30 text-[#ef4444] font-mono text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Main Data Grid */}
        <div className="bg-[#13191c] border border-[#263339]">
          {/* Header */}
          <div className="h-10 bg-[#182024] flex items-center justify-between px-4 border-b border-[#263339] font-mono text-xs text-[#8a9ba8] font-bold tracking-widest uppercase">
            <span>
              BẢNG XẾP HẠNG MA TRẬN ĐIỂM{tracksList.find((t) => t.id === selectedTrackId)?.name ? ` — [ ${tracksList.find((t) => t.id === selectedTrackId)?.name} ]` : ""}
            </span>
            <span className={isPublishedState ? "text-[#10b981]" : "text-[#f59e0b]"}>
              {isPublishedState ? "ĐÃ CÔNG BỐ PUBLIC" : "CHẾ ĐỘ BẢN NHÁP"}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#0a0e10]">
                  <th className="p-4 w-16 text-center">HẠNG</th>
                  <th className="p-4">TÊN ĐỘI THI THẮNG GIẢI</th>
                  <th className="p-4 w-32 text-right">TỔNG ĐIỂM</th>
                  <th className="p-4 w-32 text-center">KẾT QUẢ</th>
                  <th className="p-4 w-64">CƠ CHẾ GÁN GIẢI THƯỞNG (PRIZE)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263339]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#8a9ba8]">
                      Đang tải ma trận điểm kết quả...
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((r: any, idx: number) => {
                    const rankStr = String(r.rank || (currentPage - 1) * pageSize + idx + 1).padStart(2, "0");
                    const name = teamNameById.get(r.teamId) || r.teamName || r.TeamName || r.teamId;
                    const uid = `KQ: ${(r.id || "").slice(0, 8).toUpperCase()}`;
                    const score = Number(r.finalScore || r.totalScore || r.TotalScore || 0).toFixed(2);
                    const isAdv = r.isAdvanced !== undefined ? Boolean(r.isAdvanced) : idx < 2;

                    const assignedPrizeId = assignedPrizesMap[r.id] ?? r.prizeId ?? "none";

                    return (
                      <tr key={r.id || idx} className="hover:bg-[#182024] transition-colors">
                        <td className="p-4 text-center font-bold text-base text-[#8b5cf6]">{rankStr}</td>
                        <td className="p-4">
                          <div className="font-sans font-bold text-sm text-[#e1e7ec] flex items-center justify-between gap-2">
                            <span>{name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                actions.setInspectScoresModal({
                                  open: true,
                                  teamId: r.teamId || r.TeamId,
                                  teamName: name,
                                })
                              }
                              className="px-2 py-0.5 bg-[#a855f7]/10 hover:bg-[#a855f7]/20 border border-[#a855f7]/30 text-[#a855f7] rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                              title="Xem chi tiết phiếu chấm của từng Giám khảo"
                            >
                              <Eye className="w-3 h-3 text-[#a855f7]" />
                              <span>Soi điểm GK</span>
                            </button>
                          </div>
                          <div className="text-[10px] text-[#8a9ba8] font-mono mt-0.5">{uid}</div>
                        </td>
                        <td className="p-4 text-right font-bold text-base text-[#e1e7ec]">{score}</td>
                        <td className="p-4 text-center">
                          {isAdv ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase">
                              [ THĂNG HẠNG ]
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-semibold uppercase">
                              [ BỊ LOẠI ]
                            </span>
                          )}
                        </td>
                        
                        {/* CƠ CHẾ GÁN GIẢI THƯỞNG DROPDOWN */}
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-[#f59e0b] shrink-0" />
                            <select
                              value={assignedPrizeId}
                              onChange={(e) => actions.handleAssignPrizeToTeam(r.id, e.target.value, name)}
                              className="w-full px-2.5 py-1.5 bg-[#0a0e10] border border-[#263339] text-[#f59e0b] font-mono text-xs font-bold focus:outline-none focus:border-[#f59e0b] cursor-pointer"
                            >
                              <option value="none">— Chưa gán giải —</option>
                              {availablePrizesList.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Pagination */}
          {displayResults.length > 0 && (
            <div className="p-3 bg-[#0a0e10] border-t border-[#263339]">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="kết quả xếp hạng"
              />
            </div>
          )}
        </div>

      </div>

      {/* 6.2 Modal Gửi Email Kết Quả */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#13191c] border border-[#263339] max-w-xl w-full p-6 space-y-5 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#263339] pb-3">
              <div className="flex items-center gap-2 text-[#a855f7] font-bold uppercase text-sm">
                <Mail className="w-4 h-4" />
                <span>GỬI EMAIL THÔNG BÁO KẾT QUẢ</span>
              </div>
              <button
                onClick={() => actions.setIsEmailModalOpen(false)}
                className="text-[#8a9ba8] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[#8a9ba8] uppercase block text-[11px]">Đối tượng nhận mail:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => actions.setEmailRecipientType("all")}
                    className={`p-2.5 border text-left rounded ${
                      emailRecipientType === "all"
                        ? "bg-[#a855f7]/20 border-[#a855f7] text-white font-bold"
                        : "bg-[#0a0e10] border-[#263339] text-[#8a9ba8]"
                    }`}
                  >
                    <div>Toàn bộ đội thi</div>
                    <div className="text-[10px] text-[#8a9ba8]">{displayResults.length} Đội trong vòng</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => actions.setEmailRecipientType("advanced")}
                    className={`p-2.5 border text-left rounded ${
                      emailRecipientType === "advanced"
                        ? "bg-[#a855f7]/20 border-[#a855f7] text-white font-bold"
                        : "bg-[#0a0e10] border-[#263339] text-[#8a9ba8]"
                    }`}
                  >
                    <div>Đội thăng hạng &amp; có giải</div>
                    <div className="text-[10px] text-[#8a9ba8]">Chỉ Top xuất sắc</div>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#8a9ba8] uppercase block text-[11px]">Tiêu đề Email:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => actions.setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] focus:outline-none focus:border-[#a855f7]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[#8a9ba8] uppercase block text-[11px]">Nội dung gửi kèm:</label>
                <textarea
                  rows={4}
                  value={emailCustomMessage}
                  onChange={(e) => actions.setEmailCustomMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] focus:outline-none focus:border-[#a855f7]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#263339]">
              <button
                type="button"
                onClick={() => actions.setIsEmailModalOpen(false)}
                className="px-4 py-2 border border-[#263339] text-[#8a9ba8] hover:text-white"
              >
                HỦY
              </button>
              <button
                type="button"
                disabled={isSendingEmail}
                onClick={actions.handleSendEmailAnnouncement}
                className="px-4 py-2 bg-[#a855f7] text-white font-bold hover:bg-purple-600 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingEmail ? "ĐANG GỬI..." : "GỬI THÔNG BÁO"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Soi Chi Tiết Điểm Giám Khảo */}
      <SubmissionJudgeScoresModal
        open={inspectScoresModal.open}
        onClose={() => actions.setInspectScoresModal({ open: false })}
        teamId={inspectScoresModal.teamId}
        teamName={inspectScoresModal.teamName}
      />
    </div>
  );
};
