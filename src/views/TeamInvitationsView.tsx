"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMyInvitations, type MyInvitationItem } from "@/repositories/usersRepository";
import { useAcceptOrDeclineInvitation } from "@/repositories/teamsRepository";
import { useRespondEventRoleInvitation } from "@/repositories/eventRolesRepository";
import { Badge, Button, Card, SkeletonRows } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/providers/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Mail, RefreshCw, XCircle } from "lucide-react";

export function TeamInvitationsView() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useMyInvitations();
  const invitations = data?.invitations ?? [];

  const { mutateAsync: respondTeam, isPending: isRespondingTeam } = useAcceptOrDeclineInvitation();
  const { mutateAsync: respondEventRole, isPending: isRespondingEventRole } = useRespondEventRoleInvitation();
  const isResponding = isRespondingTeam || isRespondingEventRole;

  const [error, setError] = useState("");

  const isProfileIncomplete = user?.isStudent && (!user?.schoolId || (!user?.isFpt && !user?.studentCode));

  const handleRespond = async (inv: MyInvitationItem | any, isAccepted: boolean) => {
    setError("");
    const invId = inv.invitationId || inv.InvitationId || inv.id || inv.Id;
    const invType = String(inv.type || inv.Type || "TEAM").toUpperCase();
    const targetName = inv.targetName || inv.TargetName || "đội thi";

    if (!invId) {
      toast.error("Không tìm thấy mã định danh lời mời.");
      return;
    }

    try {
      if (invType === "TEAM" || invType === "TEAM_MEMBER") {
        await respondTeam({ invitationId: invId, isAccepted });
      } else {
        await respondEventRole({ invitationId: invId, isAccepted });
      }

      if (isAccepted) {
        if (invType === "TEAM" || invType === "TEAM_MEMBER") {
          toast.success(`Bạn đã gia nhập đội "${targetName}". Hãy cùng đồng đội hoàn thiện bài thi.`);
        } else if (inv.role === "Judge") {
          toast.success(`Bạn đã nhận vai trò Ban giám khảo sự kiện "${targetName}".`);
        } else if (inv.role === "Mentor") {
          toast.success(`Bạn đã nhận vai trò Cố vấn sự kiện "${targetName}".`);
        } else {
          toast.success(`Bạn đã nhận vai trò Cán bộ điều phối sự kiện "${targetName}".`);
        }
        queryClient.invalidateQueries({ queryKey: ["my-team"] });
        queryClient.invalidateQueries({ queryKey: ["myTeam"] });
        queryClient.invalidateQueries({ queryKey: ["eventRoles"] });
        queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      } else {
        toast.info(`Bạn đã từ chối lời mời tham gia "${targetName}".`);
        queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      }
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string; detail?: string } } };
      const rawMsg =
        detail?.response?.data?.message ||
        detail?.response?.data?.detail ||
        detail?.message ||
        "Không thể xử lý lời mời. Vui lòng thử lại sau.";

      const isProfileErr =
        rawMsg.toLowerCase().includes("profile") ||
        rawMsg.toLowerCase().includes("hồ sơ") ||
        rawMsg.toLowerCase().includes("school") ||
        rawMsg.toLowerCase().includes("student");

      const msg = isProfileErr && isAccepted
        ? "Bạn cần hoàn tất cập nhật hồ sơ cá nhân/sinh viên trước khi đồng ý tham gia đội thi."
        : rawMsg;

      setError(msg);
      toast.error(msg);
    } finally {
      refetch();
    }
  };

  const pending = invitations.filter((i) => i.status === "PendingAccept");
  const history = invitations.filter((i) => i.status !== "PendingAccept");

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case "Coordinator":
      case "EventCoordinator":
        return "Cán bộ điều phối";
      case "Judge":
        return "Ban giám khảo";
      case "Mentor":
        return "Cố vấn chuyên môn";
      default:
        return role || "Cán bộ sự kiện";
    }
  };

  const titleOf = (inv: MyInvitationItem) => {
    if (inv.type === "TEAM") {
      if (inv.role === "Trưởng nhóm") {
        return `Chuyển quyền đội trưởng — ${inv.targetName}`;
      }
      return `Lời mời gia nhập đội ${inv.targetName}`;
    }
    const trackPart = inv.trackName ? ` · Hạng mục ${inv.trackName}` : "";
    return `Vai trò ${formatRoleLabel(inv.role)} — ${inv.targetName}${trackPart}`;
  };

  const subtitleOf = (inv: MyInvitationItem) => {
    if (inv.type === "TEAM") {
      return inv.role === "Trưởng nhóm" ? "Yêu cầu chuyển quyền đội trưởng" : "Lời mời từ đội trưởng";
    }
    return "Lời mời vai trò sự kiện";
  };

  return (
    <PageShell className="max-w-3xl">
      <PageHeader
        title="Lời mời của tôi"
        description="Lời mời vào đội thi và lời mời nhận vai trò trong sự kiện."
        actions={
          <Button variant="ghost" onClick={() => refetch()} disabled={isFetching} className="text-xs">
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin motion-reduce:animate-none" : ""}`} />
            Làm mới
          </Button>
        }
      />

      {isProfileIncomplete && (
        <Card className="mb-6 flex flex-col items-start justify-between gap-3 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-warning)]" />
            <span>Hồ sơ sinh viên chưa hoàn thiện. Cập nhật thông tin để có thể tham gia đội thi.</span>
          </div>
          <Link href="/profile">
            <Button variant="primary" className="shrink-0 text-xs whitespace-nowrap">
              Cập nhật hồ sơ
            </Button>
          </Link>
        </Card>
      )}

      {error && (
        <p role="alert" className="mb-4 text-sm text-[color:var(--color-danger)]">
          {error}
        </p>
      )}

      {isLoading ? (
        <SkeletonRows rows={3} />
      ) : isError ? (
        <Card className="text-center">
          <p className="text-sm text-[color:var(--color-danger)]">Không tải được danh sách lời mời.</p>
          <Button variant="ghost" onClick={() => refetch()} className="mt-4 text-xs">
            Thử lại
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Đang chờ phản hồi</h2>

            {pending.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="Không có lời mời đang chờ"
                description="Khi có đội trưởng hoặc BTC mời, lời mời sẽ xuất hiện tại đây."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {pending.map((inv) => (
                  <li key={inv.invitationId}>
                    <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">{titleOf(inv)}</span>
                          <Badge tone="warning">Đang chờ</Badge>
                        </div>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{subtitleOf(inv)}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          Mời bởi {inv.inviterName || "—"} · Hết hạn{" "}
                          <span className="font-mono tabular-nums">
                            {new Date(inv.expiresAt).toLocaleString("vi-VN", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button accent="team" disabled={isResponding} onClick={() => handleRespond(inv, true)} className="text-xs">
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
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Đã phản hồi gần đây</h2>
              <ul className="flex flex-col gap-2">
                {history.map((inv) => (
                  <li key={inv.invitationId}>
                    <Card className="flex items-center justify-between gap-4 bg-[var(--bg-panel)]/60 py-3">
                      <span className="truncate text-sm text-[var(--text-muted)]">{titleOf(inv)}</span>
                      <Badge tone={inv.status === "Accepted" ? "success" : "neutral"}>
                        {inv.status === "Accepted" ? "Đã chấp nhận" : "Đã từ chối"}
                      </Badge>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}
