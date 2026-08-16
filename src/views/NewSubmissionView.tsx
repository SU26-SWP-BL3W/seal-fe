"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useCreateSubmission, readApiError, type SubmitResultRequest } from "@/repositories/submitResultsRepository";
import { useMyTeam } from "@/repositories/teamsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useEventRounds } from "@/repositories/eventsRepository";
import { Code, Globe, Presentation, FileText, Lock, PlusSquare, AlertCircle, ArrowLeft, Send, CheckCircle2 } from "lucide-react";

export function NewSubmissionView() {
  const { user } = useAuth();
  const { data: teamResponse, isLoading: isLoadingTeam } = useMyTeam();
  const team = (teamResponse as any)?.team ?? teamResponse;

  const eventId = team?.eventId || team?.EventId || "";
  const teamId = team?.id || team?.Id || "";
  const trackId = team?.trackId || team?.TrackId || "";

  const { data: rounds = [], isLoading: isLoadingRounds } = useEventRounds(eventId || undefined);
  const { data: tracks = [] } = useGetTracksByEvent(eventId || undefined);

  const currentTrack = useMemo(() => {
    return tracks.find((t) => (t.id || t.Id) === trackId) || null;
  }, [tracks, trackId]);

  // Vong thi dang mo nop bai (submissionDeadline > now)
  const openRounds = useMemo(() => {
    return rounds.filter((r) => {
      const deadline = r.submissionDeadline || r.endDate;
      return !deadline || new Date(deadline) > new Date();
    });
  }, [rounds]);

  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const activeRoundId = selectedRoundId || openRounds[0]?.id || rounds[0]?.id || "";
  const activeRound = rounds.find((r) => r.id === activeRoundId) || openRounds[0] || rounds[0];

  // 3 URLs bat buoc theo quy chuan Backend
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [slideUrl, setSlideUrl] = useState("");
  const [description, setDescription] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const createSubmission = useCreateSubmission();

  const isLeader = team?.leaderId === user?.id || team?.LeaderId === user?.id;
  const isRegistered = team?.status === "Registered" || team?.status === "Approved";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !activeRoundId || !trackId) {
      setSubmitError("Thiếu thông tin Đội thi, Hạng mục hoặc Vòng thi.");
      return;
    }

    if (!repoUrl.trim() || !demoUrl.trim() || !slideUrl.trim()) {
      setSubmitError("Vui lòng điền đủ 3 đường dẫn bắt buộc: Repo URL, Demo URL và Slide URL.");
      return;
    }

    setSubmitError("");

    const payload: SubmitResultRequest = {
      TeamId: teamId,
      TrackId: trackId,
      RoundId: activeRoundId,
      RepoUrl: repoUrl.trim(),
      DemoUrl: demoUrl.trim(),
      SlideUrl: slideUrl.trim(),
      SubmissionUrl: repoUrl.trim(),
      Description: description.trim(),
    };

    try {
      await createSubmission.mutateAsync(payload);
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(readApiError(err));
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-xs text-[#bbc9ce]">
        Vui lòng đăng nhập để nộp bài thi.
      </div>
    );
  }

  if (isLoadingTeam || isLoadingRounds) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-xs text-[#00d9ff] animate-pulse">
        [ SYSTEM_LOG: LOADING_SUBMISSION_DECK... ]
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#080f11] border border-[#3c494d] text-center glow-box">
        <h2 className="font-display text-xl font-bold uppercase text-[#00d9ff] mb-2">CHƯA THAM GIA ĐỘI THI</h2>
        <p className="font-mono text-xs text-[#bbc9ce] mb-6">
          Bạn cần tạo hoặc gia nhập một đội thi trước khi có thể nộp bài.
        </p>
        <Link href="/my-team">
          <button className="bg-[#00d9ff] text-[#080f11] font-mono font-bold text-xs px-6 py-2.5 rounded uppercase hover:bg-white transition-colors">
            [ Đến Không Gian Đội Thi ]
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-[#00d9ff] selection:text-[#003641]">
      {/* Ambient Scanlines */}
      <div className="fixed inset-0 pointer-events-none opacity-5 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px] z-0" />

      <div className="max-w-6xl mx-auto relative z-10 space-y-6">
        {/* Header (Stitch T7) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-[#859398] mb-1 tracking-wider uppercase">
              MODULE // SUBMISSION_CREATION
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white flex items-center gap-3 uppercase tracking-wide">
              <PlusSquare className="w-8 h-8 text-[#00d9ff]" />
              Khởi Tạo Bài Nộp Mới
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/my-submissions">
              <button className="font-mono text-xs text-[#bbc9ce] hover:text-[#00d9ff] border border-[#3c494d] bg-[#080f11] px-3.5 py-1.5 flex items-center gap-1.5 transition-colors uppercase">
                <ArrowLeft className="w-3.5 h-3.5" /> Danh sách bài nộp
              </button>
            </Link>
            <div className="font-mono text-xs text-[#38bdf8] bg-[#38bdf8]/10 px-3 py-1.5 border border-[#38bdf8]/30 uppercase font-bold">
              [ MODE: WRITE ]
            </div>
          </div>
        </div>

        {submitSuccess ? (
          <div className="bg-[#080f11] border border-[#00d9ff] p-10 text-center glow-box max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#00d9ff]/10 border border-[#00d9ff] flex items-center justify-center mx-auto text-[#00d9ff]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase text-[#00d9ff]">NỘP BÀI THI THÀNH CÔNG!</h2>
            <p className="font-mono text-xs text-[#bbc9ce] max-w-md mx-auto leading-relaxed">
              Bài nộp của đội <strong className="text-white">{team?.name || team?.Name}</strong> đã được ghi nhận trên hệ thống và chuyển vào hàng đợi chấm điểm của Hội đồng Giám khảo.
            </p>
            <div className="pt-4 flex justify-center gap-4 font-mono text-xs">
              <Link href="/my-submissions">
                <button className="bg-[#00d9ff] text-[#080f11] font-bold px-6 py-2.5 uppercase hover:bg-white transition-colors">
                  [ Xem Bảng Bài Nộp ]
                </button>
              </Link>
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setRepoUrl("");
                  setDemoUrl("");
                  setSlideUrl("");
                  setDescription("");
                }}
                className="border border-[#3c494d] text-[#bbc9ce] px-6 py-2.5 uppercase hover:border-[#00d9ff] hover:text-white transition-colors"
              >
                Nộp bài khác
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1px] bg-white/10 border border-white/10 glow-box">
            {/* Left Column (Info & Meta) */}
            <div className="lg:col-span-4 bg-[#242b2d] p-6 relative group border border-white/5 space-y-6">
              {/* 4 Cyber Corners */}
              <div className="corner-accent-tl opacity-70 group-hover:opacity-100" />
              <div className="corner-accent-tr opacity-70 group-hover:opacity-100" />
              <div className="corner-accent-bl opacity-70 group-hover:opacity-100" />
              <div className="corner-accent-br opacity-70 group-hover:opacity-100" />

              <div className="bg-[#00d9ff]/10 h-7 -mx-6 -mt-6 mb-6 flex items-center px-6 border-b border-[#00d9ff]/20">
                <span className="font-mono text-[11px] font-bold text-[#00d9ff] uppercase tracking-widest">
                  META_DATA
                </span>
              </div>

              {/* Đội thi */}
              <div>
                <label className="block font-mono text-[11px] text-[#859398] uppercase tracking-wider mb-1.5">
                  ĐỘI THI
                </label>
                <div className="font-mono text-xs text-white bg-[#0e1417] p-3 border border-[#3c494d] flex items-center justify-between">
                  <span>{team?.name || team?.Name || "Đội thi"}</span>
                  <span className="text-[10px] text-[#38bdf8] border border-[#38bdf8]/30 px-1.5 py-0.5 bg-[#38bdf8]/10 font-bold">
                    {team?.status || "Registered"}
                  </span>
                </div>
              </div>

              {/* Hạng mục */}
              <div>
                <label className="block font-mono text-[11px] text-[#859398] uppercase tracking-wider mb-1.5">
                  HẠNG MỤC (READ-ONLY)
                </label>
                <div className="font-mono text-xs text-white bg-[#0e1417] p-3 border border-[#3c494d] flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#859398]" />
                  <span>{currentTrack?.trackName || currentTrack?.TrackName || "Advanced Tech Track"}</span>
                </div>
              </div>

              {/* Vòng thi */}
              <div>
                <label className="block font-mono text-[11px] text-[#00d9ff] uppercase tracking-wider mb-1.5 font-bold">
                  VÒNG THI HIỆN TẠI
                </label>
                <select
                  value={activeRoundId}
                  onChange={(e) => setSelectedRoundId(e.target.value)}
                  className="w-full input-cyber text-white font-mono text-xs p-3 focus:outline-none focus:border-[#00d9ff] bg-[#152238] border-b-2 border-[#3c494d]"
                >
                  {rounds.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#0e1417] text-white">
                      {r.roundName} {r.submissionDeadline ? `(Hạn: ${new Date(r.submissionDeadline).toLocaleDateString("vi-VN")})` : ""}
                    </option>
                  ))}
                </select>
                <p className="font-mono text-[10px] text-[#859398] mt-1.5">
                  {openRounds.length > 0 ? "Vòng thi đang mở tiếp nhận hồ sơ." : "Hệ thống vòng thi sự kiện."}
                </p>
              </div>

              {/* Thông số hệ thống */}
              <div className="pt-4 border-t border-[#3c494d]/50 font-mono text-[11px] text-[#859398] space-y-2">
                <div className="flex justify-between">
                  <span>TRẠNG THÁI:</span>
                  <span className="text-[#38bdf8] font-bold">CỔNG NỘP MỞ</span>
                </div>
                <div className="flex justify-between">
                  <span>ĐỊNH DẠNG:</span>
                  <span className="text-white">GITHUB, LIVE URL, SLIDE</span>
                </div>
                <div className="flex justify-between">
                  <span>KIỂM TOÁN:</span>
                  <span className="text-[#00d9ff]">AUTO API AUDIT</span>
                </div>
              </div>
            </div>

            {/* Right Column (Data Input Form) */}
            <div className="lg:col-span-8 bg-[#1a2123] p-6 relative border border-white/5">
              <div className="bg-[#38bdf8]/10 h-7 -mx-6 -mt-6 mb-6 flex items-center px-6 border-b border-[#38bdf8]/20">
                <span className="font-mono text-[11px] font-bold text-[#38bdf8] uppercase tracking-widest">
                  DATA_INPUT (3 URLS BẮT BUỘC)
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Repo URL */}
                <div>
                  <label className="block font-mono text-xs text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                    <Code className="w-4 h-4 text-[#00d9ff]" />
                    Repository URL <span className="text-[#ffb4ab] font-bold">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://github.com/organization/project-repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    className="w-full input-cyber text-white font-mono text-xs p-3.5 pl-4 focus:outline-none focus:border-[#00d9ff] bg-[#152238] border-b-2 border-[#3c494d]"
                  />
                  <p className="font-mono text-[11px] text-[#859398] mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-[#febb29]" />
                    Repo mã nguồn (GitHub/GitLab) — tự động kiểm tra sao lưu và commit lịch sử.
                  </p>
                </div>

                {/* 2. Demo URL */}
                <div>
                  <label className="block font-mono text-xs text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                    <Globe className="w-4 h-4 text-[#38bdf8]" />
                    Demo Video / Live App URL <span className="text-[#ffb4ab] font-bold">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://demo.project.app hoặc https://youtube.com/watch?v=..."
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    className="w-full input-cyber text-white font-mono text-xs p-3.5 pl-4 focus:outline-none focus:border-[#00d9ff] bg-[#152238] border-b-2 border-[#3c494d]"
                  />
                </div>

                {/* 3. Slide URL */}
                <div>
                  <label className="block font-mono text-xs text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                    <Presentation className="w-4 h-4 text-[#ffdea9]" />
                    Slide Thuyết Trình / Báo Cáo URL <span className="text-[#ffb4ab] font-bold">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://docs.google.com/presentation/d/... hoặc https://canva.com/..."
                    value={slideUrl}
                    onChange={(e) => setSlideUrl(e.target.value)}
                    className="w-full input-cyber text-white font-mono text-xs p-3.5 pl-4 focus:outline-none focus:border-[#00d9ff] bg-[#152238] border-b-2 border-[#3c494d]"
                  />
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block font-mono text-xs text-[#859398] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                    <FileText className="w-4 h-4 text-[#859398]" />
                    Tóm Tắt Đột Phá Kỹ Thuật (Project Summary)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Mô tả ngắn gọn về giải pháp, kiến trúc và công nghệ nổi bật..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full input-cyber text-white font-mono text-xs p-3.5 focus:outline-none focus:border-[#00d9ff] bg-[#152238] border-b-2 border-[#3c494d]"
                  />
                </div>

                {submitError && (
                  <div className="p-3 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] font-mono text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-4">
                  <button
                    type="submit"
                    disabled={createSubmission.isPending}
                    className="bg-[#00d9ff] text-[#080f11] font-display text-base font-bold py-3.5 px-8 rounded-[12px] rounded-br-none hover:bg-white transition-all flex items-center justify-center gap-2 uppercase tracking-wider relative overflow-hidden group shadow-[0_0_20px_rgba(0,217,255,0.3)] cursor-pointer"
                  >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <Send className="w-4 h-4" />
                    {createSubmission.isPending ? "Đang truyền tải dữ liệu..." : "// GỬI BÀI NỘP (TRANSMIT_DATA) >"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
