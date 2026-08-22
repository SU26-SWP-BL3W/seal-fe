import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useGetUsers, useApproveUser, useRejectUser } from "@/repositories/usersRepository";
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

  const { data: rawUsersData, isLoading, refetch } = useGetUsers({ pageSize: 500 });
  const usersList: User[] = useMemo(() => {
    const list = rawUsersData?.data ?? (Array.isArray(rawUsersData) ? rawUsersData : []);
    return Array.isArray(list) ? list : [];
  }, [rawUsersData]);

  const { mutateAsync: approveUser } = useApproveUser();
  const { mutateAsync: rejectUser } = useRejectUser();

  const hasCardSubmission = (u: User) => {
    const hasStudentCode = Boolean(u.studentCode && u.studentCode.trim() !== "");
    const hasPhotoCardUrl = Boolean(
      (u as any).photoStudentCardUrl && (u as any).photoStudentCardUrl.trim() !== ""
    );
    return hasStudentCode || hasPhotoCardUrl;
  };

  const filteredCandidates = useMemo(() => {
    return usersList.filter((u) => {
      const emailLower = (u.email || "").toLowerCase();

      const isStudentRole =
        !u.isAdmin &&
        !emailLower.includes("admin") &&
        !emailLower.includes("ec.") &&
        !emailLower.includes("coordinator") &&
        !emailLower.includes("judge") &&
        !emailLower.includes("mentor");

      if (!isStudentRole) return false;
      if (!hasCardSubmission(u)) return false;

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
  }, [usersList, searchTerm, statusFilter]);

  const pagination = usePagination(filteredCandidates, 8);

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

  const isCoordinatorAccess = Boolean(currentUser);

  return {
    state: {
      searchTerm,
      statusFilter,
      detailUserModal,
      actionSuccess,
      actionError,
      isLoading,
      isCoordinatorAccess,
    },
    data: {
      usersList,
      filteredCandidates,
    },
    pagination,
    actions: {
      setSearchTerm,
      setStatusFilter,
      setDetailUserModal,
      handleApprove,
      handleReject,
      refetch,
    },
  };
}
