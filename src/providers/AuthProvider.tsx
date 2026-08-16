"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { User, EventRole } from "@/models/entities";
import apiClient from "@/models/apiClient";

export interface PresetAccount {
  email: string;
  roleName: "Admin" | "Coordinator" | "Judge" | "TeamLeader" | "Mentor" | "TeamMember";
  fullName: string;
  defaultRedirect: string;
}

export const PRESET_ACCOUNTS: PresetAccount[] = [];

// Trang đích sau khi đăng nhập thật, theo vai trò backend trả về.
const REDIRECT_BY_ROLE: Record<string, string> = {
  EventCoordinator: "/coordinator/dashboard",
  Judge: "/judge/tracks",
  Mentor: "/mentor/tracks",
  TeamLeader: "/my-team",
  TeamMember: "/my-team",
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

export type DemoRoleType = "Admin" | "Coordinator" | "Judge" | "Mentor" | "TeamLeader" | "TeamMember";

interface AuthContextType {
  user: User | null;
  activeRole: EventRole | null;
  isInitialized: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<string>;
  loginWithGoogleCredential: (idToken: string) => Promise<string>;
  loginAsDemoRole: (role: DemoRoleType) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<EventRole | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Khôi phục phiên từ localStorage (F5 safe)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      const storedRole = localStorage.getItem("activeRole");
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedRole) setActiveRole(JSON.parse(storedRole));
    } catch (e) {
      console.error("Lỗi khôi phục phiên từ localStorage:", e);
    } finally {
      setIsInitialized(true);
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

  const loginAsDemoRole = (role: DemoRoleType) => {
    let mockUser: User;
    let mockRole: EventRole | null = null;

    if (role === "Admin") {
      mockUser = {
        id: "demo-admin-01",
        userId: "demo-admin-01",
        email: "admin.overwatch@seal.edu.vn",
        fullName: "System Admin (Demo)",
        isAdmin: true,
        isStudent: false,
        isApproved: true,
        isFpt: true,
        IsAdmin: true,
      };
    } else if (role === "Judge") {
      mockUser = {
        id: "demo-judge-01",
        userId: "demo-judge-01",
        email: "judge.lead@seal.edu.vn",
        fullName: "Hội Đồng Giám Khảo (Demo)",
        isAdmin: false,
        isStudent: false,
        isApproved: true,
        isFpt: true,
      };
      mockRole = {
        id: "role-judge-01",
        eventId: "demo-event-01",
        roleName: "Judge",
        trackId: "demo-track-01",
        assignedEventIds: ["demo-event-01"],
      };
    } else if (role === "Coordinator") {
      mockUser = {
        id: "demo-ec-01",
        userId: "demo-ec-01",
        email: "coordinator@seal.edu.vn",
        fullName: "Trưởng Ban Tổ Chức (Demo)",
        isAdmin: false,
        isStudent: false,
        isApproved: true,
        isFpt: true,
      };
      mockRole = {
        id: "role-ec-01",
        eventId: "demo-event-01",
        roleName: "EventCoordinator",
        assignedEventIds: ["demo-event-01"],
      };
    } else if (role === "Mentor") {
      mockUser = {
        id: "demo-mentor-01",
        userId: "demo-mentor-01",
        email: "mentor.tech@seal.edu.vn",
        fullName: "Cố Vấn Chuyên Môn (Demo)",
        isAdmin: false,
        isStudent: false,
        isApproved: true,
        isFpt: true,
      };
      mockRole = {
        id: "role-mentor-01",
        eventId: "demo-event-01",
        roleName: "Mentor",
        trackId: "demo-track-01",
        assignedEventIds: ["demo-event-01"],
      };
    } else {
      mockUser = {
        id: "demo-student-01",
        userId: "demo-student-01",
        email: "student.leader@fpt.edu.vn",
        fullName: "Thí Sinh Trưởng Đội (Demo)",
        isAdmin: false,
        isStudent: true,
        isApproved: true,
        isFpt: true,
        studentCode: "SE180001",
      };
      mockRole = {
        id: "role-lead-01",
        eventId: "demo-event-01",
        roleName: "TeamLeader",
        teamId: "demo-team-01",
        assignedEventIds: ["demo-event-01"],
      };
    }

    saveSession(mockUser, mockRole);
  };

  const loginWithCredentials = async (email: string, password: string): Promise<string> => {
    const res = await apiClient.post<any>("/Auth/login", { email: email.trim(), password });
    const d = res.data ?? {};
    const accessToken = d.accessToken ?? d.AccessToken;
    const refreshToken = d.refreshToken ?? d.RefreshToken;
    if (!accessToken) throw new Error("Phản hồi đăng nhập thiếu token.");

    const userId = d.userId ?? d.UserId;
    const isAdmin = Boolean(d.isAdmin ?? d.IsAdmin ?? d.user?.isAdmin);
    const isStudent = Boolean(d.isStudent ?? d.IsStudent ?? d.user?.isStudent);
    const fullName = d.fullName ?? d.FullName ?? d.user?.fullName ?? "";
    const isApproved = Boolean(d.isApproved ?? d.IsApproved ?? d.user?.isApproved ?? false);
    const authUser: User = {
      id: userId,
      userId,
      email: d.email ?? d.Email ?? email.trim(),
      fullName,
      isAdmin,
      isStudent,
      isApproved,
      isFpt: Boolean(d.isFpt ?? d.IsFpt ?? email.trim().toLowerCase().endsWith("@fpt.edu.vn")),
      UserID: userId,
      FullName: fullName,
      IsAdmin: isAdmin,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    }

    let primaryRole: EventRole | null = null;
    let targetPath = isAdmin ? "/admin/dashboard" : isStudent ? (isApproved ? "/events" : "/onboarding/profile") : "/events";

    try {
      const rolesRes = await apiClient.get<any>("/EventRoles/user", {
        params: { UserId: userId, PageSize: 200 },
      });
      const rows: unknown[] = rolesRes.data?.data ?? rolesRes.data ?? [];
      primaryRole = pickPrimaryRole(rows, userId);
      if (primaryRole) {
        targetPath = REDIRECT_BY_ROLE[primaryRole.roleName || ""] ?? "/events";
      }
    } catch {
      // fallback targetPath
    }

    saveSession(authUser, primaryRole);
    return targetPath;
  };

  const loginWithGoogleCredential = async (idToken: string): Promise<string> => {
    const res = await apiClient.post<any>("/Auth/google-login", { idToken: idToken.trim() });
    const d = res.data?.data ?? res.data ?? {};
    const accessToken = d.accessToken ?? d.AccessToken ?? d.token ?? d.Token;
    const refreshToken = d.refreshToken ?? d.RefreshToken;
    if (!accessToken) throw new Error("Phản hồi Google Login thiếu token xác thực.");

    const userId = d.userId ?? d.UserId ?? d.user?.id ?? d.user?.userId;
    const isAdmin = Boolean(d.isAdmin ?? d.IsAdmin ?? d.user?.isAdmin);
    const isStudent = Boolean(d.isStudent ?? d.IsStudent ?? d.user?.isStudent);
    const fullName = d.fullName ?? d.FullName ?? d.user?.fullName ?? "";
    const email = d.email ?? d.Email ?? d.user?.email ?? "";
    const isApproved = d.isApproved ?? d.IsApproved ?? d.user?.isApproved ?? false;

    const authUser: User = {
      id: userId,
      userId,
      email,
      fullName,
      isAdmin,
      isStudent,
      isApproved,
      isFpt: email.toLowerCase().endsWith("@fpt.edu.vn"),
      UserID: userId,
      FullName: fullName,
      IsAdmin: isAdmin,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    }

    let primaryRole: EventRole | null = null;
    let targetPath = isAdmin ? "/admin/dashboard" : isStudent ? (isApproved ? "/events" : "/onboarding/profile") : "/events";

    try {
      const rolesRes = await apiClient.get<any>("/EventRoles/user", {
        params: { UserId: userId, PageSize: 200 },
      });
      const rows: unknown[] = rolesRes.data?.data ?? rolesRes.data ?? [];
      primaryRole = pickPrimaryRole(rows, userId);
      if (primaryRole) {
        targetPath = REDIRECT_BY_ROLE[primaryRole.roleName || ""] ?? "/events";
      }
    } catch {
      // fallback targetPath
    }

    saveSession(authUser, primaryRole);
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
          loginAsDemoRole,
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
