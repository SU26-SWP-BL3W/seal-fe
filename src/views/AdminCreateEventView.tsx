"use client";

import React, { useState } from "react";
import { Button, Input, Card, CalendarRangeField } from "@/components/ui";
import { eventsRepository } from "@/repositories/eventsRepository";
import { staffRepository } from "@/repositories/staffRepository";
import { usersRepository } from "@/repositories/usersRepository";
import { Shield, Calendar, Clock, Info, ArrowLeft, CheckCircle2, UserCheck } from "lucide-react";
import Link from "next/link";

export const AdminCreateEventView: React.FC = () => {
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
    track1Name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.eventName.trim()) {
      setErrorMessage("Vui lòng nhập tên sự kiện!");
      return;
    }
    if (new Date(form.startDate) > new Date(form.endDate)) {
      setErrorMessage("Ngày bắt đầu sự kiện phải diễn ra trước ngày kết thúc!");
      return;
    }
    if (!form.round1Name.trim() || !form.round1StartDate || !form.round1EndDate) {
      setErrorMessage("Vui lòng nhập đủ tên và thời gian Vòng 1 — hệ thống bắt buộc mỗi sự kiện phải có ít nhất một vòng thi.");
      return;
    }
    if (!form.track1Name.trim()) {
      setErrorMessage("Vui lòng nhập tên Hạng mục đầu tiên — mỗi vòng thi bắt buộc phải có ít nhất một hạng mục.");
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
      } else {
        setErrorMessage(res?.message || "Tạo sự kiện thất bại. Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.");
      }
    } catch (err: any) {
      console.error("Lỗi tạo sự kiện:", err);
      // BE trả lỗi validate field-level trong response.data.details (vd:
      // [{key:"Model.Rounds", value:["Sự kiện phải cấu hình ít nhất một vòng thi."]}]),
      // cụ thể hơn hẳn message chung "Exception of type ... was thrown." — ưu tiên hiện details.
      const details = err?.response?.data?.details;
      const detailMsg = Array.isArray(details) ? details.map((d: any) => d?.value?.join?.(" ") || d?.value).filter(Boolean).join(" ") : null;
      const apiMsg = detailMsg || err?.response?.data?.message || err?.message || "Tạo sự kiện thất bại. Vui lòng kiểm tra kết nối mạng và thử lại.";
      setErrorMessage(apiMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans flex flex-col">
      <main className="flex-1 max-w-[var(--container-max)] w-full mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)] border-b border-zinc-800 pb-4">
          <Link href="/admin/dashboard" className="hover:text-amber-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Bảng Điều Hành Admin
          </Link>
          <span>/</span>
          <span className="text-amber-400 font-bold">Khởi Tạo Sự Kiện Cuộc Thi Mới</span>
        </div>

        <div className="bg-[#10171a] border border-zinc-800 rounded-lg p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="font-display font-bold text-xl text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-400" />
                Khởi Tạo Sự Kiện Cuộc Thi Mới
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Tạo khung sự kiện chính, thiết lập thời gian và chỉ định Event Coordinator phụ trách điều phối giải đấu.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-4 bg-rose-950/40 border border-rose-500/40 text-rose-300 font-mono text-xs rounded">
              {errorMessage}
            </div>
          )}

          {successEventId ? (
            <div className="p-6 bg-[rgba(16,185,129,0.1)] border border-[var(--color-success)] hud-clipped space-y-4 text-center">
              <div className="flex justify-center">
                <CheckCircle2 className="w-12 h-12 text-[var(--color-success)]" />
              </div>
              <h3 className="font-mono font-bold text-lg text-[var(--color-success)] uppercase">
                Khởi Tạo Sự Kiện Thành Công!
              </h3>
              <p className="font-mono text-xs text-[var(--text-primary)]">
                Mã Sự Kiện vừa tạo: <span className="text-[var(--accent-primary)] font-bold">#{successEventId}</span>
                {form.coordinatorEmail && (
                  <span className="block text-[var(--accent-coordinator)] font-mono text-xs mt-1">
                    Đã phân công Event Coordinator: {form.coordinatorEmail}
                  </span>
                )}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-4">
                <Link href="/admin/dashboard">
                  <Button variant="primary" className="font-mono text-xs bg-[var(--color-danger)]">
                    Về Bảng Điều Hành Admin Tổng
                  </Button>
                </Link>
                <Link href="/coordinator/dashboard">
                  <Button variant="secondary" className="font-mono text-xs border-[var(--accent-coordinator)] text-[var(--accent-coordinator)]">
                    Sang Bảng EC Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Tên Sự Kiện <span className="text-[var(--color-danger)]">*</span>
                  </label>
                  <Input
                    type="text"
                    value={form.eventName}
                    onChange={(e) => setForm({ ...form, eventName: e.target.value })}
                    required
                  />
                </div>

                {/* Chỉ định Event Coordinator */}
                <div className="md:col-span-2 space-y-1.5 p-4 bg-[var(--bg-input)] border border-[var(--accent-coordinator)]/30 hud-clipped">
                  <label className="text-xs font-mono tracking-widest text-[var(--accent-coordinator)] uppercase flex items-center gap-1.5 font-bold">
                    <UserCheck className="w-4 h-4 text-[var(--accent-coordinator)]" />
                    Chỉ Định Event Coordinator (EC) Phụ Trách Quản Lý
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. ec.coordinator@seal.edu.vn"
                    value={form.coordinatorEmail}
                    onChange={(e) => setForm({ ...form, coordinatorEmail: e.target.value })}
                    className="w-full"
                  />
                  <p className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                    Admin có thể gán ngay tài khoản EC hoặc bỏ trống để gán sau trên Admin Dashboard. Tài khoản EC này sẽ phụ trách tạo Vòng thi (Rounds), Hạng mục (Tracks) & Tiêu chí.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Mùa Giải (Season) *
                  </label>
                  <select
                    value={form.season}
                    onChange={(e) => setForm({ ...form, season: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-sm hud-clipped"
                  >
                    <option value="Mùa Xuân">Mùa Xuân (Spring)</option>
                    <option value="Mùa Hè">Mùa Hè (Summer)</option>
                    <option value="Mùa Thu">Mùa Thu (Autumn)</option>
                    <option value="Mùa Đông">Mùa Đông (Winter)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Năm (Year) *
                  </label>
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <CalendarRangeField
                    title="Thời Gian Diễn Ra Sự Kiện *"
                    icon={<Calendar className="w-4 h-4 text-cyan-400" />}
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
                    title="Thời Gian Mở / Đóng Cổng Đăng Ký"
                    icon={<Clock className="w-4 h-4 text-amber-400" />}
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

                {/* Vòng 1 + Hạng mục 1 — hệ thống bắt buộc mỗi sự kiện phải có sẵn ít nhất
                    1 Round chứa ít nhất 1 Track thì mới tạo được (validate ở BE). EC có thể
                    thêm Vòng/Hạng mục khác sau tại Coordinator Dashboard. */}
                <div className="md:col-span-2 p-4 bg-[var(--bg-input)] border border-cyan-500/30 hud-clipped space-y-4">
                  <p className="text-xs font-mono tracking-widest text-cyan-300 uppercase font-bold">
                    Vòng Thi &amp; Hạng Mục Khởi Tạo (bắt buộc — có thể thêm/sửa sau ở trang EC)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                        Tên Vòng Thi *
                      </label>
                      <Input
                        type="text"
                        value={form.round1Name}
                        onChange={(e) => setForm({ ...form, round1Name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                        Tên Hạng Mục *
                      </label>
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
                    title="Thời Gian Nộp Bài Vòng 1"
                    icon={<Calendar className="w-4 h-4 text-cyan-400" />}
                    startValue={form.round1StartDate}
                    endValue={form.round1EndDate}
                    minDate={form.startDate}
                    maxDate={form.endDate}
                    onStartChange={(v) => setForm((prev) => ({ ...prev, round1StartDate: v }))}
                    onEndChange={(v) => setForm((prev) => ({ ...prev, round1EndDate: v }))}
                    startLabel="Mở nộp bài"
                    endLabel="Hạn chót"
                    hint="Phải nằm trong khoảng Khai mạc – Bế mạc sự kiện ở trên."
                    referenceRange={{
                      start: form.startDate,
                      end: form.endDate,
                      label: "Sự kiện diễn ra",
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--accent-team)] uppercase font-bold">
                    Số Thành Viên Tối Thiểu / Đội *
                  </label>
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
                  <label className="text-xs font-mono tracking-widest text-[var(--accent-team)] uppercase font-bold">
                    Số Thành Viên Tối Đa / Đội *
                  </label>
                  <Input
                    type="number"
                    min={form.minTeamSize}
                    max={20}
                    value={form.maxTeamSize}
                    onChange={(e) => setForm({ ...form, maxTeamSize: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-mono tracking-widest text-[var(--text-muted)] uppercase">
                    Mô Tả Tổng Quan Sự Kiện
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-4 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-sm hud-clipped"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-muted)]">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <Info className="w-4 h-4 text-amber-400" />
                  <span>Dành riêng cho Quản Trị Viên khởi tạo giải đấu.</span>
                </div>
                <Button variant="primary" type="submit" disabled={isSubmitting} className="bg-amber-500 text-black hover:bg-amber-400 font-bold">
                  {isSubmitting ? "Đang khởi tạo sự kiện..." : "Xác Nhận Tạo Sự Kiện"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
