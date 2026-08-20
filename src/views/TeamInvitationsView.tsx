"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useSearchParams } from "next/navigation";
import { useMyInvitations, type MyInvitationItem } from "@/repositories/usersRepository";
import { useAcceptOrDeclineInvitation } from "@/repositories/teamsRepository";
import { useRespondEventRoleInvitation } from "@/repositories/eventRolesRepository";
import { Badge, Button, Card, SkeletonRows, Pagination } from "@/components/ui";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/providers/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Lock,
  LogIn,
  UserPlus,
  Sparkles,
  ArrowRight,
  Shield,
  Info,
} from "lucide-react";

export function TeamInvitationsView() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, refreshRoles, loginWithCredentials } = useAuth();

  const queryInvitationId = searchParams.get("invitationId") || searchParams.get("id") || "";
  const queryAction = searchParams.get("action") || "";
  const queryRole = searchParams.get("role") || "";
  const queryEventName = searchParams.get("eventName") || searchParams.get("event") || "";
  const queryEmail = searchParams.get("email") || "";

  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [inputEmail, setInputEmail] = useState(queryEmail || "");
  const [quickFullName, setQuickFullName] = useState("");
  const [quickPassword, setQuickPassword] = useState("Seal@2026!");
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const { mutateAsync: registerApi } = useRegister();

  const { data, isLoading, isError, refetch, isFetching } = useMyInvitations(Boolean(user));
  const { data: rawEvents = [] } = useEvents();
  const invitations = data?.invitations ?? [];

  const { mutateAsync: respondTeam, isPending: isRespondingTeam } = useAcceptOrDeclineInvitation();
  const { mutateAsync: respondEventRole, isPending: isRespondingEventRole } = useRespondEventRoleInvitation();
  const { mutateAsync: declinePublic, isPending: isDecliningPublic } = useDeclineEventRoleInvitationPublic();
  const isResponding = isRespondingTeam || isRespondingEventRole || isDecliningPublic;

  const [error, setError] = useState("");
  const [publicDeclineSuccess, setPublicDeclineSuccess] = useState(false);

  const isProfileIncomplete = user?.isStudent && (!user?.schoolId || (!user?.isFpt && !user?.studentCode));

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case "Coordinator":
      case "EventCoordinator":
        return "Cán Bộ Điều Phối (Event Coordinator)";
      case "Judge":
        return "Ban Giám Khảo (Judge)";
      case "Mentor":
        return "Cố Vấn Chuyên Môn (Mentor)";
      case "TeamLeader":
        return "Trưởng Nhóm (Team Leader)";
      case "TeamMember":
        return "Thành Viên Đội Thi";
      default:
        return role || "Cán Bộ Sự Kiện";
    }
  };

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
          pushSystemNotification({
            title: "Gia nhập đội thi thành công",
            message: `Bạn đã chính thức gia nhập đội "${targetName}". Chúc bạn và đồng đội đạt thành tích xuất sắc!`,
            type: "success",
          });
          pushSystemNotification({
            title: "Thành viên mới gia nhập đội",
            message: `Một thành viên đã đồng ý lời mời và chính thức gia nhập đội "${targetName}".`,
            type: "success",
          });
        } else if (inv.role === "Judge") {
          toast.success(`🎉 Bạn đã nhận vai trò Ban Giám Khảo sự kiện "${targetName}". Bàn chấm điểm đã sẵn sàng!`);
          pushSystemNotification({
            title: "Đã nhận vai trò Giám khảo",
            message: `Bạn đã nhận vai trò Ban Giám Khảo sự kiện "${targetName}". Bàn chấm điểm đã sẵn sàng!`,
            type: "success",
          });
          pushSystemNotification({
            title: "Nhân sự đã nhận vai trò",
            message: `Nhân sự đã đồng ý nhận vai trò Giám khảo sự kiện "${targetName}".`,
            type: "success",
          });
        } else if (inv.role === "Mentor") {
          toast.success(`🎉 Bạn đã nhận vai trò Cố Vấn Chuyên Môn sự kiện "${targetName}". Bàn cố vấn đã sẵn sàng!`);
          pushSystemNotification({
            title: "Đã nhận vai trò Cố vấn",
            message: `Bạn đã nhận vai trò Cố Vấn Chuyên Môn sự kiện "${targetName}". Bàn cố vấn đã sẵn sàng!`,
            type: "success",
          });
          pushSystemNotification({
            title: "Nhân sự đã nhận vai trò",
            message: `Nhân sự đã đồng ý nhận vai trò Cố vấn sự kiện "${targetName}".`,
            type: "success",
          });
        } else {
          toast.success(`🎉 Bạn đã nhận vai trò Cán Bộ Điều Phối sự kiện "${targetName}".`);
          pushSystemNotification({
            title: "Đã nhận vai trò Điều Phối Viên",
            message: `Bạn đã nhận vai trò Cán Bộ Điều Phối sự kiện "${targetName}".`,
            type: "success",
          });
          pushSystemNotification({
            title: "Nhân sự đã nhận vai trò",
            message: `Nhân sự đã đồng ý nhận vai trò Điều Phối Viên sự kiện "${targetName}".`,
            type: "success",
          });
        }
        await refreshRoles();
        queryClient.invalidateQueries({ queryKey: ["my-team"] });
        queryClient.invalidateQueries({ queryKey: ["myTeam"] });
        queryClient.invalidateQueries({ queryKey: ["eventRoles"] });
        queryClient.invalidateQueries({ queryKey: ["my-invitations"] });
        queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });

        let targetRedirectUrl = "/events";
        if (invType === "TEAM" || invType === "TEAM_MEMBER") {
          targetRedirectUrl = "/my-team";
        } else if (inv.role === "Judge") {
          targetRedirectUrl = "/judge/events";
        } else if (inv.role === "Mentor") {
          targetRedirectUrl = "/mentor";
        } else if (inv.role === "Coordinator" || inv.role === "EventCoordinator") {
          targetRedirectUrl = inv.eventId || inv.targetId
            ? `/coordinator/dashboard?eventId=${inv.eventId || inv.targetId}`
            : "/coordinator/dashboard";
        } else if (inv.eventId || inv.targetId) {
          targetRedirectUrl = `/events/${inv.eventId || inv.targetId}`;
        }

        setTimeout(() => {
          window.location.href = targetRedirectUrl;
        }, 1200);
      } else {
        toast.info(`Bạn đã từ chối lời mời tham gia "${targetName}".`);
        pushSystemNotification({
          title: "Đã từ chối lời mời",
          message: `Bạn đã từ chối lời mời tham gia "${targetName}".`,
          type: "warning",
        });
        pushSystemNotification({
          title: "Lời mời tham gia bị từ chối",
          message: `Ứng viên đã từ chối lời mời tham gia "${targetName}".`,
          type: "danger",
        });
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

  const handlePublicDecline = async () => {
    if (!queryInvitationId) return;
    if (!confirm("Bạn có chắc chắn muốn từ chối lời mời tham gia sự kiện này?")) return;
    try {
      await declinePublic(queryInvitationId);
      setPublicDeclineSuccess(true);
      toast.success("Bạn đã từ chối lời mời tham gia sự kiện.");
      pushSystemNotification({
        title: "Đã từ chối lời mời sự kiện",
        message: `Bạn đã từ chối lời mời tham gia sự kiện "${queryEventName || 'Sự kiện'}".`,
        type: "warning",
      });
      pushSystemNotification({
        title: "Lời mời tham gia bị từ chối",
        message: `Ứng viên đã từ chối lời mời tham gia sự kiện "${queryEventName || 'Sự kiện'}" qua liên kết công khai.`,
        type: "danger",
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Từ chối lời mời thất bại hoặc lời mời đã hết hạn.";
      toast.error(msg);
    }
  };

  const {
    paginatedItems: paginatedPending,
    currentPage: pendingPage,
    totalPages: totalPendingPages,
    totalItems: totalPendingItems,
    pageSize: pendingPageSize,
    setCurrentPage: setPendingPage,
    setPageSize: setPendingPageSize,
  } = usePagination(pending, 5);

  const {
    paginatedItems: paginatedHistory,
    currentPage: historyPage,
    totalPages: totalHistoryPages,
    totalItems: totalHistoryItems,
    pageSize: historyPageSize,
    setCurrentPage: setHistoryPage,
    setPageSize: setHistoryPageSize,
  } = usePagination(history, 5);

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

  // Guard: Not Logged In Notice
  if (!user) {
    const currentParams = searchParams.toString();
    const returnUrl = `/my-invitations${currentParams ? `?${currentParams}` : ""}`;
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
              [ XÁC THỰC TÀI KHOẢN & PHẢN HỒI LỜI MỜI ]
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
                  Vai trò: <strong className="text-cyan-300">{formatRoleLabel(queryRole)}</strong>
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
            <form onSubmit={handleQuickActivate} className="text-left space-y-4 pt-2 border-t border-[var(--border-muted)]">
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded text-[11px] text-cyan-300 font-sans leading-relaxed">
                💡 <strong>Tài khoản đã được cấp sẵn:</strong> Ban tổ chức đã tạo tài khoản cho email của bạn. Nhấn nút bên dưới để đăng nhập, đổi mật khẩu chính thức và nhận vai trò trong sự kiện ngay!
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                  Email nhận lời mời <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="nhap.email.nhan.loi.moi@fpt.edu.vn"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-cyan-500/40 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                  Họ và tên của bạn <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={quickFullName}
                  onChange={(e) => setQuickFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-cyan-500/40 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 uppercase block mb-1">
                  Mật khẩu khởi tạo / Mật khẩu tạm <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={quickPassword}
                  onChange={(e) => setQuickPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-cyan-500/40 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[9px] text-zinc-500 mt-1 block">Mật khẩu mặc định: Seal@2026! (Bạn sẽ được đổi mật khẩu riêng ngay sau đó)</span>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  accent="primary"
                  disabled={isQuickSubmitting}
                  className="w-full font-bold text-xs py-3 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                >
                  <Sparkles className="size-4" />
                  <span>{isQuickSubmitting ? "ĐANG ĐĂNG NHẬP & KÍCH HOẠT..." : "⚡ ĐĂNG NHẬP, ĐỔI MẬT KHẨU & VÀO SỰ KIỆN"}</span>
                </Button>

                <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                  <Link href={loginUrl} className="text-zinc-400 hover:text-cyan-300 transition-colors">
                    🔐 Đã có mật khẩu riêng? Đăng nhập →
                  </Link>

                  {queryInvitationId && (
                    <button
                      type="button"
                      onClick={handlePublicDecline}
                      disabled={isDecliningPublic}
                      className="text-red-400 hover:text-red-300 hover:underline transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Từ chối lời mời
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          <div className="pt-2 border-t border-[var(--border-muted)] text-[11px] text-zinc-300 flex items-center justify-center gap-1.5">
            <Info className="size-3.5 text-cyan-400 shrink-0" />
            <span>Nếu bạn được cấp mật khẩu tạm thời trong email, hãy dùng để Đăng nhập.</span>
          </div>
        </Card>
      </main>
    );
  }

  const pending = invitations.filter((i) => i.status === "PendingAccept");
  const history = invitations.filter((i) => i.status !== "PendingAccept");

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
                  {paginatedPending.map((inv) => (
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

                  {pending.length > 0 && (
                    <Pagination
                      currentPage={pendingPage}
                      totalPages={totalPendingPages}
                      totalItems={totalPendingItems}
                      pageSize={pendingPageSize}
                      onPageChange={setPendingPage}
                      onPageSizeChange={setPendingPageSize}
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
                  {paginatedHistory.map((inv) => (
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

                  <Pagination
                    currentPage={historyPage}
                    totalPages={totalHistoryPages}
                    totalItems={totalHistoryItems}
                    pageSize={historyPageSize}
                    onPageChange={setHistoryPage}
                    onPageSizeChange={setHistoryPageSize}
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
