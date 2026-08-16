"use client";

import React from "react";
import { Button, Card, Badge } from "@/components/ui";
import { useMyAssignedJudgeTracks } from "@/viewModels/useMyAssignedJudgeTracks";
import { Award, CheckCircle2, Clock, ArrowRight, ShieldCheck, FileCheck2 } from "lucide-react";
import Link from "next/link";

export const JudgeTracksView: React.FC = () => {
  const { assignedTracks, isLoading } = useMyAssignedJudgeTracks();

  const totalAssigned = assignedTracks.length;
  const totalPendingScoring = assignedTracks.reduce((acc, t) => acc + t.pendingSubmissions, 0);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent-judge)] mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>HỘI ĐỒNG GIÁM KHẢO RBL (PURE EVALUATION WORKSPACE)</span>
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-wider">
              Danh Sách Hạng Mục Đã Phân Công Chấm Điểm
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              Chọn Hạng mục Track công nghệ để tiến hành chấm điểm minh bạch theo tiêu chí RBL.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/judge/scoring">
              <Button variant="primary" accent="judge" className="hud-glow-gold flex items-center gap-2">
                <FileCheck2 className="w-4 h-4" /> BÀN CHẤM ĐIỂM TRỰC TIẾP &gt;
              </Button>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hud-glow-gold p-5 space-y-2">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Hạng Mục Thi Đang Phụ Trách
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[var(--accent-judge)]">
                {isLoading ? "..." : totalAssigned}
              </span>
              <Award className="w-6 h-6 text-[var(--accent-judge)] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] block">
              Phân công trực tiếp từ Ban Tổ Chức
            </span>
          </Card>

          <Card className="hud-glow-cyan p-5 space-y-2">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Bài Nộp Cần Chấm (Pending)
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[var(--color-warning)]">
                {isLoading ? "..." : totalPendingScoring}
              </span>
              <Clock className="w-6 h-6 text-[var(--color-warning)] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--color-warning)] block">
              ● Cần hoàn tất trước hạn khoá cổng
            </span>
          </Card>

          <Card className="hud-glow-green p-5 space-y-2">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Tiêu Chí Đánh Giá RBL
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-3xl text-[var(--color-success)]">
                100%
              </span>
              <CheckCircle2 className="w-6 h-6 text-[var(--color-success)] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] block">
              Tự động tính toán Delta Inter-rater
            </span>
          </Card>
        </div>

        {/* Assigned Tracks Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider">
              Hạng Mục Track Được Phân Công
            </h2>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              Chất lượng đánh giá được kiểm toán độc lập
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {assignedTracks.map((item) => (
              <div
                key={item.trackId}
                className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-6 hud-clipped flex flex-col justify-between space-y-6 hover:border-[var(--accent-judge)]/60 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[var(--accent-judge)] font-bold uppercase">
                      {item.season} {"//"} {item.roundName}
                    </span>
                    <Badge tone={item.status === "IN_PROGRESS" ? "judge" : "warning"}>
                      {item.status === "IN_PROGRESS" ? "ĐANG CHẤM" : "CHỜ CHẤM"}
                    </Badge>
                  </div>

                  <h3 className="font-display font-bold text-xl text-[var(--text-primary)]">
                    {item.trackName}
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-muted)]">
                    Cuộc thi: <strong className="text-[var(--text-primary)]">{item.eventName}</strong>
                  </p>
                </div>

                {/* Submissions Stats Strip */}
                <div className="grid grid-cols-3 gap-2 bg-[var(--bg-input)] p-3 border border-[var(--border-muted)] font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">Tổng bài</span>
                    <strong className="text-[var(--text-primary)] text-sm">{item.totalSubmissions}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">Đã chấm</span>
                    <strong className="text-[var(--color-success)] text-sm">{item.scoredSubmissions}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase block">Còn lại</span>
                    <strong className="text-[var(--color-warning)] text-sm">{item.pendingSubmissions}</strong>
                  </div>
                </div>

                <div className="border-t border-[var(--border-muted)] pt-4 flex items-center justify-between">
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    Mã phân công: <span className="text-[var(--accent-judge)] font-bold">{item.trackId}</span>
                  </span>

                  <Link href={`/judge/scoring?trackId=${item.trackId}`}>
                    <Button variant="primary" accent="judge" className="font-mono text-xs flex items-center gap-1.5">
                      <span>VÀO BÀN CHẤM</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};
