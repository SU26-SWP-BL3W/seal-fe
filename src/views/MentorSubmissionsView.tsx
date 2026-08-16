"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import {
  useGetSubmitResultsByTrack,
  useMentorFeedbacks,
  useCreateMentorFeedback,
  readApiError,
  type SubmitResultListItem,
} from "@/repositories/submitResultsRepository";
import {
  Users,
  MessageSquare,
  Send,
  Eye,
  RefreshCw,
  ExternalLink,
  Code,
  Globe,
  Presentation,
  CheckCircle2,
  FileText,
  Shield,
  Clock,
} from "lucide-react";

export function MentorSubmissionsView() {
  const { user, activeRole } = useAuth();
  const eventId = activeRole?.eventId || activeRole?.EventId || "";
  const mentorId = activeRole?.id || activeRole?.eventRoleId || user?.id || "";
  const assignedTrackId = activeRole?.trackId || activeRole?.TrackId || "";

  const { data: tracks = [], isLoading: loadingTracks } = useGetTracksByEvent(eventId || undefined);
  const trackOptions = useMemo(() => {
    const list = tracks
      .map((t) => ({
        id: t.id || t.Id || "",
        name: t.trackName || t.TrackName || "Hạng mục",
      }))
      .filter((t) => t.id);
    if (assignedTrackId) return list.filter((t) => t.id === assignedTrackId);
    return list;
  }, [tracks, assignedTrackId]);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const activeTrackId = selectedTrackId || trackOptions[0]?.id || "";

  const { data: submissions = [], isLoading: loadingSubs, refetch } =
    useGetSubmitResultsByTrack(activeTrackId, eventId);

  const [selectedSub, setSelectedSub] = useState<SubmitResultListItem | null>(null);

  // Form State
  const [feedbackContent, setFeedbackContent] = useState("");
  const [technicalAdvice, setTechnicalAdvice] = useState("");
  const [suggestedScore, setSuggestedScore] = useState<number | undefined>(undefined);
  const [submitError, setSubmitError] = useState("");
  const [submitOk, setSubmitOk] = useState("");

  const createFeedback = useCreateMentorFeedback();

  const handleSelectSubmission = (sub: SubmitResultListItem) => {
    setSelectedSub(sub);
    setFeedbackContent("");
    setTechnicalAdvice("");
    setSuggestedScore(undefined);
    setSubmitError("");
    setSubmitOk("");
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub || !mentorId) {
      setSubmitError("Thiếu thông tin bài nộp hoặc tài khoản Cố vấn.");
      return;
    }
    if (!feedbackContent.trim()) {
      setSubmitError("Vui lòng nhập nội dung góp ý chuyên môn.");
      return;
    }

    setSubmitError("");
    setSubmitOk("");

    const subId = selectedSub.id || selectedSub.Id || "";

    try {
      await createFeedback.mutateAsync({
        submitResultId: subId,
        data: {
          feedbackContent: feedbackContent.trim(),
          technicalAdvice: technicalAdvice.trim() || undefined,
          suggestedScore: suggestedScore !== undefined && !isNaN(suggestedScore) ? Number(suggestedScore) : undefined,
        },
      });
      setSubmitOk("✓ Đã gửi góp ý chuyên môn thành công!");
      setFeedbackContent("");
      setTechnicalAdvice("");
      setSuggestedScore(undefined);
    } catch (err) {
      setSubmitError(readApiError(err));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-xs text-[#bbc9ce]">
        Vui lòng đăng nhập với tài khoản Cố vấn (Mentor).
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-[#34d399] selection:text-[#002e1c]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Read-only / Mentor Access Banner (Stitch M3) */}
        <div className="bg-[#34d399]/10 border border-[#34d399] text-[#34d399] p-3 font-mono text-xs flex items-center justify-between shadow-[inset_0_0_8px_rgba(52,211,153,0.15)]">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">
              VIEW ONLY MODE // MENTOR TECHNICAL GUIDANCE STREAM
            </span>
          </div>
          <span className="text-[10px] opacity-80">KHÔNG CAN THIỆP ĐIỂM CHÍNH THỨC CỦA GIÁM KHẢO</span>
        </div>

        {/* Header Panel (Stitch M3) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-[#34d399] mb-1 uppercase tracking-wider">
              [ SUBMISSION_DATA_STREAM ]
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              Tiến Độ Bài Nộp — Đội:{" "}
              <span className="text-[#34d399] tracking-tight">
                {selectedSub ? (selectedSub.teamName || selectedSub.TeamName || "CHỌN BÀI THI") : "DANH SÁCH ĐỘI HỖ TRỢ"}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={activeTrackId}
              onChange={(e) => {
                setSelectedTrackId(e.target.value);
                setSelectedSub(null);
              }}
              className="bg-[#152238] border-b-2 border-[#34d399] text-white font-mono text-xs px-3 py-2 focus:outline-none"
            >
              {trackOptions.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#0e1417] text-white">
                  Track: {t.name}
                </option>
              ))}
            </select>
            <div className="font-mono text-xs text-[#34d399] border border-[#34d399] px-3 py-1.5 bg-[#34d399]/10 font-bold uppercase">
              [ ROLE: MENTOR ]
            </div>
          </div>
        </div>

        {/* Content Grid (Stitch M3) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-[1px] bg-white/10 border border-white/10 glow-box">
          {/* Left Column: Submissions in Track (4 cols) */}
          <div className="xl:col-span-4 bg-[#1a2123] p-4 flex flex-col gap-3">
            <div className="bg-[#34d399]/10 h-7 -mx-4 -mt-4 mb-2 flex items-center px-4 border-b border-[#34d399]/20 font-mono text-[11px] text-[#34d399] font-bold uppercase">
              DANH SÁCH BÀI NỘP CỦA ĐỘI ({submissions.length})
            </div>

            {loadingSubs ? (
              <div className="p-6 text-center font-mono text-xs text-[#34d399] animate-pulse">
                Đang tải bài nộp...
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-6 text-center font-mono text-xs text-[#859398]">
                Chưa có bài nộp nào trong Hạng mục này.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[600px]">
                {submissions.map((sub, idx) => {
                  const id = sub.id || sub.Id || idx;
                  const isSelected = selectedSub && (selectedSub.id || selectedSub.Id) === id;

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectSubmission(sub)}
                      className={`w-full p-3.5 text-left font-mono text-xs border transition-all ${
                        isSelected
                          ? "bg-[#34d399]/10 border-[#34d399] text-[#34d399] font-bold shadow-[0_0_10px_rgba(52,211,153,0.2)]"
                          : "bg-[#0e1417] border-[#3c494d] text-[#bbc9ce] hover:border-[#34d399]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs">{sub.teamName || sub.TeamName || `Đội thi #${idx + 1}`}</span>
                        <span className="text-[10px] px-1.5 py-0.2 border border-[#34d399]/30 text-[#34d399]">
                          {(sub as any).roundName || (sub as any).RoundName || "Vòng thi"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#859398] truncate">
                        {sub.repoUrl || sub.RepoUrl || sub.submissionUrl || "Bài nộp"}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Tactical Deck & Feedback Form (8 cols) */}
          <div className="xl:col-span-8 bg-[#1a2123] p-6 flex flex-col gap-6">
            {!selectedSub ? (
              <div className="p-16 text-center font-mono text-xs text-[#859398] space-y-3">
                <Users className="w-12 h-12 text-[#34d399]/40 mx-auto" />
                <p>Chọn một bài nộp ở danh sách bên trái để xem liên kết và gửi góp ý chuyên môn.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Tactical Grid (Stitch M3) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[#3c494d]/40 border border-[#3c494d]/40 font-mono text-xs">
                  {/* Round info */}
                  <div className="bg-[#0e1417] p-4 flex flex-col justify-center">
                    <span className="text-[10px] text-[#859398] uppercase mb-1">[ ROUND ]</span>
                    <span className="font-bold text-white">{(selectedSub as any).roundName || (selectedSub as any).RoundName || "Vòng Đang Thi"}</span>
                    <div className="mt-2 w-full h-1 bg-[#242b2d] rounded-full overflow-hidden">
                      <div className="h-full bg-[#34d399] w-3/4 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                    </div>
                  </div>

                  {/* Submission Date */}
                  <div className="bg-[#0e1417] p-4 flex flex-col justify-center">
                    <span className="text-[10px] text-[#859398] uppercase mb-1">[ TIME_LOGGED ]</span>
                    <span className="font-bold text-[#34d399]">
                      {selectedSub.createdTime || selectedSub.CreatedTime ? new Date(selectedSub.createdTime || selectedSub.CreatedTime || "").toLocaleString("vi-VN") : "—"}
                    </span>
                    <span className="text-[10px] text-[#859398] mt-1">STATUS: VERIFIED</span>
                  </div>

                  {/* Repo Link */}
                  <div className="bg-[#0e1417] p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#859398] uppercase block mb-1">[ REPOSITORY ]</span>
                      {(selectedSub.repoUrl || selectedSub.RepoUrl || selectedSub.submissionUrl) ? (
                        <a
                          href={selectedSub.repoUrl || selectedSub.RepoUrl || selectedSub.submissionUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#00d9ff] hover:underline flex items-center gap-1 text-[11px] truncate max-w-[160px]"
                        >
                          <Code className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{selectedSub.repoUrl || "Repo mã nguồn"}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[#859398]">Chưa cung cấp</span>
                      )}
                    </div>
                  </div>

                  {/* Demo Link */}
                  <div className="bg-[#0e1417] p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#859398] uppercase block mb-1">[ LIVE DEMO ]</span>
                      {(selectedSub.demoUrl || selectedSub.DemoUrl) ? (
                        <a
                          href={selectedSub.demoUrl || selectedSub.DemoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#f87171] hover:underline flex items-center gap-1 text-[11px] truncate max-w-[160px]"
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{selectedSub.demoUrl || "Live App / Video"}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[#859398]">Chưa cung cấp</span>
                      )}
                    </div>
                  </div>

                  {/* Slide Link */}
                  <div className="bg-[#0e1417] p-4 flex items-center justify-between md:col-span-2">
                    <div>
                      <span className="text-[10px] text-[#859398] uppercase block mb-1">[ DEBRIEF SLIDES ]</span>
                      {(selectedSub.slideUrl || selectedSub.SlideUrl) ? (
                        <a
                          href={selectedSub.slideUrl || selectedSub.SlideUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#fb923c] hover:underline flex items-center gap-1 text-[11px] truncate max-w-[320px]"
                        >
                          <Presentation className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{selectedSub.slideUrl || "Slide tài liệu"}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[#859398]">Chưa cung cấp</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Project Summary Decrypt Box (Stitch M3) */}
                <div className="bg-[#0e1417] border border-[#3c494d] p-4 font-mono text-xs">
                  <div className="text-[10px] text-[#34d399] mb-2 font-bold uppercase tracking-wider">
                    &gt; PROJECT_SUMMARY // DECRYPTED_STREAM
                  </div>
                  <p className="text-[#bbc9ce] whitespace-pre-line leading-relaxed">
                    {selectedSub.description || selectedSub.Description || "Không có tóm tắt bổ sung từ thí sinh."}
                  </p>
                </div>

                {/* Existing Feedbacks History */}
                <ExistingMentorFeedbackList submitResultId={selectedSub.id || selectedSub.Id || ""} />

                {/* 2-way Mentor Feedback Form */}
                <form onSubmit={handleSendFeedback} className="bg-[#080f11] border border-[#34d399]/40 p-6 glow-box space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#3c494d]/40 pb-2">
                    <span className="text-[#34d399] font-bold uppercase flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> GỬI LỜI KHUYÊN &amp; ĐÁNH GIÁ CHUYÊN MÔN
                    </span>
                    <span className="text-[10px] text-[#859398]">[ MENTOR // 2-WAY PROTOCOL ]</span>
                  </div>

                  <div>
                    <label className="block text-white uppercase mb-1 font-bold">
                      Nhận xét &amp; Góp ý kỹ thuật (Feedback Content) *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="Phân tích ưu nhược điểm kiến trúc, mã nguồn, UI/UX của bài thi..."
                      className="w-full input-cyber p-3 bg-[#152238] text-white border-b-2 border-[#3c494d] focus:border-[#34d399]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#859398] uppercase mb-1">
                        Lời khuyên khắc phục (Technical Advice)
                      </label>
                      <input
                        type="text"
                        value={technicalAdvice}
                        onChange={(e) => setTechnicalAdvice(e.target.value)}
                        placeholder="VD: Cần tối ưu query DB, refactor component..."
                        className="w-full input-cyber p-3 bg-[#152238] text-white border-b-2 border-[#3c494d] focus:border-[#34d399]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#859398] uppercase mb-1">
                        Điểm gợi ý (Suggested Score 0-100)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={suggestedScore ?? ""}
                        onChange={(e) => setSuggestedScore(e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="VD: 85"
                        className="w-full input-cyber p-3 bg-[#152238] text-white border-b-2 border-[#3c494d] focus:border-[#34d399]"
                      />
                    </div>
                  </div>

                  {submitError && <p className="text-[#ffb4ab] text-[11px]">{submitError}</p>}
                  {submitOk && <p className="text-[#34d399] text-[11px] font-bold">{submitOk}</p>}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={createFeedback.isPending}
                      className="bg-[#34d399] text-[#002e1c] font-display text-sm font-bold py-3 px-6 rounded-[12px] rounded-br-none hover:bg-white transition-all flex items-center gap-2 uppercase shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                    >
                      <Send className="w-4 h-4" />
                      {createFeedback.isPending ? "Đang truyền tải..." : "// GỬI LỜI KHUYÊN CHO ĐỘI (TRANSMIT_ADVICE) >"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExistingMentorFeedbackList({ submitResultId }: { submitResultId: string }) {
  const { data: feedbacks = [] } = useMentorFeedbacks(submitResultId);
  if (feedbacks.length === 0) return null;

  return (
    <div className="bg-[#0e1417] border border-[#34d399]/30 p-4 space-y-3 font-mono text-xs">
      <div className="text-[#34d399] font-bold uppercase flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        LỊCH SỬ GÓP Ý TRƯỚC ĐÂY ({feedbacks.length})
      </div>
      <div className="space-y-2">
        {feedbacks.map((fb) => (
          <div key={fb.id} className="p-3 bg-[#1a2123] border border-[#3c494d] space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white font-bold">{fb.mentorName || "Cố vấn"}</span>
              {fb.suggestedScore !== undefined && (
                <span className="text-[#fbbf24] font-bold">Điểm gợi ý: {fb.suggestedScore}/100</span>
              )}
            </div>
            <p className="font-sans text-xs text-[#bbc9ce]">"{fb.feedbackContent}"</p>
            {fb.technicalAdvice && (
              <p className="text-[11px] text-[#34d399]">💡 {fb.technicalAdvice}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
