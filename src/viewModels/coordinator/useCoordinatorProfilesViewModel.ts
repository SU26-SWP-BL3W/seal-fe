import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  useGetUsers,
  useApproveUser,
  useRejectUser,
  useGetAllUserRejections,
  useUnblockUser,
} from "@/repositories/usersRepository";
import type { User } from "@/models/entities";
import { readApiError } from "@/repositories/submitResultsRepository";
import { usePagination } from "@/hooks/usePagination";

export function useCoordinatorProfilesViewModel() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailUserModal, setDetailUserModal] = useState<User | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: rawUsersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useGetUsers({ pageSize: 500 });
  const usersList: User[] = useMemo(() => {
    const list = rawUsersData?.data ?? (Array.isArray(rawUsersData) ? rawUsersData : []);
    return Array.isArray(list) ? list : [];
  }, [rawUsersData]);

  const { data: allRejections = [], isLoading: isLoadingRejections, refetch: refetchRejections } = useGetAllUserRejections({ pageSize: 1000 });
  const isLoading = isLoadingUsers || isLoadingRejections;

  const rejectionsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const r of allRejections) {
      const uid = r.userId || (r as any).UserId;
      if (uid) {
        if (!map[uid]) map[uid] = [];
        map[uid].push(r);
      }
    }
    return map;
  }, [allRejections]);

  const enrichedUsers: User[] = useMemo(() => {
    return usersList.map((u) => {
      const uId = u.id || (u as any).Id || u.userId || "";
      const userRejs = rejectionsMap[uId] || [];
      const count = userRejs.length || (u as any).rejectionCount || 0;
      const sorted = [...userRejs].sort(
        (a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
      );
      return {
        ...u,
        rejectionCount: count,
        lastRejectionReason: sorted[0]?.reason || (u as any).lastRejectionReason,
        rejections: sorted,
      };
    });
  }, [usersList, rejectionsMap]);

  const { mutateAsync: approveUser } = useApproveUser();
  const { mutateAsync: rejectUser } = useRejectUser();
  const { mutateAsync: unblockUser, isPending: isUnblocking } = useUnblockUser();

  const hasCardSubmission = (u: User) => {
    const hasStudentCode = Boolean(u.studentCode && u.studentCode.trim() !== "");
    const hasPhotoCardUrl = Boolean(
      (u as any).photoStudentCardUrl && (u as any).photoStudentCardUrl.trim() !== ""
    );
    return hasStudentCode || hasPhotoCardUrl;
  };

  const allCandidates = useMemo(() => {
    return enrichedUsers.filter((u) => {
      const emailLower = (u.email || "").toLowerCase();

      const isStudentRole =
        !u.isAdmin &&
        !emailLower.includes("admin") &&
        !emailLower.includes("ec.") &&
        !emailLower.includes("coordinator") &&
        !emailLower.includes("judge") &&
        !emailLower.includes("mentor");

      if (!isStudentRole) return false;
      return hasCardSubmission(u);
    });
  }, [enrichedUsers]);

  const candidatesStats = useMemo(() => {
    const all = allCandidates.length;
    const approved = allCandidates.filter((u) => !!u.isApproved).length;
    const locked = allCandidates.filter((u) => (u.rejectionCount ?? 0) >= 2).length;
    const pending = allCandidates.filter((u) => !u.isApproved && (u.rejectionCount ?? 0) < 2).length;
    return { all, approved, pending, locked };
  }, [allCandidates]);

  const filteredCandidates = useMemo(() => {
    return allCandidates.filter((u) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        (u.fullName || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.studentCode || "").toLowerCase().includes(searchLower) ||
        (u.schoolName || "").toLowerCase().includes(searchLower);

      let matchesStatus = true;
      if (statusFilter === "approved") matchesStatus = !!u.isApproved;
      else if (statusFilter === "pending") matchesStatus = !u.isApproved && (u.rejectionCount ?? 0) < 2;
      else if (statusFilter === "locked") matchesStatus = (u.rejectionCount ?? 0) >= 2;

      return matchesSearch && matchesStatus;
    });
  }, [allCandidates, searchTerm, statusFilter]);

  const pagination = usePagination(filteredCandidates, 8);

  const refetch = () => {
    refetchUsers();
    refetchRejections();
  };

  const handleApprove = async (userId: string) => {
    setActionError(null);
    try {
      await approveUser(userId);
      setActionSuccess("Đã duyệt hồ sơ sinh viên thành công!");
      refetch();
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      setActionError("Lỗi phê duyệt: " + readApiError(err));
    }
  };

  const handleReject = async (userId: string, reason: string) => {
    setActionError(null);
    try {
      await rejectUser({ userId, reason });
      setActionSuccess("Đã từ chối hồ sơ sinh viên và ghi nhận lịch sử.");
      refetch();
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      setActionError("Lỗi từ chối hồ sơ: " + readApiError(err));
    }
  };

  const handleUnblock = async (userId: string) => {
    setActionError(null);
    try {
      await unblockUser(userId);
      setActionSuccess("Đã mở khóa tài khoản thành công! Thí sinh có thể nộp lại hồ sơ.");
      refetch();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err) {
      setActionError("Lỗi mở khóa tài khoản: " + readApiError(err));
    }
  };

  const isCoordinatorAccess = Boolean(currentUser);

  return {
    state: {
      searchTerm,
      statusFilter,
      detailUserModal,
      actionSuccess,
      actionError,
      isLoading,
      isUnblocking,
      isCoordinatorAccess,
    },
    data: {
      usersList: enrichedUsers,
      filteredCandidates,
      candidatesStats,
    },
    pagination,
    actions: {
      setSearchTerm,
      setStatusFilter,
      setDetailUserModal,
      handleApprove,
      handleReject,
      handleUnblock,
      refetch,
    },
  };
}
