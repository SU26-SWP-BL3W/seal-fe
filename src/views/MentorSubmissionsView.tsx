"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useMentorWorkspaceViewModel, useMentorSubmissionDetailViewModel } from "@/viewModels/useMentorWorkspaceViewModel";
import { encodeMentorFeedbackComment, parseMentorFeedbackComment } from "@/repositories/submitResultsRepository";
import { Card } from "@/components/ui";
import {
  Code,
  PlayCircle,
  Copy,
  Check,
  Target,
  MessageSquare,
  Plus,
  Trash2,
  Send,
  FileText,
} from "lucide-react";

export function MentorSubmissionsView() {
  const searchParams = useSearchParams();
  const teamIdParam = searchParams.get("teamId") || "";
  const trackIdParam = searchParams.get("trackId") || "";

  const {
    myTracks,
    selectedTrackId,
    submissions,
    teamNameById,
    isLoading,
    eventId: _eventId,
  } = useMentorWorkspaceViewModel();

  const currentTrackId = trackIdParam || selectedTrackId || (myTracks[0]?.id || myTracks[0]?.Id || "");
  const currentTrack = myTracks.find((t) => (t.id || t.Id) === currentTrackId);

  // Filter submissions by current team / track
  const filteredSubmissions = submissions.filter((s) => {
    const sTeamId = (s.teamId || s.TeamId || "") as string;
    if (teamIdParam) return sTeamId === teamIdParam;
    return true;
  });

  const [selectedSubId, setSelectedSubId] = useState<string>("");
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
  const [successMsg, setSuccessMsg] = useState("");

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
    setSuccessMsg("");
    try {
      await createFeedback.mutateAsync({
        submitResultId: subId,
        comment: encodeMentorFeedbackComment({
          text: feedbackContent.trim(),
          technicalAdvice: technicalAdvice.trim() || undefined,
          suggestedScore: typeof suggestedScore === "number" ? suggestedScore : undefined,
        }),
      });
      setFeedbackContent("");
      setTechnicalAdvice("");
      setSuggestedScore("");
      setSuccessMsg("Gửi góp ý chuyên môn thành công!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Gửi nhận xét thất bại.");
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
    <main className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans p-4 md:p-6 flex flex-col space-y-4">
      <div className="max-w-[1600px] w-full mx-auto space-y-4 flex-1 flex flex-col">

        {/* ── TẦNG 1: BREADCRUMB & HEADER ── */}
        <header className="bg-[#10171a] border border-zinc-800 p-4 hud-clipped flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm font-mono text-xs">
          <div className="space-y-1">
            <div className="text-zinc-400 flex flex-wrap items-center gap-2">
              <Link href={`/mentor/teams?trackId=${currentTrackId}`} className="text-zinc-400 hover:text-white font-bold transition-colors">
                [ &lt; QUAY LẠI DANH SÁCH ĐỘI ]
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-teal-400 font-bold uppercase">[ KHÔNG GIAN CỐ VẤN ]</span>
              <span className="text-zinc-600">/</span>
              <span className="text-white font-bold">{activeTeamName}</span>
            </div>
            <h1 className="font-display text-xl md:text-2xl text-white font-extrabold tracking-wider uppercase pt-1">
              CHI TIẾT BÀI NỘP &amp; KHÔNG GIAN CỐ VẤN
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-teal-300 bg-teal-950/50 px-3 py-1.5 border border-teal-500/40 hud-clipped font-bold">
              [ CHẾ ĐỘ: CỐ VẤN CHUYÊN MÔN ]
            </div>
          </div>
        </header>

        {/* ── TẦNG 2: CHỌN BÀI NỘP NẾU CÓ NHIỀU BÀI ── */}
        {filteredSubmissions.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 bg-[#10171a] p-3 border border-zinc-800 hud-clipped font-mono text-xs">
            <span className="text-zinc-400 uppercase font-bold mr-1">
              [ CHỌN BÀI NỘP ({filteredSubmissions.length}): ]
            </span>
            {filteredSubmissions.map((sub, idx) => {
              const subId = sub.id || sub.Id || "";
              const isSelected = (activeSubmission?.id || activeSubmission?.Id) === subId;
              const tId = (sub.teamId || sub.TeamId || "") as string;
              const tName = teamNameById.get(tId) || `Đội #${idx + 1}`;
              return (
                <button
                  key={subId || idx}
                  type="button"
                  onClick={() => setSelectedSubId(subId)}
                  className={`px-3 py-1 text-xs font-mono font-bold uppercase hud-clipped cursor-pointer transition-all border ${
                    isSelected
                      ? "bg-teal-500 text-black border-teal-500 font-extrabold"
                      : "bg-[#141f23] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600"
                  }`}
                >
                  [ {tName} {(sub as any).roundName || (sub as any).RoundName ? `(${(sub as any).roundName || (sub as any).RoundName})` : `#${idx + 1}`} ]
                </button>
              );
            })}
          </div>
        )}

        {/* ── TẦNG 3: NỘI DUNG BÀI THI & KHUNG GÓP Ý CỐ VẤN ── */}
        {isLoading ? (
          <div className="flex-1 bg-[#10171a] border border-zinc-800 p-12 text-center flex flex-col items-center justify-center font-mono text-xs text-teal-400 animate-pulse hud-clipped">
            [ ĐANG TẢI HỒ SƠ BÀI DỰ THI... ]
          </div>
        ) : !activeSubmission ? (
          <Card className="p-12 bg-[#10171a] border border-zinc-800 text-center font-mono text-xs text-zinc-400 hud-clipped">
            [ Chưa tìm thấy bài nộp cho đội thi này trong Hạng mục hiện tại ]
          </Card>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            
            {/* CỘT TRÁI (7 CỘT): HỒ SƠ BÀI THI & TÀI LIỆU */}
            <div className="lg:col-span-7 space-y-4 flex flex-col">
              
              {/* Card 1: Thông tin đội & Hạng mục */}
              <div className="bg-[#10171a] border border-zinc-800 p-5 space-y-3 hud-clipped shadow-sm font-mono text-xs">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-teal-400 font-bold uppercase">[ BÀI DỰ THI ĐỘI THI ]</span>
                  <span className="px-2 py-0.5 bg-[#090e11] border border-zinc-800 text-zinc-400 font-bold hud-clipped">
                    SUB-{String(activeSubmission.id || activeSubmission.Id || "SUB").substring(0, 6).toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Tên Đội Thi:</span>
                  <h2 className="font-display text-xl font-bold text-white uppercase">{activeTeamName}</h2>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block font-bold">Hạng Mục Phụ Trách:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-950/40 border border-teal-500/30 text-teal-300 font-bold hud-clipped">
                    <Target className="w-3.5 h-3.5" />
                    {currentTrack?.trackName || currentTrack?.TrackName || "Hạng mục phụ trách"}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">[ TÓM TẮT ĐỀ ÁN / GIẢI PHÁP ]</span>
                  <p className="font-sans text-xs text-zinc-300 leading-relaxed bg-[#090e11] p-3.5 border border-zinc-800/80 hud-clipped min-h-[80px]">
                    {description}
                  </p>
                </div>
              </div>

              {/* Card 2: Liên kết sản phẩm & Mã nguồn */}
              <div className="bg-[#10171a] border border-zinc-800 p-5 space-y-3 hud-clipped shadow-sm font-mono text-xs flex-1">
                <div className="text-cyan-400 font-bold uppercase border-b border-zinc-800 pb-2.5">
                  [ LIÊN KẾT MÃ NGUỒN ]
                </div>

                <div className="space-y-3">
                  {/* Repo URL */}
                  <div className="p-3 bg-[#090e11] border border-zinc-800 space-y-1.5 hud-clipped">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-teal-400" /> KHO MÃ NGUỒN (REPOSITORY)
                    </span>
                    {repoUrl ? (
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-cyan-300 text-xs truncate bg-[#141f23] px-2.5 py-1.5 border border-zinc-800">
                          {repoUrl}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(repoUrl, "repo")}
                          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold hud-clipped cursor-pointer"
                        >
                          {copiedField === "repo" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-white text-black text-[11px] font-bold uppercase hud-clipped transition-all cursor-pointer"
                        >
                          [ MỞ &gt; ]
                        </a>
                      </div>
                    ) : (
                      <span className="text-zinc-500 italic text-[11px] block">[ Đội thi chưa đính kèm link repository ]</span>
                    )}
                  </div>

                  {/* Demo URL */}
                  {demoUrl && (
                    <div className="p-3 bg-[#090e11] border border-zinc-800 space-y-1.5 hud-clipped">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-cyan-400" /> SẢN PHẨM TRỰC TUYẾN (LIVE DEMO)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-cyan-300 text-xs truncate bg-[#141f23] px-2.5 py-1.5 border border-zinc-800">
                          {demoUrl}
                        </span>
                        <a
                          href={demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-cyan-500 hover:bg-white text-black text-[11px] font-bold uppercase hud-clipped transition-all cursor-pointer"
                        >
                          [ MỞ &gt; ]
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Slide URL */}
                  {slideUrl && (
                    <div className="p-3 bg-[#090e11] border border-zinc-800 space-y-1.5 hud-clipped">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-400" /> SLIDE THUYẾT TRÌNH (PRESENTATION)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-amber-300 text-xs truncate bg-[#141f23] px-2.5 py-1.5 border border-zinc-800">
                          {slideUrl}
                        </span>
                        <a
                          href={slideUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-amber-500 hover:bg-white text-black text-[11px] font-bold uppercase hud-clipped transition-all cursor-pointer"
                        >
                          [ MỞ &gt; ]
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (5 CỘT): GÓP Ý & PHẢN HỒI CỐ VẤN */}
            <div className="lg:col-span-5 bg-[#10171a] border border-teal-500/40 p-5 space-y-4 hud-clipped shadow-sm flex flex-col justify-between font-mono text-xs">
              <div className="space-y-4">
                
                {/* Header Góp ý */}
                <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
                  <div className="flex items-center gap-2 text-teal-300 font-bold uppercase">
                    <MessageSquare className="w-4 h-4" />
                    <span>[ GÓP Ý &amp; PHẢN HỒI CỐ VẤN ]</span>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/30 text-[10px] font-bold hud-clipped">
                    {feedbacks.length} GÓP Ý
                  </span>
                </div>

                {/* Form gửi phản hồi */}
                <form onSubmit={handleSendFeedback} className="bg-[#090e11] p-4 border border-zinc-800 space-y-3 hud-clipped">
                  <div className="text-teal-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> THÊM GÓP Ý MỚI CHO ĐỘI THI
                  </div>

                  <div className="space-y-1 font-sans">
                    <label className="text-zinc-300 text-xs font-semibold block">
                      Nội dung nhận xét &amp; định hướng <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="Nhận xét về kiến trúc kĩ thuật, giải pháp, khả năng áp dụng thực tế..."
                      rows={3}
                      className="w-full bg-[#141f23] border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 hud-clipped focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="space-y-1 font-sans">
                    <label className="text-zinc-300 text-xs font-semibold block">
                      Lời khuyên kỹ thuật / Công nghệ đề xuất
                    </label>
                    <input
                      type="text"
                      value={technicalAdvice}
                      onChange={(e) => setTechnicalAdvice(e.target.value)}
                      placeholder="VD: Nên dùng Redis cache, tối ưu Docker multi-stage..."
                      className="w-full bg-[#141f23] border border-zinc-800 px-3 py-2 text-xs text-zinc-200 hud-clipped focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 text-xs font-semibold block font-sans">
                      Điểm tham khảo nội bộ (0 - 100)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={suggestedScore}
                      onChange={(e) => setSuggestedScore(e.target.value ? Number(e.target.value) : "")}
                      placeholder="VD: 85"
                      className="w-32 bg-[#141f23] border border-zinc-800 px-3 py-2 text-xs text-teal-300 font-bold font-mono hud-clipped focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  {errorMsg && <p className="text-red-400 font-bold text-xs">{errorMsg}</p>}
                  {successMsg && <p className="text-emerald-400 font-bold text-xs">[✓ {successMsg}]</p>}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={createFeedback.isPending}
                      className="px-4 py-2 bg-teal-500 hover:bg-white text-black font-bold uppercase text-xs transition-all cursor-pointer hud-clipped flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {createFeedback.isPending ? "[ ĐANG GỬI... ]" : "[ GỬI GÓP Ý CHO ĐỘI THI ]"}
                    </button>
                  </div>
                </form>

                {/* Danh sách lịch sử phản hồi */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                    [ LỊCH SỬ GÓP Ý CỦA CỐ VẤN ({feedbacks.length}) ]
                  </span>

                  {isLoadingFeedbacks ? (
                    <p className="text-zinc-500 italic">[ Đang tải lịch sử góp ý... ]</p>
                  ) : feedbacks.length === 0 ? (
                    <p className="text-zinc-500 italic p-3 bg-[#090e11] border border-zinc-800 text-center hud-clipped">
                      [ Chưa có nhận xét nào từ Cố vấn cho bài nộp này ]
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {feedbacks.map((fb) => {
                        const parsed = parseMentorFeedbackComment(fb.comment);
                        return (
                          <div key={fb.id} className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-2 hud-clipped">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold hud-clipped">
                                  {fb.mentorName || "Cố vấn"}
                                </span>
                                {parsed.suggestedScore !== undefined && (
                                  <span className="text-cyan-400 font-bold">
                                    Điểm gợi ý: {parsed.suggestedScore}/100
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500">
                                  {new Date(fb.createdTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFeedback(fb.id)}
                                  disabled={deleteFeedback.isPending}
                                  className="text-zinc-500 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                                  title="Xóa nhận xét này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <p className="font-sans text-xs text-zinc-200 leading-relaxed">{parsed.text}</p>

                            {parsed.technicalAdvice && (
                              <div className="p-2 bg-teal-950/40 border border-teal-500/30 text-teal-300 text-[11px] hud-clipped">
                                💡 <strong>Khuyên dùng:</strong> {parsed.technicalAdvice}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
