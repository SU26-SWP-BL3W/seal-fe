import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useEvents } from "@/repositories/eventsRepository";
import { getAssignedEventIdsFromRoles } from "@/lib/eventRoles";
import { usePagination } from "@/hooks/usePagination";

export type EventTab = "all" | "ongoing" | "upcoming" | "past";

export function useJudgeEventsViewModel() {
  const { user, activeRole, allEventRoles } = useAuth();
  const { data: rawEvents = [], isLoading } = useEvents();
  const [activeTab, setActiveTab] = useState<EventTab>("all");

  const events = useMemo(() => {
    const list = Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data || [];
    return list;
  }, [rawEvents]);

  const judgeEvents = useMemo(() => {
    if (!user) return [];
    if (user.isAdmin || user.IsAdmin) return events;

    const assignedIds: string[] = getAssignedEventIdsFromRoles(
      allEventRoles.filter((r) => r.roleName === "Judge"),
    );
    if (assignedIds.length === 0) {
      if (Array.isArray((activeRole as any)?.assignedEventIds)) {
        assignedIds.push(...(activeRole as any).assignedEventIds);
      }
      const singleEventId = activeRole?.eventId || (activeRole as any)?.EventId;
      if (singleEventId && !assignedIds.includes(singleEventId)) {
        assignedIds.push(singleEventId);
      }
    }

    if (assignedIds.length > 0) {
      return events.filter((e: any) => assignedIds.includes(e.id || e.Id));
    }

    return [];
  }, [events, user, activeRole, allEventRoles]);

  const categorizedEvents = useMemo(() => {
    const now = new Date();
    const ongoingList: any[] = [];
    const upcomingList: any[] = [];
    const pastList: any[] = [];

    judgeEvents.forEach((evt: any) => {
      const startDate = evt.startDate || evt.StartDate;
      const endDate = evt.endDate || evt.EndDate;
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (end && end < now) {
        pastList.push(evt);
      } else if (start && start > now) {
        upcomingList.push(evt);
      } else {
        ongoingList.push(evt);
      }
    });

    return {
      all: judgeEvents,
      ongoing: ongoingList,
      upcoming: upcomingList,
      past: pastList,
    };
  }, [judgeEvents]);

  const displayedEvents = categorizedEvents[activeTab] || [];
  const pagination = usePagination(displayedEvents, 6);

  return {
    state: {
      activeTab,
      isLoading,
    },
    data: {
      judgeEvents,
      categorizedEvents,
      displayedEvents,
    },
    pagination,
    actions: {
      setActiveTab,
    },
  };
}
