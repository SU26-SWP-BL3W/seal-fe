import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useEventDetail } from "@/repositories/eventsRepository";
import { useGetAuditLogs } from "@/repositories/shared/auditLogsRepository";

export function useCoordinatorEventDetailViewModel() {
  const params = useParams();
  const eventId = (params?.id as string) || "";

  const { data: event, isLoading: isLoadingEvent } = useEventDetail(eventId);
  const { data: auditLogs = [], isLoading: isLoadingLogs } = useGetAuditLogs(eventId);

  const [eventName, setEventName] = useState("");
  const [season, setSeason] = useState("Spring");
  const [year, setYear] = useState(2024);
  const [startDate, setStartDate] = useState("2024-04-15");
  const [endDate, setEndDate] = useState("2024-04-17");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);

  useEffect(() => {
    if (event) {
      const ev = event as any;
      setEventName(ev.eventName || ev.EventName || ev.name || "Chưa thiết lập tên sự kiện");
      setSeason(ev.season || ev.Season || "");
      setYear(ev.year || ev.Year || new Date().getFullYear());
      setStartDate(ev.startDate ? ev.startDate.split("T")[0] : "");
      setEndDate(ev.endDate ? ev.endDate.split("T")[0] : "");
      setDescription(ev.description || ev.Description || "Chưa có mô tả cho sự kiện này.");
      setStatus(ev.status !== undefined ? Boolean(ev.status) : ev.Status !== undefined ? Boolean(ev.Status) : false);
    }
  }, [event]);

  return {
    state: {
      eventId,
      eventName,
      season,
      year,
      startDate,
      endDate,
      description,
      status,
      isLoadingEvent,
      isLoadingLogs,
    },
    data: {
      event,
      auditLogs,
    },
  };
}
