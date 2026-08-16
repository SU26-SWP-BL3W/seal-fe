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
          <h2 className="font-display text-xl font-bold uppercase text-[#ffbb2a]">
            YÊU CẦU QUYỀN GIÁM KHẢO
          </h2>
          <p className="font-mono text-xs text-[#bbc9ce] leading-relaxed">
            Vui lòng đăng nhập với tài khoản Giám khảo hoặc chọn nhanh vai trò Demo bên dưới để kiểm tra giao diện:
          </p>
          <div className="pt-2 flex flex-col gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => loginAsDemoRole("Judge")}
              className="w-full bg-[#ffbb2a] text-[#080f11] font-bold py-2.5 uppercase hover:bg-white transition-colors"
            >
              [ ⚖️ Vào Bằng Tài Khoản Giám Khảo Demo ]
            </button>
            <Link href="/login" className="w-full">
              <button className="w-full border border-[#3c494d] text-[#bbc9ce] py-2 uppercase hover:border-[#ffbb2a] hover:text-white">
                Đến trang đăng nhập thật
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-[#ffbb2a] selection:text-[#080f11]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#3c494d] pb-4 gap-4">
          <div>
            <div className="font-mono text-[11px] text-[#ffbb2a] mb-1 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>// JUDGE_OPERATIONS / ASSIGNED_TRACKS</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase flex items-center gap-3">
              HẠNG MỤC PHÂN CÔNG CHẤM ĐIỂM
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/judge/scoring">
              <button className="px-4 py-2 bg-[#ffbb2a] text-[#080f11] font-mono font-bold text-xs uppercase tracking-wider hover:bg-white transition-colors flex items-center gap-2 cursor-pointer hud-clipped">
                <FileCheck2 className="w-4 h-4" /> // BÀN CHẤM ĐIỂM TRỰC TIẾP &gt;
              </button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#080f11] border border-[#3c494d] p-5 relative space-y-2 glow-box-amber">
            <div className="corner-accent-tl text-[#ffbb2a]" />
            <div className="corner-accent-tr text-[#ffbb2a]" />
            <span className="font-mono text-[10px] text-[#859398] uppercase tracking-wider block">
              Hạng Mục Thi Đang Phụ Trách
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[#ffbb2a]">
                {isLoading ? "..." : totalAssigned}
              </span>
              <Award className="w-6 h-6 text-[#ffbb2a] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[#859398] block">
              Phân công trực tiếp từ Ban Tổ Chức
            </span>
          </div>

          <div className="bg-[#080f11] border border-[#3c494d] p-5 relative space-y-2 glow-box-amber">
            <div className="corner-accent-tl text-[#ffbb2a]" />
            <div className="corner-accent-tr text-[#ffbb2a]" />
            <span className="font-mono text-[10px] text-[#859398] uppercase tracking-wider block">
              Bài Nộp Chờ Đánh Giá (Pending)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[#f59e0b]">
                {isLoading ? "..." : totalPendingScoring}
              </span>
              <Clock className="w-6 h-6 text-[#f59e0b] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[#f59e0b] block">
              ● Cần hoàn tất trước hạn đóng cổng
            </span>
          </div>

          <div className="bg-[#080f11] border border-[#3c494d] p-5 relative space-y-2 glow-box-amber">
            <div className="corner-accent-tl text-[#ffbb2a]" />
            <div className="corner-accent-tr text-[#ffbb2a]" />
            <span className="font-mono text-[10px] text-[#859398] uppercase tracking-wider block">
              Tiến Độ Hoàn Thành
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[#10b981]">
                {totalAssigned > 0 ? `${totalCompleted} Bài` : "100%"}
              </span>
              <CheckCircle2 className="w-6 h-6 text-[#10b981] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[#859398] block">
              Tự động tính toán Delta Inter-rater
            </span>
          </div>
        </div>

        {/* Assigned Tracks List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider">
              DANH SÁCH TRACKS ĐƯỢC CHỈ ĐỊNH
            </h2>
            <span className="font-mono text-xs text-[#859398]">
              Chất lượng đánh giá được kiểm toán độc lập
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center font-mono text-xs text-[#859398] animate-pulse">
              ĐANG TRUY XUẤT DỮ LIỆU HẠNG MỤC...
            </div>
          ) : assignedTracks.length === 0 ? (
            <div className="p-12 bg-[#080f11] border border-[#3c494d] text-center space-y-3">
              <p className="font-mono text-xs text-[#859398]">
                Bạn hiện chưa được phân công chấm điểm cho Hạng mục nào trong sự kiện này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignedTracks.map((track) => {
                const progressPct =
                  track.totalSubmissions > 0
                    ? Math.round(((track.totalSubmissions - track.pendingSubmissions) / track.totalSubmissions) * 100)
                    : 0;

                return (
                  <div
                    key={track.trackId}
                    className="bg-[#080f11] border border-[#3c494d] hover:border-[#ffbb2a] transition-all p-6 relative flex flex-col justify-between group glow-box-amber"
                  >
                    <div className="corner-accent-tl text-[#ffbb2a]" />
                    <div className="corner-accent-tr text-[#ffbb2a]" />
                    <div className="corner-accent-bl text-[#ffbb2a]" />
                    <div className="corner-accent-br text-[#ffbb2a]" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-[#ffbb2a] font-bold px-2 py-0.5 bg-[#ffbb2a]/10 border border-[#ffbb2a]/30">
                          {(track as any).trackCode || "TRACK"}
                        </span>
                        <span className="font-mono text-xs text-[#bbc9ce]">
                          {track.eventName}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display font-bold text-xl text-white group-hover:text-[#ffbb2a] transition-colors">
                          {track.trackName}
                        </h3>
                        <p className="font-mono text-xs text-[#859398] mt-1 line-clamp-2">
                          {(track as any).description || "Hạng mục thi đấu chuyên môn được chấm điểm theo tiêu chí RBL."}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between text-[#bbc9ce]">
                          <span className="text-[11px] text-[#859398]">TIẾN ĐỘ CHẤM:</span>
                          <span className="text-[#ffbb2a] font-bold">
                            {track.totalSubmissions - track.pendingSubmissions} / {track.totalSubmissions} BÀI ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#161d1f] border border-[#3c494d] overflow-hidden">
                          <div
                            className="h-full bg-[#ffbb2a] transition-all duration-300 shadow-[0_0_8px_rgba(255,187,42,0.6)]"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 mt-4 border-t border-[#3c494d]/60 flex items-center justify-between">
                      <span className="font-mono text-xs text-[#f59e0b]">
                        {track.pendingSubmissions} bài nộp chờ chấm
                      </span>
                      <Link href={`/judge/tracks/${track.trackId}/teams`}>
                        <button className="px-4 py-2 bg-transparent border border-[#ffbb2a]/40 text-[#ffbb2a] font-mono text-xs font-bold uppercase hover:bg-[#ffbb2a] hover:text-[#080f11] transition-all flex items-center gap-1.5 cursor-pointer hud-clipped">
                          <span>MỞ DANH SÁCH BÀI NỘP</span>
                          <ArrowRight className="w-3.5 h-3.5" />
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
