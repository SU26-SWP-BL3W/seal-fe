import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetTeamScoreBreakdown } from "@/repositories/scoresRepository";

export function useMentorProgressViewModel() {
  const { user } = useAuth();
  const [inputTeamId, setInputTeamId] = useState("team-1");
  const [activeTeamId, setActiveTeamId] = useState("team-1");

  const { data: scoreBreakdown, isLoading, refetch } = useGetTeamScoreBreakdown(activeTeamId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputTeamId.trim()) {
      setActiveTeamId(inputTeamId.trim());
    }
  };

  return {
    state: {
      inputTeamId,
      activeTeamId,
      isLoading,
    },
    data: {
      scoreBreakdown,
      user,
    },
    actions: {
      setInputTeamId,
      handleSearch,
      refetch,
    },
  };
}
