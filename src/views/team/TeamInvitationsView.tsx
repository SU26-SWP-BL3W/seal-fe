"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { Badge, Button, Card, SkeletonRows, Pagination } from "@/components/ui";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Lock,
  LogIn,
  UserPlus,
  ArrowRight,
  Info,
} from "lucide-react";
import { useTeamInvitationsViewModel } from "@/viewModels/team/useTeamInvitationsViewModel";
import type { MyInvitationItem } from "@/repositories/usersRepository";

export function TeamInvitationsView() {
  const { state, data, pagination, actions } = useTeamInvitationsViewModel();

  const {
    user,
    error,
    publicDeclineSuccess,
    isProfileIncomplete,
    isLoading,
    isError,
    isFetching,
    isResponding,
    queryInvitationId,
    queryRole,
    queryEventName,
    queryEmail,
    searchParamsString,
  } = state;

  const { pending, history, rawEvents } = data;
  const { pendingPagination, historyPagination } = pagination;

  // Guard: Not Logged In Notice
  if (!user) {
    const returnUrl = `/my-invitations${searchParamsString ? `?${searchParamsString}` : ""}`;
    const loginUrl = `/login?returnUrl=${encodeURIComponent(returnUrl)}${queryEmail ? `&email=${encodeURIComponent(queryEmail)}` : ""}`;
    const registerUrl = `/register?returnUrl=${encodeURIComponent(returnUrl)}${queryEmail ? `&email=${encodeURIComponent(queryEmail)}` : ""}`;

    return (
      <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-[var(--space-xl)] flex items-center justify-center">
        <Card className="max-w-lg w-full p-8 text-center border border-cyan-500/40 bg-[#0c1417] hud-clipped shadow-2xl space-y-6 font-mono">
          <div className="size-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Lock className="size-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
              [ XÁC THỰC TÀI KHOẢN &amp; PHẢN HỒI LỜI MỜI ]
            </span>
            <h2 className="font-display text-2xl font-bold uppercase text-white">
              Xác Nhận Nhận Vai Trò Sự Kiện
            </h2>

            {queryRole || queryEventName ? (
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded text-left space-y-1 text-xs">
                <div className="text-zinc-300">
                  Sự kiện: <strong className="text-white">{queryEventName || "SEAL Hackathon"}</strong>
                </div>
                <div className="text-zinc-300">
                  Vai trò: <strong className="text-cyan-300">{actions.formatRoleLabel(queryRole)}</strong>
                </div>
                {queryEmail && (
                  <div className="text-zinc-300">
                    Email mời: <strong className="text-amber-300">{queryEmail}</strong>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                Bạn nhận được thư mời tham gia sự kiện / đội thi trên hệ thống SEAL. Vui lòng đăng nhập hoặc kích hoạt tài khoản để hệ thống tự động gán quyền.
              </p>
            )}
          </div>

          {publicDeclineSuccess ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300 font-sans flex items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              <span>Bạn đã từ chối lời mời tham gia sự kiện thành công. Bạn có thể đóng trang này.</span>
            </div>
          ) : (
            <div className="text-left space-y-4 pt-2 border-t border-[var(--border-muted)]">
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded text-[11px] text-cyan-300 font-sans leading-relaxed">
                <strong>Tài khoản cho email này đã được tạo sẵn.</strong> Nếu bạn nhận được email &quot;Kích hoạt tài khoản&quot;, hãy bấm link kích hoạt trong email đó trước — hệ thống sẽ cấp mật khẩu tạm và gửi lại qua email. Nếu đã có mật khẩu, đăng nhập trực tiếp bên dưới.
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Link href={loginUrl} className="w-full">
                  <Button
                    variant="primary"
                    accent="primary"
                    className="w-full font-bold text-xs py-3 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                  >
                    <LogIn className="size-4" />
                    <span>ĐĂNG NHẬP ĐỂ PHẢN HỒI LỜI MỜI</span>
                  </Button>
                </Link>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                  <Link href={registerUrl} className="text-zinc-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                    <UserPlus className="size-3" /> Chưa có tài khoản riêng? Đăng ký →
                  </Link>

                  {queryInvitationId && (
                    <button
                      type="button"
                      onClick={actions.handlePublicDecline}
                      disabled={isResponding}
                      className="text-red-400 hover:text-red-300 hover:underline transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Từ chối lời mời
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-[var(--border-muted)] text-[11px] text-zinc-300 flex items-center justify-center gap-1.5">
            <Info className="size-3.5 text-cyan-400 shrink-0" />
            <span>Nếu bạn được cấp mật khẩu tạm thời trong email, hãy dùng để Đăng nhập.</span>
          </div>
        </Card>
      </main>
    );
  }

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

          <Button variant="ghost" onClick={() => actions.refetch()} disabled={isFetching} className="text-xs">
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
            <Button variant="ghost" onClick={() => actions.refetch()} className="mt-[var(--space-md)] text-xs">
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
                  {pendingPagination.paginatedItems.map((inv: MyInvitationItem) => (
                    <li key={inv.invitationId}>
                      <Card className="flex flex-col gap-[var(--space-md)] sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-[var(--space-xs)]">
                            <span className="font-mono text-sm font-bold text-[color:var(--text-primary)]">
                              {actions.titleOf(inv)}
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
                            onClick={() => actions.handleRespond(inv, true)}
                            className="text-xs"
                          >
                            <CheckCircle2 className="size-3.5" /> Chấp nhận
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={isResponding}
                            onClick={() => actions.handleRespond(inv, false)}
                            className="text-xs text-[color:var(--color-danger)] hover:border-[var(--color-danger)] hover:text-[color:var(--color-danger)]"
                          >
                            <XCircle className="size-3.5" /> Từ chối
                          </Button>
                        </div>
                      </Card>
                    </li>
                  ))}

                  {pending.length > 0 && (
                    <Pagination
                      currentPage={pendingPagination.currentPage}
                      totalPages={pendingPagination.totalPages}
                      totalItems={pendingPagination.totalItems}
                      pageSize={pendingPagination.pageSize}
                      onPageChange={pendingPagination.setCurrentPage}
                      onPageSizeChange={pendingPagination.setPageSize}
                      itemLabel="lời mời đang chờ"
                      compact={true}
                    />
                  )}
                </ul>
              )}
            </section>

            {history.length > 0 && (
              <section className="flex flex-col gap-[var(--space-sm)]">
                <h2 className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
                  Đã phản hồi gần đây
                </h2>
                <ul className="flex flex-col gap-[var(--space-xs)]">
                  {historyPagination.paginatedItems.map((inv: MyInvitationItem) => {
                    const isAccepted = inv.status === "Accepted";
                    const isExpired = inv.status === "Expired";
                    const isCancelled = inv.status === "Cancelled";
                    const role = inv.role || "";
                    const isTeam = inv.type === "TEAM";

                    // Find matching event
                    const matchedEvent = (rawEvents || []).find((ev: any) => {
                      const evId = ev.id || ev.Id || ev.eventId || ev.EventId;
                      const evName = ev.name || ev.eventName || ev.EventName || "";
                      if ((inv as any).eventId && ((inv as any).eventId === evId || (inv as any).EventId === evId)) return true;
                      if (inv.targetName && evName.trim().toLowerCase() === inv.targetName.trim().toLowerCase()) return true;
                      return false;
                    });
                    const eventId = (inv as any).eventId || (inv as any).EventId || (inv as any).targetId || (inv as any).TargetId || matchedEvent?.id || (matchedEvent as any)?.Id;

                    let destinationUrl = "/events";
                    if (role === "Coordinator" || role === "EventCoordinator") {
                      destinationUrl = eventId ? `/coordinator/events/${eventId}` : "/coordinator/dashboard";
                    } else if (role === "Judge") {
                      destinationUrl = eventId ? `/judge/scoring?eventId=${eventId}` : "/judge/events";
                    } else if (role === "Mentor") {
                      destinationUrl = eventId ? `/mentor/teams?eventId=${eventId}` : "/mentor/teams";
                    } else if (isTeam) {
                      destinationUrl = eventId ? `/events/${eventId}` : "/my-team";
                    } else if (eventId) {
                      destinationUrl = `/events/${eventId}`;
                    }

                    return (
                      <li key={inv.invitationId}>
                        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-panel)]/60 py-3">
                          <div className="min-w-0">
                            <span className="truncate font-mono text-xs text-[color:var(--text-muted)] block">
                              {actions.titleOf(inv)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge tone={isAccepted ? "success" : isExpired || isCancelled ? "neutral" : "danger"}>
                              {isAccepted ? "Đã chấp nhận" : isExpired ? "Hết hạn" : isCancelled ? "Đã hủy" : "Đã từ chối"}
                            </Badge>
                            {isAccepted && (
                              <Link href={destinationUrl}>
                                <Button variant="secondary" className="text-[11px] py-1 px-2.5 h-7">
                                  <span>Truy cập sự kiện</span>
                                  <ArrowRight className="size-3" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </Card>
                      </li>
                    );
                  })}

                  <Pagination
                    currentPage={historyPagination.currentPage}
                    totalPages={historyPagination.totalPages}
                    totalItems={historyPagination.totalItems}
                    pageSize={historyPagination.pageSize}
                    onPageChange={historyPagination.setCurrentPage}
                    onPageSizeChange={historyPagination.setPageSize}
                    itemLabel="lời mời lịch sử"
                    compact={true}
                  />
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
