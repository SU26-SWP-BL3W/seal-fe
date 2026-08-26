export interface SubmissionArtifactUrls {
  repoUrl: string;
  demoUrl: string;
  slideUrl: string;
}

/** Lấy 3 link nộp bài — repo fallback submissionUrl (tương thích bài cũ). */
export function getSubmissionArtifactUrls(sub: Record<string, unknown> | null | undefined): SubmissionArtifactUrls {
  if (!sub) return { repoUrl: "", demoUrl: "", slideUrl: "" };
  const repoUrl =
    String(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl || "").trim();
  const demoUrl = String(sub.demoUrl || sub.DemoUrl || "").trim();
  const slideUrl = String(sub.slideUrl || sub.SlideUrl || "").trim();
  return { repoUrl, demoUrl, slideUrl };
}

export function countSubmissionArtifactLinks(sub: Record<string, unknown> | null | undefined): number {
  const { repoUrl, demoUrl, slideUrl } = getSubmissionArtifactUrls(sub);
  return [repoUrl, demoUrl, slideUrl].filter(Boolean).length;
}

export function hasAnySubmissionArtifactLink(sub: Record<string, unknown> | null | undefined): boolean {
  return countSubmissionArtifactLinks(sub) > 0;
}
