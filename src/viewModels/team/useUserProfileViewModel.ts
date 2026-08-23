import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
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
  return {
    label: "Thí Sinh / Sinh Viên",
    badgeClass: "bg-sky-950/40 border-sky-500/30 text-sky-300",
    dotClass: "bg-sky-400",
    typeLabel: "Thí Sinh Dự Thi",
    isStaff: false,
  };
};

export function useUserProfileViewModel() {
  const toast = useToast();
  const router = useRouter();
  const { user, activeRole, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const currentUserId = user?.id || user?.userId || user?.UserID || (user as any)?.Id;
  const { data: userRolesResult, isLoading: rolesLoading } = useGetEventRolesByUser(currentUserId, { pageSize: 100 });
  const userRoles = useMemo(() => {
    const raw = (userRolesResult as any)?.data?.items ?? (userRolesResult as any)?.items ?? (Array.isArray(userRolesResult) ? userRolesResult : []);
    return Array.isArray(raw) ? raw : [];
  }, [userRolesResult]);

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

  const { data: rawEvents } = useEvents();
  const eventsList = useMemo(() => {
    const ev = (Array.isArray(rawEvents) ? rawEvents : (rawEvents as any)?.data) || [];
    return Array.isArray(ev) ? ev : [];
  }, [rawEvents]);

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

  const { data: myTeamData } = useMyTeam();
  const myTeam = (myTeamData as any)?.data ?? myTeamData;

  const assignedRoleNames = useMemo(() => {
    return [...new Set(userRoles.map((r: any) => r.roleName || r.RoleName).filter(Boolean))];
  }, [userRoles]);

  const roleInfo = useMemo(() => {
    const isAdmin = Boolean(user?.isAdmin || (user as any)?.IsAdmin);
    const isStudent = user?.isStudent !== undefined ? user.isStudent : undefined;
    const rawRole = activeRole?.roleName || (activeRole as any)?.RoleName || (user as any)?.role || (user as any)?.Role || "";

    const isTeamLeader = myTeam && (myTeam.leaderId === currentUserId || (myTeam as any)?.LeaderId === currentUserId);
    const isTeamMember = myTeam && !isTeamLeader;

    const effectiveRoles = [...assignedRoleNames];
    if (isTeamLeader && !effectiveRoles.includes("TeamLeader")) effectiveRoles.push("TeamLeader");
    if (isTeamMember && !effectiveRoles.includes("TeamMember")) effectiveRoles.push("TeamMember");

    if (rolesLoading && !isAdmin && !rawRole && effectiveRoles.length === 0) {
      return {
        label: "Đang tải phân công…",
        badgeClass: "bg-zinc-800/60 border-zinc-600/40 text-zinc-300",
        dotClass: "bg-zinc-400 animate-pulse",
        typeLabel: "Đang xác định vai trò…",
        isStaff: true,
      };
    }

    return getRoleDetails(rawRole, effectiveRoles, isAdmin, isStudent);
  }, [user, activeRole, assignedRoleNames, myTeam, currentUserId, rolesLoading]);

  const isStaff = roleInfo.isStaff;

  const [schoolChoice, setSchoolChoice] = useState<"FPT" | "OTHER">(
    user?.isFpt !== false ? "FPT" : "OTHER"
  );
  const [schoolId, setSchoolId] = useState(user?.schoolId || (user as any)?.SchoolId || "");
  const [studentCode, setStudentCode] = useState(user?.studentCode || (user as any)?.StudentId || (user as any)?.StudentCode || "");
  const [fullName, setFullName] = useState(user?.fullName || (user as any)?.FullName || "");
  const [customSchoolName, setCustomSchoolName] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    user?.photoStudentCardUrl || (user as any)?.PhotoStudentCardUrl || null
  );

  const [fptCode, setFptCode] = useState(studentCode || "");
  const [fptResult, setFptResult] = useState<FptStudentResponse | null>(null);
  const [fptError, setFptError] = useState("");

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

  const [isDragging, setIsDragging] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [requestUnblockSuccess, setRequestUnblockSuccess] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPasswordCard, setShowPasswordCard] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const updateProfileMutation = useUpdateStudentProfile();
  const verifyFptMutation = useFptStudentVerification();
  const requestUnblockMutation = useRequestUnblock();
  const changePasswordMutation = useChangePassword();

  const { data: schoolsData, isLoading: loadingSchools } = useGetSchools();
  const schools = schoolsData || [];

  const { data: rejectionsData } = useGetUserRejections(user?.id || user?.userId);
  const rejections: any[] = Array.isArray(rejectionsData) ? rejectionsData : ((rejectionsData as any)?.data || []);

  const rejectionCount = rejections.length;
  const isBlocked = rejectionCount >= 2 && !user?.isApproved;

  const currentSchoolId = user?.schoolId || (user as any)?.SchoolId || schoolId;
  const userSchool = schools.find((s) => s.id === currentSchoolId);
  const schoolNameDisplay =
    (schoolId === "OTHER_CUSTOM" && customSchoolName.trim())
      ? customSchoolName.trim()
      : userSchool?.schoolName ||
      (user as any)?.schoolName ||
      (user as any)?.SchoolName ||
      (user as any)?.school?.schoolName ||
      "Chưa cập nhật";

  const userStudentCode = user?.studentCode || (user as any)?.StudentCode || (user as any)?.StudentId || "";
  const hasMSSV = Boolean(userStudentCode && userStudentCode.trim() !== "");
  const hasSchool = Boolean((userSchool?.schoolName && userSchool.schoolName.trim() !== "") || (user?.schoolId && user.schoolId !== "OTHER_CUSTOM"));
  const hasStudentCardPhoto = Boolean(user?.photoStudentCardUrl || (user as any)?.PhotoStudentCardUrl || photoPreview);

  const isFptStudent = useMemo(() => {
    const emailLower = (user?.email || "").toLowerCase();
    const isFptEmail = emailLower.endsWith("@fpt.edu.vn") || emailLower.endsWith("@fe.edu.vn");
    const isFptSchool = userSchool?.schoolName?.toLowerCase().includes("fpt") || false;

    if (schoolChoice === "OTHER") return false;
    if (isFptEmail || isFptSchool) return true;
    if (user?.isFpt && hasMSSV && !userSchool) return true;
    return false;
  }, [schoolChoice, userSchool, user, hasMSSV]);

  const cardApprovalStatus = useMemo(() => {
    if (isBlocked) {
      return {
        label: "[ TÀI KHOẢN TẠM KHÓA ]",
        colorClass: "text-rose-400 font-bold",
        badge: "bg-rose-950/40 text-rose-300 border-rose-500/30",
        isApproved: false,
      };
    }

    if (!hasMSSV || (!hasSchool && !customSchoolName.trim())) {
      return {
        label: "[ CHƯA HOÀN TẤT HỒ SƠ ]",
        colorClass: "text-amber-400 font-bold animate-pulse",
        badge: "bg-amber-950/40 text-amber-300 border-amber-500/30",
        isApproved: false,
      };
    }

    if (isFptStudent) {
      if (user?.isApproved) {
        return {
          label: "[ ĐÃ XÁC THỰC FPT ]",
          colorClass: "text-emerald-400 font-bold",
          badge: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
          isApproved: true,
        };
      }
      return {
        label: "[ CHỜ XÁC MINH MSSV ]",
        colorClass: "text-amber-400 font-bold",
        badge: "bg-amber-950/40 text-amber-300 border-amber-500/30",
        isApproved: false,
      };
    }

    if (!hasStudentCardPhoto) {
      return {
        label: "[ CHƯA NỘP ẢNH THẺ ]",
        colorClass: "text-amber-400 font-bold animate-pulse",
        badge: "bg-amber-950/40 text-amber-300 border-amber-500/30",
        isApproved: false,
      };
    }

    if (user?.isApproved) {
      return {
        label: "[ ĐÃ DUYỆT THẺ SV ]",
        colorClass: "text-emerald-400 font-bold",
        badge: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30",
        isApproved: true,
      };
    }

    return {
      label: "[ CHỜ PHÊ DUYỆT THẺ ]",
      colorClass: "text-amber-300 font-bold",
      badge: "bg-amber-950/40 text-amber-300 border-amber-500/30",
      isApproved: false,
    };
  }, [isBlocked, hasMSSV, hasSchool, customSchoolName, isFptStudent, hasStudentCardPhoto, user?.isApproved]);

  const { data: latestProfile } = useQuery({
    queryKey: ["profile-approval-poll", currentUserId],
    queryFn: async () => {
      const { data } = await apiClient.get<any>("/Users/profile");
      return data;
    },
    enabled: !!user && !user?.isApproved,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (latestProfile?.isApproved && !user?.isApproved) {
      updateUser({ isApproved: true });
      toast.success("Hồ sơ của bạn đã được Ban Tổ Chức phê duyệt!");
      router.push("/events");
    }
  }, [latestProfile?.isApproved, user?.isApproved, updateUser, toast, router]);

  const handleVerifyFpt = async () => {
    if (!fptCode.trim()) {
      setFptError("Vui lòng nhập Mã số sinh viên FPT");
      return;
    }
    setFptError("");
    try {
      const res = await verifyFptMutation.mutateAsync(fptCode.trim());
      const data = (res as any)?.data ?? res;
      if (data?.isValid || (data as any)?.IsValid || data?.fullName || (data as any)?.FullName) {
        setFptResult(data);
        const name = data.fullName || (data as any).FullName;
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
        if (selectedSchoolId === "OTHER_CUSTOM") {
          if (!customSchoolName.trim()) {
            setSubmitError("Vui lòng nhập tên trường đại học của bạn.");
            return;
          }
          const matched = schools.find((s) =>
            s.schoolName?.toLowerCase().includes(customSchoolName.trim().toLowerCase())
          );
          if (matched?.id) {
            selectedSchoolId = matched.id;
          } else {
            const fallback = schools.find(
              (s) =>
                s.schoolName?.toLowerCase().includes("khác") ||
                s.schoolName?.toLowerCase().includes("other")
            ) || schools[0];
            selectedSchoolId = fallback?.id || "";
          }
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
      if (selectedSchoolId === "OTHER_CUSTOM") {
        if (!customSchoolName.trim()) {
          setSubmitError("Vui lòng nhập tên đơn vị công tác / tổ chức của bạn.");
          return;
        }
        const matched = schools.find((s) =>
          s.schoolName?.toLowerCase().includes(customSchoolName.trim().toLowerCase())
        );
        if (matched?.id) {
          selectedSchoolId = matched.id;
        } else {
          const fallback = schools.find(
            (s) =>
              s.schoolName?.toLowerCase().includes("khác") ||
              s.schoolName?.toLowerCase().includes("other")
          ) || schools[0];
          selectedSchoolId = fallback?.id || "";
        }
      }
    }

    try {
      let finalPhotoUrl = user?.photoStudentCardUrl || (user as any)?.PhotoStudentCardUrl;

      if (!isStaff && photoFile) {
        setIsUploadingPhoto(true);
        const uploadRes = await uploadRepository.uploadFile(photoFile);
        finalPhotoUrl = uploadRes?.fileUrl || (uploadRes as any)?.FileUrl;
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
      updateUser({ mustChangePassword: false });
      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("currentUser") || "{}");
          localStorage.setItem("currentUser", JSON.stringify({ ...stored, mustChangePassword: false }));
        } catch {}
      }
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

  return {
    state: {
      user,
      activeRole,
      isEditing,
      currentUserId,
      userRoles,
      staffRoles,
      studentRoles,
      roleInfo,
      isStaff,
      schoolChoice,
      schoolId,
      studentCode,
      fullName,
      customSchoolName,
      photoFile,
      photoPreview,
      fptCode,
      fptResult,
      fptError,
      isDragging,
      submitError,
      submitSuccess,
      requestUnblockSuccess,
      isUploadingPhoto,
      showPasswordCard,
      oldPassword,
      newPassword,
      confirmPassword,
      passwordError,
      passwordSuccess,
      rejections,
      rejectionCount,
      isBlocked,
      schoolNameDisplay,
      hasMSSV,
      hasSchool,
      hasStudentCardPhoto,
      isFptStudent,
      cardApprovalStatus,
      isUpdatingProfile: updateProfileMutation.isPending,
      isVerifyingFpt: verifyFptMutation.isPending,
      isChangingPassword: changePasswordMutation.isPending,
    },
    data: {
      schools,
      eventsList,
      trackNameMap,
      eventNameMap,
      myTeam,
    },
    refs: {
      fileInputRef,
    },
    actions: {
      setIsEditing,
      setSchoolChoice,
      setSchoolId,
      setStudentCode,
      setFullName,
      setCustomSchoolName,
      setFptCode,
      setIsDragging,
      setShowPasswordCard,
      setOldPassword,
      setNewPassword,
      setConfirmPassword,
      handleVerifyFpt,
      handleFileChange,
      handleFormSubmit,
      handleChangePassword,
      setRequestUnblockSuccess,
      setPhotoFile,
      setPhotoPreview,
    },
  };
}
