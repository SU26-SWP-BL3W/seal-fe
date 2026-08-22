/**
 * Scoring Domain Service
 * Pure business logic for judge scoring timeline evaluation, weighted sum calculation, bounds clamping, and draft storage.
 */

export interface ScoringTimelineContext {
  event?: { status?: boolean; endDate?: string } | null;
  round?: { startDate?: string; endDate?: string; submissionDeadline?: string; scoringStartDate?: string; scoringEndDate?: string; evaluationEndDate?: string } | null;
  track?: { endDate?: string; scoringStartDate?: string; scoringEndDate?: string } | null;
  now?: number;
}

export interface ScoringTimelineStatus {
  isEventEnded: boolean;
  isSubmissionStillOpen: boolean;
  isBeforeScoringTime: boolean;
  isScoringTimeExpired: boolean;
  isScoringLocked: boolean;
  lockReason?: string;
}

export interface CriteriaItem {
  id?: string;
  name?: string;
  maxScore?: number;
  weight?: number;
  description?: string;
}

const DRAFT_SCORE_PREFIX = "seal_judge_draft_score_";

export const scoringService = {
  /**
   * Evaluates the event & round timeline to determine if scoring is unlocked for judges.
   */
  evaluateScoringTimeline(context: ScoringTimelineContext): ScoringTimelineStatus {
    const { event, round, track, now = Date.now() } = context;

    const isEventEnded = Boolean(
      event && (event.status === false || (event.endDate && new Date(event.endDate).getTime() < now))
    );

    const submissionDeadlineStr = track?.endDate || round?.endDate || round?.submissionDeadline || event?.endDate;
    const scoringStartDateStr = track?.scoringStartDate || round?.scoringStartDate;
    const scoringEndDateStr = track?.scoringEndDate || round?.scoringEndDate || round?.evaluationEndDate || event?.endDate;

    const submissionDeadlineTime = submissionDeadlineStr ? new Date(submissionDeadlineStr).getTime() : null;
    const scoringStartTime = scoringStartDateStr ? new Date(scoringStartDateStr).getTime() : null;
    const scoringEndTime = scoringEndDateStr ? new Date(scoringEndDateStr).getTime() : null;

    const isSubmissionStillOpen = Boolean(
      !isEventEnded && submissionDeadlineTime && !isNaN(submissionDeadlineTime) && now <= submissionDeadlineTime
    );
    const isBeforeScoringTime = Boolean(
      !isEventEnded && !isSubmissionStillOpen && scoringStartTime && !isNaN(scoringStartTime) && now < scoringStartTime
    );
    const isScoringTimeExpired = Boolean(
      !isEventEnded && scoringEndTime && !isNaN(scoringEndTime) && now > scoringEndTime
    );

    const isScoringLocked = isEventEnded || isSubmissionStillOpen || isBeforeScoringTime || isScoringTimeExpired;

    let lockReason: string | undefined;
    if (isEventEnded) {
      lockReason = "Sự kiện đã kết thúc.";
    } else if (isSubmissionStillOpen) {
      lockReason = "Thời hạn nộp bài của thí sinh vẫn đang diễn ra. Bàn chấm điểm sẽ mở sau khi đóng cổng nộp.";
    } else if (isBeforeScoringTime) {
      lockReason = "Chưa đến thời gian bắt đầu chấm điểm theo lịch trình.";
    } else if (isScoringTimeExpired) {
      lockReason = "Thời hạn chấm điểm của giám khảo đã kết thúc.";
    }

    return {
      isEventEnded,
      isSubmissionStillOpen,
      isBeforeScoringTime,
      isScoringTimeExpired,
      isScoringLocked,
      lockReason,
    };
  },

  /**
   * Calculates total weighted score from rubric criteria and inputs.
   */
  calculateTotalScore(criteria: CriteriaItem[], scoreInputs: Record<string, number>): number {
    if (!criteria || criteria.length === 0) {
      return Object.values(scoreInputs).reduce((sum, v) => sum + (Number(v) || 0), 0);
    }

    let totalScore = 0;
    const hasWeights = criteria.some((c) => Number(c.weight) > 0);

    if (hasWeights) {
      for (const cr of criteria) {
        const crId = cr.id || "";
        const val = Number(scoreInputs[crId]) || 0;
        const max = Number(cr.maxScore) || 10;
        const weight = Number(cr.weight) || 0;
        // Percentage of max score scaled by weight percentage
        totalScore += (val / max) * weight;
      }
    } else {
      for (const cr of criteria) {
        const crId = cr.id || "";
        totalScore += Number(scoreInputs[crId]) || 0;
      }
    }

    return Math.round(totalScore * 100) / 100;
  },

  /**
   * Clamps a score between 0 and maxScore.
   */
  clampScore(val: number, maxScore = 10): number {
    if (isNaN(val)) return 0;
    return Math.max(0, Math.min(Number(val), maxScore));
  },

  /**
   * Saves draft scores locally.
   */
  saveDraft(submitResultId: string, judgeId: string, scores: Record<string, number>, comment: string): void {
    if (typeof window === "undefined" || !submitResultId) return;
    try {
      const key = `${DRAFT_SCORE_PREFIX}${judgeId}_${submitResultId}`;
      localStorage.setItem(key, JSON.stringify({ scores, comment, savedAt: new Date().toISOString() }));
    } catch (e) {
      console.warn("Could not save score draft to localStorage", e);
    }
  },

  /**
   * Loads draft scores locally.
   */
  loadDraft(submitResultId: string, judgeId: string): { scores: Record<string, number>; comment: string } | null {
    if (typeof window === "undefined" || !submitResultId) return null;
    try {
      const key = `${DRAFT_SCORE_PREFIX}${judgeId}_${submitResultId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Clears draft scores after successful API submission.
   */
  clearDraft(submitResultId: string, judgeId: string): void {
    if (typeof window === "undefined" || !submitResultId) return;
    try {
      const key = `${DRAFT_SCORE_PREFIX}${judgeId}_${submitResultId}`;
      localStorage.removeItem(key);
    } catch {}
  },
};
