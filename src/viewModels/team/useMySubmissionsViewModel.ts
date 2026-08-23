import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useQueryClient } from "@tanstack/react-query";
import { useMyTeam } from "@/repositories/teamsRepository";
import {
  useMySubmissions,
  useDeleteSubmission,
  useUpdateSubmission,
  readApiError,
  type SubmitResultListItem,
} from "@/repositories/submitResultsRepository";
import { validateDemoUrl, validateRepoUrl, validateSlideUrl } from "@/lib/linkValidators";
import { usePagination } from "@/hooks/usePagination";

export function useMySubmissionsViewModel() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: teamResponse, isLoading: isLoadingTeam } = useMyTeam();
  const team = (teamResponse as any)?.team ?? teamResponse;

  const teamId = team?.id || team?.Id || "";
  const isLeader = (team?.members || []).some(
    (m: any) => (m.userId === user?.id || m.userId === user?.userId) && (m.roleName === "TeamLeader" || m.roleName === "Leader"),
  );
  const isRegistered = team?.status === "Registered" || team?.status === "Approved";

  const { data: submissions = [], isLoading: isLoadingSubs, refetch } = useMySubmissions(teamId);

  const pagination = usePagination(submissions, 5);

  const [editingSub, setEditingSub] = useState<SubmitResultListItem | null>(null);
  const [editRepo, setEditRepo] = useState("");
  const [editDemo, setEditDemo] = useState("");
  const [editSlide, setEditSlide] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editError, setEditError] = useState("");

  const updateMutation = useUpdateSubmission();
  const deleteMutation = useDeleteSubmission();

  const handleOpenEdit = (sub: SubmitResultListItem) => {
    setEditingSub(sub);
    setEditRepo(sub.repoUrl || sub.RepoUrl || sub.submissionUrl || sub.SubmissionUrl || "");
    setEditDemo(sub.demoUrl || sub.DemoUrl || "");
    setEditSlide(sub.slideUrl || sub.SlideUrl || "");
    setEditDesc(sub.description || sub.Description || "");
    setEditError("");
  };

  const sanitizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    const subId = editingSub.id || editingSub.Id || "";
    const repoFormatted = sanitizeUrl(editRepo);
    const demoFormatted = sanitizeUrl(editDemo);
    const slideFormatted = sanitizeUrl(editSlide);

    if (!repoFormatted && !demoFormatted && !slideFormatted) {
      setEditError("Vui lòng điền ít nhất một đường dẫn hợp lệ cho bài nộp.");
      return;
    }

    const repoCheck = validateRepoUrl(repoFormatted);
    if (!repoCheck.isValid) {
      setEditError(repoCheck.errorMessage || "Repo không hợp lệ.");
      return;
    }
    const demoCheck = validateDemoUrl(demoFormatted);
    if (demoFormatted && !demoCheck.isValid) {
      setEditError(demoCheck.errorMessage || "Demo không hợp lệ.");
      return;
    }
    const slideCheck = validateSlideUrl(slideFormatted);
    if (slideFormatted && !slideCheck.isValid) {
      setEditError(slideCheck.errorMessage || "Slide không hợp lệ.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: subId,
        data: {
          RepoUrl: repoFormatted,
          DemoUrl: demoFormatted,
          SlideUrl: slideFormatted,
          SubmissionUrl: repoFormatted || demoFormatted || slideFormatted,
          Description: editDesc.trim(),
        },
      });
      setEditingSub(null);
      toast.success("Cập nhật bài nộp thành công!");
      queryClient.invalidateQueries({ queryKey: ["submitResults"] });
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      refetch();
    } catch (err) {
      const msg = readApiError(err);
      setEditError(msg);
      toast.error(msg);
    }
  };

  const handleDelete = async (sub: SubmitResultListItem) => {
    const subId = sub.id || sub.Id || "";
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài nộp này không?")) return;
    try {
      await deleteMutation.mutateAsync(subId);
      toast.success("Đã xóa bài nộp thành công.");
      queryClient.invalidateQueries({ queryKey: ["submitResults"] });
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      refetch();
    } catch (err) {
      const msg = readApiError(err);
      toast.error(msg);
    }
  };

  return {
    state: {
      team,
      teamId,
      isLeader,
      isRegistered,
      isLoadingTeam,
      isLoadingSubs,
      editingSub,
      editRepo,
      editDemo,
      editSlide,
      editDesc,
      editError,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
    },
    data: {
      submissions,
    },
    pagination,
    actions: {
      setEditingSub,
      setEditRepo,
      setEditDemo,
      setEditSlide,
      setEditDesc,
      handleOpenEdit,
      handleSaveEdit,
      handleDelete,
      refetch,
    },
  };
}
