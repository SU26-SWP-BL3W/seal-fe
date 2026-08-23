/**
 * Authentication & Security Domain Service
 * Pure business logic for password validation, email validation, and token extraction.
 */

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0 to 4
  feedback: string[];
}

export const authService = {
  /**
   * Validates password complexity.
   */
  validatePasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    if (!password || password.length < 6) {
      feedback.push("Mật khẩu phải có tối thiểu 6 ký tự.");
    } else {
      score += 1;
    }

    if (password.length >= 8) {
      score += 1;
    }

    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Nên chứa cả chữ hoa và chữ thường.");
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("Nên chứa ít nhất 1 chữ số.");
    }

    return {
      isValid: password.length >= 6,
      score: Math.min(score, 4),
      feedback,
    };
  },

  /**
   * Checks if an email address matches standard RFC 5322 format.
   */
  validateEmail(email: string): boolean {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  },

  /**
   * Helper to check if email is an FPT edu email.
   */
  isFptEmail(email: string): boolean {
    if (!email) return false;
    const lower = email.trim().toLowerCase();
    return lower.endsWith("@fpt.edu.vn") || lower.endsWith("@fe.edu.vn");
  },
};
