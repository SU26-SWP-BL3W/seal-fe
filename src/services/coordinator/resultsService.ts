/**
 * Results & Publishing Domain Service
 * Pure business logic for score calculation, prize payload creation, and CSV export.
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
   * Export final results to a CSV file and trigger browser download with UTF-8 BOM.
   */
  exportResultsToCsv(options: ResultExportOptions): void {
    const { results, eventName, roundName, trackName, teamNameById, availablePrizes, assignedPrizesMap } = options;
    if (!results || results.length === 0) {
      throw new Error("Chưa có dữ liệu bảng điểm kết quả để xuất file!");
    }

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

    const rows = results.map((r, idx) => {
      const rankStr = String(r.rank || idx + 1);
      const name = teamNameById.get(r.teamId || "") || r.teamName || r.TeamName || r.teamId || "Đội thi";
      const uid = `KQ-${(r.id || "").slice(0, 8).toUpperCase()}`;
      const score = Number(r.finalScore || r.totalScore || r.TotalScore || 0).toFixed(2);
      const isAdv = r.isAdvanced !== undefined ? Boolean(r.isAdvanced) : idx < 2;
      const statusStr = isAdv ? "THĂNG HẠNG" : "BỊ LOẠI";

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

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    const safeEventName = eventName.replace(/[^a-zA-Z0-9_-]/g, "_");
    const safeRoundName = roundName.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("download", `Ket_Qua_${safeEventName}_${safeRoundName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Builds the congratulatory notification payload when a prize is assigned.
   */
  buildPrizeNotificationPayload(teamName: string, prizeName: string, eventName: string) {
    return {
      title: "THƯ CHÚC MỪNG ĐẠT GIẢI THƯỞNG SỰ KIỆN",
      message: `Nhiệt liệt chúc mừng Đội "${teamName}" đã xuất sắc đạt ${prizeName} tại sự kiện "${eventName}"! Ban Tổ Chức xin chúc mừng thành tích rực rỡ của toàn đội!`,
      type: "success" as const,
    };
  },

  /**
   * Builds the official publication notification payload.
   */
  buildPublishNotificationPayload(roundName: string, eventName: string) {
    return {
      title: "Công bố kết quả chính thức!",
      message: `Ban Tổ Chức đã chính thức công bố bảng điểm & xếp hạng cho Vòng thi "${roundName}" sự kiện "${eventName}". Hãy kiểm tra Bảng xếp hạng ngay!`,
      type: "success" as const,
    };
  },
};
