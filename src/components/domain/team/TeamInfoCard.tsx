"use client";

import { Card } from "@/components/ui";
import type { TeamView } from "./types";

interface Props {
  team: TeamView;
  memberCount: number;
  isLeader: boolean;
}

export function TeamInfoCard({ team, memberCount, isLeader }: Props) {
  const rows = [
    { label: "Sự kiện", value: team.eventName },
    {
      label: "Ngày tạo",
      value: team.createdTime ? new Date(team.createdTime).toLocaleDateString("vi-VN") : "—",
    },
    { label: "Thành viên", value: `${memberCount} người` },
    { label: "Vai trò của bạn", value: isLeader ? "Đội trưởng" : "Thành viên" },
    { label: "Mã đội", value: team.id },
  ];

  return (
    <Card className="p-0">
      <h2 className="border-b border-[var(--border-muted)] px-[var(--space-lg)] py-[var(--space-md)] font-mono text-sm font-bold uppercase tracking-wider text-[color:var(--text-primary)]">
        Thông tin đội
      </h2>
      <dl className="px-[var(--space-lg)] py-[var(--space-sm)]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-[var(--space-md)] border-b border-[var(--border-muted)]/50 py-[var(--space-sm)] last:border-0"
          >
            <dt className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
              {row.label}
            </dt>
            <dd
              className="truncate font-mono text-xs tabular-nums text-[color:var(--text-primary)]"
              title={row.value}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
