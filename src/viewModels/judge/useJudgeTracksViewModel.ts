import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMyAssignedJudgeTracks } from "@/viewModels/judge/useMyAssignedJudgeTracks";
import { usePagination } from "@/hooks/usePagination";

export function useJudgeTracksViewModel() {
  const { user } = useAuth();
  const { assignedTracks, isLoading, refetch } = useMyAssignedJudgeTracks();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refetch();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const pagination = usePagination(assignedTracks, 6);

  const totalAssigned = assignedTracks.length;
  const totalPendingScoring = assignedTracks.reduce((acc, t) => acc + t.pendingSubmissions, 0);
  const totalCompleted = assignedTracks.reduce(
    (acc, t) => acc + t.scoredSubmissions,
    0,
  );

  return {
    state: {
      isLoading,
      isRefreshing,
      totalAssigned,
      totalPendingScoring,
      totalCompleted,
    },
    data: {
      assignedTracks,
    },
    pagination,
    actions: {
      handleRefresh,
    },
  };
}
