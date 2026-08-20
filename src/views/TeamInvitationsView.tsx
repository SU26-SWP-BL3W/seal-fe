"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useMyInvitations, type MyInvitationItem } from "@/repositories/usersRepository";
import { useAcceptOrDeclineInvitation } from "@/repositories/teamsRepository";
import { useRespondEventRoleInvitation } from "@/repositories/eventRolesRepository";
import { Badge, Button, Card, SkeletonRows } from "@/components/ui";
import { useToast } from "@/providers/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle, Lock, LogIn, Sparkles, ArrowRight } from "lucide-react";

export function TeamInvitationsView() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, refreshRoles } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useMyInvitations(Boolean(user));
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
          toast.success(`🎉 Chúc mừng! Bạn đã chính thức gia nhập đội "${targetName}". Hãy cùng đồng đội hoàn thiện bài thi thật tốt nhé!`);
        } else if (inv.role === "Judge") {
          toast.success(`🎉 Bạn đã nhận vai trò Ban Giám Khảo sự kiện "${targetName}". Bàn chấm điểm đã sẵn sàng!`);
        } else if (inv.role === "Mentor") {
          toast.success(`🎉 Bạn đã nhận vai trò Cố Vấn Chuyên Môn sự kiện "${targetName}". Bàn cố vấn đã sẵn sàng!`);
        } else {
          toast.success(`🎉 Bạn đã nhận vai trò Cán Bộ Điều Phối sự kiện "${targetName}".`);
        }
        await refreshRoles();
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

  // Guard: Not Logged In Notice
  if (!user) {
    return (
      <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-[var(--space-xl)] flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center border border-cyan-500/40 bg-[#0c1417] hud-clipped shadow-2xl space-y-5 font-mono">
          <div className="size-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Lock className="size-7" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              [ YÊU CẦU XÁC THỰC TÀI KHOẢN ]
            </span>
            <h2 className="font-display text-xl font-bold uppercase text-white">
              Đăng Nhập Để Xem Lời Mời
            </h2>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              Bạn đang truy cập Trung tâm lời mời. Vui lòng đăng nhập vào tài khoản SEAL của bạn (hoặc tài khoản tạm thời được cấp) để xem chi tiết và phản hồi lời mời tham gia sự kiện / đội thi.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link href="/login?returnUrl=/my-invitations">
              <Button variant="primary" accent="primary" className="w-full font-bold text-xs py-2.5 flex items-center justify-center gap-2">
                <LogIn className="size-4" />
                <span>ĐĂNG NHẬP ĐỂ XEM LỜI MỜI</span>
              </Button>
            </Link>
            <Link href="/register?returnUrl=/my-invitations">
              <Button variant="secondary" className="w-full text-xs py-2.5">
                ĐĂNG KÝ TÀI KHOẢN MỚI
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const pending = invitations.filter((i) => i.status === "PendingAccept");
  const history = invitations.filter((i) => i.status !== "PendingAccept");

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case "Coordinator":
      case "EventCoordinator":
        return "Cán Bộ Điều Phối (Coordinator)";
      case "Judge":
        return "Ban Giám Khảo (Judge)";
      case "Mentor":
        return "Cố Vấn Chuyên Môn (Mentor)";
      default:
        return role || "Cán Bộ Sự Kiện";
    }
  };

  const titleOf = (inv: MyInvitationItem) =>
    inv.type === "TEAM"
      ? inv.role === "Trưởng nhóm"
        ? `👑 Yêu cầu chuyển quyền Đội trưởng đội ${inv.targetName}`
        : `📩 Lời mời gia nhập đội thi ${inv.targetName} (Từ Đội trưởng)`
      : `🎖️ Lời mời đảm nhiệm vai trò: ${formatRoleLabel(inv.role)} — Sự kiện ${inv.targetName}${inv.trackName ? ` · Hạng mục ${inv.trackName}` : ""}`;

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

        {/* Cảnh báo nếu hồ sơ chưa hoàn thiện */}
        {isProfileIncomplete && (
          <Card className="p-4 bg-amber-500/10 border border-amber-500/30 hud-clipped flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-400 shrink-0" />
              <span>Hồ sơ sinh viên của bạn chưa hoàn thiện. Vui lòng cập nhật thông tin để đảm bảo có thể tham gia đội thi.</span>
            </div>
            <Link href="/profile">
              <Button variant="primary" className="text-xs shrink-0 whitespace-nowrap">
                CẬP NHẬT HỒ SƠ &gt;
              </Button>
            </Link>
          </Card>
        )}

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
                  {history.map((inv) => {
                    const isAccepted = inv.status === "Accepted";
                    const role = inv.role || "";
                    const isTeam = inv.type === "TEAM";

                    return (
                      <li key={inv.invitationId}>
                        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-panel)]/60 py-3">
                          <div className="min-w-0">
                            <span className="truncate font-mono text-xs text-[color:var(--text-muted)] block">
                              {titleOf(inv)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge tone={isAccepted ? "success" : "neutral"}>
                              {isAccepted ? "Đã chấp nhận" : "Đã từ chối"}
                            </Badge>
                            {isAccepted && (
                              <Link
                                href={
                                  isTeam
                                    ? "/my-team"
                                    : role === "Judge"
                                    ? "/judge/events"
                                    : role === "Mentor"
                                    ? "/mentor/teams"
                                    : "/coordinator/dashboard"
                                }
                              >
                                <Button variant="secondary" className="text-[11px] py-1 px-2.5 h-7">
                                  <span>Truy cập</span>
                                  <ArrowRight className="size-3" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
