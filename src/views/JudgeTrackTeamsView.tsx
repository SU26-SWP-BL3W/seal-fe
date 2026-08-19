"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useGetSubmitResultsByTrack } from "@/repositories/submitResultsRepository";
import { useGetTracksByEvent } from "@/repositories/tracksRepository";
import { useGetScoresByEventRole } from "@/repositories/scoresRepository";
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
  const trackName = currentTrack?.trackName || (currentTrack as any)?.TrackName || "Hạng Mục Chuyên Môn";

  const { data: rawSubmissions = [], isLoading: isLoadingSubs } = useGetSubmitResultsByTrack(trackId, eventId);
  const submissions = useMemo(() => {
    return Array.isArray(rawSubmissions) ? rawSubmissions : [];
  }, [rawSubmissions]);
  const eventRoleId = activeRole?.id || activeRole?.eventRoleId || "";

  // "Đã chốt điểm" thật = có phiếu chấm (Score) với isSubmitted=true cho bài này,
  // không có field isEvaluated/IsGraded nào trên SubmitResult (BE không trả field đó).
  const { data: myScores = [] } = useGetScoresByEventRole(eventRoleId || undefined);
  const submittedIds = useMemo(
    () => new Set(myScores.filter((s) => s.isSubmitted).map((s) => s.submitResultId)),
    [myScores],
  );

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0c1214] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#080e10] border border-amber-500/40 p-8 text-center glow-box-amber relative space-y-4">
          <div className="corner-accent-tl text-amber-400/60" />
          <div className="corner-accent-tr text-amber-400/60" />
          <div className="corner-accent-bl text-amber-400/60" />
          <div className="corner-accent-br text-amber-400/60" />
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
            <Scale className="w-6 h-6" />
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
              className="w-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold py-2.5 uppercase hover:bg-amber-500 hover:text-black transition-all"
            >
              [ Vào Bằng Tài Khoản Giám Khảo Demo ]
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0c1214] text-[#dde4e6] font-sans hex-bg py-8 px-4 md:px-8 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Link & Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <Link
              href="/judge/tracks"
              className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-amber-300 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> TRỞ VỀ DANH SÁCH HẠNG MỤC
            </Link>
            <div className="font-mono text-[11px] text-amber-400 mb-1 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-3.5 h-3.5" />
              <span>HẠNG MỤC / {trackName}</span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase">
              DANH SÁCH BÀI DỰ THI
            </h1>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-[#12191c] border border-zinc-800 px-3 py-1.5 text-zinc-300 rounded">
              TỔNG BÀI NỘP: <span className="text-amber-300 font-bold">{submissions.length}</span>
            </div>
          </div>
        </div>

        {/* Security Notice Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 font-mono text-xs flex items-center justify-between rounded">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
            <div>
              <span className="font-bold uppercase tracking-wider block">
                CHẾ ĐỘ CHẤM ĐIỂM ẨN DANH
              </span>
              <span className="text-[11px] text-zinc-300 opacity-90">
                Theo quy chế thi đấu, thông tin tên đội thi, thành viên và trường học được ẩn danh để đảm bảo tính khách quan và công bằng tuyệt đối.
              </span>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-[#0e1518] border border-zinc-800 relative shadow-sm overflow-hidden rounded">
          <div className="corner-accent-tl text-amber-400/40" />
          <div className="corner-accent-tr text-amber-400/40" />
          <div className="corner-accent-bl text-amber-400/40" />
          <div className="corner-accent-br text-amber-400/40" />

          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#12191c]/80">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400/80 inline-block" />
              <span>DANH SÁCH BÀI LÀM CẦN ĐÁNH GIÁ</span>
            </span>
            <span className="font-mono text-[11px] text-zinc-400">
              CẬP NHẬT THỜI GIAN THỰC
            </span>
          </div>

          {isLoadingSubs ? (
            <div className="p-12 text-center font-mono text-xs text-zinc-500 animate-pulse">
              ĐANG TẢI BÀI NỘP ẨN DANH...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center space-y-3 font-mono text-xs text-zinc-500">
              <AlertTriangle className="w-8 h-8 text-amber-400/50 mx-auto" />
              <p>Chưa có bài nộp nào được ghi nhận trong Hạng mục này.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#12191c] border-b border-zinc-800 text-zinc-400 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">MÃ BÀI NỘP</th>
                    <th className="py-3 px-4">VÒNG THI</th>
                    <th className="py-3 px-4">THỜI GIAN NỘP</th>
                    <th className="py-3 px-4">BÀI NỘP</th>
                    <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                    <th className="py-3 px-4 text-right">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {submissions.map((sub: any, idx: number) => {
                    const subId = sub.id || sub.Id || "";
                    const code = `SUB-${subId.slice(0, 8).toUpperCase()}`;
                    const submissionUrl = sub.submissionUrl || sub.SubmissionUrl || "";
                    const submitTime = sub.createdTime || sub.CreatedTime;
                    const isEvaluated = submittedIds.has(subId);

                    return (
                      <tr
                        key={subId}
                        className="hover:bg-[#141e22] transition-colors group"
                      >
                        <td className="py-3 px-4 text-zinc-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-white tracking-wider flex items-center gap-2">
                          <span className="text-amber-300">{code}</span>
                        </td>
                        <td className="py-3 px-4 text-zinc-300">Vòng Đánh Giá</td>
                        <td className="py-3 px-4 text-zinc-500">
                          {submitTime ? new Date(submitTime).toLocaleString("vi-VN") : "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          {submissionUrl ? (
                            <a
                              href={submissionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 bg-[#12191c] border border-zinc-700 text-cyan-400 hover:border-cyan-400 transition-colors inline-flex items-center gap-1 text-[10px]"
                            >
                              Xem bài nộp <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-zinc-600 text-[10px]">Chưa có link</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isEvaluated ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase">
                              <CheckCircle2 className="w-3 h-3" /> ĐÃ CHỐT ĐIỂM
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold text-[10px] uppercase">
                              <Clock className="w-3 h-3" /> CHỜ ĐÁNH GIÁ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/judge/scoring?subId=${subId}`}>
                            <button className="px-3 py-1.5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-600/20 text-amber-300 border border-amber-500/40 font-bold text-xs uppercase hover:bg-amber-500 hover:text-black transition-all inline-flex items-center gap-1 cursor-pointer shadow-sm">
                              <FileCheck2 className="w-3.5 h-3.5" />
                              <span>CHẤM ĐIỂM &gt;</span>
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

