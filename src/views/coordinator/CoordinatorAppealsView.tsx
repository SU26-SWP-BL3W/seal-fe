"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { AppealStatus } from "@/repositories/appealsRepository";
import { Pagination } from "@/components/ui/Pagination";
import { Button } from "@/components/ui";
import { useCoordinatorAppealsViewModel } from "@/viewModels/coordinator/useCoordinatorAppealsViewModel";
import { Check, X, AlertCircle, CheckCircle2, UserPlus, Filter, ChevronDown, ArrowLeft, RefreshCw } from "lucide-react";

/**
 * =========================================================================================
 * COMPONENT: CoordinatorAppealsView
 * VAI TRÒ: Điều phối viên (Event Coordinator - EC) / Ban Tổ Chức
 * CHỨC NĂNG TRỌNG TÂM:
 *   1. Quản lý Hàng đợi đơn khiếu nại / phúc khảo điểm số từ các đội thi (/coordinator/appeals).
 *   2. Xem chi tiết lý do khiếu nại, mã bài nộp, đội thi và thời gian nộp đơn.
 *   3. DUYỆT ĐƠN PHÚC KHẢO (Approve Appeal) & PHÂN CÔNG GIÁM KHẢO CHẤM LẠI (Re-assign Judge).
 *   4. TỪ CHỐI ĐƠN PHÚC KHẢO (Reject Appeal) kèm lý do giải trình bắt buộc gửi về cho đội thi.
 *   5. Lọc đơn phúc khảo theo từng Sự kiện và Vòng thi tương ứng.
 * =========================================================================================
 */
