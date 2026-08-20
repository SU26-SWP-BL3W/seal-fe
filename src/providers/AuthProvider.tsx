"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { User, EventRole } from "@/models/entities";
import apiClient from "@/models/apiClient";
import {
  normalizeEventRoleRows,
  pickPrimaryRoleFromRows,
  resolveStaffLandingPath,
  type NormalizedEventRole,
} from "@/lib/eventRoles";

interface AuthContextType {
  user: User | null;
  activeRole: EventRole | null;
  allEventRoles: NormalizedEventRole[];
  isInitialized: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<string>;
  loginWithGoogleCredential: (idToken: string) => Promise<string>;
  logout: () => void;
  refreshRoles: () => Promise<EventRole | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<EventRole | null>(null);
  const [allEventRoles, setAllEventRoles] = useState<NormalizedEventRole[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const fetchUserRoles = async (userId: string): Promise<{
    primaryRole: EventRole | null;
    allRoles: NormalizedEventRole[];
  }> => {
    if (!userId) return { primaryRole: null, allRoles: [] };
    try {
      const rolesRes = await apiClient.get<any>("/EventRoles/user", {
        params: { UserId: userId, userId, PageSize: 200, pageSize: 200 },
      });
      const rows: unknown[] =
        rolesRes.data?.data?.items ??
        rolesRes.data?.items ??
        rolesRes.data?.data ??
        rolesRes.data ??
        [];
      const allRoles = normalizeEventRoleRows(rows);
      return {
        primaryRole: pickPrimaryRoleFromRows(rows, userId),
        allRoles,
      };
    } catch {
      return { primaryRole: null, allRoles: [] };
    }
  };

  const applyRoleState = (primaryRole: EventRole | null, roles: NormalizedEventRole[]) => {
    setActiveRole(primaryRole);
    setAllEventRoles(roles);
    if (typeof window !== "undefined") {
      if (primaryRole) {
        localStorage.setItem("activeRole", JSON.stringify(primaryRole));
      } else {
        localStorage.removeItem("activeRole");
      }
      localStorage.setItem("allEventRoles", JSON.stringify(roles));
    }
  };

  const refreshRoles = async (): Promise<EventRole | null> => {
    const currentUserId = user?.id || user?.userId || user?.UserID || (user as any)?.Id;
    if (!currentUserId) return null;
    const { primaryRole, allRoles } = await fetchUserRoles(currentUserId);
    applyRoleState(primaryRole, allRoles);
    return primaryRole;
  };

  // Khôi phục phiên từ localStorage (F5 safe) & đồng bộ profile + eventRoles mới nhất từ BE
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      const storedRole = localStorage.getItem("activeRole");
      const storedAllRoles = localStorage.getItem("allEventRoles");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        if (storedRole) setActiveRole(JSON.parse(storedRole));
        if (storedAllRoles) setAllEventRoles(JSON.parse(storedAllRoles));
      } else {
        setUser(null);
        setActiveRole(null);
        setAllEventRoles([]);
        if (typeof window !== "undefined") {
          localStorage.removeItem("activeRole");
          localStorage.removeItem("allEventRoles");
        }
      }
    } catch (e) {
      console.error("Lỗi khôi phục phiên từ localStorage:", e);
    } finally {
      setIsInitialized(true);
    }

    // Tự động kiểm tra và làm mới trạng thái isApproved & EventRoles từ server nếu có token
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      apiClient.get<User>("/Users/profile")
        .then(async (res) => {
          if (res.data) {
            const raw = res.data as any;
            const uid = raw.id || raw.Id || raw.userId || raw.UserId;
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

            if (uid) {
              const { primaryRole, allRoles } = await fetchUserRoles(uid);
              applyRoleState(primaryRole, allRoles);
            }
          }
        })
        .catch(() => {
          // Bỏ qua lỗi nếu offline hoặc mạng chậm
        });
    }
  }, []);

  const saveSession = (newUser: User, newRole: EventRole | null, roles: NormalizedEventRole[] = []) => {
    setUser(newUser);
    applyRoleState(newRole, roles);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(newUser));
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
    let allRoles: NormalizedEventRole[] = [];
    try {
      const rolesRes = await apiClient.get<any>("/EventRoles/user", {
        params: { UserId: userId, userId, PageSize: 200, pageSize: 200 },
      });
      const rows: unknown[] = rolesRes.data?.data?.items ?? rolesRes.data?.items ?? rolesRes.data?.data ?? rolesRes.data ?? [];
      allRoles = normalizeEventRoleRows(rows);
      primaryRole = pickPrimaryRoleFromRows(rows, userId);
    } catch {
      // fallback
    }

    const lowerEmail = (d.email ?? d.Email ?? email.trim()).toLowerCase();
    let detectedRole = primaryRole?.roleName;
    if (!detectedRole) {
      if (lowerEmail.includes("ec_") || lowerEmail.includes("ec.") || lowerEmail.includes("coordinator")) {
        detectedRole = "EventCoordinator";
      } else if (lowerEmail.includes("judge")) {
        detectedRole = "Judge";
      } else if (lowerEmail.includes("mentor")) {
        detectedRole = "Mentor";
      }
    }

    let targetPath = "/";
    if (isAdmin) {
      targetPath = "/admin/dashboard";
    } else if (allRoles.length > 0) {
      targetPath = resolveStaffLandingPath(allRoles) || "/";
    } else if (detectedRole === "EventCoordinator" || detectedRole === "Coordinator") {
      targetPath = primaryRole?.eventId ? `/coordinator/dashboard?eventId=${primaryRole.eventId}` : "/coordinator/dashboard";
    } else if (detectedRole === "Judge") {
      targetPath = primaryRole?.eventId ? `/judge/events?eventId=${primaryRole.eventId}` : "/judge/events";
    } else if (detectedRole === "Mentor") {
      targetPath = primaryRole?.eventId ? `/events/${primaryRole.eventId}` : "/events";
    } else if (detectedRole === "TeamLeader" || detectedRole === "TeamMember") {
      targetPath = primaryRole?.eventId ? `/my-team?eventId=${primaryRole.eventId}` : "/my-team";
    } else if (isStudent) {
      targetPath = isApproved ? "/" : "/onboarding/profile";
    }

    if (mustChangePassword) {
      targetPath = "/change-password";
    }

    saveSession(authUser, isAdmin ? null : primaryRole, allRoles);
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
    let allRoles: NormalizedEventRole[] = [];
    try {
      const rolesRes = await apiClient.get<any>("/EventRoles/user", {
        params: { UserId: userId, userId, PageSize: 200, pageSize: 200 },
      });
      const rows: unknown[] =
        rolesRes.data?.data?.items ??
        rolesRes.data?.items ??
        rolesRes.data?.data ??
        rolesRes.data ??
        [];
      allRoles = normalizeEventRoleRows(rows);
      primaryRole = pickPrimaryRoleFromRows(rows, userId);
    } catch {
      // fallback
    }

    const lowerEmail = email.toLowerCase();
    let detectedRole = primaryRole?.roleName;
    if (!detectedRole) {
      if (lowerEmail.includes("ec_") || lowerEmail.includes("ec.") || lowerEmail.includes("coordinator")) {
        detectedRole = "EventCoordinator";
      } else if (lowerEmail.includes("judge")) {
        detectedRole = "Judge";
      } else if (lowerEmail.includes("mentor")) {
        detectedRole = "Mentor";
      }
    }

    let targetPath = "/";
    if (isAdmin) {
      targetPath = "/admin/dashboard";
    } else if (allRoles.length > 0) {
      targetPath = resolveStaffLandingPath(allRoles) || "/";
    } else if (detectedRole === "EventCoordinator" || detectedRole === "Coordinator") {
      targetPath = primaryRole?.eventId ? `/coordinator/dashboard?eventId=${primaryRole.eventId}` : "/coordinator/dashboard";
    } else if (detectedRole === "Judge") {
      targetPath = primaryRole?.eventId ? `/judge/events?eventId=${primaryRole.eventId}` : "/judge/events";
    } else if (detectedRole === "Mentor") {
      targetPath = primaryRole?.eventId ? `/events/${primaryRole.eventId}` : "/events";
    } else if (detectedRole === "TeamLeader" || detectedRole === "TeamMember") {
      targetPath = primaryRole?.eventId ? `/my-team?eventId=${primaryRole.eventId}` : "/my-team";
    } else if (isStudent) {
      targetPath = isApproved ? "/" : "/onboarding/profile";
    }

    if (mustChangePassword) {
      targetPath = "/change-password";
    }

    saveSession(authUser, isAdmin ? null : primaryRole, allRoles);
    return targetPath;
  };

  const logout = () => {
    setUser(null);
    setActiveRole(null);
    setAllEventRoles([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("activeRole");
      localStorage.removeItem("allEventRoles");
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
          allEventRoles,
          isInitialized,
          loginWithCredentials,
          loginWithGoogleCredential,
          logout,
          refreshRoles,
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
