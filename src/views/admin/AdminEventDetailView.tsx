"use client";

import React from "react";
import { Button, Card, Badge, Input, ApiMissingDataBadge, StatCard, EmptyState } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Link } from "@/i18n/routing";
import { ComprehensiveEventEditModal } from "@/components/domain/ComprehensiveEventEditModal";
import { RevokeDraftConfirmModal } from "@/components/domain/RevokeDraftConfirmModal";
import { ActivatePublicConfirmModal } from "@/components/domain/ActivatePublicConfirmModal";
import {
  Layers,
  Users,
  ArrowLeft,
  UserCheck,
  RefreshCw,
  FileText,
  Target,
  Scale,
  Lightbulb,
  Search,
  Filter,
  Edit,
} from "lucide-react";
import { useAdminEventDetailViewModel } from "@/viewModels/admin/useAdminEventDetailViewModel";

export function AdminEventDetailView() {
  const { state, data, actions } = useAdminEventDetailViewModel();

  const {
    eventId,
    activeTab,
    staffRoleFilter,
    staffSearchTerm,
    isEditingEvent,
    isRevokingDraft,
    isActivatingPublic,
    isEmergencyOverrideOpen,
    emergencyEcEmail,
    isSubmittingEmergency,
    emergencyMessage,
    isLoadingRounds,
    isLoadingTracks,
    isLoadingTeams,
    isLoadingStaff,
    evName,
    season,
    year,
    description,
    maxTeams,
    isActive,
  } = state;

  const {
    event,
    roundsList,
    tracksList,
    teamsList,
    eventRoles,
    judgesList,
    mentorsList,
    coordinatorsList,
    filteredStaffList,
  } = data;

  const tabs = [
    { id: "overview" as const, label: "Tổng quan" },
    { id: "rounds" as const, label: `Vòng thi (${roundsList.length})` },
    { id: "tracks" as const, label: `Hạng mục (${tracksList.length})` },
    { id: "staff" as const, label: `Hội đồng & cố vấn (${eventRoles.length})` },
    { id: "teams" as const, label: `Đội thi (${teamsList.length})` },
  ];

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title={evName}
        description={`Mã sự kiện: ${eventId}`}
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
            <span className="truncate text-[var(--text-primary)]">{evName}</span>
          </nav>
        }
        actions={
          <>
            <Link href="/admin/events">
              <Button variant="secondary" accent="primary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            {isActive ? (
              <Button variant="ghost" accent="primary" onClick={() => actions.setIsRevokingDraft(true)}>
                Thu hồi về nháp
              </Button>
            ) : (
              <Button variant="ghost" accent="primary" onClick={() => actions.setIsActivatingPublic(true)}>
                Kích hoạt công khai
              </Button>
            )}
            <Button
              variant="ghost"
              accent="primary"
              onClick={() => {
                if (isActive) actions.setIsRevokingDraft(true);
                else actions.setIsEditingEvent(true);
              }}
            >
              <Edit className="h-4 w-4" />
              Sửa sự kiện
            </Button>
            <Link href={`/admin/events/coordinators?eventId=${eventId}`}>
              <Button variant="ghost" accent="coordinator">
                Phân công EC
              </Button>
            </Link>
            <Button
              variant="ghost"
              accent="primary"
              onClick={() => {
                actions.setIsEmergencyOverrideOpen(true);
              }}
            >
              Can thiệp EC
            </Button>
            <Link href={`/coordinator/dashboard?eventId=${eventId}`}>
              <Button variant="ghost" accent="coordinator">
                Giám sát EC
              </Button>
            </Link>
            <Button variant="ghost" accent="primary" onClick={actions.handleRefreshAll}>
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="team">
          {season} {year}
        </Badge>
        <Badge tone={isActive ? "success" : "neutral"}>
          {isActive ? "Đang mở" : "Tạm dừng"}
        </Badge>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--border-muted)] pb-px text-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => actions.setActiveTab(tab.id)}
            className={`cursor-pointer whitespace-nowrap border-b-2 px-4 py-2.5 font-medium transition-colors ${
              activeTab === tab.id
                ? "border-[var(--accent-primary)] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="Quy mô đội thi tối đa"
              value={`${maxTeams} đội`}
              accent="var(--accent-primary)"
            />
            <StatCard
              label="Thời gian đăng ký"
              value={
                <>
                  {event?.registrationStartDate
                    ? new Date(event.registrationStartDate).toLocaleDateString("vi-VN")
                    : "TBD"}{" "}
                  —{" "}
                  {event?.registrationEndDate
                    ? new Date(event.registrationEndDate).toLocaleDateString("vi-VN")
                    : "TBD"}
                </>
              }
              accent="var(--text-primary)"
            />
            <StatCard
              label="Thời gian tổ chức"
              value={
                <>
                  {event?.startDate ? new Date(event.startDate).toLocaleDateString("vi-VN") : "TBD"} —{" "}
                  {event?.endDate ? new Date(event.endDate).toLocaleDateString("vi-VN") : "TBD"}
                </>
              }
              accent="var(--color-success)"
            />
          </div>

          <Card className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <FileText className="h-4 w-4 text-[var(--accent-primary)]" />
              Mô tả thể lệ cuộc thi
            </h3>
            <p className="whitespace-pre-line rounded-lg border border-[var(--border-muted)] bg-[var(--bg-base)] p-4 text-sm leading-relaxed text-[var(--text-muted)]">
              {description}
            </p>
          </Card>
        </div>
      )}

      {activeTab === "rounds" && (
        <Card className="space-y-4">
          <h3 className="flex items-center gap-2 border-b border-[var(--border-muted)] pb-3 text-sm font-semibold text-[var(--text-primary)]">
            <Layers className="h-4 w-4 text-[var(--accent-primary)]" />
            Cấu trúc các vòng thi ({roundsList.length})
          </h3>

          {isLoadingRounds ? (
            <EmptyState icon={RefreshCw} title="Đang tải" description="Đang tải các vòng thi..." />
          ) : roundsList.length === 0 ? (
            <EmptyState title="Chưa có vòng thi" description="Chưa có vòng thi nào được cấu hình cho sự kiện này." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {roundsList.map((r: any, idx) => (
                <div
                  key={r.id || idx}
                  className="space-y-2 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-base)] p-4 transition-colors hover:border-[var(--accent-primary)]/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--text-primary)]">
                      Vòng {r.roundNumber || idx + 1}: {r.roundName || r.name || "Vòng thi"}
                    </span>
                    <Badge tone="team">Vòng {idx + 1}</Badge>
                  </div>
                  <div className="space-y-0.5 text-xs text-[var(--text-muted)]">
                    <div>
                      Thời gian: {r.startDate ? new Date(r.startDate).toLocaleDateString("vi-VN") : "TBD"} –{" "}
                      {r.endDate ? new Date(r.endDate).toLocaleDateString("vi-VN") : "TBD"}
                    </div>
                    {r.advancementRule && <div>Quy tắc đi tiếp: {r.advancementRule}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "tracks" && (
        <Card className="space-y-4">
          <h3 className="flex items-center gap-2 border-b border-[var(--border-muted)] pb-3 text-sm font-semibold text-[var(--text-primary)]">
            <Target className="h-4 w-4 text-[var(--accent-primary)]" />
            Danh sách hạng mục ({tracksList.length})
          </h3>

          {isLoadingTracks ? (
            <EmptyState icon={RefreshCw} title="Đang tải" description="Đang tải các hạng mục..." />
          ) : tracksList.length === 0 ? (
            <EmptyState title="Chưa có hạng mục" description="Chưa có track nào được tạo cho sự kiện này." />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {tracksList.map((t: any, idx) => {
                const trackId = t.id || t.trackId;
                const trackJudges = judgesList.filter((j) => (j.trackId || j.TrackId) === trackId);
                const trackMentors = mentorsList.filter((m) => (m.trackId || m.TrackId) === trackId);

                return (
                  <div
                    key={trackId || idx}
                    className="space-y-3 rounded-lg border border-[var(--border-muted)] bg-[var(--bg-base)] p-5 transition-colors hover:border-[var(--accent-primary)]/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {t.trackName || t.name || "Track thi đấu"}
                      </span>
                      <Badge tone="team">Track {idx + 1}</Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                      {t.description || "Chưa có mô tả cho hạng mục này."}
                    </p>

                    <div className="space-y-2 border-t border-[var(--border-muted)]/60 pt-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[var(--text-muted)]">
                          <Scale className="h-3 w-3 text-[var(--accent-judge)]" /> Giám khảo ({trackJudges.length})
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {trackJudges.length > 0
                            ? trackJudges.map((j: any) => j.user?.fullName || j.user?.email || j.fullName || "Giám khảo").join(", ")
                            : "Chưa phân công"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[var(--text-muted)]">
                          <Lightbulb className="h-3 w-3 text-[var(--accent-mentor)]" /> Cố vấn ({trackMentors.length})
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {trackMentors.length > 0
                            ? trackMentors.map((m: any) => m.user?.fullName || m.user?.email || m.fullName || "Cố vấn").join(", ")
                            : "Chưa phân công"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Giám khảo" value={`${judgesList.length} người`} accent="var(--accent-judge)" />
            <StatCard label="Cố vấn" value={`${mentorsList.length} người`} accent="var(--accent-mentor)" />
            <StatCard label="Điều phối viên" value={`${coordinatorsList.length} người`} accent="var(--accent-coordinator)" />
          </div>

          <Card className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-12">
            <div className="flex items-center gap-2 sm:col-span-4">
              <Filter className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <select
                value={staffRoleFilter}
                onChange={(e) => actions.setStaffRoleFilter(e.target.value as any)}
                className="h-10 w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
              >
                <option value="all">Tất cả vai trò ({eventRoles.length})</option>
                <option value="judge">Giám khảo ({judgesList.length})</option>
                <option value="mentor">Cố vấn ({mentorsList.length})</option>
                <option value="coordinator">Điều phối viên ({coordinatorsList.length})</option>
              </select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-8">
              <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <Input
                type="search"
                placeholder="Tìm theo tên, email, hạng mục..."
                value={staffSearchTerm}
                onChange={(e) => actions.setStaffSearchTerm(e.target.value)}
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                <Users className="h-4 w-4 text-[var(--accent-primary)]" />
                Phân công nhân sự ({filteredStaffList.length})
              </h3>
              <Link href={`/admin/events/coordinators?eventId=${eventId}`}>
                <Button variant="ghost" accent="coordinator" className="h-8 text-xs">
                  <UserCheck className="h-3.5 w-3.5" />
                  Quản lý phân công
                </Button>
              </Link>
            </div>

            {isLoadingStaff ? (
              <EmptyState icon={RefreshCw} title="Đang tải" description="Đang tải danh sách nhân sự..." />
            ) : filteredStaffList.length === 0 ? (
              <ApiMissingDataBadge
                endpoint="GET /api/EventRoles/event"
                title="Chưa có nhân sự được phân công"
                message="Chưa có giám khảo, cố vấn hoặc điều phối viên nào được gán vào sự kiện này."
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--border-muted)]">
                <table className="w-full min-w-[850px] table-fixed border-collapse text-sm">
                  <thead className="border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
                    <tr>
                      <th className="w-[35%] px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Họ tên &amp; email</th>
                      <th className="w-[20%] px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Vai trò</th>
                      <th className="w-[25%] px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Hạng mục</th>
                      <th className="w-[20%] px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaffList.map((r: any, idx: number) => {
                      const user = r.user || r.User || {};
                      const fullName = user.fullName || user.FullName || r.fullName || "Nhân sự SEAL";
                      const email = user.email || user.Email || r.email || "Chưa có email";
                      const roleName = String(r.roleName ?? r.RoleName ?? "");
                      const trackName = r.track?.trackName || r.Track?.TrackName || "Toàn sự kiện";

                      const isJudge = roleName.toLowerCase().includes("judge") || roleName === "1";
                      const isMentor = roleName.toLowerCase().includes("mentor") || roleName === "2";
                      const isCoordinator = roleName.toLowerCase().includes("coordinator") || roleName === "0";

                      return (
                        <tr key={r.id || idx} className="border-t border-[var(--border-muted)]/60 transition-colors hover:bg-[var(--bg-input)]/50">
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="truncate font-medium text-[var(--text-primary)]" title={fullName}>
                                {fullName}
                              </span>
                              <span className="truncate text-xs text-[var(--text-muted)]" title={email}>
                                {email}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {isJudge ? (
                              <Badge tone="judge">Giám khảo</Badge>
                            ) : isMentor ? (
                              <Badge tone="mentor">Cố vấn</Badge>
                            ) : isCoordinator ? (
                              <Badge tone="coordinator">Điều phối</Badge>
                            ) : (
                              <Badge tone="neutral">{roleName}</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-[var(--text-primary)]">{trackName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone="success">Đã gán</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "teams" && (
        <Card className="space-y-4">
          <h3 className="flex items-center gap-2 border-b border-[var(--border-muted)] pb-3 text-sm font-semibold text-[var(--text-primary)]">
            <Users className="h-4 w-4 text-[var(--accent-primary)]" />
            Đội thi tham gia ({teamsList.length})
          </h3>

          {isLoadingTeams ? (
            <EmptyState icon={RefreshCw} title="Đang tải" description="Đang tải danh sách đội thi..." />
          ) : teamsList.length === 0 ? (
            <EmptyState title="Chưa có đội thi" description="Chưa có đội thi nào đăng ký tham gia sự kiện này." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--border-muted)]">
              <table className="w-full border-collapse text-sm">
                <thead className="border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Tên đội</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Hạng mục</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Thành viên</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)]">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {teamsList.map((tm: any, idx) => (
                    <tr key={tm.id || idx} className="border-t border-[var(--border-muted)]/60 transition-colors hover:bg-[var(--bg-input)]/50">
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {tm.name || tm.teamName || "Đội thi"}
                      </td>
                      <td className="px-4 py-3 text-[var(--accent-primary)]">
                        {tm.trackName || "—"}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {tm.memberCount || tm.members?.length || 1} thành viên
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="success">{tm.status || "Registered"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {isActivatingPublic && event && (
        <ActivatePublicConfirmModal
          event={event}
          onClose={() => actions.setIsActivatingPublic(false)}
          onConfirmSuccess={actions.handleRefreshAll}
        />
      )}

      {/* Modal Xác Nhận Thu Hồi Về Bản Nháp Cho Admin */}
      {isRevokingDraft && event && (
        <RevokeDraftConfirmModal
          event={event}
          onClose={() => actions.setIsRevokingDraft(false)}
          onConfirmSuccess={() => {
            actions.handleRefreshAll();
            actions.setIsRevokingDraft(false);
          }}
        />
      )}

      {/* Modal Chỉnh Sửa Toàn Diện Sự Kiện Cho Admin */}
      {isEditingEvent && event && (
        <ComprehensiveEventEditModal
          event={event}
          onClose={() => actions.setIsEditingEvent(false)}
          onSuccess={() => {
            actions.handleRefreshAll();
            actions.setIsEditingEvent(false);
          }}
        />
      )}

      {isEmergencyOverrideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg space-y-4 border-[var(--color-warning)]/40 p-6">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Can thiệp khẩn cấp: chỉ định EC
              </h3>
              <button
                type="button"
                onClick={() => actions.setIsEmergencyOverrideOpen(false)}
                className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[var(--text-muted)]">
              Sử dụng khi tài khoản event coordinator phụ trách sự kiện bị khóa hoặc gặp sự cố bất khả kháng.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[var(--text-muted)]">
                Email event coordinator mới
              </label>
              <Input
                type="email"
                value={emergencyEcEmail}
                onChange={(e) => actions.setEmergencyEcEmail(e.target.value)}
                placeholder="coordinator@fpt.edu.vn"
              />
            </div>

            {emergencyMessage && (
              <div
                className={`rounded-lg border p-2.5 text-xs ${
                  emergencyMessage.isError
                    ? "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                    : "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]"
                }`}
              >
                {emergencyMessage.text}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-[var(--border-muted)] pt-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmittingEmergency}
                onClick={() => actions.setIsEmergencyOverrideOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                variant="primary"
                accent="primary"
                disabled={isSubmittingEmergency}
                onClick={actions.handleAssignEmergencyEc}
              >
                {isSubmittingEmergency ? "Đang xử lý..." : "Xác nhận chỉ định EC"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

export default AdminEventDetailView;