export const CoordinatorAppealsView: React.FC = () => {
  // -------------------------------------------------------------------------
  // [BƯỚC 1]: KẾT NỐI VỚI VIEWMODEL (MVVM PATTERN)
  // Bóc tách toàn bộ state xử lý form, modal và mutation sang useCoordinatorAppealsViewModel
  // -------------------------------------------------------------------------
  const { state, data, pagination, actions } = useCoordinatorAppealsViewModel();

  // State quản trị form, modal duyệt/từ chối và thông báo
  const {
    selectedEventId,
    eventId,
    roundId,
    selectedAppealId,
    assignedJudgeId,
    rejectReason,
    rejectingAppealId,
    isSubmitting,
    successMessage,
    errorMessage,
  } = state;

  // Dữ liệu danh sách truy vấn từ Backend (Sự kiện, Vòng thi, Giám khảo, Đơn phúc khảo)
  const { eventsList, rounds, judges, teamNameById, appeals, displayAppeals, isLoading } = data;
  
  // Phân trang danh sách đơn phúc khảo
  const { paginatedItems: paginatedAppeals, currentPage, totalPages, totalItems, pageSize, setCurrentPage, setPageSize } = pagination;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0e10] text-[#e1e7ec] font-sans selection:bg-[#8b5cf6] selection:text-white">
      <div className="flex-1 p-6 space-y-6 max-w-[1500px] w-full mx-auto">
        
        {/* =====================================================================
            KHỐI 1: THANH ĐIỀU HƯỚNG & LÀM MỚI (TOP NAVIGATION)
            ===================================================================== */}
        <div className="flex items-center justify-between">
          <Link href={`/coordinator/submissions${selectedEventId ? `?eventId=${selectedEventId}` : ""}`} className="text-xs font-mono text-[#8a9ba8] hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>QUAY LẠI QUẢN LÝ BÀI NỘP</span>
          </Link>
          <Button
            variant="ghost"
            onClick={() => actions.refetch()}
            className="text-xs font-mono text-[#8a9ba8] hover:text-white flex items-center gap-1 border border-[#263339]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>LÀM MỚI</span>
          </Button>
        </div>

        {/* =====================================================================
            KHỐI 2: BỘ LỌC SỰ KIỆN & VÒNG THI (FILTER BAR)
            ===================================================================== */}
        <div className="bg-[#13191c] p-4 border border-[#263339] flex flex-col sm:flex-row sm:items-center gap-4 font-mono text-xs">
          {/* Lọc Sự kiện */}
          <div className="flex items-center gap-3 flex-1">
            <Filter className="w-4 h-4 text-[#8b5cf6] shrink-0" />
            <span className="text-[#8b5cf6] font-bold uppercase tracking-wider shrink-0">SỰ KIỆN:</span>
            <div className="relative flex-1 max-w-md">
              <select
                value={eventId}
                onChange={(e) => {
                  actions.setSelectedEventId(e.target.value);
                  actions.setSelectedRoundId("");
                }}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#8b5cf6]"
              >
                <option value="">-- Chọn sự kiện --</option>
                {eventsList.map((ev: any, idx: number) => {
                  const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-${idx}`;
                  return (
                    <option key={id} value={id}>
                      {ev.eventName || ev.EventName} ({ev.season || ev.Season} {ev.year || ev.Year})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Lọc Vòng thi */}
          <div className="flex items-center gap-3 flex-1">
            <span className="text-[#8b5cf6] font-bold uppercase tracking-wider shrink-0">VÒNG THI:</span>
            <div className="relative flex-1 max-w-md">
              <select
                value={roundId}
                onChange={(e) => actions.setSelectedRoundId(e.target.value)}
                disabled={!eventId || rounds.length === 0}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-semibold cursor-pointer appearance-none focus:outline-none focus:border-[#8b5cf6] disabled:opacity-40"
              >
                <option value="">-- Chọn vòng thi --</option>
                {rounds.map((r: any, idx: number) => {
                  const id = r.id || r.Id || `round-${idx}`;
                  return (
                    <option key={id} value={id}>
                      {r.roundName || r.RoundName}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8a9ba8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tiêu đề trang */}
        <div className="border-b border-[#263339] pb-4">
          <h1 className="font-mono font-bold text-2xl md:text-3xl text-[#e1e7ec] uppercase tracking-wider">
            HÀNG ĐỢI XỬ LÝ PHÚC KHẢO
          </h1>
          <p className="font-sans text-xs text-[#8a9ba8] mt-1">
            Tiếp nhận và giải quyết khiếu nại điểm số từ các đội thi trong vòng thi đã chọn.
          </p>
        </div>

        {/* Thông báo Alert */}
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

        {/* =====================================================================
            KHỐI 3: BẢNG HÀNG ĐỢI ĐƠN PHÚC KHẢO (APPEALS QUEUE TABLE)
            ===================================================================== */}
        <div className="bg-[#13191c] border border-[#263339]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#263339] text-[#8a9ba8] tracking-wider text-[11px] bg-[#0a0e10]">
                  <th className="p-4 w-36">MÃ BÀI NỘP</th>
                  <th className="p-4">LÝ DO KHIẾU NẠI</th>
                  <th className="p-4 w-44">THỜI GIAN</th>
                  <th className="p-4 w-36">TRẠNG THÁI</th>
                  <th className="p-4 w-44 text-right pr-6">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263339]">
                {!roundId ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#8a9ba8]">
                      Chọn sự kiện và vòng thi để xem đơn phúc khảo.
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#8a9ba8]">
                      Đang tải danh sách đơn phúc khảo...
                    </td>
                  </tr>
                ) : appeals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#8a9ba8]">
                      Chưa có đơn phúc khảo nào cho vòng thi này.
                    </td>
                  </tr>
                ) : (
                  // 👉 Render từng đơn phúc khảo của các đội thi
                  paginatedAppeals.map((apl) => {
                    const team = teamNameById.get(apl.teamId) || apl.teamId;
                    const isPending = apl.status === AppealStatus.Pending;

                    return (
                      <tr key={apl.id} className="hover:bg-[#182024] transition-colors">
                        {/* Cột 1: Mã bài nộp + Tên đội thi */}
                        <td className="p-4 text-[#8b5cf6] font-bold">
                          #{apl.submitResultId}
                          <div className="text-[10px] text-[#8a9ba8] font-normal mt-0.5 truncate max-w-[8rem]">{team}</div>
                        </td>

                        {/* Cột 2: Lý do khiếu nại do đội trưởng gửi lên */}
                        <td className="p-4 text-[#8a9ba8] truncate max-w-xs">{apl.reason}</td>

                        {/* Cột 3: Thời gian gửi đơn */}
                        <td className="p-4 text-[#8a9ba8]">
                          {apl.createdTime ? new Date(apl.createdTime).toLocaleString("vi-VN") : "—"}
                        </td>

                        {/* Cột 4: Trạng thái (Chờ xử lý / Đã duyệt / Đã từ chối) */}
                        <td className="p-4">
                          <span className={`font-semibold text-[10px] ${isPending ? "text-[#f59e0b]" : apl.status === 1 ? "text-emerald-400" : "text-[#ef4444]"}`}>
                            {isPending ? "[ CHỜ XỬ LÝ ]" : apl.status === 1 ? "[ ĐÃ DUYỆT ]" : "[ ĐÃ TỪ CHỐI ]"}
                          </span>
                        </td>

                        {/* Cột 5: NÚT THAO TÁC CỦA EC (DUYỆT HOẶC TỪ CHỐI) */}
                        <td className="p-4 text-right pr-6">
                          {isPending && (
                            <div className="flex items-center justify-end gap-2">
                              {/* Nút mở popup Duyệt đơn & Phân công giám khảo */}
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => actions.setSelectedAppealId(apl.id)}
                                className="px-3.5 py-1.5 bg-[#8b5cf6] text-white hover:bg-purple-600 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>DUYỆT</span>
                              </button>

                              {/* Nút mở popup Từ chối đơn & Nhập lý do */}
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => actions.setRejectingAppealId(apl.id)}
                                className="px-3.5 py-1.5 border border-[#ef4444] text-[#ef4444] hover:bg-red-500/10 font-mono text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>TỪ CHỐI</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang danh sách đơn */}
          {displayAppeals.length > 0 && (
            <div className="p-4 border-t border-[#263339]">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="đơn phúc khảo"
              />
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          KHỐI 4: MODAL DUYỆT ĐƠN & PHÂN CÔNG GIÁM KHẢO CHẤM LẠI
          ===================================================================== */}
      {selectedAppealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13191c] border border-[#263339] p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-[#8b5cf6] font-mono font-bold text-xs uppercase">
              <UserPlus className="w-4 h-4" />
              <span>Duyệt đơn &amp; Phân công Giám khảo chấm lại</span>
            </div>
            <p className="text-xs text-[#e1e7ec] font-sans">
              Đơn phúc khảo sẽ được phê duyệt. Chọn Giám khảo phụ trách chấm lại bài nộp (tuỳ chọn):
            </p>
            <div className="space-y-1 font-mono text-xs">
              <label className="text-[#8a9ba8]">Giám khảo chấm lại:</label>
              <select
                value={assignedJudgeId}
                onChange={(e) => actions.setAssignedJudgeId(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-xs focus:border-[#8b5cf6] outline-none cursor-pointer"
              >
                <option value="">-- Không gán lại (giữ giám khảo cũ) --</option>
                {judges.map((j: any) => {
                  const id = j.id || j.Id || j.eventRoleId || j.EventRoleId;
                  const name = j.user?.fullName || j.User?.FullName || j.fullName || j.email || "Giám khảo";
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
              {judges.length === 0 && (
                <p className="text-[10px] text-[#8a9ba8]">Chưa có giám khảo nào được gán cho sự kiện này.</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => actions.setSelectedAppealId(null)}
                className="px-4 py-2 border border-[#263339] text-[#8a9ba8] hover:text-white font-mono text-xs cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={actions.handleApproveAppeal}
                className="px-4 py-2 bg-[#8b5cf6] text-white hover:bg-purple-600 font-mono text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "ĐANG DUYỆT..." : "XÁC NHẬN DUYỆT"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          KHỐI 5: MODAL TỪ CHỐI ĐƠN PHÚC KHẢO & NHẬP GIẢI TRÌNH
          ===================================================================== */}
      {rejectingAppealId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#13191c] border border-[#263339] p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-red-400 font-mono font-bold text-xs uppercase">
              <X className="w-4 h-4" />
              <span>Từ chối đơn phúc khảo</span>
            </div>
            <div className="space-y-1 font-mono text-xs">
              <label className="text-[#8a9ba8]">Lý do từ chối phúc khảo (bắt buộc):</label>
              <textarea
                rows={3}
                required
                placeholder="Nhập lý do từ chối đơn khiếu nại (ví dụ: Đơn nộp quá hạn, bài thi đã chấm đúng thang điểm)..."
                value={rejectReason}
                onChange={(e) => actions.setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0e10] border border-[#263339] text-[#e1e7ec] font-mono text-xs focus:border-red-400 outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  actions.setRejectingAppealId(null);
                  actions.setRejectReason("");
                }}
                className="px-4 py-2 border border-[#263339] text-[#8a9ba8] hover:text-white font-mono text-xs cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={actions.handleRejectAppeal}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-mono text-xs font-bold cursor-pointer flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "ĐANG TỪ CHỐI..." : "XÁC NHẬN TỪ CHỐI"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
