"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMyTeam } from "@/repositories/teamsRepository";
import {
  useMySubmissions,
  useDeleteSubmission,
  useUpdateSubmission,
  useMentorFeedbacks,
  readApiError,
  type SubmitResultListItem,
} from "@/repositories/submitResultsRepository";
import {
  FolderOpen,
  Code,
  Globe,
  Presentation,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Scale,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export function MySubmissionsView() {
  const { user, loginAsDemoRole } = useAuth();
  const { data: teamResponse, isLoading: isLoadingTeam } = useMyTeam();
  const team = (teamResponse as any)?.team ?? teamResponse;

  const teamId = team?.id || team?.Id || "";
  const isLeader = team?.leaderId === user?.id || team?.LeaderId === user?.id;
  const isRegistered = team?.status === "Registered" || team?.status === "Approved";

  const { data: submissions = [], isLoading: isLoadingSubs, refetch } = useMySubmissions();

  // Edit Modal State
  const [editingSub, setEditingSub] = useState<SubmitResultListItem | null>(null);
  const [editRepo, setEditRepo] = useState("");
  const [editDemo, setEditDemo] = useState("");
  const [editSlide, setEditSlide] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editError, setEditError] = useState("");

  const updateMutation = useUpdateSubmission();
  const deleteMutation = useDeleteSubmission();

  const handleOpenEdit = (sub: SubmitResultListItem) => {
    setEditingSub(sub);
    setEditRepo(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl || "");
    setEditDemo(sub.demoUrl || sub.DemoUrl || "");
    setEditSlide(sub.slideUrl || sub.SlideUrl || "");
    setEditDesc(sub.description || sub.Description || "");
    setEditError("");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    const subId = editingSub.id || editingSub.Id || "";
    if (!editRepo.trim() || !editDemo.trim() || !editSlide.trim()) {
      setEditError("Vui lòng điền đủ 3 đường dẫn bắt buộc: Repo, Demo và Slide.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: subId,
        data: {
          RepoUrl: editRepo.trim(),
          DemoUrl: editDemo.trim(),
          SlideUrl: editSlide.trim(),
          SubmissionUrl: editRepo.trim(),
          Description: editDesc.trim(),
        },
      });
      setEditingSub(null);
      refetch();
    } catch (err) {
      setEditError(readApiError(err));
    }
  };

  const handleDelete = async (sub: SubmitResultListItem) => {
    const subId = sub.id || sub.Id || "";
    if (!confirm("Bạn có chắc chắn muốn xóa bài nộp này không?")) return;
    try {
      await deleteMutation.mutateAsync(subId);
      refetch();
    } catch (err) {
      alert("Không thể xóa bài nộp: " + readApiError(err));
    }
  };

  if (!user) {
    return (
          <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#080f11] border border-[#00d9ff] p-8 text-center glow-box space-y-4">
              <div className="corner-accent-tl" />
              <div className="corner-accent-tr" />
              <div className="corner-accent-bl" />
              <div className="corner-accent-br" />
              <h2 className="font-display text-xl font-bold uppercase text-[#00d9ff]">DANH SÁCH BÀI NỘP ĐỘI THI</h2>
              <p className="font-mono text-xs text-[#bbc9ce] leading-relaxed">
                Vui lòng đăng nhập hoặc bấm nút Demo bên dưới để kiểm tra giao diện bảng bài nộp:
              </p>
              <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => loginAsDemoRole("TeamLeader")}
                  className="w-full bg-[#00d9ff] text-[#080f11] font-bold py-2.5 uppercase hover:bg-white transition-colors"
                >
                  [ 🎯 Xem Bằng Tài Khoản Thí Sinh Demo ]
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-[#00d9ff] selection:text-[#003641]">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header Panel (Stitch T5) */}
            <div className="bg-[#1a2123] relative p-6 border-t-2 border-[#00d9ff] shadow-[inset_0_0_20px_rgba(0,217,255,0.05)] border border-white/5 glow-box">
              <div className="corner-accent-tl" />
              <div className="corner-accent-br" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-[11px] text-[#859398] mb-1 uppercase tracking-wider">
                    QUẢN LÝ BÀI DỰ THI
                  </div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
                    <FolderOpen className="w-8 h-8 text-[#00d9ff]" />
                    Danh Sách Bài Nộp Theo Vòng Thi
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => refetch()}
                    className="font-mono text-xs text-[#bbc9ce] hover:text-[#00d9ff] border border-[#3c494d] bg-[#080f11] px-3 py-2 flex items-center gap-1.5 transition-colors uppercase"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Làm mới
                  </button>

                  <Link href="/submissions/new">
                    <button className="bg-[#00d9ff] text-[#080f11] font-display text-sm font-bold px-5 py-2 rounded-[12px] rounded-br-none hover:bg-white transition-all flex items-center gap-1.5 uppercase shadow-[0_0_15px_rgba(0,217,255,0.3)]">
                      <Plus className="w-4 h-4" /> Nộp bài mới &gt;
                    </button>
                  </Link>
                </div>
              </div>

              {/* Team & Track Badges */}
              <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[#3c494d]/40 font-mono text-xs">
                <div className="bg-[#0e1417] border border-[#3c494d] px-3.5 py-1.5 flex items-center gap-2">
                  <span className="text-[#859398]">ĐỘI:</span>
                  <span className="text-[#38bdf8] font-bold">{team?.name || team?.Name || "Chưa có đội"}</span>
                </div>
                <div className="bg-[#0e1417] border border-[#3c494d] px-3.5 py-1.5 flex items-center gap-2">
                  <span className="text-[#859398]">VAI TRÒ:</span>
                  <span className="text-[#ffdea9] font-bold">{isLeader ? "Trưởng Nhóm (Leader)" : "Thành Viên (Member)"}</span>
                </div>
                <div className="bg-[#0e1417] border border-[#3c494d] px-3.5 py-1.5 flex items-center gap-2">
                  <span className="text-[#859398]">TRẠNG THÁI:</span>
                  <span className="text-[#34d399] font-bold">{team?.status || "Active"}</span>
                </div>
              </div>
            </div>

            {/* Command Grid Table Panel (Stitch T5) */}
            <div className="bg-[#1a2123] border border-white/10 glow-box flex flex-col">
              {/* Panel Header Bar */}
              <div className="h-8 bg-[#38bdf8]/10 border-b border-[#38bdf8]/30 flex items-center px-4 justify-between font-mono text-xs">
                <span className="text-[#38bdf8] font-bold tracking-widest">[ SUBMISSION_GRID ]</span>
                <span className="text-[#38bdf8]/70 text-[10px]">SYNC: ACTIVE ({submissions.length} BÀI NỘP)</span>
              </div>

              {isLoadingSubs ? (
                <div className="p-12 text-center font-mono text-xs text-[#00d9ff] animate-pulse">
                  [ SYSTEM_LOG: FETCHING_SUBMISSIONS... ]
                </div>
              ) : submissions.length === 0 ? (
                <div className="p-12 text-center font-mono text-xs text-[#859398] space-y-3">
                  <p>Đội của bạn chưa có bài nộp nào được lưu trên hệ thống.</p>
                  <Link href="/submissions/new">
                    <button className="bg-[#00d9ff] text-[#080f11] font-bold px-4 py-2 uppercase text-xs hover:bg-white transition-colors">
                      [ Nộp Bài Thi Đầu Tiên ]
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[#3c494d]/60 bg-[#0e1417]/80 text-[#859398]">
                        <th className="py-3 px-4 uppercase tracking-wider">VÒNG THI</th>
                        <th className="py-3 px-4 uppercase tracking-wider">LIÊN KẾT BÀI NỘP (3 URLS)</th>
                        <th className="py-3 px-4 uppercase tracking-wider">THỜI GIAN NỘP</th>
                        <th className="py-3 px-4 uppercase tracking-wider">TRẠNG THÁI</th>
                        <th className="py-3 px-4 uppercase tracking-wider text-right">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3c494d]/40">
                      {submissions.map((sub, idx) => {
                        const id = sub.id || sub.Id || `sub-${idx}`;
                        const isEliminated = (sub as any).isEliminated || (sub as any).IsEliminated;
                        const isActive = sub.isActive ?? sub.IsActive ?? true;

                        return (
                          <tr key={id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-4 px-4 font-bold text-white whitespace-nowrap">
                              {(sub as any).roundName || (sub as any).RoundName || `Vòng ${idx + 1}`}
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex flex-wrap items-center gap-2">
                                {(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl) && (
                                  <a
                                    href={(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl) || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0e1417] border border-[#00d9ff]/30 text-[#00d9ff] hover:border-[#00d9ff] text-[11px]"
                                  >
                                    <Code className="w-3 h-3" /> Repo
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                                {(sub.demoUrl || sub.DemoUrl) && (
                                  <a
                                    href={(sub.demoUrl || sub.DemoUrl) || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0e1417] border border-[#f87171]/30 text-[#f87171] hover:border-[#f87171] text-[11px]"
                                  >
                                    <Globe className="w-3 h-3" /> Live Demo
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                                {(sub.slideUrl || sub.SlideUrl) && (
                                  <a
                                    href={(sub.slideUrl || sub.SlideUrl) || undefined}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0e1417] border border-[#fb923c]/30 text-[#fb923c] hover:border-[#fb923c] text-[11px]"
                                  >
                                    <Presentation className="w-3 h-3" /> Slides
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </td>

                            <td className="py-4 px-4 text-[#859398] whitespace-nowrap text-[11px]">
                              {sub.createdTime || sub.CreatedTime ? new Date(sub.createdTime || sub.CreatedTime || "").toLocaleString("vi-VN") : "—"}
                            </td>

                            <td className="py-4 px-4 whitespace-nowrap">
                              {isEliminated ? (
                                <span className="px-2 py-0.5 border border-[#ffb4ab]/30 bg-[#ffb4ab]/10 text-[#ffb4ab] text-[10px] font-bold uppercase">
                                  ✗ BỊ LOẠI
                                </span>
                              ) : !isActive ? (
                                <span className="px-2 py-0.5 border border-[#859398]/30 bg-[#859398]/10 text-[#859398] text-[10px] font-bold uppercase">
                                  ĐÃ HỦY
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 border border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399] text-[10px] font-bold uppercase">
                                  ✓ ĐÃ NỘP
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {isActive && !isEliminated && (
                                  <button
                                    onClick={() => handleOpenEdit(sub)}
                                    disabled={!isRegistered || !isLeader}
                                    title={!isLeader ? "Chỉ Trưởng nhóm mới có quyền sửa bài" : "Chỉnh sửa liên kết"}
                                    className={`px-2.5 py-1 border text-[11px] uppercase flex items-center gap-1 ${isRegistered && isLeader
                                        ? "border-[#00d9ff]/40 text-[#00d9ff] hover:bg-[#00d9ff]/10"
                                        : "border-[#3c494d] text-[#859398] opacity-40 cursor-not-allowed"
                                      }`}
                                  >
                                    <Edit className="w-3 h-3" /> Sửa
                                  </button>
                                )}

                                <Link href={`/appeals?subId=${id}`}>
                                  <button
                                    className="px-2.5 py-1 border border-[#febb29]/40 text-[#febb29] hover:bg-[#febb29]/10 text-[11px] uppercase flex items-center gap-1"
                                    title="Gửi đơn phúc khảo điểm số"
                                  >
                                    <Scale className="w-3 h-3" /> Phúc khảo
                                  </button>
                                </Link>

                                {isLeader && (
                                  <button
                                    onClick={() => handleDelete(sub)}
                                    className="px-2 py-1 border border-[#ffb4ab]/30 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 text-[11px]"
                                    title="Xóa bài nộp"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Mentor Feedbacks Section for Team */}
            {submissions.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-display text-lg font-bold text-[#34d399] uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  GÓP Ý &amp; ĐÁNH GIÁ CHUYÊN MÔN TỪ CỐ VẤN (MENTOR FEEDBACK)
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {submissions.map((sub, idx) => (
                    <TeamSubmissionFeedbackDrawer key={sub.id || sub.Id || idx} submitResultId={sub.id || sub.Id || ""} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit Submission Modal */}
          {editingSub && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#080f11] border border-[#00d9ff] p-6 max-w-xl w-full glow-box relative space-y-4">
                <div className="corner-accent-tl" />
                <div className="corner-accent-tr" />
                <div className="corner-accent-bl" />
                <div className="corner-accent-br" />

                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="font-display text-lg font-bold text-[#00d9ff] uppercase">
                    CHỈNH SỬA BÀI NỘP
                  </h3>
                  <button onClick={() => setEditingSub(null)} className="text-[#859398] hover:text-white font-mono">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-white mb-1">Repo URL *</label>
                    <input
                      type="url"
                      required
                      value={editRepo}
                      onChange={(e) => setEditRepo(e.target.value)}
                      className="w-full input-cyber p-2.5 bg-[#152238] text-white border-b border-[#3c494d] focus:border-[#00d9ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-1">Demo Video / Live App URL *</label>
                    <input
                      type="url"
                      required
                      value={editDemo}
                      onChange={(e) => setEditDemo(e.target.value)}
                      className="w-full input-cyber p-2.5 bg-[#152238] text-white border-b border-[#3c494d] focus:border-[#00d9ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-1">Slide Thuyết Trình URL *</label>
                    <input
                      type="url"
                      required
                      value={editSlide}
                      onChange={(e) => setEditSlide(e.target.value)}
                      className="w-full input-cyber p-2.5 bg-[#152238] text-white border-b border-[#3c494d] focus:border-[#00d9ff]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#859398] mb-1">Ghi chú cập nhật</label>
                    <textarea
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full input-cyber p-2.5 bg-[#152238] text-white border-b border-[#3c494d] focus:border-[#00d9ff]"
                    />
                  </div>

                  {editError && (
                    <p className="text-[#ffb4ab] text-[11px]">{editError}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditingSub(null)}
                      className="px-4 py-2 border border-[#3c494d] text-[#bbc9ce] hover:text-white"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="px-5 py-2 bg-[#00d9ff] text-[#080f11] font-bold uppercase hover:bg-white"
                    >
                      {updateMutation.isPending ? "Đang lưu..." : "Cập Nhật"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    }

    function TeamSubmissionFeedbackDrawer({ submitResultId }: { submitResultId: string }) {
      const { data: feedbacks = [] } = useMentorFeedbacks(submitResultId);
      const [isOpen, setIsOpen] = useState(false);

      if (feedbacks.length === 0) return null;

      return (
        <div className="bg-[#1a2123] border border-[#34d399]/30 p-4 glow-box font-mono text-xs">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full text-[#34d399] hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2 font-bold uppercase">
              <MessageSquare className="w-4 h-4" />
              Nhận Xét Chuyên Môn Cố Vấn ({feedbacks.length} Lời Khuyên)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-[#859398]">
              {isOpen ? "Thu gọn ▲" : "Xem chi tiết ▼"}
            </span>
          </button>

          {isOpen && (
            <div className="mt-3 pt-3 border-t border-[#3c494d]/50 space-y-3">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="p-3 bg-[#0e1417] border border-[#34d399]/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#34d399] font-bold">Mentor: {fb.mentorName || "Cố vấn"}</span>
                    {fb.suggestedScore !== undefined && (
                      <span className="text-[#fbbf24] font-bold">Điểm gợi ý: {fb.suggestedScore}/100</span>
                    )}
                  </div>
                  <p className="font-sans text-white text-xs leading-relaxed">"{fb.feedbackContent}"</p>
                  {fb.technicalAdvice && (
                    <div className="p-2 bg-[#152238] border border-[#34d399]/20 text-[#34d399] text-[11px]">
                      💡 Lời khuyên kỹ thuật: {fb.technicalAdvice}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }


