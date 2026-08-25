/**
 * =========================================================================================
 * DOMAIN SERVICE: calibrationService
 * TẦNG KIẾN TRÚC: Business Service / Domain Service
 * MÔ TẢ:
 *   Chứa pure business logic xử lý ma trận hiệu chuẩn điểm số của Hội đồng Giám khảo (Judge Calibration),
 *   tính toán tỷ lệ hoàn tất chấm bài (Realtime Progress), kiểm tra tổng trọng số tiêu chí (100%),
 *   và xuất file CSV ẩn danh phục vụ nghiên cứu & đối soát.
 * =========================================================================================
 */

/**
 * Interface biểu diễn 1 cặp phiếu chấm giữa Giám khảo và Bài nộp của Đội thi
 */
export interface CalibrationScorePair {
  isSubmitted?: boolean;
  IsSubmitted?: boolean;
  score?: number;
  judgeId?: string;
  submitResultId?: string;
}

/**
 * Interface kết quả thống kê tiến độ chấm điểm
 */
export interface CalibrationProgressResult {
  totalPairs: number;        // Tổng số lượt chấm phân công
  submittedPairs: number;    // Số phiếu đã được giám khảo chốt điểm chính thức
  pendingPairs: number;      // Số phiếu còn ở trạng thái nháp (Draft) hoặc chưa chấm
  progressPercent: number;   // Phần trăm hoàn tất (0 - 100%)
  isCompleted: boolean;      // Cờ báo hiệu 100% giám khảo đã hoàn tất chốt điểm
}

/**
 * Interface cấu hình tiêu chí chấm điểm (Rubric Criteria)
 */
export interface CriteriaConfigItem {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  description: string;
}

export const calibrationService = {
  /**
   * =====================================================================================
   * HÀM: calculateProgress
   * CHỨC NĂNG:
   *   Tính toán thống kê tỷ lệ hoàn tất nộp phiếu chấm điểm của Giám khảo trong một Hạng mục.
   *   Được dùng bởi HUD Realtime Monitoring trên giao diện EC để cảnh báo trước khi công bố.
   * =====================================================================================
   */
  calculateProgress(scores: CalibrationScorePair[], isCompletedFlag = false): CalibrationProgressResult {
    const list = scores || [];
    const totalPairs = list.length;
    
    // Đếm số phiếu mà Giám khảo đã bấm "Chốt điểm" (IsSubmitted = true)
    const submittedPairs = list.filter((s) => Boolean(s.isSubmitted ?? s.IsSubmitted)).length;
    
    // Số phiếu chưa chốt
    const pendingPairs = Math.max(0, totalPairs - submittedPairs);
    
    // Phần trăm tiến độ làm tròn
    const progressPercent = totalPairs > 0 ? Math.round((submittedPairs / totalPairs) * 100) : 0;

    return {
      totalPairs,
      submittedPairs,
      pendingPairs,
      progressPercent,
      isCompleted: isCompletedFlag || (totalPairs > 0 && submittedPairs === totalPairs),
    };
  },

  /**
   * =====================================================================================
   * HÀM: downloadAnonymizedCsvBlob
   * CHỨC NĂNG:
   *   Tải xuống dữ liệu ma trận điểm đã ẩn danh danh tính thí sinh/giám khảo để phân tích đối soát.
   * =====================================================================================
   */
  downloadAnonymizedCsvBlob(blobData: BlobPart, eventId: string): void {
    if (!blobData) {
      throw new Error("Không có dữ liệu file CSV ẩn danh!");
    }
    const blob = new Blob([blobData], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SEAL_Scores_Anonymized_${eventId || "all"}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * =====================================================================================
   * HÀM: validateWeights
   * CHỨC NĂNG:
   *   Kiểm tra tính hợp lệ của bảng tiêu chí Rubric: Tổng trọng số (Weight) của tất cả tiêu chí
   *   BẮT BUỘC phải cộng lại tròn 100%.
   * =====================================================================================
   */
  validateWeights(criteriaList: CriteriaConfigItem[]): { isValid: boolean; totalWeight: number; error?: string } {
    const totalWeight = criteriaList.reduce((acc, c) => acc + (Number(c.weight) || 0), 0);
    if (totalWeight !== 100) {
      return {
        isValid: false,
        totalWeight,
        error: `Tổng trọng số các tiêu chí hiện tại là ${totalWeight}%, cần đạt chính xác 100%.`,
      };
    }
    return { isValid: true, totalWeight };
  },
};
