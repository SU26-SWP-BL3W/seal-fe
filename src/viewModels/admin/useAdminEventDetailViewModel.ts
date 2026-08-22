import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useEventDetail } from "@/repositories/eventsRepository";
import { useGetRoundsByEvent } from "@/repositories/events/roundsRepository";
import { useGetTracksByEvent } from "@/repositories/events/tracksRepository";
import { useGetTeamsByEvent } from "@/repositories/teamsRepository";
import { useGetEventRoles, staffRepository } from "@/repositories/staffRepository";

export function useAdminEventDetailViewModel() {
  const params = useParams();
  const eventId = (params?.eventId as string) || (params?.id as string) || "";

  const [activeTab, setActiveTab] = useState<"overview" | "rounds" | "tracks" | "staff" | "teams">("overview");
  const [staffRoleFilter, setStaffRoleFilter] = useState<"all" | "judge" | "mentor" | "coordinator">("all");
  const [staffSearchTerm, setStaffSearchTerm] = useState("");
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isRevokingDraft, setIsRevokingDraft] = useState(false);
  const [isActivatingPublic, setIsActivatingPublic] = useState(false);
  const [isEmergencyOverrideOpen, setIsEmergencyOverrideOpen] = useState(false);
  const [emergencyEcEmail, setEmergencyEcEmail] = useState("");
  const [isSubmittingEmergency, setIsSubmittingEmergency] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const { data: event, isLoading: isLoadingEvent, refetch: refetchEvent } = useEventDetail(eventId);
  const { data: rounds = [], isLoading: isLoadingRounds, refetch: refetchRounds } = useGetRoundsByEvent(eventId);
  const roundsList: any[] = Array.isArray(rounds) ? rounds : (rounds as any)?.data ?? [];

  const { data: tracks = [], isLoading: isLoadingTracks, refetch: refetchTracks } = useGetTracksByEvent(eventId);
  const tracksList: any[] = Array.isArray(tracks) ? tracks : (tracks as any)?.data ?? [];

  const { data: teams = [], isLoading: isLoadingTeams, refetch: refetchTeams } = useGetTeamsByEvent(eventId);
  const teamsList: any[] = Array.isArray(teams) ? teams : (teams as any)?.data ?? [];

  const { data: rawEventRoles = [], isLoading: isLoadingStaff, refetch: refetchStaff } = useGetEventRoles(eventId);
  const eventRoles: any[] = Array.isArray(rawEventRoles) ? rawEventRoles : (rawEventRoles as any)?.data ?? [];

  const judgesList = useMemo(() => {
    return eventRoles.filter((r) => {
      const name = String(r.roleName ?? r.RoleName ?? "").toLowerCase();
      return name.includes("judge") || name === "1";
    });
  }, [eventRoles]);

  const mentorsList = useMemo(() => {
    return eventRoles.filter((r) => {
      const name = String(r.roleName ?? r.RoleName ?? "").toLowerCase();
      return name.includes("mentor") || name === "2";
    });
  }, [eventRoles]);

  const coordinatorsList = useMemo(() => {
    return eventRoles.filter((r) => {
      const name = String(r.roleName ?? r.RoleName ?? "").toLowerCase();
      return name.includes("coordinator") || name === "0";
    });
  }, [eventRoles]);

  const filteredStaffList = useMemo(() => {
    return eventRoles.filter((r) => {
      const roleLower = String(r.roleName ?? r.RoleName ?? "").toLowerCase();
      const user = r.user || r.User || {};
      const fullName = (user.fullName || user.FullName || r.fullName || r.FullName || "").toLowerCase();
      const email = (user.email || user.Email || r.email || r.Email || "").toLowerCase();

      if (staffRoleFilter === "judge" && !roleLower.includes("judge") && roleLower !== "1") return false;
      if (staffRoleFilter === "mentor" && !roleLower.includes("mentor") && roleLower !== "2") return false;
      if (staffRoleFilter === "coordinator" && !roleLower.includes("coordinator") && roleLower !== "0") return false;

      if (staffSearchTerm.trim()) {
        const query = staffSearchTerm.toLowerCase().trim();
        const matchesName = fullName.includes(query);
        const matchesEmail = email.includes(query);
        const trackName = (r.track?.trackName || r.Track?.TrackName || "").toLowerCase();
        const matchesTrack = trackName.includes(query);
        return matchesName || matchesEmail || matchesTrack;
      }

      return true;
    });
  }, [eventRoles, staffRoleFilter, staffSearchTerm]);

  const evName = event?.eventName || (event as any)?.EventName || "Chi Tiết Sự Kiện";
  const season = event?.season || (event as any)?.Season || "Summer";
  const year = event?.year || (event as any)?.Year || 2026;
  const description = event?.description || (event as any)?.Description || "Chưa có mô tả chi tiết cho sự kiện này.";
  const maxTeams = event?.maxTeams || (event as any)?.MaxTeams || 50;
  const isActive = event?.status !== false && (event as any)?.Status !== false;

  const handleRefreshAll = () => {
    refetchEvent();
    refetchRounds();
    refetchTracks();
    refetchTeams();
    refetchStaff();
  };

  const handleAssignEmergencyEc = async () => {
    if (!emergencyEcEmail.trim()) {
      setEmergencyMessage({ text: "Vui lòng nhập Email của Event Coordinator mới.", isError: true });
      return;
    }

    setIsSubmittingEmergency(true);
    setEmergencyMessage(null);

    try {
      await staffRepository.inviteCoordinator({
        eventId,
        email: emergencyEcEmail.trim(),
      });
      setEmergencyMessage({ text: `Đã phân công ${emergencyEcEmail.trim()} làm Event Coordinator thành công!`, isError: false });
      setEmergencyEcEmail("");
      refetchStaff();
    } catch (err: any) {
      setEmergencyMessage({ text: err?.response?.data?.message || err?.message || "Phân công EC thất bại.", isError: true });
    } finally {
      setIsSubmittingEmergency(false);
    }
  };

  return {
    state: {
      eventId,
      activeTab,
      staffRoleFilter,
      staffSearchTerm,
      isEditingEvent,
      isRevokingDraft,
      isActivatingPublic,
      isEmergencyOverrideOpen,
      emergencyEcEmail,
      isSubmittingEmergency,
      emergencyMessage,
      isLoadingEvent,
      isLoadingRounds,
      isLoadingTracks,
      isLoadingTeams,
      isLoadingStaff,
      evName,
      season,
      year,
      description,
      maxTeams,
      isActive,
    },
    data: {
      event,
      roundsList,
      tracksList,
      teamsList,
      eventRoles,
      judgesList,
      mentorsList,
      coordinatorsList,
      filteredStaffList,
    },
    actions: {
      setActiveTab,
      setStaffRoleFilter,
      setStaffSearchTerm,
      setIsEditingEvent,
      setIsRevokingDraft,
      setIsActivatingPublic,
      setIsEmergencyOverrideOpen,
      setEmergencyEcEmail,
      handleRefreshAll,
      handleAssignEmergencyEc,
    },
  };
}
