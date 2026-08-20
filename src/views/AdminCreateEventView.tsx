"use client";

import React, { useState } from "react";
import { Button, Input, Card, CalendarRangeField } from "@/components/ui";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { eventsRepository } from "@/repositories/eventsRepository";
import { staffRepository } from "@/repositories/staffRepository";
import { usersRepository } from "@/repositories/usersRepository";
import { Calendar, Clock, Info, CheckCircle2, UserCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/providers/ToastProvider";
import { Link } from "@/i18n/routing";

export const AdminCreateEventView: React.FC = () => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successEventId, setSuccessEventId] = useState<string | null>(null);

  const [form, setForm] = useState({
    eventName: "SEAL Hackathon 2026",
    season: "Mùa Hè",
    year: 2026,
    startDate: "2026-07-15T08:00",
    endDate: "2026-09-20T17:00",
    registrationStartDate: "2026-06-01T08:00",
    registrationEndDate: "2026-07-10T23:59",
    description: "Đấu trường công nghệ quy mô lớn dành cho sinh viên toàn quốc do Ban Quản Trị SEAL phê duyệt.",
    coordinatorEmail: "ec.coordinator@seal.edu.vn",
    minTeamSize: 3,
    maxTeamSize: 5,
    maxTeams: 50,
    round1Name: "Vòng 1",
    round1StartDate: "2026-07-15T08:00",
    round1EndDate: "2026-09-20T17:00",
    track1Name: "Bảng Đấu Phần Mềm Ứng Dụng (General Software)",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.eventName.trim()) {
      const msg = "Vui lòng nhập tên sự kiện!";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      const msg = "Ngày bắt đầu sự kiện phải diễn ra trước ngày kết thúc!";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (!form.round1Name.trim() || !form.round1StartDate || !form.round1EndDate) {
      const msg = "Vui lòng nhập đủ tên và thời gian Vòng 1 — hệ thống bắt buộc mỗi sự kiện phải có ít nhất một vòng thi.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (!form.track1Name.trim()) {
      const msg = "Vui lòng nhập tên Hạng mục (Track) đầu tiên — mỗi vòng thi bắt buộc phải có ít nhất một hạng mục.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        eventName: form.eventName,
        season: form.season,
        year: Number(form.year),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        registrationStartDate: form.registrationStartDate ? new Date(form.registrationStartDate).toISOString() : new Date(form.startDate).toISOString(),
        registrationEndDate: form.registrationEndDate ? new Date(form.registrationEndDate).toISOString() : new Date(form.endDate).toISOString(),
        description: form.description,
        maxTeams: Number(form.maxTeams),
        status: true,
        rounds: [
          {
            roundName: form.round1Name,
            roundNumber: 1,
            startDate: new Date(form.round1StartDate).toISOString(),
            endDate: new Date(form.round1EndDate).toISOString(),
            tracks: [{ trackName: form.track1Name }],
          },
        ],
      };

      const res = await eventsRepository.createEvent(payload);

      if (res && res.success !== false && (res.data || res.id || res.Id || res.eventId || res.EventId)) {
        const innerData = res.data || res;
        const eventId = innerData.id || innerData.Id || innerData.eventId || innerData.EventId || "";
        if (form.coordinatorEmail.trim()) {
          const foundUser = await usersRepository.findUserByEmail(form.coordinatorEmail.trim());
          if (foundUser) {
            const realUserId = foundUser.id || (foundUser as any).Id || (foundUser as any).userId || (foundUser as any).UserId;
            try {
              await staffRepository.assignRoleDirectly({
                userId: realUserId,
                eventId: eventId,
                roleName: "EventCoordinator",
              });
            } catch (err: any) {
              console.error("Lỗi phân công EC:", err);
            }
          } else {
            alert(`Cảnh báo: Đã tạo thành công Sự kiện, nhưng không tìm thấy tài khoản với email "${form.coordinatorEmail}". Bạn có thể phân công lại EC ở danh sách sự kiện.`);
          }
        }
        setSuccessEventId(eventId);
        toast.success("Khởi tạo sự kiện cuộc thi thành công!");
      } else {
        const msg = res?.message || "Tạo sự kiện thất bại. Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.";
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      console.error("Lỗi tạo sự kiện:", err);
      const details = err?.response?.data?.details;
      const detailMsg = Array.isArray(details) ? details.map((d: any) => d?.value?.join?.(" ") || d?.value).filter(Boolean).join(" ") : null;
      const apiMsg = detailMsg || err?.response?.data?.message || err?.message || "Tạo sự kiện thất bại. Vui lòng kiểm tra dữ liệu và thử lại.";
      setErrorMessage(apiMsg);
      toast.error(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell className="min-h-[calc(100vh-4rem)] space-y-6">
      <PageHeader
        title="Khởi tạo sự kiện mới"
        description="Tạo khung sự kiện chính, thiết lập thời gian và chỉ định event coordinator phụ trách điều phối giải đấu."
        breadcrumb={
          <nav className="text-xs text-[var(--text-muted)]">
            <Link href="/admin/dashboard" className="hover:text-[var(--accent-primary)]">
              Admin
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-[var(--text-primary)]">Tạo sự kiện</span>
          </nav>
        }
      />

      <Card className="space-y-6 p-6">
        {errorMessage && (
          <div className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
            {errorMessage}
          </div>
        )}

        {successEventId ? (
          <div className="space-y-4 rounded-lg border border-[var(--color-success)] bg-[var(--color-success)]/10 p-6 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-[var(--color-success)]" />
            </div>
            <h3 className="font-display text-lg font-semibold text-[var(--color-success)]">
              Khởi tạo sự kiện thành công
            </h3>
            <p className="text-sm text-[var(--text-primary)]">
              Mã sự kiện: <span className="font-semibold text-[var(--accent-primary)]">#{successEventId}</span>
              {form.coordinatorEmail && (
                <span className="mt-1 block text-[var(--accent-coordinator)]">
                  Đã phân công EC: {form.coordinatorEmail}
                </span>
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link href="/admin/dashboard">
                <Button variant="primary" accent="primary">
                  Về bảng điều hành
                </Button>
              </Link>
              <Link href="/coordinator/dashboard">
                <Button variant="secondary" accent="coordinator">
                  Sang EC dashboard
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-[var(--text-muted)]">
                  Tên sự kiện <span className="text-[var(--color-danger)]">*</span>
                </label>
                <Input
                  type="text"
                  value={form.eventName}
                  onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-4 rounded-lg border border-[var(--accent-coordinator)]/30 bg-[var(--bg-input)] p-4 md:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--accent-coordinator)]">
                  <UserCheck className="h-4 w-4" />
                  Chỉ định event coordinator phụ trách
                </label>
                <Input
                  type="email"
                  placeholder="e.g. ec.coordinator@seal.edu.vn"
                  value={form.coordinatorEmail}
                  onChange={(e) => setForm({ ...form, coordinatorEmail: e.target.value })}
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Admin có thể gán ngay tài khoản EC hoặc bỏ trống để gán sau trên Admin Dashboard.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Mùa giải *</label>
                <select
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  className="h-10 w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                >
                  <option value="Mùa Xuân">Mùa Xuân (Spring)</option>
                  <option value="Mùa Hè">Mùa Hè (Summer)</option>
                  <option value="Mùa Thu">Mùa Thu (Autumn)</option>
                  <option value="Mùa Đông">Mùa Đông (Winter)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-muted)]">Năm *</label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <CalendarRangeField
                  title="Thời gian diễn ra sự kiện *"
                  icon={<Calendar className="h-4 w-4 text-[var(--accent-primary)]" />}
                  startValue={form.startDate}
                  endValue={form.endDate}
                  onStartChange={(v) => setForm((prev) => ({ ...prev, startDate: v }))}
                  onEndChange={(v) => setForm((prev) => ({ ...prev, endDate: v }))}
                  startLabel="Khai mạc"
                  endLabel="Bế mạc"
                />
              </div>

              <div className="md:col-span-2">
                <CalendarRangeField
                  title="Thời gian mở / đóng cổng đăng ký"
                  icon={<Clock className="h-4 w-4 text-[var(--color-warning)]" />}
                  startValue={form.registrationStartDate}
                  endValue={form.registrationEndDate}
                  onStartChange={(v) => setForm((prev) => ({ ...prev, registrationStartDate: v }))}
                  onEndChange={(v) => setForm((prev) => ({ ...prev, registrationEndDate: v }))}
                  startLabel="Mở cổng"
                  endLabel="Đóng cổng"
                  hint="Cân đối mốc đăng ký so với thời gian diễn ra sự kiện đã chọn ở trên."
                  referenceRange={{
                    start: form.startDate,
                    end: form.endDate,
                    label: "Sự kiện diễn ra",
                  }}
                />
              </div>

              <div className="space-y-4 rounded-lg border border-[var(--accent-primary)]/30 bg-[var(--bg-input)] p-4 md:col-span-2">
                <p className="text-xs font-medium text-[var(--accent-primary)]">
                  Vòng thi & hạng mục khởi tạo (bắt buộc — có thể thêm/sửa sau ở trang EC)
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-muted)]">Tên vòng thi *</label>
                    <Input
                      type="text"
                      value={form.round1Name}
                      onChange={(e) => setForm({ ...form, round1Name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-muted)]">Tên hạng mục *</label>
                    <Input
                      type="text"
                      placeholder="Ví dụ: Lập trình Web"
                      value={form.track1Name}
                      onChange={(e) => setForm({ ...form, track1Name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <CalendarRangeField
                  title="Thời gian nộp bài vòng 1"
                  icon={<Calendar className="h-4 w-4 text-[var(--accent-primary)]" />}
                  startValue={form.round1StartDate}
                  endValue={form.round1EndDate}
                  minDate={form.startDate}
                  maxDate={form.endDate}
                  onStartChange={(v) => setForm((prev) => ({ ...prev, round1StartDate: v }))}
                  onEndChange={(v) => setForm((prev) => ({ ...prev, round1EndDate: v }))}
                  startLabel="Mở nộp bài"
                  endLabel="Hạn chót"
                  hint="Phải nằm trong khoảng khai mạc – bế mạc sự kiện ở trên."
                  referenceRange={{
                    start: form.startDate,
                    end: form.endDate,
                    label: "Sự kiện diễn ra",
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--accent-team)]">Số thành viên tối thiểu / đội *</label>
                <Input
                  type="number"
                  min={1}
                  max={form.maxTeamSize}
                  value={form.minTeamSize}
                  onChange={(e) => setForm({ ...form, minTeamSize: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--accent-team)]">Số thành viên tối đa / đội *</label>
                <Input
                  type="number"
                  min={form.minTeamSize}
                  max={20}
                  value={form.maxTeamSize}
                  onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-[var(--text-muted)]">Mô tả tổng quan sự kiện</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-muted)] bg-[var(--bg-input)] p-4 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-3 rounded-lg border border-[var(--color-danger)]/80 bg-[var(--color-danger)]/10 p-4 text-sm text-[var(--color-danger)]">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div>
                  <strong className="block text-xs font-semibold">Chưa thể khởi tạo sự kiện</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[var(--border-muted)] pt-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Info className="h-4 w-4 text-[var(--color-warning)]" />
                <span>Dành riêng cho quản trị viên khởi tạo giải đấu.</span>
              </div>
              <Button variant="primary" accent="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang khởi tạo..." : "Xác nhận tạo sự kiện"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </PageShell>
  );
};
