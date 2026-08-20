"use client";

import { ApiMissingDataBadge } from "@/components/ui";
import type { PrizeItem } from "@/viewModels/eventsMetadata";

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

function PodiumRow({
  team,
  rank,
}: {
  team: PodiumTeam;
  rank: 1 | 2 | 3;
}) {
  const label = rank === 1 ? "Quán quân" : rank === 2 ? "Á quân 1" : "Á quân 2";
  const accent =
    rank === 1
      ? "text-[var(--accent-judge)]"
      : rank === 2
        ? "text-[var(--accent-team)]"
        : "text-[var(--color-warning)]";

  return (
    <article className="grid grid-cols-1 gap-4 border-b border-[var(--border-muted)] py-8 last:border-b-0 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-8">
      <span className={`font-display text-3xl font-semibold tabular-nums ${accent}`}>
        {String(rank).padStart(2, "0")}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${accent}`}>{label}</p>
        <h3 className="mt-1 font-display text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
          {team.teamName}
        </h3>
        {team.projectName && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{team.projectName}</p>
        )}
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {[team.track, team.school, team.eventName].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="sm:text-right">
        <p className="text-xs text-[var(--text-muted)]">Tiền thưởng {team.prizeTitle}</p>
        <p className={`mt-1 font-display text-lg font-semibold tabular-nums ${accent}`}>
          {formatVnd(team.prizeVnd ?? 0)}
        </p>
        {team.score != null && (
          <p className="mt-1 text-sm tabular-nums text-[var(--text-muted)]">{team.score} / 10</p>
        )}
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
  const ordered = [
    gold ? { team: gold, rank: 1 as const } : null,
    silver ? { team: silver, rank: 2 as const } : null,
    bronze ? { team: bronze, rank: 3 as const } : null,
  ].filter(Boolean) as { team: PodiumTeam; rank: 1 | 2 | 3 }[];

  return (
    <section className="border-t border-[var(--border-muted)] px-4 py-20 sm:px-6 md:py-28">
      <div className="mx-auto w-full max-w-[var(--container-max)]">
        <div className="max-w-xl">
          <p className="landing-section-kicker text-sm font-medium text-[var(--accent-judge)]">
            Bảng vàng
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-[var(--text-primary)] md:text-4xl">
            Vinh danh {season}
          </h2>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Kết quả chính thức từ <span className="text-[var(--text-primary)]">{eventName}</span>
          </p>
          {prizes.length > 0 && (
            <p className="mt-2 text-sm text-[var(--accent-judge)]">
              {prizes.map((p) => `${p.prizeName}: ${p.value}`).join(" · ")}
            </p>
          )}
        </div>

        {!gold && !silver && !bronze ? (
          <div className="mt-12">
            <ApiMissingDataBadge
              title="Chưa có dữ liệu bảng vàng"
              message="Chưa có kết quả vinh danh quán quân / á quân được công bố."
            />
          </div>
        ) : (
          <div className="mt-12 border-t border-[var(--border-muted)]">
            {ordered.map(({ team, rank }) => (
              <PodiumRow key={rank} team={team} rank={rank} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
