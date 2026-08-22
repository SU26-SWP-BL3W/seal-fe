"use client";

import React from "react";
import { Button, Card, Badge, Input, EmptyState, Pagination } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "@/i18n/routing";
import {
  UserCheck,
  Calendar,
  Search,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Trash2,
  Shield,
  Info,
  RefreshCw,
  UserPlus,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { RoleInvitationHistoryCard } from "@/components/domain/role-invitations/RoleInvitationHistoryCard";
import { useAdminCoordinatorsViewModel } from "@/viewModels/admin/useAdminCoordinatorsViewModel";

function pickEventId(ev: any): string {
  return ev?.id || ev?.Id || ev?.eventId || ev?.EventId || "";
}

export function AdminCoordinatorsView() {
  const { state, data, pagination, actions } = useAdminCoordinatorsViewModel();
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);

  const {
    selectedEventId,
    selectedEvent,
    selectedUser,
    searchQuery,
    customFullName,
    isSubmitting,
    removingRoleId,
    actionSuccess,
    actionError,
    historyRecords,
    isLoadingRoles,
    matchedUser,
    isStudent,
    isAlreadyEc,
  } = state;

  const { eventsList, currentCoordinators, searchMatches } = data;
  const { paginatedItems: paginatedCoordinators, currentPage, totalPages, totalItems, pageSize, setCurrentPage, setPageSize } = pagination;

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title="Phân công trưởng ban điều phối"
        description="Trao quyền điều phối, cấu hình tiêu chí, duyệt hồ sơ thí sinh và chấm thi cho ban tổ chức từng sự kiện."
        breadcrumb={
          <nav className="text-xs text-[var(--text-muted)]">
            <Link href="/admin/dashboard" className="hover:text-[var(--accent-primary)]">
              Admin
            </Link>
            <span className="mx-1.5">/</span>
            <Link href="/admin/events" className="hover:text-[var(--accent-primary)]">
              Sự kiện
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--text-primary)]">Phân công EC</span>
          </nav>
        }
        actions={
          <>
            <Link href="/admin/events">
              <Button variant="secondary" accent="primary">
                Quay lại sự kiện
              </Button>
            </Link>
            {selectedEventId && (
              <Link href={`/coordinator/dashboard?eventId=${selectedEventId}`}>
                <Button variant="secondary" accent="coordinator">
                  <ExternalLink className="h-4 w-4" />
                  Giám sát EC
                </Button>
              </Link>
            )}
            <Button variant="ghost" accent="primary" onClick={() => actions.refetchRoles()}>
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </>
        }
      />

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)]">
            <Calendar className="h-4 w-4 text-[var(--accent-primary)]" />
            Bước 1: Chọn sự kiện
          </span>
          <span className="text-xs text-[var(--text-muted)]">{eventsList.length} sự kiện có sẵn</span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-8">
            <select
              value={selectedEventId}
              onChange={(e) => actions.setSelectedEventId(e.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            >
              <option value="">— Chọn sự kiện —</option>
              {eventsList.map((ev: any) => {
                const id = pickEventId(ev);
                const name = ev.eventName || ev.EventName || "Sự kiện";
                const season = ev.season || ev.Season || "";
                const year = ev.year || ev.Year || "";
                return (
                  <option key={id} value={id}>
                    {name} [{season} {year}]
                  </option>
                );
              })}
            </select>
          </div>

          {selectedEvent && (
            <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 text-sm md:col-span-4">
              <span className="text-[var(--text-muted)]">Mùa giải:</span>
              <Badge tone="team">
                {selectedEvent.season || selectedEvent.Season || "Summer"}{" "}
                {selectedEvent.year || selectedEvent.Year || 2026}
              </Badge>
              <Badge tone={selectedEvent.status !== false ? "success" : "neutral"} className="ml-auto">
                {selectedEvent.status !== false ? "Mở" : "Đóng"}
              </Badge>
            </div>
          )}
        </div>
      </Card>

      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success)]/40 bg-[var(--color-success)]/10 p-3 text-sm text-[var(--color-success)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-5">
          <Card className="space-y-4 p-5">
            <div className="border-b border-[var(--border-muted)] pb-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <UserPlus className="h-4 w-4 text-[var(--accent-primary)]" />
                Gán / mời điều phối viên
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Nhập email hoặc tìm kiếm tài khoản giảng viên / cán bộ trong hệ thống.
              </p>
            </div>

            <form onSubmit={actions.handleSubmit} className="space-y-4">
              <div className="relative space-y-1.5">
                <label className="block text-xs font-medium text-[var(--text-muted)]">
                  Email hoặc tên người dùng
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    type="text"
                    placeholder="vd: coordinator@fpt.edu.vn hoặc tên..."
                    value={searchQuery}
                    onChange={(e) => {
                      actions.setSearchQuery(e.target.value);
                      if (selectedUser) actions.handleClearSelection();
                    }}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
                    className="pl-9"
                    disabled={isSubmitting}
                  />
                </div>

                {isSearchFocused && searchMatches.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-lg border border-[var(--border-muted)] bg-[var(--bg-panel)] shadow-lg">
                    <div className="sticky top-0 border-b border-[var(--border-muted)] bg-[var(--bg-base)] p-2 text-xs text-[var(--text-muted)]">
                      {searchQuery.trim() ? `Gợi ý (${searchMatches.length})` : `Tất cả tài khoản (${searchMatches.length})`}
                    </div>
                    {searchMatches.map((u: any) => {
                      const name = u.fullName || u.FullName || "Không tên";
                      const email = u.email || u.Email || "";
                      const isStud = Boolean(u.isStudent || u.IsStudent || u.studentCode);
                      return (
                        <div
                          key={u.id || u.Id || email}
                          onClick={() => actions.handleSelectUser(u)}
                          className="flex cursor-pointer items-center justify-between border-b border-[var(--border-muted)]/60 p-2.5 transition-colors hover:bg-[var(--bg-input)]"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="truncate font-medium text-[var(--text-primary)]">{name}</div>
                            <div className="truncate text-xs text-[var(--text-muted)]">{email}</div>
                          </div>
                          <Badge tone={isStud ? "warning" : "info"}>{isStud ? "Thí sinh" : "Cán bộ"}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {matchedUser && (
                <div className="space-y-1.5 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-base)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-muted)]">Tài khoản xác định</span>
                    <button
                      type="button"
                      onClick={actions.handleClearSelection}
                      className="cursor-pointer text-xs text-[var(--accent-primary)] hover:underline"
                    >
                      Đổi tài khoản
                    </button>
                  </div>
                  <div className="font-medium text-[var(--text-primary)]">
                    {matchedUser.fullName || (matchedUser as any).FullName || "Cán bộ"}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Mail className="h-3 w-3" /> {matchedUser.email}
                  </div>

                  {isStudent && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-2 text-xs text-[var(--color-warning)]">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Tài khoản này là sinh viên, không thể làm điều phối viên.
                    </div>
                  )}

                  {isAlreadyEc && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-[var(--accent-coordinator)]/40 bg-[var(--accent-coordinator)]/10 p-2 text-xs text-[var(--accent-coordinator)]">
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      Người này đã là điều phối viên của sự kiện này.
                    </div>
                  )}
                </div>
              )}

              {!matchedUser && searchQuery.includes("@") && searchQuery.includes(".") && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[var(--text-muted)]">Họ và tên (tùy chọn)</label>
                  <Input
                    type="text"
                    placeholder="vd: ThS. Nguyễn Văn A"
                    value={customFullName}
                    onChange={(e) => actions.setCustomFullName(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <span className="block text-xs text-cyan-400 font-mono">
                    Tài khoản chưa có trong hệ thống: Sẽ tự động cấp tài khoản tạm &amp; gửi email kích hoạt qua email này.
                  </span>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                accent="coordinator"
                disabled={isSubmitting || isStudent || isAlreadyEc || !selectedEventId || !searchQuery.trim()}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Đang xử lý...
                  </>
                ) : matchedUser ? (
                  <>
                    <UserCheck className="h-4 w-4" /> Xác nhận phân công EC
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Gửi Mời &amp; Cấp TK Tạm EC
                  </>
                )}
              </Button>
            </form>
          </Card>

          <Card className="space-y-2 p-4 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1.5 font-medium text-[var(--text-primary)]">
              <Info className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              Quyền hạn của event coordinator
            </div>
            <ul className="list-disc space-y-1 pl-4">
              <li>Toàn quyền cấu hình bộ tiêu chí &amp; mẫu đánh giá cho các track.</li>
              <li>Duyệt đăng ký đội thi và hồ sơ thẻ sinh viên Non-FPT.</li>
              <li>Phân bổ ban giám khảo, giám sát tiến độ chấm điểm.</li>
              <li>Tính điểm và công bố bảng vàng kết quả sự kiện.</li>
            </ul>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Shield className="h-4 w-4 text-[var(--accent-coordinator)]" />
                Điều phối viên hiện tại ({currentCoordinators.length})
              </h3>
              <span className="text-xs text-[var(--text-muted)]">
                {selectedEvent?.eventName || selectedEvent?.EventName || "Chưa chọn"}
              </span>
            </div>

            {!selectedEventId ? (
              <EmptyState
                title="Chưa chọn sự kiện"
                description="Vui lòng chọn một sự kiện ở trên để xem danh sách điều phối viên."
              />
            ) : isLoadingRoles ? (
              <EmptyState
                icon={RefreshCw}
                title="Đang tải"
                description="Đang tải danh sách nhân sự sự kiện..."
              />
            ) : currentCoordinators.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Chưa có điều phối viên"
                description="Sự kiện này chưa có trưởng ban điều phối. Hãy dùng form bên trái để gán ít nhất một EC."
              />
            ) : (
              <div className="space-y-3">
                {paginatedCoordinators.map((c: any, idx: number) => {
                  const roleId = c.id || c.Id || c.roleId || c.RoleId || `ec-${idx}`;
                  const coordUserId = c.userId || c.UserId || c.user?.id || c.user?.userId || c.User?.Id;
                  const uName = c.user?.fullName || c.User?.FullName || c.fullName || c.FullName || c.userName || c.UserName || "Điều phối viên";
                  const uEmail = c.user?.email || c.User?.Email || c.email || c.Email || "coordinator@seal.edu.vn";
                  const isRemoving = removingRoleId === roleId;

                  return (
                    <div
                      key={roleId}
                      className="flex flex-col justify-between gap-3 rounded-lg border border-[var(--accent-coordinator)]/30 bg-[var(--bg-base)] p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--accent-coordinator)]/40 bg-[var(--accent-coordinator)]/10 font-semibold text-[var(--accent-coordinator)]">
                          {uName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-[var(--text-primary)]">{uName}</div>
                          <div className="flex items-center gap-1.5 truncate text-xs text-[var(--text-muted)]">
                            <Mail className="h-3 w-3 shrink-0" /> {uEmail}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                        <Badge tone="coordinator">Coordinator</Badge>
                        <Button
                          variant="ghost"
                          accent="primary"
                          onClick={() => actions.handleRemoveCoordinator(roleId, uName, coordUserId, uEmail)}
                          disabled={isRemoving}
                          className="h-8 px-2.5 text-xs"
                        >
                          {isRemoving ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                          Thu hồi
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {currentCoordinators.length > 0 && (
                  <div className="pt-2">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                      itemLabel="điều phối viên"
                      compact={true}
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Role Invitation History & Status Tracker Section */}
      {selectedEventId && (
        <RoleInvitationHistoryCard
          eventId={selectedEventId}
          eventName={selectedEvent?.eventName || selectedEvent?.EventName || "Sự kiện"}
          roleFilter="EventCoordinator"
          records={historyRecords}
          onRefresh={() => actions.refetchRoles()}
          onResend={actions.handleResendCoordinatorInvitation}
          onRevoke={actions.handleRevokeCoordinatorInvitation}
          onDeleteHistory={() => actions.refetchRoles()}
        />
      )}
    </PageShell>
  );
}
