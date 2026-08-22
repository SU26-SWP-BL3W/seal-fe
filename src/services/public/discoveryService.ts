/**
 * Discovery & Public Domain Service
 * Pure business logic for event discovery filtering, season matching, and status determination.
 */

export interface EventFilterCriteria {
  searchQuery?: string;
  season?: string;
  year?: number;
  statusFilter?: "all" | "upcoming" | "ongoing" | "completed";
}

export const discoveryService = {
  /**
   * Filters event list based on search term, season, and status.
   */
  filterEvents<T extends { eventName?: string; name?: string; description?: string; season?: string; year?: number; startDate?: string; endDate?: string }>(
    events: T[],
    criteria: EventFilterCriteria
  ): T[] {
    let list = events || [];
    const now = Date.now();

    if (criteria.searchQuery?.trim()) {
      const q = criteria.searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          (e.eventName || e.name || "").toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q)
      );
    }

    if (criteria.season && criteria.season !== "all") {
      list = list.filter((e) => (e.season || "").toLowerCase() === criteria.season?.toLowerCase());
    }

    if (criteria.year) {
      list = list.filter((e) => Number(e.year) === criteria.year);
    }

    if (criteria.statusFilter && criteria.statusFilter !== "all") {
      list = list.filter((e) => {
        const sTime = e.startDate ? new Date(e.startDate).getTime() : 0;
        const eTime = e.endDate ? new Date(e.endDate).getTime() : Infinity;

        if (criteria.statusFilter === "upcoming") return now < sTime;
        if (criteria.statusFilter === "ongoing") return now >= sTime && now <= eTime;
        if (criteria.statusFilter === "completed") return now > eTime;
        return true;
      });
    }

    return list;
  },
};
