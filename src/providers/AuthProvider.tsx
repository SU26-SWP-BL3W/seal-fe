"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useGoogleLogin, useLogin, useLogout } from "@/repositories/auth/authRepository";
import type { User } from "@/models/entities";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (idToken: string) => Promise<User>;
  logout: () => Promise<void>;
  /** Cập nhật user tại chỗ (vd sau khi nộp/sửa hồ sơ SV) — không gọi lại login. */
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const logoutMutation = useLogout();

  // Bootstrap phiên từ localStorage khi tải lại trang — tránh nháy "chưa đăng nhập"
  // trước khi kịp gọi lại API. apiClient tự làm mới token khi 401 (single-flight),
  // nên chỉ cần đọc user cache ở đây, không cần verify token ngay lúc mount.
  useEffect(() => {
    const raw = localStorage.getItem("currentUser");
    if (raw) {
      try {
        // Cố ý setState trong effect: bootstrap phiên từ localStorage sau khi
        // mount để khớp SSR (server không có localStorage) — tránh hydration
        // mismatch nếu đọc ngay lúc render đầu.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(raw) as User);
      } catch {
        localStorage.removeItem("currentUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const profile = await loginMutation.mutateAsync({ email, password });
      setUser(profile);
      return profile;
    },
    [loginMutation],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const profile = await googleLoginMutation.mutateAsync(idToken);
      setUser(profile);
      return profile;
    },
    [googleLoginMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    setUser(null);
  }, [logoutMutation]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, loginWithGoogle, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() phải gọi bên trong <AuthProvider>.");
  return ctx;
}
