"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import {
  useUpdateStudentProfile,
  useFptStudentVerification,
  useRequestUnblock,
  useChangePassword,
} from "@/repositories/authRepository";
import { useGetUserRejections } from "@/repositories/usersRepository";
import { useGetSchools } from "@/repositories/schoolsRepository";
import { useGetEventRolesByUser } from "@/repositories/events/eventRolesRepository";
import { useEvents } from "@/repositories/eventsRepository";
import { useMyTeam } from "@/repositories/teamsRepository";
import { uploadRepository } from "@/repositories/uploadRepository";
import { Button, Input, Card, Badge } from "@/components/ui";
import { useToast } from "@/providers/ToastProvider";
import type { FptStudentResponse } from "@/models/entities";

const normalizeId = (id?: string | null) => (id || "").replace(/-/g, "").toLowerCase();

export const getRoleDetails = (
  role: string,
  assignedRoles: string[],
  isAdmin?: boolean,
  isStudent?: boolean
) => {
  if (isAdmin) {
    return {
      label: "Quản Trị Viên (Admin)",
      badgeClass: "bg-red-950/40 border-red-500/30 text-red-300",
      dotClass: "bg-red-400 animate-pulse",
      typeLabel: "Quản Trị Viên Hệ Thống",
      isStaff: true,
    };
  }
  if (assignedRoles.includes("Judge") && assignedRoles.includes("Mentor")) {
    return {
      label: "Giám Khảo & Cố Vấn Học Thuật",
      badgeClass: "bg-purple-950/40 border-purple-500/30 text-purple-300",
      dotClass: "bg-purple-400",
      typeLabel: "Ban Giám Khảo & Cố Vấn",
      isStaff: true,
    };
  }
  if (assignedRoles.includes("Judge") || role === "Judge") {
    return {
      label: "Ban Giám Khảo (Judge)",
      badgeClass: "bg-indigo-950/40 border-indigo-500/30 text-indigo-300",
      dotClass: "bg-indigo-400",
      typeLabel: "Hội Đồng Giám Khảo",
      isStaff: true,
    };
  }
  if (assignedRoles.includes("Mentor") || role === "Mentor") {
    return {
      label: "Cố Vấn Học Thuật (Mentor)",
      badgeClass: "bg-cyan-950/40 border-cyan-500/30 text-cyan-300",
      dotClass: "bg-cyan-400",
      typeLabel: "Cố Vấn Chuyên Môn",
      isStaff: true,
    };
  }
  if (
    assignedRoles.includes("EventCoordinator") ||
    assignedRoles.includes("Coordinator") ||
    role === "Coordinator" ||
    role === "EventCoordinator"
  ) {
    return {
      label: "Điều Phối Viên Sự Kiện (Coordinator)",
      badgeClass: "bg-amber-950/40 border-amber-500/30 text-amber-300",
      dotClass: "bg-amber-400",
      typeLabel: "Ban Tổ Chức / Điều Phối Viên",
      isStaff: true,
    };
  }
  if (assignedRoles.includes("TeamLeader") || role === "TeamLeader" || role === "Leader") {
    return {
      label: "Trưởng Nhóm (Team Leader)",
      badgeClass: "bg-emerald-950/40 border-emerald-500/30 text-emerald-300",
      dotClass: "bg-emerald-400",
      typeLabel: "Thí Sinh (Trưởng Nhóm)",
      isStaff: false,
    };
  }
  if (assignedRoles.includes("TeamMember") || role === "TeamMember" || role === "Member") {
    return {
      label: "Thành Viên Đội Thi (Team Member)",
      badgeClass: "bg-teal-950/40 border-teal-500/30 text-teal-300",
      dotClass: "bg-teal-400",
      typeLabel: "Thí Sinh (Thành Viên Đội)",
      isStaff: false,
    };
  }
  // Mặc định đối với mọi tài khoản thí sinh / sinh viên tham gia hệ thống:
  return {
    label: "Thí Sinh / Sinh Viên",
    badgeClass: "bg-sky-950/40 border-sky-500/30 text-sky-300",
    dotClass: "bg-sky-400",
    typeLabel: "Thí Sinh Dự Thi",
    isStaff: false,
  };
};

