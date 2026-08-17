"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { Link } from "@/i18n/routing";
import { useCreateTeam } from "@/repositories/teamsRepository";
import { usePublicEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent, type TrackWithStaffModel } from "@/repositories/tracksRepository";
import { AlertCircle, Calendar } from "lucide-react";
import { MAX_MEMBERS, MIN_MEMBERS } from "./teamStatus";

const SELECT_CLASS =
  "w-full border border-[var(--border-muted)] bg-[var(--bg-input)] px-[var(--space-md)] py-[var(--space-sm)] font-mono text-sm text-[color:var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent-team)] disabled:opacity-40";

interface CreateTeamFormProps {
  defaultEventId?: string;
}

// Trạng thái rỗng của /my-team: một hành động rõ ràng duy nhất là tạo đội.
export function CreateTeamForm({ defaultEventId }: CreateTeamFormProps) {
  const { user, activeRole } = useAuth();
  const isApproved = Boolean(user?.isApproved || user?.isAdmin);
  const searchParams = useSearchParams();

  const urlEventId =
    searchParams.get("eventId") ||
    defaultEventId ||
    activeRole?.eventId ||
    activeRole?.EventId ||
    "";

  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [pickedTrackId, setPickedTrackId] = useState("");
  const [error, setError] = useState("");

  const { data: events = [] } = usePublicEvents();
  const eventList = (Array.isArray(events) ? events : []) as Record<string, string>[];
  const eventIdOf = (ev: Record<string, string>) => ev.id || ev.Id || ev.eventId || ev.EventId || "";

  // Lấy thẳng sự kiện mà student đã click vào
  const selectedEvent =
    eventList.find((ev) => eventIdOf(ev) === urlEventId) ||
    (eventList.length > 0 ? eventList[0] : null);

  const eventId = selectedEvent ? eventIdOf(selectedEvent) : urlEventId;
  const eventName = selectedEvent
    ? (selectedEvent.eventName || selectedEvent.EventName || selectedEvent.name || selectedEvent.Name || "Sự kiện SEAL")
    : "Sự kiện SEAL";

  const { data: tracks = [] } = useGetTracksByEvent(eventId);
  const { mutateAsync: createTeam, isPending } = useCreateTeam();

  const trackIdOf = (t: TrackWithStaffModel) => t.id || t.Id || "";
  const trackId = tracks.some((t) => trackIdOf(t) === pickedTrackId)
    ? pickedTrackId
    : tracks[0]
      ? trackIdOf(tracks[0])
      : "";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isApproved) {
      setError("Hồ sơ sinh viên của bạn chưa được duyệt. Vui lòng cập nhật hồ sơ trước khi tạo đội.");
      return;
    }
    if (!eventId || !trackId) {
      setError("Vui lòng chọn hạng mục thi đấu trước khi tạo đội.");
      return;
    }
    try {
      await createTeam({
        name: teamName.trim(),
        description: description.trim(),
        eventId,
        trackId,
      });
    } catch (err: unknown) {
      const detail = err as { message?: string; response?: { data?: { message?: string } } };
      setError(detail?.response?.data?.message || detail?.message || "Không tạo được đội.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg py-[var(--space-xl)]">
      <div className="mb-[var(--space-lg)]">
        <div className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--text-muted)]">
          Đội thi của tôi
        </div>
        <h1 className="mt-1 font-display text-3xl font-bold uppercase text-balance text-[color:var(--text-primary)]">
          Bạn chưa có đội
        </h1>
        <p className="mt-[var(--space-xs)] font-mono text-sm text-pretty text-[color:var(--text-muted)]">
          Tạo đội để bắt đầu tham gia. Bạn sẽ là đội trưởng và cần {MIN_MEMBERS}–{MAX_MEMBERS} thành viên trước khi ghi danh.
        </p>
      </div>

      {!isApproved && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex flex-col gap-3 font-mono text-xs">
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

      <Card className="p-0">
        <form onSubmit={handleCreate} className="flex flex-col gap-[var(--space-md)] p-[var(--space-lg)]">
          {/* Tên sự kiện hiển thị trực tiếp từ sự kiện student đã chọn, không dùng drop-down */}
          <Field label="Sự kiện tham gia" required>
            {() => (
              <div className="w-full border border-[var(--border-muted)] bg-[var(--bg-input)] px-[var(--space-md)] py-3 font-mono text-sm flex items-center justify-between gap-3 hud-clipped">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] shrink-0 animate-pulse" />
                  <span className="font-bold text-[color:var(--text-primary)] truncate text-sm">
                    {eventName}
                  </span>
                </div>
                <span className="shrink-0 px-2 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded text-[10px] font-bold uppercase tracking-wider">
                  Sự Kiện Đã Chọn
                </span>
              </div>
            )}
          </Field>

          <Field label="Hạng mục thi đấu" required>
            {(field) => (
              <select
                {...field}
                value={trackId}
                onChange={(e) => setPickedTrackId(e.target.value)}
                required
                disabled={!eventId || !isApproved}
                className={SELECT_CLASS}
              >
                <option value="">— Chọn hạng mục —</option>
                {tracks.map((t) => {
                  const id = trackIdOf(t);
                  return (
                    <option key={id} value={id}>
                      {t.trackName || t.TrackName || id}
                    </option>
                  );
                })}
              </select>
            )}
          </Field>

          <Field label="Tên đội" required>
            {(field) => (
              <Input
                {...field}
                type="text"
                placeholder="VD: Cyber Knights"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                disabled={!isApproved}
              />
            )}
          </Field>

          <Field label="Mô tả đội" hint="Không bắt buộc — giới thiệu ngắn về hướng đi của đội.">
            {(field) => (
              <textarea
                {...field}
                placeholder="Giới thiệu ngắn về đội thi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={!isApproved}
                className={`${SELECT_CLASS} resize-none placeholder:text-[color:var(--text-muted)]/50`}
              />
            )}
          </Field>

          {error && (
            <p role="alert" className="font-mono text-xs text-pretty text-[color:var(--color-danger)]">
              {error}
            </p>
          )}

          <Button
            id="create-team-btn"
            type="submit"
            accent="team"
            disabled={!isApproved || !teamName.trim() || !eventId || !trackId || isPending}
          >
            {!isApproved ? "Cần xác thực hồ sơ để tạo đội" : isPending ? "Đang tạo..." : "Tạo đội"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
