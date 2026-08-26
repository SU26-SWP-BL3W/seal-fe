"use client";

import { Link } from "@/i18n/routing";
import { Badge, Button } from "@/components/ui";
import { TEAM_STATUS, TONE_TEXT } from "./teamStatus";
import type { TeamView } from "./types";

interface Props {
  team: TeamView;
  isLeader: boolean;
  canConfirm: boolean;
  isLeaving: boolean;
  onConfirmRegistration: () => void;
  onLeave: () => void;
  onEdit?: () => void;
  onOpenInvite?: () => void;
}

// Header một hành động chính duy nhất theo trạng thái đội; mọi lối đi khác
// hạ xuống hàng phụ để không tranh chấp sự chú ý.
export function TeamHeader({
  team,
  isLeader,
  canConfirm,
  isLeaving,
  onConfirmRegistration,
  onLeave,
  onEdit,
  onOpenInvite,
}: Props) {
  const status = TEAM_STATUS[team.status] ?? TEAM_STATUS.Forming;
  const isRegistered = team.status === "Registered" || team.status === "Approved";
  const canRegister = isLeader && (team.status === "Forming" || team.status === "Rejected");

  return (
    <header className="flex flex-col gap-[var(--space-md)] border-b border-[var(--border-muted)] pb-[var(--space-lg)] md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
          Đội thi của tôi
        </div>

        <h1 className="mt-1 truncate font-display text-3xl font-bold uppercase text-balance text-[color:var(--accent-team)]">
          {team.teamName}
        </h1>

        <div className="mt-[var(--space-sm)] flex flex-wrap items-center gap-[var(--space-sm)]">
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone="team">
            {isLeader ? "Đội trưởng" : "Thành viên"}
          </Badge>
          <Link
            href={`/events/${team.eventId}`}
            className="max-w-[16rem] truncate font-mono text-xs text-[color:var(--text-muted)] underline-offset-4 hover:text-[color:var(--accent-team)] hover:underline"
          >
            {team.eventName}
          </Link>
        </div>

        <p className={`mt-[var(--space-sm)] max-w-xl font-mono text-xs text-pretty ${TONE_TEXT[status.tone]}`}>
          {status.hint}
        </p>

        {team.description && (
          <p className="mt-[var(--space-xs)] max-w-xl font-mono text-xs text-pretty text-[color:var(--text-muted)]">
            {team.description}
          </p>
        )}
      </div>

      <div className="flex flex-col items-stretch gap-[var(--space-sm)] md:items-end">
        {canRegister && (
          <Button
            id="confirm-registration-btn"
            accent="team"
            onClick={onConfirmRegistration}
            disabled={!canConfirm}
            title={canConfirm ? undefined : "Chưa đủ điều kiện — xem danh sách bên dưới"}
          >
            Ghi danh với BTC
          </Button>
        )}

        {isRegistered && (
          <Link href={team.eventId ? `/submissions/new?eventId=${team.eventId}` : "/submissions/new"}>
            <Button id="submit-project-btn" accent="team" className="w-full">
              Nộp bài thi
            </Button>
          </Link>
        )}

        <div className="flex flex-wrap gap-[var(--space-xs)] md:justify-end">
          {isLeader && (team.status === "Forming" || team.status === "Rejected") && onOpenInvite && (
            <Button
              variant="ghost"
              accent="team"
              className="text-xs font-bold border border-[var(--accent-team)]/40 bg-[var(--accent-team)]/10"
              onClick={onOpenInvite}
            >
              Mời thành viên
            </Button>
          )}
          {team.status === "Registered" && isLeader && (
            <Link href={team.eventId ? `/submissions/new?eventId=${team.eventId}` : "/submissions/new"}>
              <Button
                id="submit-project-btn"
                variant="primary"
                accent="team"
                className="text-xs font-bold shadow-[0_0_15px_rgba(56,189,248,0.3)] bg-[var(--accent-team)] text-black hover:bg-white"
              >
                + Nộp bài thi
              </Button>
            </Link>
          )}
          <Link href={team.eventId ? `/my-submissions?eventId=${team.eventId}` : "/my-submissions"}>
            <Button id="view-submissions-btn" variant="ghost" accent="team" className="text-xs">
              Quản lý bài nộp
            </Button>
          </Link>
          <Link href={`/events/${team.eventId}/leaderboard`}>
            <Button variant="ghost" accent="team" className="text-xs">
              Bảng xếp hạng
            </Button>
          </Link>
          {isLeader && (team.status === "Forming" || team.status === "Rejected") && onEdit && (
            <Button variant="ghost" accent="team" className="text-xs" onClick={onEdit}>
              Sửa thông tin
            </Button>
          )}
          {!isLeader && team.status === "Forming" && (
            <Button
              variant="ghost"
              onClick={onLeave}
              disabled={isLeaving}
              className="text-xs text-[color:var(--color-danger)] hover:border-[var(--color-danger)] hover:text-[color:var(--color-danger)]"
            >
              Rời đội
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
