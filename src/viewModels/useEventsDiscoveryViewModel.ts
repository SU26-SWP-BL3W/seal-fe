"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  computeEventStatus,
  STATUS_PRIORITY,
  extractTrackNames,
  type EventDisplayStatus,
  type EventCardData,
} from "./eventsMetadata";

import { usePublicEvents } from "@/repositories/eventsRepository";
import { useAuth } from "@/providers/AuthProvider";

export type { EventDisplayStatus, EventCardData };

export type EventStatusFilter = "all" | "my_event" | EventDisplayStatus;
export type EventSortOption = "relevant" | "soonest" | "newest" | "most_teams";

export interface TrackSummary {
  track: string;
  eventCount: number;
}

export function useEventsDiscoveryViewModel() {
  const { activeRole } = useAuth();
  const myEventIds = useMemo(() => {
    const ids = [
      ...(activeRole?.assignedEventIds ?? activeRole?.AssignedEventIds ?? []),
      activeRole?.eventId || activeRole?.EventId || "",
    ].filter(Boolean);
    return [...new Set(ids)];
  }, [activeRole]);
  const { data: realPublicEvents = [] } = usePublicEvents();
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatusFilter>("all");
  const [sort, setSort] = useState<EventSortOption>("relevant");
  const [trackFilter, setTrackFilterState] = useState<string | null>(null);

  useEffect(() => {
    const readFromUrl = () => setTrackFilterState(new URLSearchParams(window.location.search).get("track"));
    readFromUrl();
    window.addEventListener("popstate", readFromUrl);
    return () => window.removeEventListener("popstate", readFromUrl);
  }, []);

  const setTrackFilter = useCallback((track: string | null) => {
    setTrackFilterState(track);
    const params = new URLSearchParams(window.location.search);
    if (track) params.set("track", track);
    else params.delete("track");
    const qs = params.toString();
    window.history.pushState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
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

    const combined = mappedReal;
    // Deduplicate by ID
    const seen = new Set<string>();
    const unique = combined.filter((ev) => {
      if (seen.has(ev.id)) return false;
      seen.add(ev.id);
      return true;
    });

    return unique.map((ev) => ({ ...ev, status: computeEventStatus(ev, now) }));
  }, [realPublicEvents, now]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = allEvents.filter((ev) => {
      const matchesSearch =
        !q ||
        ev.eventName.toLowerCase().includes(q) ||
        ev.tagline.toLowerCase().includes(q) ||
        ev.tracks.some((t) => t.toLowerCase().includes(q));
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "my_event"
          ? myEventIds.includes(ev.id)
          : ev.status === statusFilter);
      const matchesTrack = !trackFilter || ev.tracks.includes(trackFilter);
      return matchesSearch && matchesStatus && matchesTrack;
    });

    const sorted = [...filtered];
    switch (sort) {
      case "soonest":
        sorted.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        break;
      case "most_teams":
        sorted.sort((a, b) => b.teamCount - a.teamCount);
        break;
      case "relevant":
      default:
        // Ưu tiên cao nhất: Đang mở đăng ký (0) > Đang diễn ra (1) > Sắp diễn ra (2) > Đã kết thúc (3).
        sorted.sort((a, b) => {
          const pA = STATUS_PRIORITY[a.status] ?? 99;
          const pB = STATUS_PRIORITY[b.status] ?? 99;
          if (pA !== pB) return pA - pB;
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });
    }
    return sorted;
  }, [allEvents, search, statusFilter, sort, trackFilter, myEventIds]);

  // Hạng mục + số sự kiện/tổng giải thưởng thuộc từng hạng mục — gộp trên
  // TOÀN BỘ sự kiện (không theo bộ lọc hiện tại), dùng cho dải pill lọc nhanh.
  const topTracks: TrackSummary[] = useMemo(() => {
    const byTrack = new Map<string, TrackSummary>();
    for (const ev of allEvents) {
      for (const track of ev.tracks) {
        const existing = byTrack.get(track);
        if (existing) {
          existing.eventCount += 1;
        } else {
          byTrack.set(track, { track, eventCount: 1 });
        }
      }
    }
    return Array.from(byTrack.values()).sort((a, b) => b.eventCount - a.eventCount);
  }, [allEvents]);

  return {
    events: filteredEvents,
    totalCount: allEvents.length,
    topTracks,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    trackFilter,
    setTrackFilter,
    sort,
    setSort,
  };
}
