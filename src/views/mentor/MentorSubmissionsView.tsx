"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMentorWorkspaceViewModel, useMentorSubmissionDetailViewModel } from "@/viewModels/mentor/useMentorWorkspaceViewModel";
import { Card, Button, Badge } from "@/components/ui";
import { useToast } from "@/providers/ToastProvider";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";
import {
  ChevronRight,
  Code,
  PlayCircle,
  Presentation,
  Copy,
  Check,
  BadgeCheck,
  Target,
  FolderGit2,
  FileText,
  GitFork,
  GitCommit,
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  Info,
  Send,
} from "lucide-react";

export function MentorSubmissionsView() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get("teamId") || "";
  const trackIdParam = searchParams.get("trackId") || "";

  const {
    myTracks,
    selectedTrackId,
    submissions,
    teamNameById,
    isLoading,
  } = useMentorWorkspaceViewModel();

  const currentTrackId = trackIdParam || selectedTrackId || (myTracks[0]?.id || myTracks[0]?.Id || "");
  const currentTrack = myTracks.find((t) => (t.id || t.Id) === currentTrackId);

  // Filter submissions by current team / track
  const filteredSubmissions = submissions.filter((s) => {
    const sTeamId = (s.teamId || s.TeamId || "") as string;
    if (teamIdParam) return sTeamId === teamIdParam;
    return true;
  });

  const [selectedSubId] = useState<string>("");
  const activeSubmission =
    filteredSubmissions.find((s) => (s.id || s.Id) === selectedSubId) || filteredSubmissions[0];

  const activeTeamId = (activeSubmission?.teamId || activeSubmission?.TeamId || teamIdParam) as string;
  const activeTeamName = teamNameById.get(activeTeamId) || `Đội #${activeTeamId || "---"}`;

  // Feedback ViewModel for active submission
  const { feedbacks, isLoading: isLoadingFeedbacks, createFeedback, deleteFeedback } =
    useMentorSubmissionDetailViewModel((activeSubmission?.id || activeSubmission?.Id) as string, activeTeamId);

  // Feedback form states
  const [feedbackContent, setFeedbackContent] = useState("");
  const [technicalAdvice, setTechnicalAdvice] = useState("");
  const [suggestedScore, setSuggestedScore] = useState<number | "">("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const copyToClipboard = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission) return;
    const subId = (activeSubmission.id || activeSubmission.Id) as string;
    if (!feedbackContent.trim()) {
      setErrorMsg("Vui lòng nhập nội dung nhận xét chuyên môn.");
      return;
    }
    setErrorMsg("");
    try {
      await createFeedback.mutateAsync({
        submitResultId: subId,
        data: {
          feedbackContent: feedbackContent.trim(),
          technicalAdvice: technicalAdvice.trim() || undefined,
          suggestedScore: typeof suggestedScore === "number" ? suggestedScore : undefined,
        },
      });
      toast.success("Đã gửi nhận xét và lời khuyên cho đội thi thành công!");
      pushSystemNotification({
        title: "Cố vấn đã gửi nhận xét bài thi",
        message: `Cố vấn chuyên môn đã gửi nhận xét và lời khuyên kỹ thuật cho bài thi của Đội "${activeTeamName}".`,
        type: "info",
      });
      setFeedbackContent("");
      setTechnicalAdvice("");
      setSuggestedScore("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Gửi nhận xét thất bại.";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!activeSubmission) return;
    const subId = (activeSubmission.id || activeSubmission.Id) as string;
    try {
      await deleteFeedback.mutateAsync({ submitResultId: subId, feedbackId });
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Xóa nhận xét thất bại.");
    }
  };

  const repoUrl = activeSubmission?.repoUrl || activeSubmission?.RepoUrl || activeSubmission?.submissionUrl || activeSubmission?.SubmissionUrl || "";
  const demoUrl = activeSubmission?.demoUrl || activeSubmission?.DemoUrl || "";
  const slideUrl = activeSubmission?.slideUrl || activeSubmission?.SlideUrl || "";
  const description = activeSubmission?.description || activeSubmission?.Description || "Chưa có mô tả chi tiết bài nộp.";

  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen p-6 flex flex-col">
      <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6">
        {/* Top Context Header */}
        <header className="w-full bg-surface-container-low border border-outline-variant p-5 rounded-lg">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 font-mono text-xs text-on-surface-variant mb-2">
            <span className="text-[#00d9ff] font-bold">[</span>
            <Link href="/mentor/tracks" className="hover:text-on-surface transition-colors">
              Bàn Làm Việc Cố Vấn
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{currentTrack?.trackName || currentTrack?.TrackName || "Hạng mục phụ trách"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>{activeTeamName}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-on-surface font-bold">Chi tiết bài nộp</span>
            <span className="text-[#00d9ff] font-bold">]</span>
          </div>

          {/* Title Row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 border-b border-outline-variant pb-3">
            <h1 className="font-display text-2xl md:text-3xl text-[#00d9ff] font-extrabold tracking-wider uppercase flex items-center gap-3">
              <span className="w-2 h-6 bg-[#00d9ff] inline-block rounded-xs" />
              CHI TIẾT BÀI NỘP CỦA ĐỘI
            </h1>
            <div className="font-mono text-xs flex items-center gap-2 border border-[#00d9ff]/30 px-3 py-1 rounded bg-[#00d9ff]/5 text-[#00d9ff]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d9ff] animate-pulse" />
              CHẾ ĐỘ XEM &amp; HỖ TRỢ CỐ VẤN
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20 font-mono text-xs text-[#2dd4bf] animate-pulse">
            Đang tải chi tiết bài nộp...
          </div>
        ) : !activeSubmission ? (
          <Card className="p-12 bg-surface-container-low border border-outline-variant text-center font-mono text-xs text-on-surface-variant">
            <Info className="w-8 h-8 mx-auto mb-2 text-on-surface-variant/60" />
            Chưa tìm thấy bài nộp cho đội thi này trong Hạng mục hiện tại.
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Bento Grid Canvas */}
            <div className="grid grid-cols-12 gap-4">
              {/* HUD Panel 1: Team Info (Col span 4) */}
              <div className="col-span-12 lg:col-span-4 bg-surface-container-high border border-outline-variant rounded-lg flex flex-col overflow-hidden">
                <div className="bg-surface-variant px-4 py-2 flex justify-between items-center border-b border-surface font-mono text-xs">
                  <span className="text-[#00d9ff] font-bold tracking-widest uppercase">THÔNG TIN ĐỘI THI</span>
                  <BadgeCheck className="w-4 h-4 text-on-surface-variant" />
                </div>
                <div className="p-5 flex-1 flex flex-col gap-5 font-mono text-xs">
                  <div>
                    <div className="text-[10px] text-on-surface-variant uppercase mb-1">Team Designation</div>
                    <div className="font-display text-xl font-bold text-on-surface">{activeTeamName}</div>
                  </div>

                  <div>
                    <div className="text-[10px] text-on-surface-variant uppercase mb-1">Track Assignment</div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-tertiary-container/10 border border-tertiary-container/30 text-tertiary-container rounded">
                      <Target className="w-3.5 h-3.5" />
                      {currentTrack?.trackName || currentTrack?.TrackName || "Hạng mục phụ trách"}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="text-[10px] text-on-surface-variant uppercase mb-2">Project Abstract</div>
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed bg-surface p-3 border border-outline-variant rounded">
                      {description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-outline-variant flex justify-between items-center text-[11px]">
                    <span className="text-on-surface-variant">SUBMISSION ID:</span>
                    <span className="px-2 py-0.5 bg-surface border border-outline-variant rounded text-on-surface font-bold">
                      {(activeSubmission.id || activeSubmission.Id || "SUB").substring(0, 10)}
                    </span>
                  </div>
                </div>
              </div>

              {/* HUD Panel 2: Submission URLs & Content (Col span 8) */}
              <div className="col-span-12 lg:col-span-8 bg-surface-container-high border border-outline-variant rounded-lg flex flex-col overflow-hidden">
                <div className="bg-surface-variant px-4 py-2 flex justify-between items-center border-b border-surface font-mono text-xs">
                  <span className="text-[#00d9ff] font-bold tracking-widest uppercase">/ SUBMISSION ARTIFACTS</span>
                  <FolderGit2 className="w-4 h-4 text-on-surface-variant" />
                </div>

                <div className="p-5 flex flex-col gap-4 flex-1">
                  {/* Artifact Links */}
                  <div className="flex flex-col gap-3 font-mono text-xs">
                    {/* Repository URL */}
                    <div className="flex items-stretch bg-surface border border-outline-variant rounded overflow-hidden group">
                      <div className="w-12 bg-surface-variant flex items-center justify-center border-r border-outline-variant">
                        <Code className="w-4 h-4 text-on-surface-variant group-hover:text-[#00d9ff] transition-colors" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center px-4 py-2">
                        <span className="text-[9px] text-on-surface-variant uppercase font-bold">Source Repository</span>
                        <span className="text-[12px] text-on-surface truncate font-bold">
                          {repoUrl || "Chưa cung cấp repository URL"}
                        </span>
                      </div>
                      {repoUrl && (
                        <>
                          <button
                            onClick={() => copyToClipboard(repoUrl, "repo")}
                            className="w-10 flex items-center justify-center hover:bg-surface-variant text-on-surface-variant border-l border-outline-variant"
                            title="Sao chép liên kết"
                          >
                            {copiedField === "repo" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <a
                            href={repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 flex items-center justify-center hover:bg-[#00d9ff] hover:text-[#080f11] text-on-surface-variant border-l border-outline-variant transition-colors"
                            title="Mở liên kết"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>

                    {/* Live Demo URL */}
                    <div className="flex items-stretch bg-surface border border-outline-variant rounded overflow-hidden group">
                      <div className="w-12 bg-surface-variant flex items-center justify-center border-r border-outline-variant">
                        <PlayCircle className="w-4 h-4 text-on-surface-variant group-hover:text-[#00d9ff] transition-colors" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center px-4 py-2">
                        <span className="text-[9px] text-on-surface-variant uppercase font-bold">Live Demo Endpoint</span>
                        <span className="text-[12px] text-on-surface truncate font-bold">
                          {demoUrl || "Chưa cung cấp demo URL"}
                        </span>
                      </div>
                      {demoUrl && (
                        <>
                          <button
                            onClick={() => copyToClipboard(demoUrl, "demo")}
                            className="w-10 flex items-center justify-center hover:bg-surface-variant text-on-surface-variant border-l border-outline-variant"
                          >
                            {copiedField === "demo" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <a
                            href={demoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 flex items-center justify-center hover:bg-[#00d9ff] hover:text-[#080f11] text-on-surface-variant border-l border-outline-variant transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>

                    {/* Pitch Deck / Slide URL */}
                    <div className="flex items-stretch bg-surface border border-outline-variant rounded overflow-hidden group">
                      <div className="w-12 bg-surface-variant flex items-center justify-center border-r border-outline-variant">
                        <Presentation className="w-4 h-4 text-on-surface-variant group-hover:text-[#00d9ff] transition-colors" />
                      </div>
                      <div className="flex-1 flex flex-col justify-center px-4 py-2">
                        <span className="text-[9px] text-on-surface-variant uppercase font-bold">Pitch Deck / Slides</span>
                        <span className="text-[12px] text-on-surface truncate font-bold">
                          {slideUrl || "Chưa cung cấp slide URL"}
                        </span>
                      </div>
                      {slideUrl && (
                        <>
                          <button
                            onClick={() => copyToClipboard(slideUrl, "slide")}
                            className="w-10 flex items-center justify-center hover:bg-surface-variant text-on-surface-variant border-l border-outline-variant"
                          >
                            {copiedField === "slide" ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <a
                            href={slideUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-10 flex items-center justify-center hover:bg-[#00d9ff] hover:text-[#080f11] text-on-surface-variant border-l border-outline-variant transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Submission Notes Box */}
                  <div className="flex-1 bg-surface border border-outline-variant rounded flex flex-col">
                    <div className="px-3 py-2 border-b border-outline-variant flex items-center gap-2 bg-surface-variant/50 font-mono text-[11px]">
                      <FileText className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span className="text-on-surface-variant font-bold">GHI CHÚ BÀI NỘP</span>
                    </div>
                    <div className="p-4 font-mono text-xs text-on-surface-variant leading-relaxed overflow-y-auto max-h-40">
                      {description}
                    </div>
                  </div>
                </div>
              </div>

              {/* HUD Panel 3: System Status & Telemetry (Col span 12) */}
              <div className="col-span-12 bg-surface-container-high border border-outline-variant rounded-lg flex flex-col overflow-hidden font-mono text-xs">
                <div className="bg-surface-variant px-4 py-2 flex justify-between items-center border-b border-surface">
                  <span className="text-[#00d9ff] font-bold tracking-widest uppercase">
                    THÔNG TIN HỆ THỐNG &amp; TRẠNG THÁI NỘP BÀI
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#2dd4bf]">TRỰC TUYẾN</span>
                    <span className="w-2 h-2 rounded-full bg-[#00d9ff] animate-ping" />
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-surface border border-outline-variant rounded p-3 flex flex-col gap-1">
                    <div className="text-[9px] text-on-surface-variant uppercase">Host Provider</div>
                    <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <GitFork className="w-4 h-4 text-[#2dd4bf]" /> GITHUB
                    </div>
                  </div>

                  <div className="bg-surface border border-outline-variant rounded p-3 flex flex-col gap-1">
                    <div className="text-[9px] text-on-surface-variant uppercase">Submission Code</div>
                    <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <GitCommit className="w-4 h-4 text-amber-400" />
                      {(activeSubmission.id || activeSubmission.Id || "N/A").substring(0, 12)}
                    </div>
                  </div>

                  <div className="bg-surface border border-outline-variant rounded p-3 flex flex-col gap-1">
                    <div className="text-[9px] text-on-surface-variant uppercase">Submission Timestamp</div>
                    <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#00d9ff]" />
                      {activeSubmission.createdTime || activeSubmission.CreatedTime
                        ? new Date(activeSubmission.createdTime || activeSubmission.CreatedTime!).toLocaleString("vi-VN")
                        : "---"}
                    </div>
                  </div>

                  <div className="bg-surface border border-outline-variant rounded p-3 flex flex-col justify-center items-center gap-1">
                    <span className="text-[#00d9ff] font-bold text-xs">[ STATUS: NOMINAL ]</span>
                    <span className="text-[9px] text-on-surface-variant">API_CONN_ESTABLISHED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mentor Feedback Protocol Panel */}
            <div className="bg-surface-container-high border border-outline-variant rounded-lg p-5 font-mono text-xs space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#2dd4bf]" />
                  <h3 className="font-display text-base font-bold text-on-surface uppercase tracking-wider">
                    GÓP Ý &amp; PHẢN HỒI CỐ VẤN (MENTOR FEEDBACK PROTOCOL)
                  </h3>
                </div>
                <Badge tone="mentor">TOTAL: {feedbacks.length}</Badge>
              </div>

              {/* Feedback Form */}
              <form onSubmit={handleSendFeedback} className="bg-surface p-4 border border-[#2dd4bf]/30 rounded space-y-4">
                <div className="text-xs font-bold text-[#2dd4bf] flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> THÊM GÓP Ý CHUYÊN MÔN CHO ĐỘI THI
                </div>

                <div className="space-y-1.5">
                  <label className="text-on-surface font-semibold">
                    Nội dung nhận xét &amp; định hướng <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={feedbackContent}
                    onChange={(e) => setFeedbackContent(e.target.value)}
                    placeholder="Nhận xét về kiến trúc kĩ thuật, giải pháp, khả năng áp dụng thực tế..."
                    rows={3}
                    className="w-full bg-surface-container border border-outline-variant p-3 font-sans text-xs text-on-surface placeholder:text-on-surface-variant/50 rounded focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-on-surface font-semibold">Lời khuyên kỹ thuật / Công nghệ (Khuyên dùng)</label>
                    <input
                      type="text"
                      value={technicalAdvice}
                      onChange={(e) => setTechnicalAdvice(e.target.value)}
                      placeholder="VD: Nên dùng Redis cache, tối ưu Docker multi-stage..."
                      className="w-full bg-surface-container border border-outline-variant px-3 py-2 font-sans text-xs text-on-surface rounded focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-on-surface font-semibold">Điểm tham khảo (0-100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={suggestedScore}
                      onChange={(e) => setSuggestedScore(e.target.value ? Number(e.target.value) : "")}
                      placeholder="VD: 85"
                      className="w-full bg-surface-container border border-outline-variant px-3 py-2 font-mono text-xs text-on-surface rounded focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>
                </div>

                {errorMsg && <p className="text-red-400 text-xs font-bold">{errorMsg}</p>}

                <div className="flex justify-end pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    accent="mentor"
                    disabled={createFeedback.isPending}
                    className="text-xs py-2 px-5 font-bold"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {createFeedback.isPending ? "Đang gửi..." : "Gửi góp ý cho đội thi"}
                  </Button>
                </div>
              </form>

              {/* Feedback History List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                  Lịch sử góp ý của Cố vấn ({feedbacks.length})
                </div>

                {isLoadingFeedbacks ? (
                  <p className="text-on-surface-variant italic">Đang tải lịch sử góp ý...</p>
                ) : feedbacks.length === 0 ? (
                  <p className="text-on-surface-variant/70 italic">Chưa có nhận xét nào từ Cố vấn cho bài nộp này.</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {feedbacks.map((fb) => (
                      <div key={fb.id} className="p-4 bg-surface border border-outline-variant rounded space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge tone="mentor">Mentor: {fb.mentorName || "Cố vấn"}</Badge>
                            {fb.suggestedScore !== undefined && fb.suggestedScore !== null && (
                              <span className="text-[#00d9ff] font-bold">
                                Điểm gợi ý: {fb.suggestedScore}/100
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-on-surface-variant">
                              {new Date(fb.createdTime).toLocaleString("vi-VN")}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteFeedback(fb.id)}
                              disabled={deleteFeedback.isPending}
                              className="text-on-surface-variant hover:text-red-400 transition-colors p-1"
                              title="Xóa nhận xét này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="font-sans text-xs text-on-surface leading-relaxed">{fb.feedbackContent}</p>

                        {fb.technicalAdvice && (
                          <div className="p-2.5 bg-[#2dd4bf]/10 border border-[#2dd4bf]/30 text-[#2dd4bf] text-[11px] rounded">
                            Khuyên dùng: {fb.technicalAdvice}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
