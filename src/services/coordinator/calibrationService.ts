/**
 * Calibration Domain Service
 * Pure business logic for judge scoring variance, calibration progress, and anonymized research CSV export.
 */

export interface CalibrationScorePair {
  isSubmitted?: boolean;
  IsSubmitted?: boolean;
  score?: number;
  judgeId?: string;
  submitResultId?: string;
}

export interface CalibrationProgressResult {
  totalPairs: number;
  submittedPairs: number;
  pendingPairs: number;
  progressPercent: number;
  isCompleted: boolean;
}

export interface CriteriaConfigItem {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  description: string;
}

export const calibrationService = {
  /**
   * Calculates calibration completion statistics from score pairs.
   */
  calculateProgress(scores: CalibrationScorePair[], isCompletedFlag = false): CalibrationProgressResult {
    const list = scores || [];
    const totalPairs = list.length;
    const submittedPairs = list.filter((s) => Boolean(s.isSubmitted ?? s.IsSubmitted)).length;
    const pendingPairs = Math.max(0, totalPairs - submittedPairs);
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
   * Triggers download of anonymized research CSV blob.
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
   * Validates criteria weight distribution.
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
