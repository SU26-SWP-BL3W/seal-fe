/**
 * Mentor Domain Service
 * Pure business logic for mentor guidance, milestone progress tracking, and feedback formatting.
 */

export interface TeamProgressMilestone {
  id: string;
  name: string;
  isCompleted: boolean;
  dueDate?: string;
  completionRate?: number;
}

export const mentorService = {
  /**
   * Calculates overall team progress percentage from deliverables and milestones.
   */
  calculateTeamProgress(milestones: TeamProgressMilestone[]): number {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.isCompleted).length;
    return Math.round((completed / milestones.length) * 100);
  },

  /**
   * Formats mentor feedback comment with timestamp and metadata.
   */
  formatMentorFeedback(mentorName: string, notes: string): string {
    const timestamp = new Date().toLocaleString("vi-VN");
    return `[Cố vấn: ${mentorName} - ${timestamp}]\n${notes.trim()}`;
  },
};
