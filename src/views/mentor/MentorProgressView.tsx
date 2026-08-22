"use client";

import React from "react";
import { Button, Card, Input } from "@/components/ui";
import { Search, Shield, RefreshCw, BarChart2 } from "lucide-react";
import { useMentorProgressViewModel } from "@/viewModels/mentor/useMentorProgressViewModel";

export function MentorProgressView() {
  const { state, data, actions } = useMentorProgressViewModel();
  const { inputTeamId, isLoading } = state;
  const { scoreBreakdown, user } = data;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] font-mono text-xs text-[var(--text-muted)]">
        Vui lòng đăng nhập với tài khoản Mentor...
      </div>
    );
  }

  return (
    <div className="p-[var(--space-xl)] max-w-[var(--container-max)] mx-auto hud-lattice min-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-[var(--border-muted)] pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[rgba(167,139,250,0.1)] border border-[var(--accent-mentor)]/30 flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-[var(--accent-mentor)]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-[var(--accent-mentor)] tracking-widest uppercase">
              THEO DÕI TIẾN ĐỘ ĐỘI THI (MENTOR PROGRESS)
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Tra cứu bảng phân rã điểm số và tiến độ của các đội thi
            </p>
          </div>
        </div>

        <form onSubmit={actions.handleSearch} className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Mã đội thi (VD: team-1)"
            value={inputTeamId}
            onChange={(e) => actions.setInputTeamId(e.target.value)}
            className="w-48 text-xs font-mono"
          />
          <Button type="submit" variant="ghost" className="text-xs flex items-center gap-1">
            <Search className="w-3.5 h-3.5" /> Tra cứu
          </Button>
        </form>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent-mentor)]" />
          </div>
        ) : !scoreBreakdown ? (
          <Card className="p-12 text-center text-xs font-mono text-[var(--text-muted)] hud-clipped border-[var(--border-muted)]">
            <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
            Nhập mã Đội thi để tra cứu bảng phân rã điểm số theo từng tiêu chí.
          </Card>
        ) : (
          <Card className="p-6 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-4">
              <div>
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                  ĐỘI THI THAM GIA
                </span>
                <h2 className="font-display font-bold text-xl text-[var(--text-primary)] uppercase">
                  {scoreBreakdown.teamName || `Đội #${scoreBreakdown.teamId}`}
                </h2>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  Hạng mục: {scoreBreakdown.trackName || "AI & Data Science"}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">
                  TỔNG ĐIỂM TRUNG BÌNH
                </span>
                <span className="font-mono text-3xl font-bold text-[var(--accent-mentor)]">
                  {scoreBreakdown.totalScore} / 10
                </span>
              </div>
            </div>

            {/* Criteria Breakdown List */}
            <div className="space-y-4">
              <h3 className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                PHÂN RÃ ĐIỂM SỐ THEO TIÊU CHÍ (CRITERIA BREAKDOWN)
              </h3>

              {scoreBreakdown.details?.map((item: any) => (
                <div
                  key={item.criteriaId}
                  className="p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] hud-clipped space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-[var(--text-primary)]">{item.criteriaName}</span>
                    <span className="text-[var(--accent-mentor)] font-bold">
                      {item.scoreValue} / {item.maxScore} (Trọng số: {item.weight}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-[var(--bg-base)] border border-[var(--border-muted)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-mentor)] transition-all duration-300"
                      style={{ width: `${(item.scoreValue / item.maxScore) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
