"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { Card, ConfirmDialog, SkeletonRows } from "@/components/ui";
import { AlertTriangle, Check, X, Mail } from "lucide-react";
import {
  AvailableTeamsList,
  buildRequirements,
  ConfirmRegistrationDialog,
  CreateTeamForm,
  InviteMemberModal,
  InvitePanel,
  MemberRoster,
  RegistrationChecklist,
  TeamHeader,
  TeamInfoCard,
  TransferLeaderDialog,
  type InvitationView,
} from "@/components/domain/team";
import { TeamCountdownTimer } from "@/components/domain/TeamCountdownTimer";
import { useMyTeamViewModel } from "@/viewModels/team/useMyTeamViewModel";

export function MyTeamView() {
  const { state, actions } = useMyTeamViewModel();

  const {
    isLoading,
    team,
    members,
    isLeader,
    currentUserId,
    roleName,
    targetEventId,
    invitations,
    isLoadingInvitations,
    hasInvitationError,
    pendingMyInvitations,
    isRespondingInv,
    isInviting,
    isKicking,
    kickTarget,
    isCancelling,
    cancelTarget,
    isRegistering,
    isTransferring,
    transferTarget,
    isLeaving,
    isUpdatingTeam,
    showEditDialog,
    showInviteModal,
    showRegisterDialog,
    showLeaveDialog,
    dialogError,
    noTeamTab,
    editName,
    editDescription,
    activeRound,
  } = state;

  if (isLoading) {
    return (
      <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-[var(--space-xl)]">
        <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-[var(--space-lg)]">
          <SkeletonRows rows={1} />
          <div className="grid grid-cols-1 gap-[var(--space-lg)] lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <SkeletonRows rows={4} />
            </Card>
            <Card>
              <SkeletonRows rows={3} />
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (!team) {
    const isJudge = roleName === "Judge";
    const isMentor = roleName === "Mentor";
    const isEC = roleName === "EventCoordinator" || roleName === "Coordinator";

    if (isJudge || isMentor || isEC) {
      const redirectUrl = isJudge
        ? `/judge/scoring${targetEventId ? `?eventId=${targetEventId}` : ""}`
        : isMentor
        ? `/mentor/tracks${targetEventId ? `?eventId=${targetEventId}` : ""}`
        : `/coordinator/dashboard${targetEventId ? `?eventId=${targetEventId}` : ""}`;

      const workspaceTitle = isJudge
        ? "BÀN CHẤM ĐIỂM GIÁM KHẢO"
        : isMentor
        ? "BÀN CỐ VẤN CHUYÊN MÔN"
        : "BÀN ĐIỀU PHỐI BAN TỔ CHỨC";

      return (
        <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-12 flex items-center justify-center font-mono">
          <Card className="max-w-xl w-full p-8 bg-[#10171a] border border-amber-500/40 hud-clipped space-y-6 text-center shadow-lg">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase hud-clipped inline-block">
                [ CHÍNH SÁCH BẢO VỆ TÍNH LIÊM CHÍNH CUỘC THI ]
              </span>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wide">
                Không Thể Tham Gia Hoặc Tạo Đội Thi
              </h2>
            </div>

            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              Tài khoản của bạn đang giữ vai trò <strong>{isJudge ? "Giám Khảo (Judge)" : isMentor ? "Cố Vấn (Mentor)" : "Ban Tổ Chức (Coordinator)"}</strong> trong hệ thống.
              Theo quy chế chống xung đột lợi ích (Conflict of Interest), Chuyên gia chuyên môn và Ban tổ chức không được phép đăng ký hoặc tham gia đội thi của thí sinh.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={redirectUrl}>
                <button className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-white text-black font-bold uppercase text-xs hud-clipped transition-all cursor-pointer shadow-sm">
                  [ VÀO {workspaceTitle} &gt; ]
                </button>
              </Link>
              <Link href="/events">
                <button className="w-full sm:w-auto px-4 py-2.5 bg-[#141f23] border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-bold uppercase text-xs hud-clipped transition-all cursor-pointer">
                  [ KHÁM PHÁ SỰ KIỆN ]
                </button>
              </Link>
            </div>
          </Card>
        </main>
      );
    }

    return (
      <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-zinc-400">
                [ KHÔNG GIAN ĐỘI THI ]
              </div>
              <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold uppercase text-white">
                Gia Nhập Hoặc Tạo Đội Thi Mới
              </h1>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900/90 p-1 border border-zinc-800 rounded hud-clipped">
              {pendingMyInvitations.length > 0 && (
                <button
                  type="button"
                  onClick={() => actions.setNoTeamTab("invitations")}
                  className={`px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                    noTeamTab === "invitations"
                      ? "bg-cyan-400 text-black shadow-sm font-extrabold"
                      : "text-cyan-300 hover:text-white"
                  }`}
                >
                  <Mail className="size-3.5" /> Lời Mời Nhận Được ({pendingMyInvitations.length})
                </button>
              )}
              <button
                type="button"
                onClick={() => actions.setNoTeamTab("create")}
                className={`px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer ${
                  noTeamTab === "create"
                    ? "bg-[var(--accent-team)] text-black shadow-sm font-extrabold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Tạo Đội Mới
              </button>
              <button
                type="button"
                onClick={() => actions.setNoTeamTab("find")}
                className={`px-4 py-2 text-xs font-bold uppercase transition-all cursor-pointer ${
                  noTeamTab === "find"
                    ? "bg-cyan-400 text-black shadow-sm font-extrabold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                🔍 Tìm &amp; Gia Nhập Đội
              </button>
            </div>
          </div>

          {noTeamTab === "invitations" && pendingMyInvitations.length > 0 ? (
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-r from-cyan-950/60 to-[#101e24] border-2 border-cyan-400 hud-clipped shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-3 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      [ BẠN CÓ {pendingMyInvitations.length} LỜI MỜI GIA NHẬP ĐỘI THI ĐANG CHỜ ]
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Do Đội trưởng gửi lời mời chính thức
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {pendingMyInvitations.map((inv: any) => {
                    const invId = inv.invitationId || inv.InvitationId || inv.id || inv.Id;
                    const targetName = inv.targetName || inv.TargetName || "Đội thi";
                    const inviter = inv.inviterName || inv.InviterName || "Đội trưởng";

                    return (
                      <div
                        key={invId}
                        className="p-5 bg-black/60 border border-cyan-500/40 hud-clipped flex flex-col md:flex-row md:items-center justify-between gap-5"
                      >
                        <div className="space-y-2 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase rounded">
                              LỜI MỜI VÀO ĐỘI
                            </span>
                            <h3 className="font-display text-xl font-bold text-white uppercase truncate">
                              {targetName}
                            </h3>
                          </div>
                          <p className="font-sans text-xs text-zinc-300 leading-relaxed">
                            Đội trưởng <strong>{inviter}</strong> đã gửi lời mời bạn tham gia đội thi này. Nhấn <strong>[ Đồng ý vào đội ]</strong> để chính thức gia nhập đội và mở không gian làm việc của đội ngay lập tức!
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                          <button
                            disabled={isRespondingInv}
                            onClick={() => actions.handleAcceptInv(inv)}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-white text-black font-bold uppercase hud-clipped transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5 text-xs"
                          >
                            <Check className="size-4" /> [ ĐỒNG Ý VÀO ĐỘI ]
                          </button>
                          <button
                            disabled={isRespondingInv}
                            onClick={() => actions.handleDeclineInv(inv)}
                            className="px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-bold uppercase hud-clipped transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 text-xs"
                          >
                            <X className="size-4" /> [ TỪ CHỐI ]
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 font-mono text-xs text-zinc-400">
                <span>Hoặc bạn muốn tự tạo đội riêng của mình?</span>
                <button
                  onClick={() => actions.setNoTeamTab("create")}
                  className="text-cyan-400 hover:underline cursor-pointer font-bold"
                >
                  Chuyển sang Khởi tạo đội mới &gt;
                </button>
              </div>
            </div>
          ) : noTeamTab === "create" ? (
            <CreateTeamForm defaultEventId={targetEventId} />
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded text-xs text-zinc-300 font-sans leading-relaxed">
                <strong>Dành cho thí sinh chưa có nhóm:</strong> Danh sách bên dưới hiển thị các đội thi trong sự kiện đang tuyển thêm thành viên. Bạn có thể nhấn <strong>Gửi Email Đề Nghị Gia Nhập</strong> để gửi thông tin ứng tuyển trực tiếp tới Đội trưởng.
              </div>
              <AvailableTeamsList
                eventId={targetEventId}
                eventName="Sự kiện SEAL"
                onSwitchToCreate={() => actions.setNoTeamTab("create")}
              />
            </div>
          )}
        </div>
      </main>
    );
  }

  const requirements = buildRequirements(members);
  const isForming = team.status === "Forming" || team.status === "Rejected";
  const canConfirm =
    isForming && requirements.hasEnoughMembers && requirements.membersWithoutProfile.length === 0;
  const showRequirementBanner =
    isForming && (!requirements.hasEnoughMembers || requirements.membersWithoutProfile.length > 0);

  return (
    <main className="hud-lattice min-h-[calc(100dvh-4rem)] px-[var(--space-lg)] py-[var(--space-xl)]">
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col gap-[var(--space-lg)]">
        <TeamHeader
          team={team}
          isLeader={isLeader}
          canConfirm={canConfirm}
          isLeaving={isLeaving}
          onOpenInvite={() => actions.setShowInviteModal(true)}
          onConfirmRegistration={() => {
            actions.setShowRegisterDialog(true);
          }}
          onLeave={() => {
            actions.setShowLeaveDialog(true);
          }}
          onEdit={() => {
            actions.setEditName(team.teamName);
            actions.setEditDescription(team.description || "");
            actions.setShowEditDialog(true);
          }}
        />

        {team.status === "PendingApproval" && (
          <Card className="border-sky-500/40 bg-sky-950/20 p-4 hud-clipped space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-mono font-bold text-xs uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Hồ sơ đã gửi tới Ban Tổ Chức — Đang chờ thẩm định</span>
            </div>
            <p className="font-sans text-xs text-sky-200/90 leading-relaxed">
              Hệ thống đã gửi email xác nhận ghi danh. Ban Tổ Chức sẽ kiểm tra tính hợp lệ của đội (sĩ số 3–5 người, thẻ sinh viên các thành viên) và gửi kết quả duyệt qua thông báo &amp; email trong thời gian sớm nhất.
            </p>
          </Card>
        )}

        {(team.lastRejectReason || team.status === "Rejected") && (
          <Card className="border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-5 hud-clipped space-y-3">
            <div className="flex items-center gap-2 text-[var(--color-danger)] font-mono font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-[var(--color-danger)]" />
              <span>Lý do Ban Tổ Chức từ chối / trả hồ sơ</span>
            </div>
            <div className="p-3.5 bg-black/50 border border-red-500/30 font-mono text-xs text-red-200 leading-relaxed rounded">
              {team.lastRejectReason || "Hồ sơ đội chưa đáp ứng đầy đủ thể lệ của giải đấu. Vui lòng kiểm tra lại thông tin các thành viên."}
            </div>
            <p className="font-sans text-[11px] text-zinc-400">
              Vui lòng hoàn thiện lại đội hình hoặc cập nhật hồ sơ thành viên theo lý do trên, sau đó nhấn nút <strong>[ Ghi danh với BTC ]</strong> để gửi lại hồ sơ xét duyệt.
            </p>
          </Card>
        )}

        {showRequirementBanner && (
          <Card className="border-[var(--color-warning)]/40 bg-[var(--color-warning)]/5">
            <h2 className="mb-[var(--space-sm)] font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--color-warning)]">
              Chưa đủ điều kiện ghi danh
            </h2>
            <RegistrationChecklist requirements={requirements} />
          </Card>
        )}

        {/* Đồng Hồ Đếm Ngược Nộp Bài Vòng Thi */}
        <TeamCountdownTimer
          deadline={activeRound?.endDate || activeRound?.EndDate}
          roundName={activeRound?.roundName || activeRound?.RoundName || "Vòng thi hiện tại"}
        />

        <div className="grid grid-cols-1 gap-[var(--space-lg)] lg:grid-cols-3">
          <div className="flex flex-col gap-[var(--space-lg)] lg:col-span-2">
            <MemberRoster
              members={members}
              currentUserId={currentUserId}
              isLeader={isLeader}
              onKick={(userId, name) => actions.setKickTarget({ id: userId, name })}
              onTransfer={(userId, name) => actions.setTransferTarget({ id: userId, name })}
              onOpenInvite={() => actions.setShowInviteModal(true)}
            />

            {isLeader && (
              <InvitePanel
                invitations={invitations}
                memberCount={members.length}
                canInvite={isForming}
                isLoading={isLoadingInvitations}
                loadError={hasInvitationError}
                isInviting={isInviting}
                isCancelling={isCancelling}
                onInvite={actions.handleInviteSubmit}
                onCancel={(inv) => actions.setCancelTarget(inv)}
              />
            )}
          </div>

          <div className="flex flex-col gap-[var(--space-lg)]">
            <TeamInfoCard team={team} memberCount={members.length} isLeader={isLeader} />
          </div>
        </div>

        {/* Modal Mời Thành Viên */}
        <InviteMemberModal
          open={showInviteModal}
          teamId={team.id}
          teamName={team.teamName}
          memberCount={members.length}
          pendingCount={invitations.length}
          onClose={() => actions.setShowInviteModal(false)}
          onInvite={actions.handleInviteSubmit}
        />

        {/* Dialog Xác Nhận Ghi Danh */}
        <ConfirmRegistrationDialog
          open={showRegisterDialog}
          teamName={team.teamName}
          eventName={team.eventName}
          requirements={requirements}
          canConfirm={canConfirm}
          isPending={isRegistering}
          error={dialogError}
          onConfirm={actions.handleConfirmRegistration}
          onCancel={() => actions.setShowRegisterDialog(false)}
        />

        {/* Dialog Xóa Thành Viên */}
        <ConfirmDialog
          open={Boolean(kickTarget)}
          title="Xóa thành viên khỏi đội?"
          description={`Bạn có chắc chắn muốn xóa thành viên "${kickTarget?.name}" khỏi đội thi không?`}
          confirmLabel={isKicking ? "Đang xóa..." : "Xác nhận xóa"}
          destructive
          onCancel={() => actions.setKickTarget(null)}
          onConfirm={actions.handleKickMember}
        />

        {/* Dialog Hủy Lời Mời */}
        <ConfirmDialog
          open={Boolean(cancelTarget)}
          title="Hủy lời mời tham gia?"
          description={`Hủy lời mời đã gửi tới email ${cancelTarget?.email}?`}
          confirmLabel={isCancelling ? "Đang hủy..." : "Hủy lời mời"}
          destructive
          onCancel={() => actions.setCancelTarget(null)}
          onConfirm={actions.handleCancelInvitation}
        />

        {/* Dialog Chuyển Quyền Trưởng Đội */}
        <TransferLeaderDialog
          open={Boolean(transferTarget)}
          targetName={transferTarget?.name || ""}
          isPending={isTransferring}
          error={dialogError}
          onCancel={() => actions.setTransferTarget(null)}
          onConfirm={actions.handleTransferLeadership}
        />

        {/* Dialog Rời Khỏi Đội */}
        <ConfirmDialog
          open={showLeaveDialog}
          title="Rời khỏi đội thi?"
          description="Bạn có chắc chắn muốn rời khỏi đội thi này? Bạn sẽ cần được mời lại nếu muốn gia nhập sau này."
          confirmLabel={isLeaving ? "Đang xử lý..." : "Rời đội"}
          destructive
          onCancel={() => actions.setShowLeaveDialog(false)}
          onConfirm={actions.handleLeaveTeam}
        />

        {/* Dialog Chỉnh Sửa Tên & Mô Tả Đội */}
        {showEditDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 font-mono">
            <Card className="w-full max-w-md p-6 bg-[#10171a] border border-amber-500/40 hud-clipped space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                  Chỉnh Sửa Thông Tin Đội Thi
                </h3>
                <button
                  type="button"
                  onClick={() => actions.setShowEditDialog(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="block font-mono text-[10px] text-zinc-400 uppercase mb-1">
                    Tên Đội Thi *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => actions.setEditName(e.target.value)}
                    placeholder="VD: SEAL Dev Team..."
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700 text-white font-bold rounded focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-zinc-400 uppercase mb-1">
                    Mô Tả / Khẩu Hiệu Đội
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => actions.setEditDescription(e.target.value)}
                    placeholder="Mô tả tóm tắt định hướng hoặc mục tiêu đề tài của đội..."
                    className="w-full px-3 py-2 bg-black/60 border border-zinc-700 text-zinc-200 rounded focus:border-amber-400 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => actions.setShowEditDialog(false)}
                  className="px-4 py-2 border border-zinc-700 text-zinc-300 hover:text-white rounded"
                >
                  HỦY BỎ
                </button>
                <button
                  type="button"
                  disabled={isUpdatingTeam}
                  onClick={actions.handleSaveTeamEdit}
                  className="px-5 py-2 bg-amber-500 hover:bg-white text-black font-bold uppercase rounded disabled:opacity-50"
                >
                  {isUpdatingTeam ? "ĐANG LƯU..." : "LƯU THÔNG TIN"}
                </button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </main>
  );
}
