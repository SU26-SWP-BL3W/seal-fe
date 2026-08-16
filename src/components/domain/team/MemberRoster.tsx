"use client";

import { Badge, Card, SkeletonRows } from "@/components/ui";
import type { MemberItem } from "@/viewModels/teamTypes";
import { MAX_MEMBERS, MIN_MEMBERS } from "./teamStatus";

interface Props {
  members: MemberItem[];
  currentUserId: string;
  isLeader: boolean;
  isLoading?: boolean;
  onTransfer: (userId: string, name: string) => void;
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function MemberRow({
  member,
  isCurrentUser,
  isLeader,
  onTransfer,
}: {
  member: MemberItem;
  isCurrentUser: boolean;
  isLeader: boolean;
  onTransfer: (userId: string, name: string) => void;
}) {
  return (
    <li
      className={`flex items-center gap-[var(--space-md)] border-b border-[var(--border-muted)] px-[var(--space-lg)] py-[var(--space-md)] last:border-0 ${
        isCurrentUser ? "bg-[var(--accent-team)]/5" : ""
      }`}
    >
      <div
        className={`hud-clipped flex size-10 shrink-0 items-center justify-center border font-mono text-sm font-bold ${
          member.roleName === "TeamLeader"
            ? "border-[var(--accent-team)]/40 bg-[var(--accent-team)]/15 text-[color:var(--accent-team)]"
            : "border-[var(--border-muted)] bg-[var(--bg-input)] text-[color:var(--text-muted)]"
        }`}
      >
        {initialsOf(member.fullName)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-[var(--space-xs)]">
          <span className="truncate font-mono text-sm font-semibold text-[color:var(--text-primary)]">
            {member.fullName}
          </span>
          {member.roleName === "TeamLeader" && <Badge tone="team">Đội trưởng</Badge>}
          {isCurrentUser && <Badge tone="neutral">Bạn</Badge>}
        </div>
        <div className="truncate font-mono text-[11px] text-[color:var(--text-muted)]">{member.email}</div>
        {member.school && (
          <div className="truncate font-mono text-[10px] text-[color:var(--text-muted)]/60">{member.school}</div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-[var(--space-xs)]">
        <Badge tone={member.hasStudentProfile ? "success" : "danger"}>
          {member.hasStudentProfile ? "Đã nộp hồ sơ" : "Chưa nộp hồ sơ"}
        </Badge>
        {isLeader && !isCurrentUser && member.roleName !== "TeamLeader" && (
          <button
            type="button"
            onClick={() => onTransfer(member.userId, member.fullName)}
            className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)] underline underline-offset-2 hover:text-[color:var(--accent-team)]"
          >
            Giao quyền đội trưởng
          </button>
        )}
      </div>
    </li>
  );
}

export function MemberRoster({ members, currentUserId, isLeader, isLoading = false, onTransfer }: Props) {
  const count = members.length;
  const isEnough = count >= MIN_MEMBERS && count <= MAX_MEMBERS;

  return (
    <Card className="p-0">
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-sm)] border-b border-[var(--border-muted)] px-[var(--space-lg)] py-[var(--space-md)]">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-[color:var(--text-primary)]">
          Thành viên
        </h2>
        <div className="flex items-center gap-[var(--space-sm)]">
          <div className="h-1.5 w-28 bg-[var(--bg-input)]" aria-hidden="true">
            <div
              className="h-full bg-[var(--accent-team)]"
              style={{ width: `${Math.min((count / MAX_MEMBERS) * 100, 100)}%` }}
            />
          </div>
          <span
            className={`font-mono text-sm font-bold tabular-nums ${
              isEnough ? "text-[color:var(--color-success)]" : "text-[color:var(--color-warning)]"
            }`}
          >
            {count}/{MAX_MEMBERS}
          </span>
        </div>
      </div>

      {isLoading ? (
        <SkeletonRows rows={3} className="p-[var(--space-lg)]" />
      ) : count === 0 ? (
        <p className="px-[var(--space-lg)] py-[var(--space-xl)] text-center font-mono text-xs text-pretty text-[color:var(--text-muted)]">
          Chưa có thành viên nào. Mời đồng đội bằng email ở panel bên cạnh.
        </p>
      ) : (
        <ul>
          {members.map((m) => (
            <MemberRow
              key={m.userId}
              member={m}
              isCurrentUser={m.userId === currentUserId}
              isLeader={isLeader}
              onTransfer={onTransfer}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
