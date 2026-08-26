import React, { useState, useMemo } from "react";
import {
  useGetUsers,
  useApproveUser,
  useRejectUser,
  useCreateUser,
  useUpdateUser,
  useGetAllUserRejections,
  useUnblockUser,
} from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { staffRepository } from "@/repositories/staffRepository";
import { useEvents } from "@/repositories/eventsRepository";
import { usePagination } from "@/hooks/usePagination";
import type { User } from "@/models/entities";

export function useAdminUsersViewModel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailUserModal, setDetailUserModal] = useState<User | null>(null);
  const [rejectUserModal, setRejectUserModal] = useState<{ userId: string; fullName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: eventsList = [] } = useEvents();
  const [selectedUserForEc, setSelectedUserForEc] = useState<User | null>(null);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: rawUsersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useGetUsers({ pageSize: 1000 });
  const rawUsersList: User[] = rawUsersData?.data ?? [];

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

  const usersList: User[] = useMemo(() => {
    return rawUsersList.map((u) => {
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
  }, [rawUsersList, rejectionsMap]);

  const { data: schoolsList = [] } = useGetSchools();

  const { mutateAsync: approveUser } = useApproveUser();
  const { mutateAsync: rejectUser } = useRejectUser();
  const { mutateAsync: unblockUser, isPending: isUnblocking } = useUnblockUser();
  const { mutateAsync: createUser, isPending: isCreatingUser } = useCreateUser();
  const { mutateAsync: updateUser, isPending: isUpdatingUser } = useUpdateUser();

  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserForm, setCreateUserForm] = useState({
    email: "",
    password: "",
    fullName: "",
    schoolId: "",
    studentCode: "",
    isStudent: true,
    isAdmin: false,
  });

  const refetch = () => {
    refetchUsers();
    refetchRejections();
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    try {
      await createUser({
        email: createUserForm.email.trim(),
        password: createUserForm.password,
        fullName: createUserForm.fullName.trim(),
        schoolId: createUserForm.schoolId,
        studentCode: createUserForm.studentCode.trim() || undefined,
        isStudent: createUserForm.isStudent,
        isAdmin: createUserForm.isAdmin,
      });
      setCreateUserModalOpen(false);
      setCreateUserForm({ email: "", password: "", fullName: "", schoolId: "", studentCode: "", isStudent: true, isAdmin: false });
      refetch();
    } catch (err: any) {
      setCreateUserError(err?.response?.data?.message || "Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.");
    }
  };

  const [editUserModal, setEditUserModal] = useState<User | null>(null);
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    fullName: "",
    schoolId: "",
    studentCode: "",
    isStudent: true,
    isAdmin: false,
    isApproved: true,
  });

  const openEditUserModal = (u: User) => {
    setEditUserModal(u);
    setEditUserError(null);
    setEditUserForm({
      fullName: u.fullName || "",
      schoolId: (u as any).schoolId || "",
      studentCode: u.studentCode || "",
      isStudent: !!u.isStudent,
      isAdmin: !!u.isAdmin,
      isApproved: !!u.isApproved,
    });
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModal) return;
    setEditUserError(null);
    const userId = editUserModal.id || editUserModal.userId || "";
    try {
      await updateUser({
        id: userId,
        data: {
          fullName: editUserForm.fullName.trim(),
          schoolId: editUserForm.schoolId,
          studentCode: editUserForm.studentCode.trim() || undefined,
          isStudent: editUserForm.isStudent,
          isAdmin: editUserForm.isAdmin,
          isApproved: editUserForm.isApproved,
        },
      });
      setEditUserModal(null);
      setDetailUserModal(null);
      refetch();
    } catch (err: any) {
      setEditUserError(err?.response?.data?.message || "Không thể cập nhật tài khoản.");
    }
  };

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        (u.fullName || "").toLowerCase().includes(searchLower) ||
        (u.email || "").toLowerCase().includes(searchLower) ||
        (u.studentCode || "").toLowerCase().includes(searchLower) ||
        (u.schoolName || "").toLowerCase().includes(searchLower);

      let matchesRole = true;
      const emailLower = (u.email || "").toLowerCase();
      if (roleFilter === "admin") matchesRole = !!u.isAdmin || emailLower.includes("admin");
      else if (roleFilter === "coordinator") matchesRole = emailLower.includes("ec.coordinator");
      else if (roleFilter === "judge") matchesRole = emailLower.includes("judge");
      else if (roleFilter === "mentor") matchesRole = emailLower.includes("mentor");
      else if (roleFilter === "student") matchesRole = !u.isAdmin && !emailLower.includes("admin") && !emailLower.includes("ec.coordinator") && !emailLower.includes("judge") && !emailLower.includes("mentor");

      let matchesStatus = true;
      if (statusFilter === "approved") matchesStatus = !!u.isApproved;
      else if (statusFilter === "pending") matchesStatus = !u.isApproved && (u.rejectionCount ?? 0) < 2;
      else if (statusFilter === "locked") matchesStatus = (u.rejectionCount ?? 0) >= 2;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, searchTerm, roleFilter, statusFilter]);

  const pagination = usePagination(filteredUsers, 10);

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      setDetailUserModal(null);
      refetch();
    } catch {
      alert("Đã phê duyệt hồ sơ người dùng!");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectUserModal || !rejectReason.trim()) return;

    try {
      await rejectUser({ userId: rejectUserModal.userId, reason: rejectReason.trim() });
      setRejectUserModal(null);
      setDetailUserModal(null);
      setRejectReason("");
      refetch();
    } catch {
      alert("Đã ghi nhận từ chối hồ sơ kèm lý do.");
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser(userId);
      setDetailUserModal(null);
      refetch();
      alert("Đã mở khóa tài khoản thành công!");
    } catch {
      alert("Không thể mở khóa tài khoản. Vui lòng thử lại.");
    }
  };

  const handleAssignEc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEc) return;

    setIsSubmitting(true);
    const res = await staffRepository.assignRoleDirectly({
      userId: selectedUserForEc.id || selectedUserForEc.userId || "",
      eventId: selectedEventId,
      roleName: "EventCoordinator",
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(
        `Đã phân công ${selectedUserForEc.fullName} (${selectedUserForEc.email}) làm Event Coordinator thành công!`
      );
      setTimeout(() => {
        setSelectedUserForEc(null);
        setSuccessMessage(null);
      }, 2000);
    }
  };

  return {
    state: {
      searchTerm,
      roleFilter,
      statusFilter,
      detailUserModal,
      rejectUserModal,
      rejectReason,
      selectedUserForEc,
      selectedEventId,
      isSubmitting,
      successMessage,
      isLoading,
      isUnblocking,
      createUserModalOpen,
      createUserError,
      createUserForm,
      editUserModal,
      editUserError,
      editUserForm,
      isCreatingUser,
      isUpdatingUser,
    },
    data: {
      usersList,
      filteredUsers,
      eventsList,
      schoolsList,
    },
    pagination,
    actions: {
      setSearchTerm,
      setRoleFilter,
      setStatusFilter,
      setDetailUserModal,
      setRejectUserModal,
      setRejectReason,
      setSelectedUserForEc,
      setSelectedEventId,
      setCreateUserModalOpen,
      setCreateUserForm,
      setEditUserModal,
      setEditUserForm,
      openEditUserModal,
      handleCreateUserSubmit,
      handleEditUserSubmit,
      handleApprove,
      handleRejectSubmit,
      handleUnblock,
      handleAssignEc,
      refetch,
    },
  };
}
