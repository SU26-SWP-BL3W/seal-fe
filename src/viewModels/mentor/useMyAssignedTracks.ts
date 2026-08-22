"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useGetTracksByEvent, type TrackWithStaffModel } from "@/repositories/tracksRepository";

/**
 * Hạng mục mà user hiện tại được phân công mentor — suy từ GET /Tracks/event
 * theo sự kiện đang chọn, không hardcode event id.
 */
export function useMyAssignedTracks() {
  const { user, activeRole } = useAuth();
  const eventId = activeRole?.eventId || activeRole?.EventId || "";
  const { data: tracksPage, isLoading, refetch } = useGetTracksByEvent(eventId || undefined);

  const userId = user?.userId || user?.UserID || user?.id;

  const allTracks: TrackWithStaffModel[] = Array.isArray(tracksPage) ? tracksPage : [];
  const myTracks = allTracks.filter((t) => {
    const mentors = t.mentors || t.Mentors || [];
    return mentors.some((m) => (m.id || m.Id) === userId);
  });

  return { myTracks, allTracks, isLoading, refetch, eventId };
}
