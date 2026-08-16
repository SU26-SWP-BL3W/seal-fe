"use client";

import React, { useState } from "react";
import { Button, Card, Badge, Input } from "@/components/ui";
import { useMyEvents, eventsRepository, type MyEventModel } from "@/repositories/eventsRepository";
import { useGetPendingTeams } from "@/repositories/teamsRepository";
import { useGetUsers } from "@/repositories/usersRepository";
import { computeEventStatus, STATUS_LABEL, STATUS_TONE, STATUS_DOT_VAR, type EventItem } from "@/viewModels/eventsMetadata";
import { Shield, Settings, Activity, Users, CalendarPlus, Trash2, Edit3, Award, FileText, CheckCircle2, Sliders, ExternalLink, Eye, EyeOff, Rocket } from "lucide-react";
import Link from "next/link";

function toEventDates(ev: MyEventModel): Pick<EventItem, "startDate" | "endDate" | "registrationEndDate"> {
  return {
    startDate: ev.startDate || ev.StartDate || "",
    endDate: ev.endDate || ev.EndDate || "",
    registrationEndDate: ev.registrationEndDate || ev.RegistrationEndDate || ev.endDate || ev.EndDate || "",
  };
}

export const CoordinatorDashboardView: React.FC = () => {
  const { data: eventsList = [], isLoading, refetch } = useMyEvents();
  const { data: pendingTeams = [] } = useGetPendingTeams();
  const { data: pendingUsersData } = useGetUsers({ isApproved: false });
  // AppealsController thật không có route "GET tất cả đơn phúc khảo" (chỉ có
  // theo team/round/eventRole) — không có cách hợp lệ để đếm tổng số đơn đang
  // mở trên toàn hệ thống từ 1 lệnh gọi. Để trống thay vì gọi route giả.
  const appealsList: { status?: number | string; Status?: string }[] = [];

  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [togglingEventId, setTogglingEventId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const handleTogglePublish = async (eventId: string, currentStatus: boolean, eventName: string) => {
    const nextStatus = !currentStatus;
    const confirmMsg = nextStatus
      ? `Bạn có chắc chắn muốn CÔNG BỐ sự kiện "${eventName}" lên trang chủ công khai không?`
      : `Bạn có chắc chắn muốn TẠM ẨN sự kiện "${eventName}" về trạng thái Bản Nháp (Draft) để chỉnh sửa không? Trong thời gian ẩn, thí sinh sẽ không thể thấy hay đăng ký mới.`;

    if (!confirm(confirmMsg)) return;

    setTogglingEventId(eventId);
    try {
      await eventsRepository.updateEvent(eventId, { status: nextStatus });
      await refetch();
    } catch (err: any) {
      alert(`Thao tác thất bại: ${err?.response?.data?.message || err?.message}`);
    } finally {
      setTogglingEventId(null);
    }
  };

  const pendingStudentsList = pendingUsersData?.data ?? [];

  // Metrics
  const pendingTeamsCount = pendingTeams.length;
  const pendingStudentsCount = pendingStudentsList.length;
  const openAppealsCount = Array.isArray(appealsList)
    ? appealsList.filter((a: any) => a.status === 0 || a.status === "Pending" || a.Status === "Filed").length
    : 0;

  // Filtered Events with Deduplication
  const seenEventKeys = new Set<string>();
  const filteredEvents = eventsList
    .filter((ev, idx) => {
      const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-id-${idx}`;
      return !deletedIds.includes(id);
    })
    .filter((ev) => {
      const name = (ev.eventName || ev.EventName || "").trim();
      if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      const key = `${name.toLowerCase()}-${ev.year || ev.Year || 2026}`;
      if (seenEventKeys.has(key)) return false;
      seenEventKeys.add(key);
      return true;
    });

  const handleDeleteEvent = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      if (!deleteTargetId.startsWith("ev-id-")) {
        await eventsRepository.deleteEvent(deleteTargetId);
      }
      setDeletedIds((prev) => [...prev, deleteTargetId]);
      await refetch();
    } catch (err) {
      alert("Xóa sự kiện thất bại. Vui lòng kiểm tra lại quyền truy cập.");
    } finally {
      setDeleteTargetId(null);
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans hud-lattice flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Header Title & Main Action Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent-coordinator)] mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>[● LIVE COMMAND DECK] // EVENT COORDINATOR HUB</span>
            </div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--text-primary)] uppercase tracking-wider">
              Trung Tâm Quản Lý Sự Kiện &amp; Vòng Thi
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 font-sans">
              Quản lý tập trung các mùa giải Hackathon, cấu hình vòng thi, hạng mục chuyên môn, phân công nhân sự và duyệt kết quả.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/coordinator/staff">
              <Button variant="secondary" className="hud-clipped font-mono text-xs flex items-center gap-2">
                <Users className="w-4 h-4" /> MỜI NHÂN SỰ
              </Button>
            </Link>

            <Link href="/coordinator/events/new">
              <Button variant="primary" accent="coordinator" className="hud-glow-coordinator flex items-center gap-2">
                <Settings className="w-4 h-4" /> + THÊM SỰ KIỆN MỚI (WIZARD) &gt;
              </Button>
            </Link>
          </div>
        </div>

        {/* Real-time KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hud-glow-coordinator p-5 space-y-2">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Sự Kiện Đang Phụ Trách
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-[var(--accent-coordinator)]">
                {isLoading ? "..." : filteredEvents.length}
              </span>
              <Shield className="w-5 h-5 text-[var(--accent-coordinator)] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] block">
              Danh sách sự kiện được phân công
            </span>
          </Card>

          <Card className="hud-glow-coordinator p-5 space-y-2">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Đội Thi Chờ Duyệt
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-[var(--accent-team)]">
                {pendingTeamsCount}
              </span>
              <Users className="w-5 h-5 text-[var(--accent-team)] opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] block">
              Cần duyệt đăng ký tham gia
            </span>
          </Card>

          <Card className="hud-glow-coordinator p-5 space-y-2">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Hồ Sơ SV Chờ Xác Minh
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-sky-400">
                {pendingStudentsCount}
              </span>
              <CheckCircle2 className="w-5 h-5 text-sky-400 opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] block">
              Yêu cầu duyệt thẻ sinh viên
            </span>
          </Card>

          <Card className="hud-glow-coordinator p-5 space-y-2">
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-wider block">
              Đơn Phúc Khảo Chờ Xử Lý
            </span>
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-bold text-2xl text-purple-400">
                {openAppealsCount}
              </span>
              <FileText className="w-5 h-5 text-purple-400 opacity-60" />
            </div>
            <span className="font-mono text-[10px] text-[var(--text-muted)] block">
              Đơn khiếu nại điểm từ các đội
            </span>
          </Card>
        </div>

        {/* Managed Events Deck */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-lg text-[var(--text-primary)] uppercase tracking-wider">
                Danh Sách Sự Kiện Bạn Đang Phụ Trách
              </h2>
              <p className="text-xs text-[var(--text-muted)] font-sans">
                Danh sách cập nhật thời gian thực dành riêng cho Event Coordinator đang đăng nhập.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm sự kiện..."
                className="text-xs font-mono"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <svg className="w-12 h-12 animate-spin" viewBox="0 0 100 100">
                <polygon
                  points="50,5 91,27.5 91,72.5 50,95 9,72.5 9,27.5"
                  fill="none"
                  stroke="var(--accent-coordinator)"
                  strokeWidth="2"
                  strokeDasharray="240"
                  strokeDashoffset="60"
                />
              </svg>
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="p-16 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)] text-center flex flex-col items-center gap-4">
              <CalendarPlus className="w-10 h-10 text-[var(--text-muted)] opacity-50" />
              <p className="font-sans text-sm text-[var(--text-muted)]">
                {searchTerm ? "Không tìm thấy sự kiện phù hợp từ từ khóa" : "Bạn chưa quản lý sự kiện nào trong hệ thống"}
              </p>
              <Link href="/coordinator/events/new">
                <Button variant="primary" accent="coordinator" className="text-xs font-mono">
                  <Settings className="w-4 h-4" /> TẠO SỰ KIỆN ĐẦU TIÊN
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((ev, idx) => {
                const status = computeEventStatus(toEventDates(ev) as EventItem, now);
                const id = ev.id || ev.Id || ev.eventId || ev.EventId || `ev-id-${idx}`;
                const name = ev.eventName || ev.EventName || "Sự kiện Hackathon";
                const season = ev.season || ev.Season || "Mùa giải";
                const year = ev.year || ev.Year || 2026;
                const maxTeams = ev.maxTeams || ev.MaxTeams || 50;
                const isPublished = (ev as any).status === true || (ev as any).Status === true;

                return (
                  <div
                    key={id}
                    className="bg-[var(--bg-panel)] border border-[var(--border-muted)] p-5 hud-clipped flex flex-col justify-between space-y-4 hover:border-[var(--accent-coordinator)]/50 transition-all"
                    style={{ borderTop: `3px solid ${STATUS_DOT_VAR[status]}` }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-[var(--accent-coordinator)] font-bold uppercase">
                          {season} {year}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isPublished ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold hud-clipped">
                              🟢 PUBLIC
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold hud-clipped">
                              🟡 BẢN NHÁP
                            </span>
                          )}
                          <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
                        </div>
                      </div>

                      <h3 className="font-display font-bold text-lg text-[var(--text-primary)]">
                        {name}
                      </h3>

                      <p className="text-xs text-[var(--text-muted)] font-sans line-clamp-2">
                        {ev.description || ev.Description || "Chưa có mô tả chi tiết cho sự kiện này."}
                      </p>

                      <div className="bg-[var(--bg-input)] p-2.5 rounded border border-[var(--border-muted)] text-[11px] font-mono text-[var(--text-muted)] space-y-1">
                        <div className="flex justify-between">
                          <span>Quy mô tối đa:</span>
                          <span className="text-[var(--text-primary)] font-bold">{maxTeams} Đội thi</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Mùa giải:</span>
                          <span className="text-[var(--text-primary)] font-bold">{ev.season || ev.Season || "Mùa Hè"} {ev.year || ev.Year || 2026}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Trạng thái hiển thị:</span>
                          <span className={isPublished ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                            {isPublished ? "Công khai (Thí sinh có thể thấy)" : "Đang ẩn (Chỉ BTC/Admin thấy)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="border-t border-[var(--border-muted)] pt-4 space-y-2.5">
                      
                      {/* PROMINENT EDIT EVENT BUTTON */}
                      <Link href={`/coordinator/events/${id}`} className="block">
                        <Button
                          variant="primary"
                          accent="coordinator"
                          className="w-full text-xs font-mono py-2 flex items-center justify-center gap-1.5 shadow-sm font-bold bg-[#a855f7] hover:bg-[#9333ea] text-white"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>✏️ CHỈNH SỬA SỰ KIỆN &amp; VÒNG THI</span>
                        </Button>
                      </Link>

                      {/* SECONDARY CONTROLS GRID */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={togglingEventId === id}
                          onClick={() => handleTogglePublish(id, isPublished, name)}
                          className={`w-full text-[11px] font-mono py-1.5 flex items-center justify-center gap-1 border ${
                            isPublished
                              ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                              : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                              <span>{togglingEventId === id ? "Đang ẩn..." : "Tạm Ẩn"}</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{togglingEventId === id ? "Đang mở..." : "Công Bố"}</span>
                            </>
                          )}
                        </Button>

                        <Link href="/coordinator/teams">
                          <Button variant="secondary" className="w-full text-[11px] font-mono py-1.5 flex items-center justify-center gap-1">
                            <Users className="w-3.5 h-3.5 text-[var(--accent-team)]" />
                            <span>Duyệt Đội</span>
                          </Button>
                        </Link>

                        <Link href="/coordinator/staff">
                          <Button variant="secondary" className="w-full text-[11px] font-mono py-1.5 flex items-center justify-center gap-1">
                            <Users className="w-3.5 h-3.5 text-purple-400" />
                            <span>Staff</span>
                          </Button>
                        </Link>

                        <Link href="/coordinator/publish-results">
                          <Button variant="secondary" className="w-full text-[11px] font-mono py-1.5 flex items-center justify-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            <span>Công Bố</span>
                          </Button>
                        </Link>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTargetId(id);
                            setDeleteTargetName(name);
                          }}
                          className="text-[11px] font-mono text-[var(--color-danger)] hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Xoá sự kiện
                        </button>

                        <Link href={`/events/${id}`} className="text-[11px] font-mono text-[var(--text-muted)] hover:text-[var(--accent-coordinator)] flex items-center gap-1">
                          <span>Xem Public</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Shortcut Dock at Bottom */}
        <div className="border-t border-[var(--border-muted)] pt-6 space-y-3">
          <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)] uppercase tracking-wider">
            <Sliders className="w-4 h-4 text-[var(--accent-coordinator)]" />
            <span>Thanh Lối Tắt Vận Hành Nhanh (Operational Shortcuts)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/coordinator/templates" className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hover:border-[var(--accent-coordinator)] transition-all hud-clipped flex items-center gap-3">
              <Sliders className="w-5 h-5 text-[var(--accent-coordinator)]" />
              <div>
                <h4 className="font-mono text-xs font-bold text-[var(--text-primary)]">Kho Tiêu Chí &amp; Template (RBL)</h4>
                <p className="text-[10px] text-[var(--text-muted)] font-sans">Quản lý mẫu chấm 100% trọng số</p>
              </div>
            </Link>

            <Link href="/coordinator/calibration" className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hover:border-[var(--accent-coordinator)] transition-all hud-clipped flex items-center gap-3">
              <Activity className="w-5 h-5 text-[var(--accent-team)]" />
              <div>
                <h4 className="font-mono text-xs font-bold text-[var(--text-primary)]">Hiệu Chuẩn Điểm (Calibration)</h4>
                <p className="text-[10px] text-[var(--text-muted)] font-sans">Ma trận chấm &amp; độ lệch giám khảo</p>
              </div>
            </Link>

            <Link href="/coordinator/profiles" className="p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hover:border-[var(--accent-coordinator)] transition-all hud-clipped flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-mono text-xs font-bold text-[var(--text-primary)]">Duyệt Hồ Sơ Sinh Viên</h4>
                <p className="text-[10px] text-[var(--text-muted)] font-sans">Xác minh thẻ SV &amp; FPT student</p>
              </div>
            </Link>
          </div>
        </div>

      </main>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[var(--bg-panel)] border border-[var(--color-danger)] p-6 max-w-md w-full hud-clipped space-y-4 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-2 text-[var(--color-danger)] font-mono font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              <span>XÁC NHẬN XOÁ SỰ KIỆN</span>
            </div>

            <p className="text-xs text-[var(--text-primary)] font-sans leading-relaxed">
              Bạn có chắc chắn muốn xoá sự kiện <strong className="text-[var(--accent-coordinator)]">"{deleteTargetName}"</strong>? 
              <br />
              <span className="text-[var(--color-danger)] font-mono text-[11px] block mt-2">
                ⚠️ Cảnh báo: Hành động này sẽ xoá toàn bộ Vòng thi, Hạng mục và dữ liệu liên quan!
              </span>
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setDeleteTargetId(null)}
                disabled={isDeleting}
                className="text-xs font-mono"
              >
                HỦY BỎ
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="bg-[var(--color-danger)] text-white hover:bg-red-600 text-xs font-mono"
              >
                {isDeleting ? "Đang xoá..." : "XÁC NHẬN XOÁ"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
