/**
 * =========================================================================================
 * DOMAIN SERVICE: resultsService
 * TẦNG KIẾN TRÚC: Business Service / Domain Service
 * MÔ TẢ:
 *   Chứa pure business logic xử lý kết quả thi, định dạng và xuất file CSV báo cáo bảng điểm,
 *   tạo payload thông báo chúc mừng đạt giải và thông báo công bố bảng điểm chính thức.
 * =========================================================================================
 */

/**
 * Interface đại diện cho 1 dòng dữ liệu kết quả đội thi cần xuất báo cáo
 */
export interface ExportResultItem {
  id?: string;
  rank?: number | string;
  teamId?: string;
  teamName?: string;
  TeamName?: string;
  finalScore?: number | string;
  totalScore?: number | string;
  TotalScore?: number | string;
  isAdvanced?: boolean;
  prizeId?: string | null;
}

/**
 * Interface cấu hình tùy chọn khi xuất file CSV
 */
export interface ResultExportOptions {
  results: ExportResultItem[];
  eventName: string;
  roundName: string;
  trackName: string;
  teamNameById: Map<string, string>;
  availablePrizes: Array<{ id: string; name: string }>;
  assignedPrizesMap: Record<string, string>;
}

export const resultsService = {
  /**
   * =====================================================================================
   * HÀM: exportResultsToCsv
   * CHỨC NĂNG:
   *   1. Nhận danh sách kết quả xếp hạng từ ViewModel.
   *   2. Format các cột (Hạng, Tên đội, Tổng điểm, Kết quả thăng hạng, Giải thưởng gán...).
   *   3. Đính kèm tiền tố UTF-8 BOM ("\uFEFF") để Microsoft Excel hiển thị đúng tiếng Việt có dấu.
   *   4. Tự động kích hoạt trình duyệt tải xuống file `.csv`.
   * =====================================================================================
   */
  exportResultsToCsv(options: ResultExportOptions): void {
    const { results, eventName, roundName, trackName, teamNameById, availablePrizes, assignedPrizesMap } = options;
    
    // Kiểm tra tính hợp lệ của dữ liệu trước khi xuất
    if (!results || results.length === 0) {
      throw new Error("Chưa có dữ liệu bảng điểm kết quả để xuất file!");
    }

    // Tiêu đề các cột trong file CSV
    const headers = [
      "Hạng",
      "Tên Đội Thi",
      "Mã Kết Quả",
      "Tổng Điểm",
      "Kết Quả",
      "Giải Thưởng Gán",
      "Hạng Mục (Track)",
      "Vòng Thi",
      "Sự Kiện",
      "Ngày Xuất",
    ];

    // Map từng dòng dữ liệu từ Object sang chuỗi CSV (xử lý escape dấu ngoặc kép "")
    const rows = results.map((r, idx) => {
      const rankStr = String(r.rank || idx + 1);
      const name = teamNameById.get(r.teamId || "") || r.teamName || r.TeamName || r.teamId || "Đội thi";
      const uid = `KQ-${(r.id || "").slice(0, 8).toUpperCase()}`;
      const score = Number(r.finalScore || r.totalScore || r.TotalScore || 0).toFixed(2);
      const isAdv = r.isAdvanced !== undefined ? Boolean(r.isAdvanced) : idx < 2;
      const statusStr = isAdv ? "THĂNG HẠNG" : "BỊ LOẠI";

      // Tra cứu tên giải thưởng đã gán cho đội
      const assignedPrizeId = assignedPrizesMap[r.id || ""] ?? r.prizeId ?? "none";
      const prizeObj = availablePrizes.find((p) => p.id === assignedPrizeId);
      const prizeStr = prizeObj ? prizeObj.name : "Không";

      return [
        rankStr,
        `"${name.replace(/"/g, '""')}"`,
        `"${uid}"`,
        score,
        `"${statusStr}"`,
        `"${prizeStr.replace(/"/g, '""')}"`,
        `"${trackName.replace(/"/g, '""')}"`,
        `"${roundName.replace(/"/g, '""')}"`,
        `"${eventName.replace(/"/g, '""')}"`,
        `"${new Date().toLocaleDateString("vi-VN")}"`,
      ].join(",");
    });

    // Ghép UTF-8 Byte Order Mark (\uFEFF) + Header + Rows
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    // Chuẩn hóa tên file an toàn (bỏ ký tự đặc biệt)
    const safeEventName = eventName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeRoundName = roundName.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("download", `Ket_Qua_${safeEventName}_${safeRoundName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * =====================================================================================
   * HÀM: buildPrizeNotificationPayload
   * CHỨC NĂNG:
   *   Tạo nội dung thông báo chúc mừng gửi tới tài khoản thành viên khi Đội thi được trao giải.
   * =====================================================================================
   */
  buildPrizeNotificationPayload(teamName: string, prizeName: string, eventName: string) {
    return {
      title: "THƯ CHÚC MỪNG ĐẠT GIẢI THƯỞNG SỰ KIỆN",
      message: `Nhiệt liệt chúc mừng Đội "${teamName}" đã xuất sắc đạt ${prizeName} tại sự kiện "${eventName}"! Ban Tổ Chức xin chúc mừng thành tích rực rỡ của toàn đội!`,
      type: "success" as const,
    };
  },

  /**
   * =====================================================================================
   * HÀM: buildPublishNotificationPayload
   * CHỨC NĂNG:
   *   Tạo nội dung thông báo đẩy toàn hệ thống khi Điều phối viên (EC) công bố điểm chính thức.
   * =====================================================================================
   */
  buildPublishNotificationPayload(roundName: string, eventName: string) {
    return {
      title: "Công bố kết quả chính thức!",
      message: `Ban Tổ Chức đã chính thức công bố bảng điểm & xếp hạng cho Vòng thi "${roundName}" sự kiện "${eventName}". Hãy kiểm tra Bảng xếp hạng ngay!`,
      type: "success" as const,
    };
  },
};
