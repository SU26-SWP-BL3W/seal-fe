"use client";

import React from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMyAssignedJudgeTracks } from "@/viewModels/useMyAssignedJudgeTracks";
import { Award, CheckCircle2, Clock, ArrowRight, ShieldCheck, FileCheck2, Lock } from "lucide-react";
import { Link } from "@/i18n/routing";

export const JudgeTracksView: React.FC = () => {
  const { user, loginAsDemoRole } = useAuth();
  const { assignedTracks, isLoading } = useMyAssignedJudgeTracks();

  const totalAssigned = assignedTracks.length;
  const totalPendingScoring = assignedTracks.reduce((acc, t) => acc + t.pendingSubmissions, 0);
  const totalCompleted = assignedTracks.reduce((acc, t) => acc + t.totalSubmissions - t.pendingSubmissions, 0);

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#080f11] border border-[#ffbb2a] p-8 text-center glow-box-amber relative space-y-4">
          <div className="corner-accent-tl text-[#ffbb2a]" />
          <div className="corner-accent-tr text-[#ffbb2a]" />
          <div className="corner-accent-bl text-[#ffbb2a]" />
          <div className="corner-accent-br text-[#ffbb2a]" />
          <div className="w-12 h-12 bg-[#ffbb2a]/10 border border-[#ffbb2a] rounded-full flex items-center justify-center mx-auto text-[#ffbb2a]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold uppercase text-amber-300">
            YÊU CẦU QUYỀN GIÁM KHẢO
          </h2>
          <p className="font-mono text-xs text-zinc-400 leading-relaxed">
            Vui lòng đăng nhập với tài khoản Giám khảo hoặc chọn nhanh vai trò Demo bên dưới để kiểm tra giao diện:
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => loginAsDemoRole("Judge")}
              className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold py-2.5 uppercase hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
            >
              Đăng Nhập Vai Trò Giám Khảo Demo
            </button>
            <Link href="/login" className="w-full">
              <button className="w-full border border-zinc-700 text-zinc-300 py-2 uppercase hover:border-amber-500/40 hover:text-amber-200 transition-colors cursor-pointer">
                Đến trang đăng nhập chính thức
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0c1214] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-amber-400 mb-1 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>BẢNG PHÂN CÔNG GIÁM KHẢO</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              HẠNG MỤC PHÂN CÔNG CHẤM ĐIỂM
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/judge/scoring">
              <button className="px-4 py-2 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-600/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs uppercase tracking-wider hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 cursor-pointer shadow-sm">
                <FileCheck2 className="w-4 h-4" /> BÀN CHẤM ĐIỂM TRỰC TIẾP &gt;
              </button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#0e1518] border border-zinc-800 p-5 relative space-y-2 shadow-sm">
            <div className="corner-accent-tl text-amber-400/40" />
            <div className="corner-accent-tr text-amber-400/40" />
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
              Hạng Mục Thi Đang Phụ Trách
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-amber-300">
                {isLoading ? "..." : totalAssigned}
              </span>
              <Award className="w-6 h-6 text-amber-400 opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-zinc-500 block">
              Phân công trực tiếp từ Ban Tổ Chức
            </span>
          </div>

          <div className="bg-[#0e1518] border border-zinc-800 p-5 relative space-y-2 shadow-sm">
            <div className="corner-accent-tl text-amber-400/40" />
            <div className="corner-accent-tr text-amber-400/40" />
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
              Bài Nộp Chờ Đánh Giá (Pending)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-amber-400">
                {isLoading ? "..." : totalPendingScoring}
              </span>
              <Clock className="w-6 h-6 text-amber-400 opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-amber-400/80 block">
              ● Cần hoàn tất trước hạn đóng cổng
            </span>
          </div>

          <div className="bg-[#0e1518] border border-zinc-800 p-5 relative space-y-2 shadow-sm">
            <div className="corner-accent-tl text-amber-400/40" />
            <div className="corner-accent-tr text-amber-400/40" />
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block">
              Tiến Độ Hoàn Thành
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-emerald-400">
                {totalAssigned > 0 ? `${totalCompleted} Bài` : "100%"}
              </span>
              <CheckCircle2 className="w-6 h-6 text-emerald-400 opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-zinc-500 block">
              Tự động tính toán chỉ số đánh giá
            </span>
          </div>
        </div>

        {/* Assigned Tracks List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>HẠNG MỤC THI ĐẤU PHÂN CÔNG ({assignedTracks.length})</span>
            </h2>
            <span className="font-mono text-xs text-zinc-400">
              Đánh giá chuyên môn &amp; Chấm điểm độc lập
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center font-mono text-xs text-amber-400/80 animate-pulse bg-[#0e1518] border border-zinc-800">
              ĐANG TRUY XUẤT DỮ LIỆU HẠNG MỤC...
            </div>
          ) : assignedTracks.length === 0 ? (
            <div className="p-12 bg-[#0c1214] border border-zinc-800 text-center space-y-3">
              <p className="font-mono text-xs text-zinc-500">
                Bạn hiện chưa được phân công chấm điểm cho Hạng mục nào trong sự kiện này.
              </p>
            </div>
          ) : assignedTracks.length === 1 ? (
            /* HERO TRACK CARD CHO SỰ KIỆN 1 HẠNG MỤC */
            (() => {
              const track = assignedTracks[0];
              const progressPct =
                track.totalSubmissions > 0
                  ? Math.round(((track.totalSubmissions - track.pendingSubmissions) / track.totalSubmissions) * 100)
                  : 0;

              return (
                <div className="bg-gradient-to-br from-[#121c20] via-[#0f171a] to-[#0a1012] border border-zinc-800/80 hover:border-amber-500/40 transition-all p-6 md:p-8 relative shadow-lg">
                  <div className="corner-accent-tl text-amber-400/40" />
                  <div className="corner-accent-tr text-amber-400/40" />
                  <div className="corner-accent-bl text-amber-400/40" />
                  <div className="corner-accent-br text-amber-400/40" />

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-[11px] text-amber-300 font-bold px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 uppercase tracking-wider">
                          HẠNG MỤC CHÍNH
                        </span>
                        <span className="font-mono text-xs text-zinc-400">
                          {track.eventName} • {track.roundName}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-2xl md:text-3xl text-white">
                        {track.trackName}
                      </h3>
                      <p className="font-mono text-xs text-zinc-400 leading-relaxed">
                        Hạng mục thi đấu chuyên môn. Thông tin đội thi được ẩn danh để đảm bảo tính khách quan và công bằng.
                      </p>

                      {/* Sleek Progress Bar */}
                      <div className="pt-2 space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">TIẾN ĐỘ ĐÁNH GIÁ CHUYÊN MÔN:</span>
                          <span className="text-amber-300 font-bold">
                            {track.totalSubmissions - track.pendingSubmissions} / {track.totalSubmissions} Bài Nộp ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-500 rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Direct CTA Deck */}
                    <div className="flex flex-col gap-3 min-w-[240px] shrink-0">
                      <Link
                        href={`/judge/scoring?trackId=${track.trackId}`}
                        className="px-6 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black font-mono text-sm font-extrabold uppercase hover:brightness-110 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                      >
                        <span>BẮT ĐẦU CHẤM ĐIỂM NGAY →</span>
                      </Link>

                      <Link
                        href={`/judge/tracks/${track.trackId}/teams`}
                        className="px-6 py-3 bg-[#141f23] border border-zinc-700 hover:border-amber-500/40 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase transition-all text-center flex items-center justify-center gap-2"
                      >
                        <span>[ Xem Danh Sách Bài Nộp ({track.totalSubmissions}) ]</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            /* DUAL TRACK COMPARISON DECK CHO SỰ KIỆN 2 HẠNG MỤC HOẶC NHIỀU HƠN */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {assignedTracks.map((track, idx) => {
                const progressPct =
                  track.totalSubmissions > 0
                    ? Math.round(((track.totalSubmissions - track.pendingSubmissions) / track.totalSubmissions) * 100)
                    : 0;
                const isAllDone = track.pendingSubmissions === 0;

                return (
                  <div
                    key={track.trackId || idx}
                    className="bg-gradient-to-br from-[#121c20] via-[#0f171a] to-[#0a1012] border border-zinc-800/80 hover:border-amber-500/40 transition-all p-6 relative flex flex-col justify-between space-y-4 shadow-md"
                  >
                    <div className="corner-accent-tl text-amber-400/40" />
                    <div className="corner-accent-tr text-amber-400/40" />
                    <div className="corner-accent-bl text-amber-400/40" />
                    <div className="corner-accent-br text-amber-400/40" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-amber-300 font-bold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 uppercase tracking-wider">
                          TRACK 0{idx + 1}
                        </span>
                        <span className="font-mono text-xs text-zinc-400">
                          {track.roundName}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-xl text-white">
                        {track.trackName}
                      </h3>
                      <p className="font-mono text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {(track as any).description || "Hạng mục thi đấu chuyên môn được đánh giá theo thang điểm chuẩn mực."}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-[11px] text-zinc-400">TIẾN ĐỘ CHẤM:</span>
                          <span className="text-amber-300 font-bold">
                            {track.totalSubmissions - track.pendingSubmissions} / {track.totalSubmissions} BÀI ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              isAllDone ? "bg-emerald-400" : "bg-gradient-to-r from-cyan-500 to-amber-400"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center gap-2 justify-between">
                      <Link href={`/judge/tracks/${track.trackId}/teams`} className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-3.5 py-2 bg-transparent border border-zinc-700/80 text-zinc-300 font-mono text-xs uppercase hover:border-amber-500/40 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                          <span>DS Bài Nộp ({track.pendingSubmissions})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                      <Link href={`/judge/scoring?trackId=${track.trackId}`} className="w-full sm:w-auto">
                        <button className="w-full sm:w-auto px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold uppercase hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>CHẤM TRACK NÀY &gt;</span>
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
