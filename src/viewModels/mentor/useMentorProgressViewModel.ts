import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetTeamScoreBreakdown } from "@/repositories/scoresRepository";

export function useMentorProgressViewModel() {
  const { user } = useAuth();
  const [inputTeamId, setInputTeamId] = useState("");
  const [activeTeamId, setActiveTeamId] = useState("");

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
