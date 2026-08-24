"use client";

import { useEffect, useMemo, useState } from "react";
import { computeEventStatus, STATUS_PRIORITY, extractTrackNames, type EventCardData } from "./eventsMetadata";
import { usePublicEvents } from "@/repositories/eventsRepository";

/**
 * Preview cho Landing Portal ("/") — lấy dữ liệu từ Real API Backend.
 */
export function useLandingPreviewViewModel() {
  const { data: realPublicEvents = [] } = usePublicEvents();
  // now=0 ở lần render đầu (SSR và client hydrate đều thấy giống nhau, tránh Hydration
  // mismatch) — Date.now() thật chỉ lấy trong useEffect, chạy sau khi đã hydrate xong.
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
  }, []);

  const allEvents: EventCardData[] = useMemo(() => {
    const mappedReal: EventCardData[] = realPublicEvents.map((ev: any) => {
      const eId = ev.id || ev.Id || ev.eventId || ev.EventId || `real-${Date.now()}`;
      const eName = ev.eventName || ev.EventName || "Sự kiện SEAL";
      const eSeason = ev.season || ev.Season || "SWP";
      const eYear = Number(ev.year || ev.Year || 2026);
      const eStart = ev.startDate || ev.StartDate || "2026-08-15";
      const eEnd = ev.endDate || ev.EndDate || "2026-09-30";
      const eRegStart = ev.registrationStartDate || ev.RegistrationStartDate || eStart;
      const eRegEnd = ev.registrationEndDate || ev.RegistrationEndDate || eEnd;

      return {
        id: eId,
        eventName: eName,
        season: eSeason,
        year: eYear,
        tagline: ev.tagline || ev.Tagline || ev.description || ev.Description || "Sự kiện cuộc thi Hackathon trên hệ thống SEAL",
        description: ev.description || ev.Description || "",
        startDate: eStart,
        endDate: eEnd,
        registrationStartDate: eRegStart,
        registrationEndDate: eRegEnd,
        maxTeams: Number(ev.maxTeams || ev.MaxTeams || 50),
        teamCount: Number(ev.teamCount || ev.TeamCount || 0),
        prizes: Array.isArray(ev.prizes || ev.Prizes)
          ? (ev.prizes || ev.Prizes).map((p: any) => ({
              id: p.id || p.Id || "",
              prizeName: p.prizeName || p.PrizeName || "",
              value: p.value || p.Value || "",
              quantity: Number(p.quantity ?? p.Quantity ?? 1),
            }))
          : [],
        tracks: extractTrackNames(ev),
        rounds: Array.isArray(ev.rounds || ev.Rounds) ? (ev.rounds || ev.Rounds) : [],
        status: "upcoming",
      };
    });

    return mappedReal.map((ev) => ({ ...ev, status: computeEventStatus(ev, now) }));
  }, [realPublicEvents, now]);

  const latestEvent = useMemo(() => {
    const candidates = [...allEvents]
      .filter((e) => e.status !== "ended")
      .sort(
        (a, b) =>
          STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status] ||
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      );
    return candidates[0] ?? allEvents[0] ?? null;
  }, [allEvents]);

  const featuredEvents = useMemo(() => {
    return [...allEvents]
      .filter((e) => e.id !== latestEvent?.id)
      .sort((a, b) => b.teamCount - a.teamCount || new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 3);
  }, [allEvents, latestEvent]);

  return { latestEvent, featuredEvents, totalRealCount: allEvents.length };
}
