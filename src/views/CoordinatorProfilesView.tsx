"use client";

import { useState, useMemo, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useGetUsers, useApproveUser, useRejectUser } from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { usePublicEvents } from "@/repositories/eventsRepository";
import { Button, Card, Badge } from "@/components/ui";
import {
  Users,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Eye,
  RefreshCw,
  Shield,
  AlertTriangle,
  Search,
  School,
  FileCheck,
  AlertOctagon,
  X,
  Lock,
  Filter,
  Layers,
  Target,
  UserCheck,
  UserX,
  RotateCcw,
  Edit3,
  UserPlus,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  ExternalLink,
  Crown,
  Award,
} from "lucide-react";
import type { User } from "@/models/entities";
import { readApiError } from "@/repositories/submitResultsRepository";
import { StudentProfileModal } from "@/components/domain/StudentProfileModal";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";

export const CoordinatorProfilesView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals state
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

  // Helper: Check if user has card submission (studentCode OR photoStudentCardUrl)
  const hasCardSubmission = (u: User) => {
    const hasStudentCode = Boolean(u.studentCode && u.studentCode.trim() !== "");
    const hasPhotoCardUrl = Boolean(
      (u as any).photoStudentCardUrl && (u as any).photoStudentCardUrl.trim() !== ""
    );
  };

  const handleRevokeApproval = (user: User) => {
    const id = user.id || (user as any).UserID || "";
    setLocalUsersOverride((prev) => {
      const next = new Map(prev);
      next.set(id, { isApproved: false, rejectionCount: 0 });
      return next;
    });
  }, [usersList, searchTerm, statusFilter]);

  const {
    paginatedItems: paginatedCandidates,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredCandidates, 8);

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

  // Bulk Approve
  const handleBulkApprove = async () => {
    if (selectedUserIds.size === 0) return;
    const ids = Array.from(selectedUserIds);

    setLocalUsersOverride((prev) => {
      const next = new Map(prev);
      ids.forEach((id) => next.set(id, { isApproved: true, rejectionCount: 0 }));
      return next;
    });

    setSelectedUserIds(new Set());

    // Call approvals
    for (const id of ids) {
      await approveUserMutation(id).catch((err) => console.warn("[SEAL] Bulk approve err:", err?.message));
    }
  };

  // Select all checkbox in current page
  const handleToggleSelectAll = () => {
    const currentPageIds = pagedUsers.map((u) => u.id || (u as any).UserID || "");
    const allSelected = currentPageIds.every((id) => selectedUserIds.has(id));

    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Detail / Edit Modal
  const handleOpenDetailModal = (user: User, isEditing = false) => {
    setDetailUserModal({ user, isEditing });
    setEditForm({
      fullName: user.fullName || (user as any).FullName || "",
      studentCode: user.studentCode || (user as any).StudentCode || "",
      schoolId: user.schoolId || "",
      schoolName: user.schoolName || "",
    });
  };

  const handleSaveEditUser = () => {
    if (!detailUserModal) return;
    const id = detailUserModal.user.id || (detailUserModal.user as any).UserID || "";
    const selectedSchool = schoolsList.find((s) => s.id === editForm.schoolId);

    setLocalUsersOverride((prev) => {
      const next = new Map(prev);
      next.set(id, {
        fullName: editForm.fullName,
        studentCode: editForm.studentCode,
        schoolId: editForm.schoolId,
        schoolName: selectedSchool ? selectedSchool.schoolName : editForm.schoolName,
      });
      return next;
    });

    setDetailUserModal(null);
  };

  const handleCreateUser = () => {
    if (!createForm.email || !createForm.fullName) return;
    const selectedSchool = schoolsList.find((s) => s.id === createForm.schoolId);
    const newId = `usr-manual-${Date.now()}`;

    setLocalUsersOverride((prev) => {
      const next = new Map(prev);
      next.set(newId, {
        id: newId,
        email: createForm.email,
        fullName: createForm.fullName,
        studentCode: createForm.studentCode,
        schoolId: createForm.schoolId,
        schoolName: selectedSchool ? selectedSchool.schoolName : "Đại học FPT",
        isStudent: createForm.role === "student",
        isAdmin: createForm.role === "admin",
        isApproved: true,
        createdTime: new Date().toISOString(),
      });
      return next;
    });

    setShowCreateModal(false);
    setCreateForm({ email: "", password: "Password123@", fullName: "", studentCode: "", schoolId: "", role: "student" });
  };

  const PREDEFINED_REASONS = [
    "Ảnh chụp thẻ SV bị mờ nét hoặc lóa sáng, không đọc được thông tin.",
    "Mã số sinh viên hoặc Họ tên không trùng khớp với thông tin đã đăng ký.",
    "Thẻ sinh viên đã hết hạn hoặc không có dấu mộc xác thực của nhà trường.",
    "Thông tin trường Đại học không chính xác hoặc không thuộc danh sách đối tác.",
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-base)] hud-lattice px-4 sm:px-6 py-8">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & GLOBAL COUNTERS
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-muted)] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-[rgba(167,139,250,0.1)] border border-[var(--accent-coordinator)]/40 flex items-center justify-center hud-clipped shadow-[0_0_15px_rgba(167,139,250,0.2)]">
              <Shield className="w-6 h-6 text-[var(--accent-coordinator)]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[var(--text-primary)] tracking-widest uppercase flex items-center gap-2">
                TRUNG TÂM PHÊ DUYỆT &amp; QUẢN LÝ TÀI KHOẢN
                <Badge tone="info" className="font-mono text-[10px]">SEAL AUTH CENTER</Badge>
              </h1>
              <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                Quản lý tư cách người dùng, lọc vai trò theo Hạng mục chuyên môn &amp; duyệt thẻ sinh viên toàn hệ thống
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] font-mono text-xs font-bold hud-clipped flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              + Thêm Tài Khoản
            </button>

            <Button
              variant="ghost"
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </Button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. 4 TABS TRẠNG THÁI (ALL / PENDING / APPROVED / REJECTED)
        ───────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-[var(--border-muted)] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 font-mono text-xs font-bold hud-clipped transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "all"
                ? "bg-purple-500/20 text-purple-300 border-2 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                : "bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Users className="w-4 h-4 text-purple-400" />
            Tất Cả Người Dùng
            <span className="px-1.5 py-0.2 text-[10px] rounded bg-purple-500/30 text-purple-200">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 font-mono text-xs font-bold hud-clipped transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "pending"
                ? "bg-amber-500/20 text-amber-300 border-2 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                : "bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <FileCheck className="w-4 h-4 text-amber-400" />
            Chờ Duyệt Thẻ SV
            <span className="px-1.5 py-0.2 text-[10px] rounded bg-amber-500/30 text-amber-200">
              {counts.pending}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`px-4 py-2 font-mono text-xs font-bold hud-clipped transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "approved"
                ? "bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Đã Duyệt Hợp Lệ
            <span className="px-1.5 py-0.2 text-[10px] rounded bg-emerald-500/30 text-emerald-200">
              {counts.approved}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-4 py-2 font-mono text-xs font-bold hud-clipped transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "rejected"
                ? "bg-rose-500/20 text-rose-300 border-2 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                : "bg-[var(--bg-panel)] text-[var(--text-muted)] border border-[var(--border-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            Bị Từ Chối / Khóa (2 Gậy)
            <span className="px-1.5 py-0.2 text-[10px] rounded bg-rose-500/30 text-rose-200">
              {counts.rejected}
            </span>
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. MULTI-DIMENSIONAL FILTER BAR (TRACK, EVENT, TYPE, SEARCH)
        ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-[var(--bg-panel)] border border-[var(--border-muted)] hud-clipped font-mono text-xs">
          {/* Filter 1: Track Filter */}
          <div className="space-y-1">
            <label className="text-[10px] text-cyan-300 uppercase flex items-center gap-1 font-bold">
              <Target className="w-3 h-3 text-cyan-400" />
              1. Lọc Theo Hạng Mục (Track) *
            </label>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              className="w-full px-2.5 py-2 bg-[var(--bg-input)] border border-cyan-500/40 text-cyan-200 rounded text-xs focus:outline-none focus:border-cyan-400"
            >
              {TRACK_LIST.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Event Filter */}
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold">
              <Layers className="w-3 h-3 text-purple-400" />
              2. Sự Kiện Hackathon
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-2.5 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-purple-400"
            >
              <option value="all">— Tất Cả Sự Kiện —</option>
              {eventsList.map((ev: any) => (
                <option key={ev.id || ev.Id || ev.eventId} value={ev.id || ev.Id || ev.eventId}>
                  {ev.eventName || ev.EventName || "SEAL Hackathon 2026"}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Account Type */}
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold">
              <Users className="w-3 h-3 text-amber-400" />
              3. Loại Người Dùng
            </label>
            <select
              value={selectedAccountType}
              onChange={(e) => setSelectedAccountType(e.target.value)}
              className="w-full px-2.5 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-amber-400"
            >
              <option value="all">— Tất Cả Loại Tài Khoản —</option>
              <option value="student_fpt">Sinh Viên FPT</option>
              <option value="student_other">Sinh Viên Trường Ngoài (Non-FPT)</option>
              <option value="staff">Ban Giám Khảo &amp; Cố Vấn (Staff)</option>
              <option value="admin">Quản Trị Viên (Admin)</option>
            </select>
          </div>

          {/* Filter 4: Sort */}
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold">
              <ArrowUpDown className="w-3 h-3 text-emerald-400" />
              4. Sắp Xếp Danh Sách
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-2.5 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-emerald-400"
            >
              <option value="latest">Mới nhất (Thời gian tạo)</option>
              <option value="name_asc">Họ và Tên (A → Z)</option>
              <option value="name_desc">Họ và Tên (Z → A)</option>
              <option value="code">Mã Số Sinh Viên (MSSV)</option>
              <option value="school">Trường Đại Học</option>
            </select>
          </div>

          {/* Filter 5: Search Query */}
          <div className="space-y-1">
            <label className="text-[10px] text-[var(--text-muted)] uppercase flex items-center gap-1 font-bold">
              <Search className="w-3 h-3 text-slate-400" />
              5. Tìm Kiếm Tức Thì
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tên, Email, MSSV, Trường, Đội..."
                className="w-full pl-3 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-[var(--accent-coordinator)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Current Active Filter Indicator & Context Banner */}
        <div className="flex items-center justify-between text-xs font-mono px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded hud-clipped">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--text-muted)]">Đang xem:</span>
            <span className="font-bold text-cyan-300">
              {selectedTrackId === "all" ? "Tất cả Hạng mục (Vai trò: User hệ thống)" : `Hạng mục: ${TRACK_LIST.find((t) => t.id === selectedTrackId)?.name} (Vai trò chuyên môn trong Track)`}
            </span>
            <span className="text-[var(--border-muted)]">|</span>
            <span className="text-[var(--text-muted)]">Tìm thấy: <strong className="text-white">{totalItems}</strong> người dùng</span>
          </div>

          {selectedTrackId !== "all" && (
            <button
              onClick={() => setSelectedTrackId("all")}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              ✕ Bỏ lọc Hạng mục
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. BULK ACTIONS FLOATING BAR
      ───────────────────────────────────────────────────────────── */}
      {selectedUserIds.size > 0 && (
        <div className="max-w-7xl mx-auto mb-4 p-3.5 bg-emerald-500/20 border-2 border-emerald-500 text-emerald-200 hud-clipped shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-between font-mono text-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>
              Đã chọn: <strong className="text-white font-black">{selectedUserIds.size}</strong> hồ sơ sinh viên
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedUserIds(new Set())}
              className="px-3 py-1 bg-black/40 hover:bg-black/60 border border-slate-500 text-slate-300 hud-clipped text-xs cursor-pointer"
            >
              ✕ Bỏ chọn tất cả
            </button>

            <button
              onClick={handleBulkApprove}
              disabled={isApproving}
              className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold hud-clipped text-xs shadow-[0_0_12px_rgba(16,185,129,0.5)] cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-black" />
              {isApproving ? "Đang xử lý..." : `⚡ DUYỆT HÀNG LOẠT (${selectedUserIds.size}) HỒ SƠ`}
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. MAIN USERS DATA TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        {isUsersError ? (
          <Card className="w-full p-12 bg-[var(--bg-panel)] hud-clipped border border-[var(--color-danger)]/40 text-center space-y-4 shadow-xl">
            <AlertTriangle className="w-12 h-12 text-[var(--color-danger)] mx-auto animate-pulse" />
            <h3 className="font-display text-lg font-bold text-[var(--color-danger)] uppercase tracking-wider">
              KHÔNG THỂ TẢI DANH SÁCH HỒ SƠ NGƯỜI DÙNG
            </h3>
            <p className="font-mono text-xs text-[var(--text-muted)] max-w-lg mx-auto leading-relaxed">
              {(usersError as any)?.response?.status === 403 || (usersError as any)?.response?.status === 401
                ? "Phiên làm việc hiện tại không có quyền Điều Phối Viên (Event Coordinator). Vui lòng đăng nhập lại bằng tài khoản EC hợp lệ (ví dụ: ec1@example.com / 123456)."
                : "Không thể kết nối đến máy chủ Backend API. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại."}
            </p>
            <div className="flex justify-center items-center gap-3 pt-2">
              <Button variant="ghost" onClick={() => refetch()} className="flex items-center gap-2 text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Thử lại
              </Button>
              <Link href="/login">
                <Button variant="primary" className="text-xs font-bold bg-[var(--accent-coordinator)] text-black">
                  Đăng Nhập Tài Khoản EC
                </Button>
              </Link>
            </div>
          </Card>
        ) : loadingUsers ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 font-mono text-xs text-[var(--text-muted)]">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--accent-coordinator)]" />
            <span>Đang tải danh sách người dùng...</span>
          </div>
        ) : totalItems === 0 ? (
          <Card className="w-full p-16 bg-[var(--bg-panel)] hud-clipped border-[var(--border-muted)] text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto opacity-40" />
            <p className="font-mono text-sm text-[var(--text-muted)] tracking-widest uppercase">
              Không tìm thấy người dùng nào phù hợp với bộ lọc hiện tại
            </p>
          </Card>
        ) : (
          <div className="border border-[var(--border-muted)] bg-[var(--bg-panel)] hud-clipped overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-[var(--border-muted)] bg-[var(--bg-input)] text-[10px] uppercase text-[var(--text-muted)] tracking-wider">
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={pagedUsers.length > 0 && pagedUsers.every((u) => selectedUserIds.has(u.id || (u as any).UserID || ""))}
                        onChange={handleToggleSelectAll}
                        className="cursor-pointer accent-cyan-400 w-3.5 h-3.5"
                      />
                    </th>
                    <th className="p-3">Ảnh Thẻ</th>
                    <th className="p-3">Họ và Tên / Email</th>
                    <th className="p-3">Mã Số SV</th>
                    <th className="p-3">Trường Đại Học</th>
                    <th className="p-3">
                      {selectedTrackId === "all" ? "Vai Trò Hệ Thống" : "Vai Trò Trong Hạng Mục"}
                    </th>
                    <th className="p-3">Trạng Thái Thẻ</th>
                    <th className="p-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {paginatedCandidates.map((u, idx) => {
                    const userId = u.id || (u as any).Id || u.userId || "";
                    const isLocked = (u.rejectionCount ?? 0) >= 2;
                    const isApproved = !!u.isApproved;

                    return (
                      <tr key={userId || idx} className="hover:bg-[#141e22] transition-colors">
                        <td className="py-3.5 px-4 text-zinc-500 text-center">{(currentPage - 1) * pageSize + idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-white tracking-wider">
                          <button
                            onClick={() => setDetailUserModal(u)}
                            className="hover:text-amber-300 transition-colors text-left cursor-pointer"
                          >
                            {user.photoStudentCardUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={user.photoStudentCardUrl}
                                alt="Ảnh thẻ"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[9px] text-[var(--text-muted)]">
                                —
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-cyan-300" />
                            </div>
                          </div>
                        </td>

                        {/* Full Name & Email */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-[var(--text-primary)] block text-xs">
                              {user.fullName || (user as any).FullName}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)] block truncate max-w-[200px]">
                              {user.email || (user as any).Email}
                            </span>
                          </div>
                        </td>

                        {/* Student Code */}
                        <td className="p-3">
                          <span className="font-bold text-cyan-400">
                            {user.studentCode || (user as any).StudentCode || "—"}
                          </span>
                        </td>

                        {/* School Name */}
                        <td className="p-3">
                          <span className="text-slate-300 truncate max-w-[180px] block">
                            {user.schoolName || (user as any).SchoolName || (user.isFpt ? "Đại học FPT" : "Ngoài trường")}
                          </span>
                        </td>

                        {/* Dynamic Track-based Role */}
                        <td className="p-3">
                          {selectedTrackId === "all" ? (
                            // Global Role
                            user.isAdmin ? (
                              <Badge tone="danger" className="text-[9px]">QUẢN TRỊ VIÊN</Badge>
                            ) : user.isStudent ? (
                              <Badge tone={user.isFpt ? "info" : "warning"} className="text-[9px]">
                                {user.isFpt ? "SV FPT (USER)" : "SV NGOÀI TRƯỜNG"}
                              </Badge>
                            ) : (
                              <Badge tone="neutral" className="text-[9px]">NGƯỜI DÙNG</Badge>
                            )
                          ) : (
                            // Contextual Track Role
                            <div className="space-y-1">
                              {user.trackRole === "Leader" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 rounded font-bold text-[10px]">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  Trưởng Nhóm
                                </span>
                              )}
                              {user.trackRole === "Member" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded font-bold text-[10px]">
                                  <Users className="w-3 h-3 text-cyan-400" />
                                  Thành Viên
                                </span>
                              )}
                              {user.trackRole === "Judge" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 border border-purple-500/50 text-purple-300 rounded font-bold text-[10px]">
                                  <Award className="w-3 h-3 text-purple-400" />
                                  Giám Khảo Track
                                </span>
                              )}
                              {user.trackRole === "Mentor" && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded font-bold text-[10px]">
                                  <Shield className="w-3 h-3 text-emerald-400" />
                                  Cố Vấn Track
                                </span>
                              )}
                              {!user.trackRole && (
                                <span className="text-[10px] text-slate-500 italic">Chưa gán</span>
                              )}

                              {user.teamName && (
                                <span className="block text-[10px] text-slate-400 truncate max-w-[130px]">
                                  Đội: {user.teamName}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Verification & Strike Status */}
                        <td className="p-3">
                          {is2StrikesLocked ? (
                            <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold text-[10px] rounded flex items-center gap-1 w-max">
                              <Lock className="w-3 h-3" /> 2 GẬY (KHÓA)
                            </span>
                          ) : is1Strike && !user.isApproved ? (
                            <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-[10px] rounded flex items-center gap-1 w-max">
                              <AlertTriangle className="w-3 h-3" /> NỘP LẠI (LẦN 2)
                            </span>
                          ) : user.isApproved ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-[10px] rounded flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3" /> ĐÃ DUYỆT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold text-[10px] rounded flex items-center gap-1 w-max">
                              <FileCheck className="w-3 h-3" /> CHỜ DUYỆT (LẦN 1)
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Chi Tiết / Sửa */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetailModal(user, false)}
                              className="px-2.5 py-1 bg-[var(--bg-input)] hover:bg-slate-700 border border-[var(--border-muted)] text-[var(--text-muted)] hover:text-white rounded text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Chi tiết
                            </button>

                            {/* Duyệt & Từ chối nếu chưa duyệt */}
                            {!user.isApproved && !is2StrikesLocked && (
                              <>
                                <button
                                  type="button"
                                  disabled={isApproving}
                                  onClick={() => handleApprove(user)}
                                  className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 hover:text-black border border-emerald-500/50 text-emerald-300 rounded text-[11px] font-bold cursor-pointer transition-all shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                >
                                  Duyệt
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectModal({ user })}
                                  className="px-2 py-1 bg-red-500/20 hover:bg-red-500 hover:text-white border border-red-500/50 text-red-300 rounded text-[11px] font-bold cursor-pointer transition-all"
                                >
                                  Từ chối
                                </button>
                              </>
                            )}

                            {/* Duyệt lại nếu đã bị từ chối */}
                            {!user.isApproved && (user.rejectionCount || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => handleApprove(user)}
                                className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500 hover:text-black border border-cyan-500/50 text-cyan-300 rounded text-[11px] font-bold cursor-pointer transition-all"
                              >
                                Duyệt lại
                              </button>
                            )}

                            {/* Thu hồi duyệt nếu đã duyệt */}
                            {user.isApproved && !user.isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleRevokeApproval(user)}
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded text-[11px] font-bold cursor-pointer transition-all"
                                title="Thu hồi duyệt tài khoản"
                              >
                                Thu hồi
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredCandidates.length > 0 && (
            <div className="p-4 border-t border-zinc-800">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                itemLabel="thí sinh"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          7. LIGHTBOX PREVIEW MODAL: Xem Phóng To Ảnh Thẻ Sinh Viên
      ───────────────────────────────────────────────────────────── */}
      {previewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewModal(null)}
        >
          <div
            className="w-full max-w-2xl bg-[var(--bg-panel)] border-2 border-[var(--accent-coordinator)]/50 hud-clipped shadow-[0_0_30px_rgba(167,139,250,0.25)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border-muted)] bg-[var(--bg-base)]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[var(--accent-coordinator)]" />
                <h3 className="font-display text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Minh Chứng Thẻ Sinh Viên — {previewModal.fullName}
                </h3>
              </div>
              <button onClick={() => setPreviewModal(null)} className="text-[var(--text-muted)] hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative w-full max-h-[380px] bg-black/50 border border-[var(--border-muted)] rounded flex items-center justify-center overflow-hidden p-2">
                {previewModal.photoStudentCardUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewModal.photoStudentCardUrl}
                    alt={`Thẻ sinh viên ${previewModal.fullName}`}
                    className="max-h-[360px] w-auto object-contain rounded shadow-lg"
                  />
                ) : (
                  <div className="py-16 text-center text-xs font-mono text-[var(--text-muted)] space-y-2">
                    <AlertTriangle className="w-8 h-8 mx-auto text-amber-400 opacity-60" />
                    <p>Chưa có ảnh thẻ sinh viên được tải lên</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs p-3 bg-[var(--bg-input)] border border-[var(--border-muted)] rounded">
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Họ và Tên</span>
                  <span className="font-bold text-[var(--text-primary)]">{previewModal.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Mã Số SV</span>
                  <span className="font-bold text-cyan-400">{previewModal.studentCode || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Trường</span>
                  <span className="font-bold text-amber-300 truncate block">
                    {previewModal.schoolName || (previewModal.isFpt ? "Đại học FPT" : "Ngoài trường")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block">Trạng Thái Thẻ</span>
                  <span className="font-bold text-emerald-400">
                    {previewModal.rejectionCount ? `Đã từ chối ${previewModal.rejectionCount} lần` : "Nộp lần đầu"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-[var(--border-muted)] bg-[var(--bg-base)]">
              <Button variant="ghost" onClick={() => setPreviewModal(null)} className="text-xs font-mono">
                Đóng
              </Button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectModal({ user: previewModal });
                    setPreviewModal(null);
                  }}
                  className="px-4 py-2 text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white transition-all hud-clipped flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Từ Chối Hồ Sơ
                </button>

                <button
                  type="button"
                  disabled={isApproving}
                  onClick={() => handleApprove(previewModal)}
                  className="px-5 py-2 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500 hover:text-black transition-all hud-clipped flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isApproving ? "Đang lưu..." : "Duyệt Hồ Sơ Này"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. REJECT MODAL: Nhập Lý Do & Cảnh Báo 2 Gậy
      ───────────────────────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <Card className="w-full max-w-lg p-6 bg-[var(--bg-panel)] hud-clipped border-2 border-[var(--color-danger)]/60 shadow-[0_0_30px_rgba(239,68,68,0.25)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <div className="flex items-center gap-2.5 text-[var(--color-danger)]">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-display text-base font-bold tracking-wider uppercase">
                  TỪ CHỐI HỒ SƠ THẺ SINH VIÊN
                </h3>
              </div>
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <p className="text-[var(--text-muted)]">
                Bạn đang thực hiện từ chối hồ sơ của: <strong className="text-[var(--text-primary)]">{rejectModal.user.fullName}</strong>
              </p>

              {rejectModal.user.rejectionCount === 1 ? (
                <div className="p-3 bg-rose-500/20 border-2 border-rose-500 text-rose-200 hud-clipped font-bold flex items-start gap-2 animate-pulse">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <span className="text-rose-400 uppercase">[CẢNH BÁO 2 GẬY]: </span>
                    Sinh viên này đã bị từ chối 1 lần. Nếu từ chối lần này, tài khoản sẽ bị{" "}
                    <span className="text-white underline">KHÓA VĨNH VIỄN (Permanently Rejected)</span>!
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 hud-clipped">
                  ℹ️ Đây là lần từ chối thứ 1. Sinh viên sẽ nhận được lý do và có cơ hội nộp lại ảnh thẻ.
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Chọn nhanh lý do từ chối:</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {PREDEFINED_REASONS.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRejectReason(r)}
                      className={`text-left p-2 border hud-clipped text-[11px] transition-all cursor-pointer ${
                        rejectReason === r
                          ? "bg-[var(--color-danger)]/20 border-[var(--color-danger)] text-white font-bold"
                          : "bg-[var(--bg-input)] border-[var(--border-muted)] text-[var(--text-muted)] hover:border-slate-500 hover:text-[var(--text-primary)]"
                      }`}
                    >
                      • {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  Nội dung lý do từ chối gửi cho sinh viên <span className="text-[var(--color-danger)]">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập chi tiết lý do từ chối..."
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] font-mono text-xs hud-clipped focus:outline-none focus:border-[var(--color-danger)]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" onClick={() => { setRejectModal(null); setRejectReason(""); }} className="flex-1 justify-center text-xs font-mono">
                Hủy Bỏ
              </Button>
              <button
                type="button"
                disabled={!rejectReason.trim() || isRejecting}
                onClick={handleRejectConfirm}
                className="flex-1 py-2 px-4 justify-center bg-[var(--color-danger)] hover:bg-red-600 text-white font-mono text-xs font-bold tracking-wider hud-clipped transition-all disabled:opacity-50 cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              >
                {isRejecting ? "Đang xử lý..." : "Xác Nhận Từ Chối"}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. 2-IN-1 DETAIL & EDIT USER MODAL
      ───────────────────────────────────────────────────────────── */}
      {detailUserModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <Card className="w-full max-w-lg p-6 bg-[var(--bg-panel)] hud-clipped border border-[var(--accent-coordinator)]/50 shadow-[0_0_30px_rgba(167,139,250,0.2)] space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--accent-coordinator)]" />
                <h3 className="font-display text-base font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  {detailUserModal.isEditing ? "CHỈNH SỬA THÔNG TIN NGƯỜI DÙNG" : "HỒ SƠ CHI TIẾT NGƯỜI DÙNG"}
                </h3>
              </div>
              <button onClick={() => setDetailUserModal(null)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!detailUserModal.isEditing ? (
              // VIEW MODE
              <div className="space-y-4 font-mono text-xs">
                {/* Photo if available */}
                {detailUserModal.user.photoStudentCardUrl && (
                  <div className="text-center p-2 bg-black/40 border border-[var(--border-muted)] rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={detailUserModal.user.photoStudentCardUrl}
                      alt="Ảnh thẻ"
                      className="max-h-40 mx-auto object-contain rounded"
                    />
                    <span className="text-[10px] text-[var(--text-muted)] block mt-1">Ảnh thẻ sinh viên đính kèm</span>
                  </div>
                )}

                <div className="space-y-2 divide-y divide-[var(--border-muted)]/50">
                  <div className="flex justify-between py-1.5">
                    <span className="text-[var(--text-muted)]">Họ và Tên:</span>
                    <strong className="text-[var(--text-primary)]">{detailUserModal.user.fullName}</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[var(--text-muted)]">Email:</span>
                    <span className="text-cyan-300">{detailUserModal.user.email}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[var(--text-muted)]">Mã Số Sinh Viên:</span>
                    <span className="text-amber-300 font-bold">{detailUserModal.user.studentCode || "—"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[var(--text-muted)]">Trường Đại Học:</span>
                    <span className="text-slate-200">{detailUserModal.user.schoolName || (detailUserModal.user.isFpt ? "Đại học FPT" : "Ngoài trường")}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[var(--text-muted)]">Hạng Mục Chuyên Môn:</span>
                    <span className="text-cyan-400">{detailUserModal.user.trackName || "Chưa gán"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[var(--text-muted)]">Vai Trò Trong Track:</span>
                    <span className="font-bold text-amber-300">{detailUserModal.user.trackRole || "Thành viên"}</span>
                  </div>
                  {detailUserModal.user.teamName && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-[var(--text-muted)]">Đội Thi:</span>
                      <span className="text-emerald-300 font-bold">{detailUserModal.user.teamName}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5">
                    <span className="text-[var(--text-muted)]">Trạng Thái Xác Thực:</span>
                    <span className="font-bold">
                      {detailUserModal.user.isApproved ? (
                        <span className="text-emerald-400">✓ Đã xác minh hợp lệ</span>
                      ) : (
                        <span className="text-yellow-400">Chờ duyệt (Pending)</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-2 border-t border-[var(--border-muted)]">
                  <button
                    type="button"
                    onClick={() => setDetailUserModal({ ...detailUserModal, isEditing: true })}
                    className="px-4 py-2 bg-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)]/30 border border-[var(--accent-primary)]/50 text-[var(--accent-primary)] font-bold hud-clipped flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Chỉnh Sửa Thông Tin
                  </button>

                  <Button variant="ghost" onClick={() => setDetailUserModal(null)} className="text-xs">
                    Đóng
                  </Button>
                </div>
              </div>
            ) : (
              // EDIT MODE
              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Email (Không đổi)</label>
                  <input
                    type="text"
                    value={detailUserModal.user.email || ""}
                    disabled
                    className="w-full px-3 py-2 bg-black/40 border border-[var(--border-muted)] text-slate-400 rounded text-xs cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Họ và Tên *</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Mã Số Sinh Viên (MSSV)</label>
                  <input
                    type="text"
                    value={editForm.studentCode}
                    onChange={(e) => setEditForm({ ...editForm, studentCode: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Trường Đại Học</label>
                  <select
                    value={editForm.schoolId}
                    onChange={(e) => setEditForm({ ...editForm, schoolId: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-cyan-400"
                  >
                    <option value="">— Chọn trường đại học —</option>
                    {schoolsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.schoolName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-muted)]">
                  <button
                    type="button"
                    onClick={() => setDetailUserModal({ ...detailUserModal, isEditing: false })}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hud-clipped font-bold"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditUser}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold hud-clipped shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  >
                    Lưu Thay Đổi
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          10. CREATE USER MODAL (Thêm tài khoản thủ công)
      ───────────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <Card className="w-full max-w-lg p-6 bg-[var(--bg-panel)] hud-clipped border border-[var(--accent-primary)]/50 shadow-[0_0_30px_rgba(6,182,212,0.2)] space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-muted)] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="font-display text-base font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  THÊM TÀI KHOẢN MỚI
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Họ và Tên *</label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Mã Số Sinh Viên (Tùy chọn)</label>
                <input
                  type="text"
                  value={createForm.studentCode}
                  onChange={(e) => setCreateForm({ ...createForm, studentCode: e.target.value })}
                  placeholder="SE180123"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Trường Đại Học</label>
                <select
                  value={createForm.schoolId}
                  onChange={(e) => setCreateForm({ ...createForm, schoolId: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="">— Chọn trường —</option>
                  {schoolsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.schoolName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Vai Trò</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-muted)] text-[var(--text-primary)] rounded text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="student">Thí sinh / Sinh viên</option>
                  <option value="judge">Ban Giám Khảo</option>
                  <option value="mentor">Cố Vấn Chuyên Môn</option>
                  <option value="admin">Quản Trị Viên (Admin)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-muted)]">
              <Button variant="ghost" onClick={() => setShowCreateModal(false)} className="text-xs">
                Hủy
              </Button>
              <button
                type="button"
                onClick={handleCreateUser}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold hud-clipped text-xs shadow-[0_0_12px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                + Tạo Tài Khoản
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
