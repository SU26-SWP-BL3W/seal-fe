/**
 * Submission Domain Service
 * Pure business logic for submission validation, URL checks, and deadlines.
 */

export const submissionService = {
  /**
   * Validates if a submission URL is a valid web URL or repository link.
   */
  validateSubmissionUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || !url.trim()) {
      return { isValid: false, error: "Vui lòng nhập đường dẫn liên kết bài nộp (URL)!" };
    }
    const trimmed = url.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { isValid: false, error: "Đường dẫn bài nộp phải bắt đầu bằng http:// hoặc https://" };
      }
    } catch {
      return { isValid: false, error: "Đường dẫn liên kết không đúng định dạng URL hợp lệ!" };
    }
    return { isValid: true };
  },

  /**
   * Verifies if the submission is submitted before the round deadline.
   */
  checkIsWithinDeadline(deadlineStr?: string | null, now = Date.now()): boolean {
    if (!deadlineStr) return true;
    const deadlineTime = new Date(deadlineStr).getTime();
    if (isNaN(deadlineTime)) return true;
    return now <= deadlineTime;
  },
};
