"use client";

import { Link } from "@/i18n/routing";
import { useMyAssignedTracks } from "@/viewModels/useMyAssignedTracks";
import { Card, Button } from "@/components/ui";
import { Target, Users, RefreshCw, Compass, Info } from "lucide-react";

export function MentorTracksView() {
  const { myTracks, isLoading, refetch } = useMyAssignedTracks();

  return (
    <div className="hud-lattice min-h-[calc(100vh-4rem)]">
      <div className="max-w-[var(--container-max)] mx-auto px-6 py-8 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-muted)]">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--accent-mentor)] tracking-widest uppercase font-bold">
              <Compass className="w-3.5 h-3.5" />
              MENTOR WORKSPACE
            </div>
            <h1 className="font-display text-3xl font-extrabold uppercase tracking-wide text-[var(--text-primary)] mt-1">
              Hạng Mục Được Phân Công
            </h1>
            <p className="font-mono text-xs text-[var(--text-muted)] mt-1">
              Các Hạng mục (Track) bạn đang giữ vai trò Cố vấn chuyên môn.
            </p>
          </div>
          <Button variant="ghost" accent="mentor" onClick={() => refetch()} className="text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <svg className="w-12 h-12 animate-spin" viewBox="0 0 100 100">
              <polygon
                points="50,5 91,27.5 91,72.5 50,95 9,72.5 9,27.5"
                fill="none"
                stroke="var(--accent-mentor)"
                strokeWidth="2"
                strokeDasharray="240"
                strokeDashoffset="60"
              />
            </svg>
          </div>
        ) : myTracks.length === 0 ? (
          <Card className="p-10 bg-[var(--bg-panel)] border-[var(--border-muted)] hud-clipped text-center flex flex-col items-center gap-3">
            <Info className="w-8 h-8 text-[var(--text-muted)] opacity-60" />
            <p className="font-mono text-sm text-[var(--text-muted)] tracking-wide">
              Bạn chưa được phân công Cố vấn cho Hạng mục nào trong sự kiện hiện tại.
            </p>
            <p className="font-mono text-[11px] text-[var(--text-muted)] opacity-70">
              Event Coordinator cần gán bạn vào Track qua trang Phân Công Nhân Sự trước.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {myTracks.map((track) => {
              const trackId = track.id || track.Id || "";
              const trackName = track.trackName || track.TrackName || "Hạng mục";
              const description = track.description || track.Description || "";
              const judges = track.judges || track.Judges || [];
              const mentors = track.mentors || track.Mentors || [];

              return (
                <Card
                  key={trackId}
                  className="p-6 bg-[var(--bg-panel)] border-[var(--accent-mentor)]/40 hud-clipped flex flex-col gap-4 hover:border-[var(--accent-mentor)] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Target className="w-5 h-5 text-[var(--accent-mentor)]" />
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">#{trackId}</span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">{trackName}</h3>

                  {description && (
                    <p className="font-sans text-xs text-[var(--text-muted)] leading-relaxed min-h-[48px]">
                      {description}
                    </p>
                  )}

                  <div className="pt-3 border-t border-[var(--border-muted)]/60 font-mono text-xs flex flex-col gap-1">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase">Cố vấn cùng phụ trách:</span>
                    <span className="text-[var(--text-primary)]">
                      {mentors.length > 0
                        ? mentors.map((m) => m.fullName || m.FullName).join(", ")
                        : "Chỉ mình bạn"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase mt-1">Giám khảo phụ trách:</span>
                    <span className="text-[var(--text-primary)]">
                      {judges.length > 0 ? judges.map((j) => j.fullName || j.FullName).join(", ") : "Chưa phân công"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link href="/mentor/teams">
                      <Button variant="secondary" accent="mentor" className="w-full justify-center text-[11px]">
                        <Users className="w-3.5 h-3.5" /> Đội thi
                      </Button>
                    </Link>
                    <Link href="/mentor/submissions">
                      <Button variant="secondary" accent="mentor" className="w-full justify-center text-[11px]">
                        Bài nộp
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
