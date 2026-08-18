"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { User, EventRole } from "@/models/entities";
import apiClient from "@/models/apiClient";

// Trang đích sau khi đăng nhập thật, theo vai trò backend trả về.
// Chỉ trỏ route THẬT SỰ tồn tại (có page.tsx) — EventCoordinator/Mentor/Team* trước
// đây trỏ vào route rỗng (404 khi đăng nhập thật, xác nhận sống với tài khoản
// ec_demo@yopmail.com). Chưa có trang Coordinator/Mentor/Team riêng nên về /events.
const REDIRECT_BY_ROLE: Record<string, string> = {
  Judge: "/judge/tracks",
};

const ROLE_RANK = ["EventCoordinator", "Judge", "Mentor", "TeamLeader", "TeamMember"];

function pickPrimaryRole(rows: unknown[], userId: string): EventRole | null {
  const norm = (Array.isArray(rows) ? rows : []).map((raw) => {
    const r = raw as Record<string, unknown>;
    const str = (...keys: string[]) => {
      for (const k of keys) {
        const v = r[k];
        if (typeof v === "string" && v.trim()) return v;
      }
      return "";
    };
    return {
      id: str("id", "Id"),
      eventId: str("eventId", "EventId"),
      roleName: str("roleName", "RoleName"),
      trackId: str("trackId", "TrackId"),
      teamId: str("teamId", "TeamId"),
    };
  });
  const chosen = ROLE_RANK.map((rn) => norm.find((r) => r.roleName === rn)).find(Boolean);
  if (!chosen) return null;
  const assigned = norm.filter((r) => r.roleName === chosen.roleName).map((r) => r.eventId).filter(Boolean);
  return {
    id: chosen.id,
    eventRoleId: chosen.id,
    EventRoleId: chosen.id,
    userId,
    UserId: userId,
    eventId: chosen.eventId,
    EventId: chosen.eventId,
    roleName: chosen.roleName,
    RoleName: chosen.roleName,
    trackId: chosen.trackId,
    TrackId: chosen.trackId,
    teamId: chosen.teamId,
    TeamId: chosen.teamId,
    assignedEventIds: assigned,
    AssignedEventIds: assigned,
  };
}

