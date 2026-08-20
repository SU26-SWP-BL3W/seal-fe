"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { Link } from "@/i18n/routing";
import { useCreateTeam } from "@/repositories/teamsRepository";
import { usePublicEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent, type TrackWithStaffModel } from "@/repositories/tracksRepository";
import { useToast } from "@/providers/ToastProvider";
import { AlertCircle, Calendar, Sparkles, Info } from "lucide-react";
import { pushSystemNotification } from "@/repositories/shared/notificationsRepository";
import { MAX_MEMBERS, MIN_MEMBERS } from "./teamStatus";

const SELECT_CLASS =
  "w-full border border-[var(--border-muted)] bg-[var(--bg-input)] px-[var(--space-md)] py-[var(--space-sm)] font-mono text-sm text-[color:var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent-team)] disabled:opacity-40";

interface CreateTeamFormProps {
  defaultEventId?: string;
}

export function CreateTeamForm({ defaultEventId }: CreateTeamFormProps) {
  const toast = useToast();
  const { user, activeRole } = useAuth();
  const isApproved = Boolean(user?.isApproved || user?.isAdmin);
  const searchParams = useSearchParams();

  const urlEventId =
    searchParams.get("eventId") ||
    defaultEventId ||
    activeRole?.eventId ||
    activeRole?.EventId ||
    "";

  const { data: events = [], isLoading: isLoadingEvents } = usePublicEvents();
  const eventList = (Array.isArray(events) ? events : []) as Record<string, any>[];
  const eventIdOf = (ev: Record<string, any>) => ev.id || ev.Id || ev.eventId || ev.EventId || "";

  // Event Selection State
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId || "");
  const [isChangingEvent, setIsChangingEvent] = useState(false);

  // Determine active eventId: priority chosen selectedEventId > urlEventId > first available event
  const activeEventId =
    selectedEventId ||
    urlEventId ||
    (eventList.length > 0 ? eventIdOf(eventList[0]) : "");

  const activeEvent =
    eventList.find((ev) => eventIdOf(ev) === activeEventId) ||
    (eventList.length > 0 ? eventList[0] : null);

  const eventName = activeEvent
    ? activeEvent.eventName || activeEvent.EventName || activeEvent.name || activeEvent.Name || "Sự kiện SEAL"
    : "Sự kiện SEAL";

  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [pickedTrackId, setPickedTrackId] = useState("");
  const [error, setError] = useState("");

  const { data: tracks = [], isLoading: isLoadingTracks } = useGetTracksByEvent(activeEventId || undefined);
  const { mutateAsync: createTeam, isPending } = useCreateTeam();

  const trackIdOf = (t: TrackWithStaffModel) => t.id || t.Id || "";
  const selectedTrack = tracks.find((t) => trackIdOf(t) === (pickedTrackId || trackIdOf(tracks[0])));
  const trackId = selectedTrack ? trackIdOf(selectedTrack) : "";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isApproved) {
      setError("Hồ sơ sinh viên của bạn chưa được duyệt. Vui lòng cập nhật hồ sơ trước khi tạo đội.");
      toast.error("Hồ sơ sinh viên chưa được xác thực.");
      return;
    }

    if (!activeEventId) {
      setError("Vui lòng chọn sự kiện tham gia trước khi tạo đội.");
      return;
    }

    if (!trackId) {
      setError("Vui lòng chọn hạng mục thi đấu trước khi tạo đội.");
      return;
    }

    if (teamName.trim().length < 3) {
      setError("Tên đội phải có ít nhất 3 ký tự.");
      return;
    }

    if (teamName.trim().length > 50) {
      setError("Tên đội không được vượt quá 50 ký tự.");
      return;
    }

    try {
      await createTeam({
        name: teamName.trim(),
        description: description.trim(),
        eventId: activeEventId,
        trackId,
      });
      toast.success(`Tạo đội "${teamName.trim()}" thành công! Bạn hiện là Đội trưởng.`);
      pushSystemNotification({
        title: "Tạo đội thi thành công",
        message: `Chúc mừng! Bạn đã tạo đội "${teamName.trim()}" thành công và là Đội trưởng. Hãy mời thành viên để hoàn thiện đội thi!`,
        type: "success",
      });
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string } } };
      const msg = detail?.response?.data?.message || detail?.message || "Không tạo được đội.";
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg py-[var(--space-xl)]">
      <div className="mb-[var(--space-lg)]">
        <div className="font-mono text-[10px] uppercase tracking-widest text-cyan-400 font-bold flex items-center gap-1.5">
          <Sparkles className="size-3.5" /> [ KHÔNG GIAN ĐỘI THI CỦA TÔI ]
        </div>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold uppercase text-balance text-[color:var(--text-primary)]">
          Khởi Tạo Đội Thi Mới
        </h1>
        <p className="mt-[var(--space-xs)] font-mono text-xs text-pretty text-[color:var(--text-muted)] leading-relaxed">
          Tạo đội để bắt đầu hành trình Hackathon. Bạn sẽ đóng vai trò Đội trưởng và có thể mời từ {MIN_MEMBERS}–{MAX_MEMBERS} thành viên trước khi chốt danh sách ghi danh.
        </p>
      </div>

      {!isApproved && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded flex flex-col gap-3 font-mono text-xs hud-clipped">
          <div className="flex items-start gap-2.5 text-amber-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-amber-200">HỒ SƠ CHƯA ĐƯỢC XÁC THỰC:</span>
              <p className="mt-1 text-zinc-300">
                Bạn cần hoàn thiện hồ sơ sinh viên và được duyệt trước khi có thể tạo đội hoặc ghi danh tham gia sự kiện.
              </p>
            </div>
          </div>
          <Link
            href="/onboarding/profile"
            className="self-start px-4 py-2 bg-amber-500 text-black hover:bg-amber-400 font-bold uppercase tracking-wider rounded transition-colors text-[11px] flex items-center gap-1.5 shadow-sm"
          >
            <span>Cập Nhật Hồ Sơ Sinh Viên</span>
            <span>→</span>
          </Link>
        </div>
      )}

      <Card className="p-0 border border-zinc-800 bg-[#0e1619] hud-clipped">
        <form onSubmit={handleCreate} className="flex flex-col gap-[var(--space-md)] p-[var(--space-lg)]">
          {/* Sự kiện tham gia */}
          <Field label="Sự kiện tham gia" required>
            {() => (
              <div className="space-y-2">
                {(!isChangingEvent && activeEvent) ? (
                  <div className="w-full border border-zinc-700 bg-zinc-900/90 px-3.5 py-3 font-mono text-xs flex items-center justify-between gap-3 rounded hud-clipped">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Calendar className="size-4 text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-white truncate block">
                          {eventName}
                        </span>
                        {activeEvent?.season && (
                          <span className="text-[10px] text-zinc-400">
                            Mùa: {activeEvent.season} • Năm: {activeEvent.year || new Date().getFullYear()}
                          </span>
                        )}
                      </div>
                    </div>
                    {eventList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setIsChangingEvent(true)}
                        className="shrink-0 text-[11px] text-cyan-400 hover:text-cyan-300 underline font-bold cursor-pointer"
                      >
                        Đổi sự kiện
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <select
                      value={activeEventId}
                      onChange={(e) => {
                        setSelectedEventId(e.target.value);
                        setPickedTrackId("");
                        setIsChangingEvent(false);
                      }}
                      disabled={isLoadingEvents}
                      className={SELECT_CLASS}
                    >
                      {eventList.map((ev) => {
                        const eid = eventIdOf(ev);
                        const name = ev.eventName || ev.EventName || ev.name || ev.Name || eid;
                        return (
                          <option key={eid} value={eid}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                    {isChangingEvent && (
                      <button
                        type="button"
                        onClick={() => setIsChangingEvent(false)}
                        className="text-[10px] text-zinc-400 hover:text-white"
                      >
                        Hủy đổi sự kiện
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Field>

          {/* Hạng mục thi đấu */}
          <Field label="Hạng mục thi đấu (Track)" required>
            {(field) => (
              <div className="space-y-1.5">
                <select
                  {...field}
                  value={trackId}
                  onChange={(e) => setPickedTrackId(e.target.value)}
                  required
                  disabled={!activeEventId || !isApproved || isLoadingTracks}
                  className={SELECT_CLASS}
                >
                  {isLoadingTracks ? (
                    <option value="">Đang tải danh sách hạng mục...</option>
                  ) : tracks.length === 0 ? (
                    <option value="">Sự kiện chưa mở hạng mục thi đấu</option>
                  ) : (
                    tracks.map((t) => {
                      const id = trackIdOf(t);
                      return (
                        <option key={id} value={id}>
                          {t.trackName || t.TrackName || id}
                        </option>
                      );
                    })
                  )}
                </select>

                {/* Track description hint */}
                {selectedTrack && (selectedTrack.description || (selectedTrack as any).Description) && (
                  <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded text-[11px] text-cyan-300/90 font-sans flex items-start gap-2">
                    <Info className="size-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{selectedTrack.description || (selectedTrack as any).Description}</span>
                  </div>
                )}
              </div>
            )}
          </Field>

          {/* Tên đội */}
          <Field label="Tên đội thi" required hint="Từ 3 đến 50 ký tự.">
            {(field) => (
              <div className="space-y-1">
                <Input
                  {...field}
                  type="text"
                  placeholder="VD: Cyber Knights, Data Titans..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  maxLength={50}
                  required
                  disabled={!isApproved}
                />
                <div className="text-right text-[10px] font-mono text-zinc-500">
                  {teamName.length}/50 ký tự
                </div>
              </div>
            )}
          </Field>

          {/* Mô tả đội */}
          <Field label="Mô tả đội" hint="Giới thiệu mục tiêu, ý tưởng hoặc kỹ năng đội hướng tới (Tối đa 500 ký tự).">
            {(field) => (
              <div className="space-y-1">
                <textarea
                  {...field}
                  placeholder="VD: Đội tập trung xây dựng giải pháp AI hỗ trợ giáo dục cá nhân hóa..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  disabled={!isApproved}
                  className={`${SELECT_CLASS} resize-none placeholder:text-[color:var(--text-muted)]/50 rounded`}
                />
                <div className="text-right text-[10px] font-mono text-zinc-500">
                  {description.length}/500 ký tự
                </div>
              </div>
            )}
          </Field>

          {error && (
            <div role="alert" className="p-3 bg-red-950/40 border border-red-500/40 rounded text-xs font-mono text-red-300">
              {error}
            </div>
          )}

          <Button
            id="create-team-btn"
            type="submit"
            accent="team"
            disabled={!isApproved || !teamName.trim() || !activeEventId || !trackId || isPending}
            className="w-full font-bold py-3 text-sm flex items-center justify-center gap-2"
          >
            {!isApproved
              ? "Cần xác thực hồ sơ để tạo đội"
              : isPending
                ? "Đang khởi tạo đội thi..."
                : "⚡ KHỞI TẠO ĐỘI THI"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
