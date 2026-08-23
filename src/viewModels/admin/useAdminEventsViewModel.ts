import { useState, useMemo } from "react";
import { useEvents } from "@/repositories/eventsRepository";
import { usePagination } from "@/hooks/usePagination";

function pickId(ev: any): string {
  return ev?.id || ev?.Id || ev?.eventId || ev?.EventId || "";
}

export function useAdminEventsViewModel() {
  const { data: rawEvents = [], isLoading, refetch } = useEvents();
  const eventsList: any[] = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data ?? [];

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [seasonFilter, setSeasonFilter] = useState<string>("all");
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [revokingEvent, setRevokingEvent] = useState<any | null>(null);

  const seasons = useMemo(() => {
    return Array.from(
      new Set(eventsList.map((e) => e.season || e.Season).filter(Boolean))
    );
  }, [eventsList]);

  const filteredEvents = useMemo(() => {
    return eventsList.filter((ev) => {
      const isAct = ev.status !== false && ev.Status !== false;
      if (statusFilter === "active" && !isAct) return false;
      if (statusFilter === "inactive" && isAct) return false;

      const s = ev.season || ev.Season;
      if (seasonFilter !== "all" && s !== seasonFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const name = (ev.eventName || ev.EventName || "").toLowerCase();
        const seasonName = (ev.season || ev.Season || "").toLowerCase();
        const id = pickId(ev).toLowerCase();
        return name.includes(q) || seasonName.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [eventsList, statusFilter, seasonFilter, searchTerm]);

  const pagination = usePagination(filteredEvents, 5);

  const activeCount = eventsList.filter((e) => e.status !== false && e.Status !== false).length;
  const inactiveCount = eventsList.length - activeCount;

  return {
    state: {
      searchTerm,
      statusFilter,
      seasonFilter,
      editingEvent,
      revokingEvent,
      isLoading,
      activeCount,
      inactiveCount,
    },
    data: {
      eventsList,
      filteredEvents,
      seasons,
    },
    pagination,
    actions: {
      setSearchTerm,
      setStatusFilter,
      setSeasonFilter,
      setEditingEvent,
      setRevokingEvent,
      refetch,
    },
  };
}