interface AuthContextType {
  user: User | null;
  activeRole: EventRole | null;
  isInitialized: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<string>;
  loginWithGoogleCredential: (idToken: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<EventRole | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Khôi phục phiên từ localStorage (F5 safe) & đồng bộ profile mới nhất từ BE
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      const storedRole = localStorage.getItem("activeRole");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        if (storedRole) setActiveRole(JSON.parse(storedRole));
      } else {
        setUser(null);
        setActiveRole(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("activeRole");
        }
      }
    } catch (e) {
      console.error("Lỗi khôi phục phiên từ localStorage:", e);
    } finally {
      setIsInitialized(true);
    }

    // Tự động kiểm tra và làm mới trạng thái isApproved từ server nếu có token
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      apiClient.get<User>("/Users/profile")
        .then((res) => {
          if (res.data) {
            setUser((prev) => {
              const updated = {
                ...(prev || {}),
                ...res.data,
                isApproved: res.data.isApproved ?? prev?.isApproved ?? false,
                isStudent: res.data.isStudent ?? prev?.isStudent ?? true,
                isAdmin: res.data.isAdmin ?? prev?.isAdmin ?? false,
              };
              if (typeof window !== "undefined") {
                localStorage.setItem("currentUser", JSON.stringify(updated));
              }
              return updated;
            });
          }
        })
        .catch(() => {
          // Bỏ qua lỗi nếu offline hoặc mạng chậm
        });
    }
  }, []);

  const saveSession = (newUser: User, newRole: EventRole | null) => {
    setUser(newUser);
    setActiveRole(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(newUser));
      if (newRole) {
        localStorage.setItem("activeRole", JSON.stringify(newRole));
      } else {
        localStorage.removeItem("activeRole");
      }
    }
  };

  const loginWithCredentials = async (email: string, password: string): Promise<string> => {
    const res = await apiClient.post<any>("/Auth/login", { email: email.trim(), password });
    const d = res.data ?? {};
    const accessToken = d.accessToken ?? d.AccessToken;
    const refreshToken = d.refreshToken ?? d.RefreshToken;
    if (!accessToken) throw new Error("Phản hồi đăng nhập thiếu token.");

    const userId = d.userId ?? d.UserId;
    let isAdmin = Boolean(d.isAdmin ?? d.IsAdmin ?? d.user?.isAdmin);
    let isStudent = Boolean(d.isStudent ?? d.IsStudent ?? d.user?.isStudent);
    let fullName = d.fullName ?? d.FullName ?? d.user?.fullName ?? "";
    let isApproved = Boolean(d.isApproved ?? d.IsApproved ?? d.user?.isApproved ?? false);
    let studentCode = d.studentCode ?? d.StudentCode ?? d.user?.studentCode ?? null;
    let schoolId = d.schoolId ?? d.SchoolId ?? d.user?.schoolId ?? null;
    let photoStudentCardUrl = d.photoStudentCardUrl ?? d.PhotoStudentCardUrl ?? d.user?.photoStudentCardUrl ?? null;
    let mustChangePassword = Boolean(d.mustChangePassword ?? d.MustChangePassword);

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    }

    // Truy vấn thông tin profile đầy đủ nhất từ BE để xét duyệt chính xác
    try {
      const profileRes = await apiClient.get<User>("/Users/profile");
      if (profileRes.data) {
        const p = profileRes.data;
        if (p.isAdmin !== undefined) isAdmin = Boolean(p.isAdmin);
        if (p.isStudent !== undefined) isStudent = Boolean(p.isStudent);
        if (p.isApproved !== undefined) isApproved = Boolean(p.isApproved);
        if (p.fullName) fullName = p.fullName;
        if (p.studentCode) studentCode = p.studentCode;
        if (p.schoolId) schoolId = p.schoolId;
        if (p.photoStudentCardUrl) photoStudentCardUrl = p.photoStudentCardUrl;
        if (p.mustChangePassword !== undefined) mustChangePassword = Boolean(p.mustChangePassword);
      }
    } catch {
      // Dùng thông tin từ response login nếu profile endpoint lỗi
    }

    const authUser: User = {
      id: userId,
      userId,
      email: d.email ?? d.Email ?? email.trim(),
      fullName,
      isAdmin,
      isStudent,
      isApproved,
      studentCode,
      schoolId,
      photoStudentCardUrl,
      mustChangePassword,
      isFpt: Boolean(d.isFpt ?? d.IsFpt ?? email.trim().toLowerCase().endsWith("@fpt.edu.vn")),
      UserID: userId,
      FullName: fullName,
      IsAdmin: isAdmin,
      IsApproved: isApproved,
    };

    let primaryRole: EventRole | null = null;
    // QUY TẮC ĐIỀU HƯỚNG SAU KHI ĐĂNG NHẬP:
    // - Admin -> /admin/dashboard
    // - Sinh viên/User:
    //    + ĐÃ ĐƯỢC XÁC THỰC (isApproved === true) -> /events (chọn sự kiện)
    //    + CHƯA ĐƯỢC XÁC THỰC (isApproved === false) -> /onboarding/profile (cập nhật hồ sơ)
    let targetPath = isAdmin
      ? "/admin/dashboard"
      : isApproved
        ? "/events"
        : "/onboarding/profile";

    try {
      const rolesRes = await apiClient.get<any>("/EventRoles/user", {
        params: { UserId: userId, PageSize: 200 },
      });
      const rows: unknown[] = rolesRes.data?.data ?? rolesRes.data ?? [];
      primaryRole = pickPrimaryRole(rows, userId);
      if (!isAdmin && primaryRole && REDIRECT_BY_ROLE[primaryRole.roleName || ""]) {
        targetPath = REDIRECT_BY_ROLE[primaryRole.roleName || ""];
      }
    } catch {
      // fallback targetPath
    }

    // Tài khoản tạm vừa nhận mật khẩu tạm — bắt đổi mật khẩu trước khi vào bất cứ đâu khác.
    if (mustChangePassword) {
      targetPath = "/change-password";
    }

    saveSession(authUser, isAdmin ? null : primaryRole);
    return targetPath;
  };

  const loginWithGoogleCredential = async (idToken: string): Promise<string> => {
    const res = await apiClient.post<any>("/Auth/google-login", { idToken: idToken.trim() });
    const d = res.data?.data ?? res.data ?? {};
    const accessToken = d.accessToken ?? d.AccessToken ?? d.token ?? d.Token;
    const refreshToken = d.refreshToken ?? d.RefreshToken;
    if (!accessToken) throw new Error("Phản hồi Google Login thiếu token xác thực.");

    const userId = d.userId ?? d.UserId ?? d.user?.id ?? d.user?.userId;
    let isAdmin = Boolean(d.isAdmin ?? d.IsAdmin ?? d.user?.isAdmin);
    let isStudent = Boolean(d.isStudent ?? d.IsStudent ?? d.user?.isStudent ?? true);
    let fullName = d.fullName ?? d.FullName ?? d.user?.fullName ?? "";
    const email = d.email ?? d.Email ?? d.user?.email ?? "";
    let isApproved = Boolean(d.isApproved ?? d.IsApproved ?? d.user?.isApproved ?? false);
    let studentCode = d.studentCode ?? d.StudentCode ?? d.user?.studentCode ?? null;
    let schoolId = d.schoolId ?? d.SchoolId ?? d.user?.schoolId ?? null;
    let photoStudentCardUrl = d.photoStudentCardUrl ?? d.PhotoStudentCardUrl ?? d.user?.photoStudentCardUrl ?? null;
    let mustChangePassword = Boolean(d.mustChangePassword ?? d.MustChangePassword);

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    }

    // Truy vấn thông tin profile đầy đủ nhất từ BE để xét duyệt chính xác
    try {
      const profileRes = await apiClient.get<User>("/Users/profile");
      if (profileRes.data) {
        const p = profileRes.data;
        if (p.isAdmin !== undefined) isAdmin = Boolean(p.isAdmin);
        if (p.isStudent !== undefined) isStudent = Boolean(p.isStudent);
        if (p.isApproved !== undefined) isApproved = Boolean(p.isApproved);
        if (p.fullName) fullName = p.fullName;
        if (p.studentCode) studentCode = p.studentCode;
        if (p.schoolId) schoolId = p.schoolId;
        if (p.photoStudentCardUrl) photoStudentCardUrl = p.photoStudentCardUrl;
        if (p.mustChangePassword !== undefined) mustChangePassword = Boolean(p.mustChangePassword);
      }
    } catch {
      // Dùng thông tin từ response login nếu profile endpoint lỗi
    }

    const authUser: User = {
      id: userId,
      userId,
      email,
      fullName,
      isAdmin,
      isStudent,
      isApproved,
      studentCode,
      schoolId,
      photoStudentCardUrl,
      mustChangePassword,
      isFpt: email.toLowerCase().endsWith("@fpt.edu.vn"),
      UserID: userId,
      FullName: fullName,
      IsAdmin: isAdmin,
      IsApproved: isApproved,
    };

    let primaryRole: EventRole | null = null;
    // QUY TẮC ĐIỀU HƯỚNG SAU KHI ĐĂNG NHẬP GOOGLE:
    // - Admin -> /admin/dashboard
    // - Sinh viên/User:
    //    + ĐÃ ĐƯỢC XÁC THỰC (isApproved === true) -> /events (chọn sự kiện)
    //    + CHƯA ĐƯỢC XÁC THỰC (isApproved === false) -> /onboarding/profile (cập nhật hồ sơ)
    let targetPath = isAdmin
      ? "/admin/dashboard"
      : isApproved
        ? "/events"
        : "/onboarding/profile";

    try {
      const rolesRes = await apiClient.get<any>("/EventRoles/user", {
        params: { UserId: userId, PageSize: 200 },
      });
      const rows: unknown[] = rolesRes.data?.data ?? rolesRes.data ?? [];
      primaryRole = pickPrimaryRole(rows, userId);
      if (!isAdmin && primaryRole && REDIRECT_BY_ROLE[primaryRole.roleName || ""]) {
        targetPath = REDIRECT_BY_ROLE[primaryRole.roleName || ""];
      }
    } catch {
      // fallback targetPath
    }

    // Tài khoản tạm vừa nhận mật khẩu tạm — bắt đổi mật khẩu trước khi vào bất cứ đâu khác.
    if (mustChangePassword) {
      targetPath = "/change-password";
    }

    saveSession(authUser, isAdmin ? null : primaryRole);
    return targetPath;
  };

  const logout = () => {
    setUser(null);
    setActiveRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("activeRole");
      localStorage.removeItem("accessToken");
      window.location.href = "/";
    }
  };

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "805216331270-kmjdrat53j8oa0c7sg6cqbag12a8q9iv.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthContext.Provider
        value={{
          user,
          activeRole,
          isInitialized,
          loginWithCredentials,
          loginWithGoogleCredential,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
