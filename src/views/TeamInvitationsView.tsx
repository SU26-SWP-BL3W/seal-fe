"use client";

import { useState } from "react";
import { useMyInvitations, type MyInvitationItem } from "@/repositories/usersRepository";
import { useAcceptOrDeclineInvitation } from "@/repositories/teamsRepository";
import { useRespondEventRoleInvitation } from "@/repositories/eventRolesRepository";
import { Badge, Button, Card, SkeletonRows } from "@/components/ui";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";

// Chuông thông báo — gộp lời mời vào ĐỘI và lời mời VAI TRÒ SỰ KIỆN
// (Judge/Mentor/EventCoordinator) trong 1 màn, đọc từ GET /Users/my-invitations
// (usersRepository.useMyInvitations — xem file đó để biết vì sao KHÔNG dùng
// /Teams/{teamId}/my-invitation, route đó cần biết trước teamId nên không hợp
// với màn "lời mời của tôi" này).
export function TeamInvitationsView() {
  const { data, isLoading, isError, refetch, isFetching } = useMyInvitations();
  const invitations = data?.invitations ?? [];

  const { mutateAsync: respondTeam, isPending: isRespondingTeam } = useAcceptOrDeclineInvitation();
  const { mutateAsync: respondEventRole, isPending: isRespondingEventRole } = useRespondEventRoleInvitation();
  const isResponding = isRespondingTeam || isRespondingEventRole;

  const [error, setError] = useState("");

  const handleRespond = async (inv: MyInvitationItem, isAccepted: boolean) => {
    setError("");
    try {
      if (inv.type === "TEAM") {
        await respondTeam({ invitationId: inv.invitationId, isAccepted });
      } else {
        await respondEventRole({ invitationId: inv.invitationId, isAccepted });
      }
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string } } };
      setError(detail?.response?.data?.message || detail?.message || "Không xử lý được lời mời. Thử lại sau.");
    } finally {
      refetch();
    }
  };

  const pending = invitations.filter((i) => i.status === "PendingAccept");
  const history = invitations.filter((i) => i.status !== "PendingAccept");

  const titleOf = (inv: MyInvitationItem) =>
    inv.type === "TEAM"
      ? inv.role === "Trưởng nhóm"
        ? `Yêu cầu chuyển quyền Trưởng nhóm đội ${inv.targetName}`
        : `Lời mời gia nhập đội ${inv.targetName}`
      : `Lời mời làm ${inv.role} — ${inv.targetName}${inv.trackName ? ` · ${inv.trackName}` : ""}`;

  return (
    <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-[var(--space-xl)]">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-[var(--space-lg)]">
        <header className="flex flex-wrap items-start justify-between gap-[var(--space-md)] border-b border-[var(--border-muted)] pb-[var(--space-md)]">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
              Trung tâm lời mời
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold uppercase text-balance text-[color:var(--text-primary)]">
              Lời mời của tôi
            </h1>
            <p className="mt-[var(--space-xs)] font-mono text-xs text-pretty text-[color:var(--text-muted)]">
              Lời mời vào đội thi và lời mời nhận vai trò trong sự kiện.
            </p>
          </div>

          <Button variant="ghost" onClick={() => refetch()} disabled={isFetching} className="text-xs">
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} />
            Làm mới
          </Button>
        </header>

        {error && (
          <p role="alert" className="font-mono text-xs text-pretty text-[color:var(--color-danger)]">
            {error}
          </p>
        )}

        {isLoading ? (
          <SkeletonRows rows={3} />
        ) : isError ? (
          <Card className="text-center">
            <p className="font-mono text-sm text-pretty text-[color:var(--color-danger)]">
              Không tải được danh sách lời mời.
            </p>
            <Button variant="ghost" onClick={() => refetch()} className="mt-[var(--space-md)] text-xs">
              Thử lại
            </Button>
          </Card>
        ) : (
          <>
            <section className="flex flex-col gap-[var(--space-sm)]">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
                Đang chờ bạn phản hồi
              </h2>

              {pending.length === 0 ? (
                <Card className="text-center">
                  <p className="font-mono text-sm text-pretty text-[color:var(--text-muted)]">
                    Bạn không có lời mời nào đang chờ.
                  </p>
                  <p className="mt-[var(--space-xs)] font-mono text-xs text-pretty text-[color:var(--text-muted)]/70">
                    Khi có đội trưởng hoặc BTC mời, lời mời sẽ xuất hiện tại đây.
                  </p>
                </Card>
              ) : (
                <ul className="flex flex-col gap-[var(--space-sm)]">
                  {pending.map((inv) => (
                    <li key={inv.invitationId}>
                      <Card className="flex flex-col gap-[var(--space-md)] sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-[var(--space-xs)]">
                            <span className="font-mono text-sm font-bold text-[color:var(--text-primary)]">
                              {titleOf(inv)}
                            </span>
                            <Badge tone="warning">Đang chờ</Badge>
                          </div>
                          <p className="mt-[var(--space-xs)] font-mono text-xs text-[color:var(--text-muted)]">
                            Mời bởi {inv.inviterName || "—"} · Hết hạn{" "}
                            <span className="tabular-nums">
                              {new Date(inv.expiresAt).toLocaleString("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </span>
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-[var(--space-xs)]">
                          <Button
                            accent="team"
                            disabled={isResponding}
                            onClick={() => handleRespond(inv, true)}
                            className="text-xs"
                          >
                            <CheckCircle2 className="size-3.5" /> Chấp nhận
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={isResponding}
                            onClick={() => handleRespond(inv, false)}
                            className="text-xs text-[color:var(--color-danger)] hover:border-[var(--color-danger)] hover:text-[color:var(--color-danger)]"
                          >
                            <XCircle className="size-3.5" /> Từ chối
                          </Button>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {history.length > 0 && (
              <section className="flex flex-col gap-[var(--space-sm)]">
                <h2 className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
                  Đã phản hồi gần đây
                </h2>
                <ul className="flex flex-col gap-[var(--space-xs)]">
                  {history.map((inv) => (
                    <li key={inv.invitationId}>
                      <Card className="flex items-center justify-between gap-[var(--space-md)] bg-[var(--bg-panel)]/60 py-[var(--space-sm)]">
                        <span className="truncate font-mono text-xs text-[color:var(--text-muted)]">
                          {titleOf(inv)}
                        </span>
                        <Badge tone={inv.status === "Accepted" ? "success" : "neutral"}>
                          {inv.status === "Accepted" ? "Đã chấp nhận" : "Đã từ chối"}
                        </Badge>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