export function UserProfileView() {
  const toast = useToast();
  const { user, activeRole } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const currentUserId = user?.id || user?.userId || user?.UserID || (user as any)?.Id;
  const { data: userRolesResult } = useGetEventRolesByUser(currentUserId, { pageSize: 100 });
  const userRoles = useMemo(() => {
    const raw = (userRolesResult as any)?.data?.items ?? (userRolesResult as any)?.items ?? (Array.isArray(userRolesResult) ? userRolesResult : []);
    return Array.isArray(raw) ? raw : [];
  }, [userRolesResult]);

  // Phân tách vai trò Chuyên môn (Staff) vs Đội thi Thí sinh (Student)
  const staffRoles = useMemo(() => {
    return userRoles.filter((r: any) => {
      const rn = r.roleName || r.RoleName;
      return rn === "Judge" || rn === "Mentor" || rn === "EventCoordinator" || rn === "Coordinator" || rn === "Admin";
    });
  }, [userRoles]);

  const studentRoles = useMemo(() => {
    return userRoles.filter((r: any) => {
      const rn = r.roleName || r.RoleName;
      return rn === "TeamLeader" || rn === "TeamMember" || rn === "Student";
    });
  }, [userRoles]);

  // Lấy danh sách sự kiện để map tên sự kiện thực tế trong DB
  const { data: rawEvents } = useEvents();
  const eventsList = useMemo(() => {
    const ev = (Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data) || [];
    return Array.isArray(ev) ? ev : [];
  }, [rawEvents]);

  // Lấy toàn bộ Hạng mục (Tracks) thuộc các sự kiện của người dùng để map tên Track thực tế (thay vì hiện GUID)
  const { data: allTracks = [] } = useQuery({
    queryKey: ["user-profile-tracks", userRoles.map((r: any) => r.eventId || r.EventId).join(",")],
    queryFn: async () => {
      const eventIds = [...new Set(userRoles.map((r: any) => r.eventId || r.EventId).filter(Boolean))];
      if (eventIds.length === 0) return [];
      const trackPromises = eventIds.map(async (evId) => {
        try {
          const res = await apiClient.get<any>(`/Tracks/event`, { params: { EventId: evId, PageSize: 100 } });
          const items = res.data?.data?.items ?? res.data?.data ?? res.data?.items ?? res.data ?? [];
          return Array.isArray(items) ? items : [];
        } catch {
          return [];
        }
      });
      const results = await Promise.all(trackPromises);
      return results.flat();
    },
    enabled: userRoles.length > 0,
  });

  const trackNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allTracks.forEach((t: any) => {
      const tid = normalizeId(t.id || t.Id || t.trackId || t.TrackId);
      if (tid) map.set(tid, t.trackName || t.TrackName || "Hạng mục");
    });
    return map;
  }, [allTracks]);

  const eventNameMap = useMemo(() => {
    const map = new Map<string, string>();
    eventsList.forEach((e: any) => {
      const eid = normalizeId(e.id || e.Id);
      if (eid) map.set(eid, e.eventName || e.EventName || "Sự kiện");
    });
    return map;
  }, [eventsList]);

  const assignedRoleNames = useMemo(() => {
    return [...new Set(userRoles.map((r: any) => r.roleName || r.RoleName).filter(Boolean))];
  }, [userRoles]);

  const roleInfo = useMemo(() => {
    const isAdmin = Boolean(user?.isAdmin || (user as any)?.IsAdmin);
    const isStudent = user?.isStudent !== undefined ? user.isStudent : undefined;
    const rawRole = activeRole?.roleName || (activeRole as any)?.RoleName || (user as any)?.role || (user as any)?.Role || "";

    return getRoleDetails(rawRole, assignedRoleNames, isAdmin, isStudent);
  }, [user, activeRole, assignedRoleNames]);

  const isStaff = roleInfo.isStaff;

  // Student & Staff shared state from database
  const [schoolChoice, setSchoolChoice] = useState<"FPT" | "OTHER">(
    user?.isFpt !== false ? "FPT" : "OTHER"
  );
  const [schoolId, setSchoolId] = useState(user?.schoolId || (user as any)?.SchoolId || "");
  const [studentCode, setStudentCode] = useState(user?.studentCode || (user as any)?.StudentId || (user as any)?.StudentCode || "");
  const [fullName, setFullName] = useState(user?.fullName || (user as any)?.FullName || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user?.photoStudentCardUrl || (user as any)?.PhotoStudentCardUrl || null
  );

  // Sync state when user loads
  useEffect(() => {
    if (user) {
      if (user.fullName || (user as any).FullName) {
        setFullName(user.fullName || (user as any).FullName || "");
      }
      if (user.schoolId || (user as any).SchoolId) {
        setSchoolId(user.schoolId || (user as any).SchoolId || "");
      }
      if (user.studentCode || (user as any).StudentId || (user as any).StudentCode) {
        const code = user.studentCode || (user as any).StudentId || (user as any).StudentCode || "";
        setStudentCode(code);
        setFptCode(code);
      }
      if (user.photoStudentCardUrl || (user as any).PhotoStudentCardUrl) {
        setPhotoPreview(user.photoStudentCardUrl || (user as any).PhotoStudentCardUrl || null);
      }
      if (user.isFpt !== undefined) {
        setSchoolChoice(user.isFpt ? "FPT" : "OTHER");
      }
    }
  }, [user]);

  // FPT Verification state
  const [fptCode, setFptCode] = useState(studentCode || "");
  const [fptResult, setFptResult] = useState<FptStudentResponse | null>(null);
  const [fptError, setFptError] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [requestUnblockSuccess, setRequestUnblockSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change password state
  const [showPasswordCard, setShowPasswordCard] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // API mutations
  const updateProfileMutation = useUpdateStudentProfile();
  const verifyFptMutation = useFptStudentVerification();
  const requestUnblockMutation = useRequestUnblock();
  const changePasswordMutation = useChangePassword();

  const { data: schoolsData, isLoading: loadingSchools } = useGetSchools();
  const schools = schoolsData || [];

  const { data: myTeamData } = useMyTeam();
  const myTeam = (myTeamData as any)?.data ?? myTeamData;

  const { data: rejectionsData } = useGetUserRejections(user?.id || user?.userId);
  const rejections: any[] = Array.isArray(rejectionsData) ? rejectionsData : ((rejectionsData as any)?.data || []);

  const rejectionCount = rejections.length;
  const isBlocked = rejectionCount >= 2 && !user?.isApproved;

  // Lấy tên trường / đơn vị từ danh sách Schools trong DB
  const currentSchoolId = user?.schoolId || (user as any)?.SchoolId || schoolId;
  const userSchool = schools.find((s) => s.id === currentSchoolId);
  const schoolNameDisplay =
    userSchool?.schoolName ||
    (user as any)?.schoolName ||
    (user as any)?.SchoolName ||
    (user as any)?.school?.schoolName ||
    "Chưa cập nhật";

  // Xử lý xác minh sinh viên FPT qua API tra cứu FPT DB thật
  const handleVerifyFpt = async () => {
    if (!fptCode.trim()) {
      setFptError("Vui lòng nhập Mã số sinh viên FPT");
      return;
    }
    setFptError("");
    try {
      const res = await verifyFptMutation.mutateAsync(fptCode.trim());
      const data = (res as any)?.data ?? res;
      if (data?.isValid || data?.IsValid || data?.fullName || data?.FullName) {
        setFptResult(data);
        const name = data.fullName || data.FullName;
        if (name) setFullName(name);
        setStudentCode(fptCode.trim());
        toast.success("Xác minh MSSV FPT thành công!");
      } else {
        setFptError("Mã số sinh viên không tồn tại trong hệ thống FPT Edu");
        setFptResult(null);
      }
    } catch (err: any) {
      setFptError(err?.message || "Không thể kết nối đến máy chủ xác minh FPT");
      setFptResult(null);
    }
  };

  const handleFileChange = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Kích thước file không được vượt quá 5MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setSubmitError("Chỉ chấp nhận file ảnh (JPG, PNG, WEBP)");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setSubmitError("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (!fullName.trim()) {
      setSubmitError("Vui lòng nhập họ và tên.");
      return;
    }

    let selectedSchoolId = schoolId || user?.schoolId || (user as any)?.SchoolId || "";

    if (!isStaff) {
      if (schoolChoice === "FPT") {
        const fptSchool = schools.find(
          (s) =>
            s.schoolName?.toLowerCase().includes("fpt") ||
            s.schoolName?.toLowerCase().includes("đại học fpt")
        );
        if (fptSchool?.id) {
          selectedSchoolId = fptSchool.id;
        }
        if (!studentCode.trim()) {
          setSubmitError("Vui lòng nhập Mã số sinh viên FPT.");
          return;
        }
      } else {
        if (!selectedSchoolId) {
          setSubmitError("Vui lòng chọn trường đại học từ danh sách.");
          return;
        }
        if (!studentCode.trim()) {
          setSubmitError("Vui lòng nhập Mã số sinh viên (MSSV).");
          return;
        }
        const hasExistingPhoto = Boolean(user?.photoStudentCardUrl || (user as any)?.PhotoStudentCardUrl);
        if (!hasExistingPhoto && !photoFile) {
          setSubmitError("Vui lòng tải lên ảnh thẻ sinh viên để Ban Tổ Chức xét duyệt.");
          return;
        }
      }
    } else {
      if (!selectedSchoolId) {
        setSubmitError("Vui lòng chọn Đơn vị công tác / Tổ chức / Trường học.");
        return;
      }
    }

    try {
      let finalPhotoUrl = user?.photoStudentCardUrl || (user as any)?.PhotoStudentCardUrl;

      if (!isStaff && photoFile) {
        setIsUploadingPhoto(true);
        const uploadRes = await uploadRepository.uploadFile(photoFile);
        finalPhotoUrl = uploadRes.fileUrl;
        setIsUploadingPhoto(false);
      }

      const isFptVal = !isStaff ? (schoolChoice === "FPT") : true;
      const studentCodeVal = !isStaff
        ? (studentCode.trim() || undefined)
        : (user?.studentCode || (user as any)?.StudentCode || (user as any)?.StudentId || "STAFF");

      await updateProfileMutation.mutateAsync({
        schoolId: selectedSchoolId,
        studentCode: studentCodeVal,
        photoStudentCardUrl: !isStaff ? (finalPhotoUrl || undefined) : undefined,
        isFpt: isFptVal,
        fullName: fullName.trim(),
      });

      setSubmitSuccess(true);
      setIsEditing(false);
      toast.success("Cập nhật thông tin hồ sơ thành công!");
    } catch (err: any) {
      setIsUploadingPhoto(false);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Cập nhật hồ sơ thất bại. Vui lòng kiểm tra lại thông tin.";
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ các trường mật khẩu");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        oldPassword,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Đổi mật khẩu thành công!");
      setTimeout(() => setShowPasswordCard(false), 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Đổi mật khẩu thất bại";
      setPasswordError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#090e11] text-[#dde4e6] font-sans py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Top Header Title ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
          <div>
            <div className="font-mono text-xs text-amber-400 mb-1 uppercase tracking-wider">
              [ HỒ SƠ TÀI KHOẢN HỆ THỐNG ]
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
              HỒ SƠ CÁ NHÂN &amp; PHÂN CÔNG
            </h1>
            <p className="font-mono text-xs text-zinc-400 mt-1">
              Quản lý thông tin định danh, đơn vị công tác và bảo mật tài khoản.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 border font-bold uppercase transition-all cursor-pointer hud-clipped ${
                isEditing
                  ? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-black shadow-sm"
              }`}
            >
              {isEditing ? "[ HỦY CHỈNH SỬA ]" : "[ CHỈNH SỬA HỒ SƠ ]"}
            </button>
          </div>
        </div>

        {/* ── Two-Strike Warning Banner for Students ── */}
        {!isStaff && isBlocked && (
          <div className="p-4 bg-red-950/40 border border-red-500/40 hud-clipped flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <span className="font-bold text-red-400 uppercase">[ TÀI KHOẢN BỊ KHÓA ĐĂNG KÝ THI ĐẤU ]</span>
              <p className="text-zinc-300">
                Hồ sơ sinh viên của bạn đã bị từ chối 2 lần. Vui lòng gửi yêu cầu mở khóa đến Quản trị viên.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await requestUnblockMutation.mutateAsync(user?.email || "");
                  setRequestUnblockSuccess(true);
                  toast.success("Đã gửi yêu cầu mở khóa!");
                } catch {
                  toast.error("Gửi yêu cầu thất bại");
                }
              }}
              disabled={requestUnblockSuccess || requestUnblockMutation.isPending}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold uppercase hud-clipped shrink-0 transition-all cursor-pointer disabled:opacity-50"
            >
              {requestUnblockSuccess ? "[ ĐÃ GỬI YÊU CẦU ]" : "[ GỬI YÊU CẦU MỞ KHÓA ]"}
            </button>
          </div>
        )}

        {/* ── Main Layout: Left Identification & Right Form ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── CỘT TRÁI (1 COL / 33%): THẺ ĐỊNH DANH ── */}
          <div className="space-y-6">
            <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-6 shadow-sm">
              <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-zinc-800">
                {/* Avatar Initial with Soft Glow */}
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-500/5 border-2 border-amber-500/40 rounded-full flex items-center justify-center font-display text-2xl font-extrabold text-amber-300 shadow-md">
                  {user?.fullName?.charAt(0).toUpperCase() || user?.FullName?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className="space-y-1">
                  <h3 className="font-display font-bold text-xl text-white uppercase tracking-wide">
                    {user?.fullName || user?.FullName || "Người dùng"}
                  </h3>
                  <p className="font-mono text-xs text-zinc-400">
                    {user?.email || "user@seal.vn"}
                  </p>
                  <p className="text-xs text-zinc-300 font-medium pt-0.5">
                    {isStaff
                      ? (schoolNameDisplay || "Chuyên gia Chuyên môn")
                      : `${schoolNameDisplay} ${user?.studentCode ? `• MSSV: ${user.studentCode}` : ""}`}
                  </p>
                </div>

                {/* Dải trạng thái định danh chuẩn xác theo Role */}
                <div className="pt-1">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-[11px] font-bold uppercase hud-clipped border ${roleInfo.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dotClass}`} />
                    <span>{roleInfo.label}</span>
                  </div>
                </div>
              </div>

              {/* Thông tin chi tiết trong DB */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                  <span className="text-zinc-400">ĐƠN VỊ / TRƯỜNG:</span>
                  <span className="font-bold text-white text-right max-w-[160px] truncate" title={schoolNameDisplay}>
                    {schoolNameDisplay}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                  <span className="text-zinc-400">LOẠI TÀI KHOẢN:</span>
                  <span className="font-bold text-cyan-300">
                    {roleInfo.typeLabel}
                  </span>
                </div>

                {/* Các trường chỉ dành cho Sinh Viên thực tế */}
                {!isStaff && (
                  <>
                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">MSSV:</span>
                      <span className="font-bold text-amber-300">
                        {user?.studentCode || "Chưa cập nhật"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">XÁC MINH FPT:</span>
                      <span className="font-bold text-zinc-300">
                        {user?.isFpt ? "[FPT EDU]" : "[TRƯỜNG NGOÀI]"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1 border-b border-zinc-800/80">
                      <span className="text-zinc-400">TRẠNG THÁI THẺ:</span>
                      <span className="font-bold text-emerald-400">
                        {user?.isApproved ? "[ ĐÃ DUYỆT ]" : "[ CHỜ DUYỆT ]"}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-400">NGÀY THAM GIA:</span>
                  <span className="text-zinc-300">
                    {user?.createdTime ? new Date(user.createdTime).toLocaleDateString("vi-VN") : "18/07/2026"}
                  </span>
                </div>
              </div>

              {/* Xem ảnh thẻ sinh viên (Chỉ hiện cho Sinh Viên nếu có ảnh trong DB) */}
              {!isStaff && (
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                  <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                    ẢNH THẺ SINH VIÊN ĐÃ NỘP:
                  </span>
                  {photoPreview ? (
                    <div className="relative border border-zinc-800 bg-black/40 p-1 hud-clipped">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Ảnh thẻ sinh viên"
                        className="w-full h-40 object-cover"
                      />
                      <div className="mt-1 font-mono text-[10px] text-center text-zinc-400">
                        [ BẢN ĐÃ NỘP ]
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-zinc-800 bg-[#090e11] text-center font-mono text-xs text-zinc-500 hud-clipped">
                      [ CHƯA CÓ ẢNH THẺ SINH VIÊN ]
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Lịch sử từ chối thẻ sinh viên */}
            {!isStaff && rejections.length > 0 && (
              <Card className="p-5 bg-[#10171a] border border-red-500/30 hud-clipped space-y-3">
                <h4 className="font-mono text-xs font-bold text-red-400 uppercase tracking-wider">
                  [ LỊCH SỬ TỪ CHỐI THẺ ({rejections.length}) ]
                </h4>
                <div className="space-y-2 font-mono text-xs">
                  {rejections.map((r: any, i: number) => (
                    <div key={r.id || i} className="p-3 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                      <div className="flex justify-between text-[10px] text-zinc-500">
                        <span className="text-red-400 font-bold">LẦN #{i + 1}</span>
                        <span>{r.createdTime ? new Date(r.createdTime).toLocaleDateString("vi-VN") : "Gần đây"}</span>
                      </div>
                      <p className="text-zinc-300">
                        Lý do: <span className="text-red-300">{r.reason || "Ảnh thẻ không hợp lệ"}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* ── CỘT PHẢI (2 COLS / 67%): FORM THÔNG TIN CHUẨN DATABASE ── */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Thẻ Thông tin Hồ sơ (Chế độ xem tự nhiên & Chế độ chỉnh sửa) */}
            <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h3 className="font-display font-bold text-base text-white uppercase">
                  {isStaff ? "THÔNG TIN ĐỊNH DANH & ĐƠN VỊ CÔNG TÁC" : "THÔNG TIN HỒ SƠ & THẺ SINH VIÊN"}
                </h3>
                <span className="font-mono text-[10px] px-2.5 py-1 bg-[#090e11] border border-zinc-800 text-zinc-400 uppercase hud-clipped">
                  {isEditing ? "[ ĐANG CHỈNH SỬA ]" : "[ CHẾ ĐỘ XEM ]"}
                </span>
              </div>

              {!isEditing ? (
                <div className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">HỌ VÀ TÊN</span>
                      <span className="text-sm font-bold text-white block">{fullName || user?.fullName || "Chưa cập nhật"}</span>
                    </div>

                    <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">EMAIL TÀI KHOẢN</span>
                      <span className="text-sm font-bold text-zinc-300 block truncate">{user?.email || "N/A"}</span>
                    </div>

                    <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped sm:col-span-2">
                      <span className="text-[10px] text-zinc-500 uppercase block font-bold">
                        {isStaff ? "ĐƠN VỊ CÔNG TÁC / TỔ CHỨC / TRƯỜNG HỌC" : "TRƯỜNG ĐẠI HỌC"}
                      </span>
                      <span className="text-sm font-bold text-amber-300 block">{schoolNameDisplay}</span>
                    </div>

                    {!isStaff && (
                      <>
                        <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                          <span className="text-[10px] text-zinc-500 uppercase block font-bold">MÃ SỐ SINH VIÊN (MSSV)</span>
                          <span className="text-sm font-bold text-cyan-300 block">{studentCode || "Chưa cập nhật"}</span>
                        </div>

                        <div className="p-3.5 bg-[#090e11] border border-zinc-800 space-y-1 hud-clipped">
                          <span className="text-[10px] text-zinc-500 uppercase block font-bold">PHÂN LOẠI TRƯỜNG</span>
                          <span className="text-sm font-bold text-zinc-300 block">
                            {schoolChoice === "FPT" ? "Sinh Viên FPT Edu" : "Sinh Viên Trường Ngoài"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-bold uppercase text-xs transition-all cursor-pointer hud-clipped shadow-sm"
                    >
                      [ CHỈNH SỬA THÔNG TIN HỒ SƠ ]
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-5 font-mono text-xs">
                  {/* Họ và tên */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      Họ và Tên *
                    </label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Email (Read-only từ DB) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      Email Tài Khoản (Không thể thay đổi)
                    </label>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="opacity-70 cursor-not-allowed"
                    />
                  </div>

                  {/* Đơn vị công tác / Trường học (Select từ bảng Schools thật trong DB) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      {isStaff ? "Đơn Vị Công Tác / Tổ Chức / Trường Học *" : "Trường Đại Học *"}
                    </label>
                    <select
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      className="w-full p-2.5 bg-[#090e11] border border-zinc-800 text-zinc-200 font-mono text-xs hud-clipped focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Chọn đơn vị / trường học từ hệ thống --</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.schoolName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Các trường dành riêng cho Sinh Viên (MSSV, FPT, Ảnh thẻ) */}
                  {!isStaff && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                          Phân Loại Trường *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setSchoolChoice("FPT")}
                            className={`p-2.5 text-center font-bold uppercase transition-all hud-clipped ${
                              schoolChoice === "FPT"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 font-extrabold"
                                : "bg-[#090e11] text-zinc-400 border border-zinc-800"
                            }`}
                          >
                            [ SINH VIÊN FPT ]
                          </button>
                          <button
                            type="button"
                            onClick={() => setSchoolChoice("OTHER")}
                            className={`p-2.5 text-center font-bold uppercase transition-all hud-clipped ${
                              schoolChoice === "OTHER"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 font-extrabold"
                                : "bg-[#090e11] text-zinc-400 border border-zinc-800"
                            }`}
                          >
                            [ TRƯỜNG KHÁC ]
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                          Mã Số Sinh Viên (MSSV) *
                        </label>
                        <Input
                          type="text"
                          value={studentCode}
                          onChange={(e) => setStudentCode(e.target.value)}
                          placeholder="Ví dụ: SE171234..."
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                          Ảnh Thẻ Sinh Viên (Mặt Trước) {schoolChoice === "OTHER" ? "*" : ""}
                        </label>
                        {photoPreview ? (
                          <div className="relative border border-zinc-700 bg-black/60 p-3 hud-clipped flex flex-col items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photoPreview}
                              alt="Xem trước ảnh thẻ sinh viên"
                              className="max-h-44 object-contain rounded border border-zinc-800"
                            />
                            <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-bold uppercase hud-clipped cursor-pointer transition-all"
                              >
                                [ Thay Đổi Ảnh Khác ]
                              </button>
                              {photoFile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPhotoFile(null);
                                    setPhotoPreview(user?.photoStudentCardUrl || null);
                                  }}
                                  className="px-3 py-1 bg-zinc-800 text-zinc-300 hover:text-white text-[10px] uppercase hud-clipped cursor-pointer transition-all"
                                >
                                  [ Khôi Phục Ảnh Cũ ]
                                </button>
                              )}
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
                            }}
                            className={`p-6 border-2 border-dashed text-center cursor-pointer transition-all hud-clipped ${
                              isDragging
                                ? "border-amber-400 bg-amber-500/10"
                                : "border-zinc-800 hover:border-zinc-700 bg-[#090e11]"
                            }`}
                          >
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                              className="hidden"
                            />
                            <p className="text-zinc-300 font-bold uppercase text-[11px]">
                              [ Kéo thả file ảnh thẻ vào đây hoặc Bấm để chọn ]
                            </p>
                            <span className="text-[10px] text-zinc-500 block mt-1">Dung lượng tối đa 5MB (JPG, PNG, WEBP)</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {submitError && <p className="text-red-400 font-bold">{submitError}</p>}
                  {submitSuccess && <p className="text-emerald-400 font-bold">[✓ CẬP NHẬT HỒ SƠ THÀNH CÔNG]</p>}

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      HỦY
                    </Button>
                    <Button type="submit" variant="primary" disabled={isUploadingPhoto || updateProfileMutation.isPending}>
                      {isUploadingPhoto ? "[ ĐANG TẢI ẢNH... ]" : "[ LƯU THAY ĐỔI ]"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>

            {/* ── CARD ĐỘI THI CỦA TÔI (CHO THÍ SINH / SINH VIÊN NẾU CÓ) ── */}
            {!isStaff && myTeam && (
              <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-base text-white uppercase">
                      ĐỘI THI ĐANG THAM GIA
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase">
                      Đội thi của bạn trong sự kiện
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-bold hud-clipped">
                    {myTeam.name || "Đội thi của tôi"}
                  </span>
                </div>

                <div className="p-4 bg-[#090e11] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hud-clipped font-mono text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm uppercase">
                        {myTeam.name}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-300 hud-clipped">
                        {myTeam.status || "Forming"}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-[11px]">
                      Sự kiện: <strong className="text-zinc-200">{myTeam.eventName || "Sự kiện hiện tại"}</strong>
                      {myTeam.members && ` • ${myTeam.members.length} thành viên`}
                    </p>
                  </div>

                  <Link href={`/my-team${myTeam.eventId ? `?eventId=${myTeam.eventId}` : ""}`}>
                    <button className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold uppercase text-[11px] hud-clipped transition-all cursor-pointer">
                      [ VÀO QUẢN TRỊ ĐỘI THI &gt; ]
                    </button>
                  </Link>
                </div>
              </Card>
            )}

            {/* ── BẢNG PHÂN CÔNG NHIỆM VỤ CHUYÊN MÔN (STAFF: JUDGE / MENTOR / COORDINATOR) ── */}
            {staffRoles.length > 0 && (
              <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-base text-white uppercase">
                      PHÂN CÔNG NHIỆM VỤ CHUYÊN MÔN
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase">
                      Vai trò Giám khảo, Cố vấn và Ban tổ chức theo sự kiện
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold hud-clipped">
                    {staffRoles.length} PHÂN CÔNG
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  {staffRoles.map((r: any, idx: number) => {
                    const rEventId = r.eventId || r.EventId;
                    const rEventObj = eventsList.find((e: any) => normalizeId(e.id || e.Id) === normalizeId(rEventId));
                    const rEventName = rEventObj?.eventName || rEventObj?.EventName || eventNameMap.get(normalizeId(rEventId)) || "Sự kiện SEAL";
                    const isEnded = rEventObj?.status === false || (rEventObj?.endDate && new Date(rEventObj.endDate).getTime() < Date.now());
                    const rRoleName = r.roleName || r.RoleName || "Chuyên gia";
                    const rTrackId = r.trackId || r.TrackId;
                    const rTrackName = r.track?.trackName || r.Track?.TrackName || (rTrackId ? trackNameMap.get(normalizeId(rTrackId)) : null);

                    let targetUrl = `/events/${rEventId}`;
                    let actionLabel = "[ VÀO SỰ KIỆN > ]";

                    if (rRoleName === "Judge") {
                      targetUrl = `/judge/events?eventId=${rEventId}`;
                      actionLabel = isEnded ? "[ XEM BÀI ĐÃ CHẤM > ]" : "[ BÀN CHẤM ĐIỂM > ]";
                    } else if (rRoleName === "Mentor") {
                      targetUrl = `/events/${rEventId}`;
                      actionLabel = isEnded ? "[ XEM SỰ KIỆN > ]" : "[ VÀO SỰ KIỆN > ]";
                    } else if (rRoleName === "EventCoordinator" || rRoleName === "Coordinator") {
                      targetUrl = `/coordinator/dashboard?eventId=${rEventId}`;
                      actionLabel = "[ BÀN ĐIỀU PHỐI > ]";
                    }

                    return (
                      <div
                        key={r.id || idx}
                        className="p-4 bg-[#090e11] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hud-clipped"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 font-bold uppercase text-[10px] hud-clipped ${
                              rRoleName === "Judge"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : rRoleName === "Mentor"
                                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                                : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                            }`}>
                              VAI TRÒ: {rRoleName.toUpperCase()}
                            </span>

                            {rTrackName ? (
                              <span className="px-2 py-0.5 bg-blue-950/40 text-blue-300 border border-blue-500/30 font-bold uppercase text-[10px] hud-clipped truncate max-w-xs">
                                HẠNG MỤC: {rTrackName}
                              </span>
                            ) : rTrackId ? (
                              <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-700 font-mono text-[10px] hud-clipped">
                                TRACK: {String(rTrackId).substring(0, 8)}...
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-zinc-900 text-zinc-400 border border-zinc-700 font-mono text-[10px] hud-clipped">
                                PHẠM VI: TOÀN SỰ KIỆN
                              </span>
                            )}

                            <span className={`text-[10px] font-bold px-1.5 py-0.5 hud-clipped ${
                              isEnded ? "bg-zinc-800 text-zinc-400" : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {isEnded ? "[ ĐÃ ĐÓNG ]" : "[ ĐANG MỞ ]"}
                            </span>
                          </div>

                          <div className="font-display font-bold text-white text-sm truncate">
                            {rEventName}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {rEventId && (
                            <Link href={targetUrl}>
                              <button className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 hover:border-amber-400 text-zinc-300 hover:text-white font-bold uppercase text-[11px] hud-clipped transition-all cursor-pointer">
                                {actionLabel}
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* ── BẢNG LỊCH SỬ THAM GIA ĐỘI THI (STUDENT ROLES) ── */}
            {studentRoles.length > 0 && (
              <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="font-display font-bold text-base text-white uppercase">
                      LỊCH SỬ ĐỘI THI ĐÃ THAM GIA
                    </h3>
                    <span className="font-mono text-[10px] text-zinc-500 uppercase">
                      Các sự kiện bạn đã tham gia với tư cách Thí sinh
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-1 bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 font-bold hud-clipped">
                    {studentRoles.length} SỰ KIỆN
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-xs">
                  {studentRoles.map((r: any, idx: number) => {
                    const rEventId = r.eventId || r.EventId;
                    const rEventObj = eventsList.find((e: any) => normalizeId(e.id || e.Id) === normalizeId(rEventId));
                    const rEventName = rEventObj?.eventName || rEventObj?.EventName || eventNameMap.get(normalizeId(rEventId)) || "Sự kiện SEAL";
                    const isEnded = rEventObj?.status === false || (rEventObj?.endDate && new Date(rEventObj.endDate).getTime() < Date.now());
                    const rRoleName = r.roleName || r.RoleName || "Thành viên";

                    return (
                      <div
                        key={r.id || idx}
                        className="p-4 bg-[#090e11] border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hud-clipped"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 font-bold uppercase text-[10px] hud-clipped bg-cyan-950/40 text-cyan-300 border border-cyan-500/30">
                              VAI TRÒ: {rRoleName === "TeamLeader" ? "TRƯỞNG ĐỘI" : "THÀNH VIÊN ĐỘI"}
                            </span>

                            <span className={`text-[10px] font-bold px-1.5 py-0.5 hud-clipped ${
                              isEnded ? "bg-zinc-800 text-zinc-400" : "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                            }`}>
                              {isEnded ? "[ ĐÃ ĐÓNG ]" : "[ ĐANG MỞ ]"}
                            </span>
                          </div>

                          <div className="font-display font-bold text-white text-sm truncate">
                            {rEventName}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {rEventId && (
                            <Link href={`/my-team?eventId=${rEventId}`}>
                              <button className="px-3.5 py-2 bg-[#141f23] border border-zinc-700 hover:border-cyan-400 text-cyan-300 hover:text-white font-bold uppercase text-[11px] hud-clipped transition-all cursor-pointer">
                                [ ĐỘI THI CỦA TÔI &gt; ]
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {userRoles.length === 0 && (
              <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-3 text-center shadow-sm font-mono text-xs text-zinc-400">
                <p className="font-bold text-white uppercase">[ CHƯA THAM GIA ĐỘI THI HOẶC PHÂN CÔNG CHUYÊN MÔN ]</p>
                <p className="text-zinc-500">Bạn hiện tại chưa tham gia đội thi nào hoặc chưa được phân công vai trò chuyên môn trong hệ thống.</p>
              </Card>
            )}

            {/* ── CARD ĐỔI MẬT KHẨU TÀI KHOẢN (DATABASE GROUNDED) ── */}
            <Card className="p-6 bg-[#10171a] border border-zinc-800 hud-clipped space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="font-display font-bold text-base text-white uppercase">
                    BẢO MẬT &amp; MẬT KHẨU TÀI KHOẢN
                  </h3>
                  <p className="font-mono text-[10px] text-zinc-400 mt-0.5">
                    Đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordCard(!showPasswordCard)}
                  className="px-3.5 py-1.5 bg-[#141f23] border border-zinc-700 text-zinc-300 hover:text-white font-mono text-xs font-bold uppercase hud-clipped transition-all cursor-pointer"
                >
                  {showPasswordCard ? "[ ĐÓNG FORM ]" : "[ THAY ĐỔI MẬT KHẨU ]"}
                </button>
              </div>

              {showPasswordCard && (
                <form onSubmit={handleChangePassword} className="space-y-4 pt-2 font-mono text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                      Mật Khẩu Hiện Tại *
                    </label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                        Mật Khẩu Mới *
                      </label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ít nhất 6 ký tự"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">
                        Xác Nhận Mật Khẩu Mới *
                      </label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                      />
                    </div>
                  </div>

                  {passwordError && <p className="text-red-400 font-bold">{passwordError}</p>}
                  {passwordSuccess && <p className="text-emerald-400 font-bold">[✓ ĐỔI MẬT KHẨU THÀNH CÔNG]</p>}

                  <div className="flex justify-end pt-2">
                    <Button type="submit" variant="primary" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? "[ ĐANG XỬ LÝ... ]" : "[ XÁC NHẬN ĐỔI MẬT KHẨU ]"}
                    </Button>
                  </div>
                </form>
              )}
            </Card>

          </div>

        </div>

      </div>
    </div>
  );
}
