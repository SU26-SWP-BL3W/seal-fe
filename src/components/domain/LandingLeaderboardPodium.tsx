"use client";

import { ApiMissingDataBadge } from "@/components/ui";
import type { PrizeItem } from "@/viewModels/eventsMetadata";

/** Tiền thưởng của 1 đội tại 1 hạng cụ thể (từ FinalResult/AssignPrize) — số thật, khác Event.Prize.Value (text tự do). */
function formatVnd(val: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(val)} ₫`;
}

type PodiumTeam = {
  rank?: number;
  eventName?: string;
  season?: string;
  teamName?: string;
  projectName?: string;
  track?: string;
  prizeTitle?: string;
  prizeVnd?: number;
  school?: string;
  score?: number;
};

function PodiumCard({
  team,
  rank,
  isCenter,
}: {
  team: PodiumTeam;
  rank: 1 | 2 | 3;
  isCenter?: boolean;
}) {
  const cfg = {
    1: {
      label: "Quán quân",
      numberColor: "text-[var(--accent-judge)]",
      borderColor: "border-[var(--accent-judge)]/40",
      prizeColor: "text-[var(--accent-judge)]",
      prizeZoneBg: "bg-[var(--accent-judge)]/8 border-[var(--accent-judge)]/25",
      tagBorder: "border-[var(--accent-judge)]/30 text-[var(--accent-judge)]",
      numStr: "1",
    },
    2: {
      label: "Á quân 1",
      numberColor: "text-[var(--accent-team)]",
      borderColor: "border-[var(--accent-team)]/30",
      prizeColor: "text-[var(--accent-team)]",
      prizeZoneBg: "bg-[var(--accent-team)]/8 border-[var(--border-muted)]",
      tagBorder: "border-[var(--border-muted)] text-[var(--text-muted)]",
      numStr: "2",
    },
    3: {
      label: "Á quân 2",
      numberColor: "text-[var(--color-warning)]",
      borderColor: "border-[var(--color-warning)]/30",
      prizeColor: "text-[var(--color-warning)]",
      prizeZoneBg: "bg-[var(--color-warning)]/8 border-[var(--border-muted)]",
      tagBorder: "border-[var(--border-muted)] text-[var(--text-muted)]",
      numStr: "3",
    },
  }[rank];

  return (
    <article
      className={`relative flex flex-col rounded-lg border bg-[var(--bg-panel)] px-5 pb-5 transition-transform duration-200 hover:-translate-y-0.5 ${cfg.borderColor} ${
        isCenter ? "pt-8" : "pt-5"
      }`}
    >
      {isCenter && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-md bg-[var(--accent-judge)] px-3 py-0.5 text-[11px] font-semibold text-[var(--bg-base)]">
          Quán quân
        </div>
      )}

      <div className="mb-3 text-center">
        <p className="text-[11px] text-[var(--text-muted)]">
          {team.eventName}
          {team.season ? ` · ${team.season}` : ""}
        </p>
        <p className={`mt-0.5 text-xs font-medium ${cfg.numberColor}`}>{cfg.label}</p>
      </div>

      <div className="mb-3 flex justify-center">
        <div
          className={`flex items-center justify-center rounded-lg border bg-[var(--bg-input)] font-display font-semibold ${cfg.numberColor} ${cfg.borderColor} ${
            isCenter ? "h-14 w-14 text-2xl" : "h-11 w-11 text-xl"
          }`}
        >
          {cfg.numStr}
        </div>
      </div>

      <div className="mb-2 text-center">
        <h3
          className={`font-display font-semibold text-[var(--text-primary)] ${
            isCenter ? "text-xl" : "text-base"
          }`}
        >
          {team.teamName}
        </h3>
        {team.projectName && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{team.projectName}</p>
        )}
        {team.track && (
          <span
            className={`mt-1.5 inline-block rounded-md border px-2 py-0.5 text-[11px] ${cfg.tagBorder}`}
          >
            {team.track}
          </span>
        )}
      </div>

      <div className={`mt-3 w-full rounded-md border px-3 py-2.5 text-center ${cfg.prizeZoneBg}`}>
        <span className="mb-0.5 block text-[11px] text-[var(--text-muted)]">
          Tiền thưởng {team.prizeTitle}
        </span>
        <span
          className={`font-display font-semibold tabular-nums ${isCenter ? "text-lg" : "text-sm"} ${cfg.prizeColor}`}
        >
          {formatVnd(team.prizeVnd ?? 0)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-[var(--text-muted)]">{team.school}</span>
        <span className="font-semibold tabular-nums text-[var(--accent-judge)]">
          {team.score} / 10
        </span>
      </div>
    </article>
  );
}

interface LandingLeaderboardPodiumProps {
  eventName?: string;
  season?: string;
  prizes?: PrizeItem[];
  podiumTeams?: PodiumTeam[];
}

export function LandingLeaderboardPodium({
  eventName = "SEAL Hackathon 2026",
  season = "Mùa giải 2026",
  prizes = [],
  podiumTeams = [],
}: LandingLeaderboardPodiumProps) {
  const gold = podiumTeams.find((t) => t.rank === 1) || podiumTeams[0];
  const silver = podiumTeams.find((t) => t.rank === 2) || podiumTeams[1];
  const bronze = podiumTeams.find((t) => t.rank === 3) || podiumTeams[2];

  return (
    <section className="border-t border-[var(--border-muted)] bg-[var(--bg-panel)]/30 px-4 py-14 sm:px-6 md:py-16">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-10">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-[var(--accent-judge)]">Bảng vàng</p>
          <h2 className="font-display text-2xl font-semibold text-[var(--text-primary)] md:text-3xl">
            Vinh danh {season}
          </h2>
          {prizes.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-[var(--accent-judge)]">
              {prizes.map((p) => (
                <span key={p.id}>
                  {p.prizeName}: <strong>{p.value}</strong>
                </span>
              ))}
            </div>
          )}
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">
            Kết quả chính thức từ <span className="text-[var(--text-primary)]">{eventName}</span>
          </p>
        </div>

        {!gold && !silver && !bronze ? (
          <ApiMissingDataBadge
            title="Chưa có dữ liệu bảng vàng"
            message="Chưa có kết quả vinh danh quán quân / á quân được công bố."
          />
        ) : (
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
            {silver && (
              <div className="md:order-1">
                <PodiumCard team={silver} rank={2} />
              </div>
            )}
            {gold && (
              <div className="md:order-2 md:-mb-1">
                <PodiumCard team={gold} rank={1} isCenter />
              </div>
            )}
            {bronze && (
              <div className="md:order-3">
                <PodiumCard team={bronze} rank={3} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
