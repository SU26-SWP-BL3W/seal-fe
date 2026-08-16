"use client";

import { useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";
import { useCreateTeam } from "@/repositories/teamsRepository";
import { usePublicEvents } from "@/repositories/eventsRepository";
import { useGetTracksByEvent, type TrackWithStaffModel } from "@/repositories/tracksRepository";
import { MAX_MEMBERS, MIN_MEMBERS } from "./teamStatus";

const SELECT_CLASS =
  "w-full border border-[var(--border-muted)] bg-[var(--bg-input)] px-[var(--space-md)] py-[var(--space-sm)] font-mono text-sm text-[color:var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--accent-team)] disabled:opacity-40";

// Trạng thái rỗng của /my-team: một hành động rõ ràng duy nhất là tạo đội.
export function CreateTeamForm() {
  const [teamName, setTeamName] = useState("");
  const [description, setDescription] = useState("");
  const [pickedEventId, setPickedEventId] = useState("");
  const [pickedTrackId, setPickedTrackId] = useState("");
  const [error, setError] = useState("");

  const { data: events = [] } = usePublicEvents();
  const eventList = (Array.isArray(events) ? events : []) as Record<string, string>[];
  const eventIdOf = (ev: Record<string, string>) => ev.id || ev.Id || ev.eventId || ev.EventId || "";

  // Mặc định chọn mục đầu tiên bằng giá trị dẫn xuất thay vì setState trong effect.
  const eventId = pickedEventId || (eventList[0] ? eventIdOf(eventList[0]) : "");

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
    if (!eventId || !trackId) {
      setError("Chọn sự kiện và hạng mục trước khi tạo đội.");
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

      <Card className="p-0">
        <form onSubmit={handleCreate} className="flex flex-col gap-[var(--space-md)] p-[var(--space-lg)]">
          <Field label="Sự kiện" required>
            {(field) => (
              <select
                {...field}
                value={eventId}
                onChange={(e) => {
                  setPickedEventId(e.target.value);
                  setPickedTrackId("");
                }}
                required
                className={SELECT_CLASS}
              >
                <option value="">— Chọn sự kiện —</option>
                {eventList.map((ev) => {
                  const id = eventIdOf(ev);
                  return (
                    <option key={id} value={id}>
                      {ev.eventName || ev.EventName || ev.name || ev.Name || id}
                    </option>
                  );
                })}
              </select>
            )}
          </Field>

          <Field label="Hạng mục" required>
            {(field) => (
              <select
                {...field}
                value={trackId}
                onChange={(e) => setPickedTrackId(e.target.value)}
                required
                disabled={!eventId}
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
            disabled={!teamName.trim() || !eventId || !trackId || isPending}
          >
            {isPending ? "Đang tạo..." : "Tạo đội"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
