"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { Link } from "@/i18n/routing";
import {
  ShieldAlert,
  ArrowLeft,
  Scale,
  FileCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export function JudgeTrackTeamsView() {
  const params = useParams();
  const trackId = (params?.trackId as string) || "";
  const { user, activeRole, loginAsDemoRole } = useAuth();
  const eventId = activeRole?.eventId || activeRole?.EventId || "";

  const { data: tracks = [] } = useGetTracksByEvent(eventId || undefined);
  const currentTrack = tracks.find((t) => (t.id || t.Id) === trackId);
  const trackName = currentTrack?.trackName || (currentTrack as any)?.TrackName || "Hạng mục đánh giá";

  const { data: submissions = [], isLoading: isLoadingSubs } = useGetSubmitResultsByTrack(trackId, eventId);
  const eventRoleId = activeRole?.id || activeRole?.eventRoleId || "";

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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0e1417] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-[#ffbb2a] selection:text-[#080f11]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Link & Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#3c494d] pb-4 gap-4">
          <div>
            <Link
              href="/judge/tracks"
              className="inline-flex items-center gap-2 text-xs font-mono text-[#859398] hover:text-[#ffbb2a] mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> TRỞ VỀ DANH SÁCH HẠNG MỤC
            </Link>
            <div className="font-mono text-[11px] text-[#ffbb2a] mb-1 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-3.5 h-3.5" />
              <span>// ANONYMIZED_SUBMISSION_STREAM / {trackName}</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase">
              DANH SÁCH BÀI NỘP ẨN DANH (BR-12)
            </h1>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-[#161d1f] border border-[#3c494d] px-3 py-1.5 text-[#bbc9ce]">
              TỔNG BÀI NỘP: <span className="text-[#ffbb2a] font-bold">{submissions.length}</span>
            </div>
          </div>
        </div>

        {/* Security Notice Banner */}
        <div className="bg-[#ffbb2a]/10 border border-[#ffbb2a] text-[#ffbb2a] p-4 font-mono text-xs flex items-center justify-between glow-box-amber">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider block">
                ANONYMOUS EVALUATION PROTOCOL (BR-12 ACTIVE)
              </span>
              <span className="text-[11px] text-[#dde4e6] opacity-90">
                Theo quy chế thi đấu, Giám khảo chỉ được tương tác với mã định danh bài nộp ẩn danh. Tên đội thi, tên thí sinh và trường học đã được mã hóa bảo vệ.
              </span>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-[#080f11] border border-[#3c494d] relative glow-box-amber overflow-hidden">
          <div className="corner-accent-tl text-[#ffbb2a]" />
          <div className="corner-accent-tr text-[#ffbb2a]" />
          <div className="corner-accent-bl text-[#ffbb2a]" />
          <div className="corner-accent-br text-[#ffbb2a]" />

          <div className="p-4 border-b border-[#3c494d] flex items-center justify-between bg-[#161d1f]/50">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ffbb2a] inline-block" />
              [ SUBMISSION_DATA_STREAM ]
            </span>
            <span className="font-mono text-[11px] text-[#859398]">
              CẬP NHẬT THỜI GIAN THỰC
            </span>
          </div>

          {isLoadingSubs ? (
            <div className="p-12 text-center font-mono text-xs text-[#859398] animate-pulse">
              ĐANG TẢI BÀI NỘP ẨN DANH...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center space-y-3 font-mono text-xs text-[#859398]">
              <AlertTriangle className="w-8 h-8 text-[#ffbb2a] mx-auto" />
              <p>Chưa có bài nộp nào được ghi nhận trong Hạng mục này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#161d1f] border-b border-[#3c494d] text-[#859398] uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">MÃ BÀI NỘP</th>
                    <th className="py-3 px-4">VÒNG THI</th>
                    <th className="py-3 px-4">THỜI GIAN NỘP</th>
                    <th className="py-3 px-4">TÀI NGUYÊN DỰ ÁN</th>
                    <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                    <th className="py-3 px-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3c494d]/40">
                  {submissions.map((sub, idx) => {
                    const subId = sub.id || sub.Id || "";
                    const code = `SUB-${subId.slice(0, 8).toUpperCase()}`;
                    const roundName = (sub as any)?.roundName || "Vòng Đánh Giá";
                    const submitTime = (sub as any)?.submittedAt || (sub as any)?.createdAt || (sub as any)?.createdTime;
                    const isEvaluated = (sub as any)?.isEvaluated || false;

                    return (
                      <tr
                        key={subId}
                        className="hover:bg-[#161d1f]/70 transition-colors group"
                      >
                        <td className="py-3 px-4 text-[#859398]">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white tracking-wider flex items-center gap-2">
                          <span className="text-[#ffbb2a]">{code}</span>
                        </td>
                        <td className="py-3 px-4 text-[#bbc9ce]">{roundName}</td>
                        <td className="py-3 px-4 text-[#859398]">
                          {submitTime ? new Date(submitTime).toLocaleString("vi-VN") : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {sub.repoUrl && (
                              <a
                                href={sub.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 bg-[#161d1f] border border-[#3c494d] text-[#00d9ff] hover:border-[#00d9ff] transition-colors inline-flex items-center gap-1 text-[10px]"
                                title="Repository"
                              >
                                Repo <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {sub.demoUrl && (
                              <a
                                href={sub.demoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 bg-[#161d1f] border border-[#3c494d] text-[#10b981] hover:border-[#10b981] transition-colors inline-flex items-center gap-1 text-[10px]"
                                title="Live Demo"
                              >
                                Demo <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {sub.slideUrl && (
                              <a
                                href={sub.slideUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 bg-[#161d1f] border border-[#3c494d] text-[#c084fc] hover:border-[#c084fc] transition-colors inline-flex items-center gap-1 text-[10px]"
                                title="Slides"
                              >
                                Slide <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isEvaluated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30 font-bold text-[10px] uppercase">
                              <CheckCircle2 className="w-3 h-3" /> ĐÃ CHỐT ĐIỂM
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ffbb2a]/10 text-[#ffbb2a] border border-[#ffbb2a]/30 font-bold text-[10px] uppercase">
                              <Clock className="w-3 h-3" /> CHỜ ĐÁNH GIÁ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/judge/scoring?subId=${subId}`}>
                            <button className="px-3 py-1.5 bg-[#ffbb2a] text-[#080f11] font-bold text-xs uppercase hover:bg-white transition-colors inline-flex items-center gap-1 cursor-pointer hud-clipped">
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>// CHẤM ĐIỂM &gt;</span>
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
