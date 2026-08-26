import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { User, AuthSession } from "@/models/entities";

// ─── Session persistence ──────────────────────────────────────────────────────
// Dùng chung cho login/google-login/logout — 1 nơi duy nhất ghi/xoá localStorage.

function persistSession(session: AuthSession, profile: User) {
  localStorage.setItem("accessToken", session.accessToken);
  localStorage.setItem("refreshToken", session.refreshToken);
  localStorage.setItem("currentUser", JSON.stringify(profile));
}

function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("currentUser");
}

// ─── Register ─────────────────────────────────────────────────────────────────
// POST /Auth/register — body: {email, password, fullName} → User (chưa có token,
// phải verify email + đăng nhập riêng sau đó).

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const { data } = await apiClient.post<User>("/Auth/register", payload);
      return data;
    },
  });
}

// ─── Login (email/password) ───────────────────────────────────────────────────
// POST /Auth/login → AuthSession (token + field tối thiểu), sau đó gọi thêm
// GET /Users/profile để lấy User đầy đủ — trả thẳng User cho component dùng.

export interface LoginPayload {
  email: string;
  password: string;
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const { data: session } = await apiClient.post<AuthSession>("/Auth/login", payload);
      // Ghi accessToken trước để interceptor gắn Authorization cho request profile bên dưới.
      localStorage.setItem("accessToken", session.accessToken);
      const { data: profile } = await apiClient.get<User>("/Users/profile");
      persistSession(session, profile);
      return profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["currentUser"], profile);
    },
  });
}

// ─── Google Login ──────────────────────────────────────────────────────────────
// POST /Auth/google-login — body: {idToken} (từ Google Identity Services ở FE).

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (idToken: string) => {
      const { data: session } = await apiClient.post<AuthSession>("/Auth/google-login", {
        idToken,
      });
      localStorage.setItem("accessToken", session.accessToken);
      const { data: profile } = await apiClient.get<User>("/Users/profile");
      persistSession(session, profile);
      return profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["currentUser"], profile);
    },
  });
}

// ─── Logout ────────────────────────────────────────────────────────────────────
// POST /Auth/logout — [Authorize], không có body. Đây là logout NGƯỜI DÙNG chủ động
// bấm nút; khác forceLogout() trong apiClient.ts (bị động, kích hoạt khi refresh-token
// thất bại) — cả 2 dùng chung 1 bộ key localStorage nhưng khác trigger, không trùng lặp.

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post<boolean>("/Auth/logout");
    },
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
  });
}

// Chú ý: KHÔNG export hook refresh-token thủ công ở đây. apiClient.ts đã tự làm mới
// token khi gặp 401 (single-flight, tự retry) — thêm 1 đường refresh thứ 2 ở đây dễ
// đua nhau (race) với cơ chế đó.

// ─── Verify email ──────────────────────────────────────────────────────────────
// GET /Auth/verify-email?token=xxx — query param, không phải body.

export function useVerifyEmail(token: string | null) {
  return useQuery({
    queryKey: ["verifyEmail", token],
    queryFn: async () => {
      const { data } = await apiClient.get<boolean>("/Auth/verify-email", {
        params: { token },
      });
      return data;
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await apiClient.post<boolean>("/Auth/resend-verification", { email });
      return data;
    },
  });
}

// ─── Password management ───────────────────────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await apiClient.post<{ message: string }>("/Auth/forgot-password", {
        email,
      });
      return data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (payload: { token: string; newPassword: string }) => {
      const { data } = await apiClient.post<boolean>("/Auth/reset-password", payload);
      return data;
    },
  });
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

/** PUT /Auth/change-password — [Authorize]. */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const { data } = await apiClient.put<boolean>("/Auth/change-password", payload);
      return data;
    },
  });
}

// ─── Two-strike unblock request ────────────────────────────────────────────────
// POST /Auth/request-unblock — tài khoản bị khoá sau 2 lần từ chối hồ sơ, xin admin gỡ.

export function useRequestUnblock() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data } = await apiClient.post<{ message: string }>("/Auth/request-unblock", {
        email,
      });
      return data;
    },
  });
}

// ─── Student profile ────────────────────────────────────────────────────────────
// POST tạo lần đầu / PUT cập nhật — cùng shape body, cùng response User đầy đủ.
// KHÔNG có userId trong body — BE tự lấy từ JWT ([Authorize]).

export interface StudentProfilePayload {
  schoolId?: string;
  studentCode?: string;
  photoStudentCardUrl?: string;
  isFpt: boolean;
  fullName?: string;
}

export function useSubmitStudentProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: StudentProfilePayload) => {
      const res = await apiClient.post<any>("/Auth/student-profiles", payload);
      const data = res.data?.data ?? res.data;
      return data;
    },
    onSuccess: (profile) => {
      if (profile) {
        localStorage.setItem("currentUser", JSON.stringify(profile));
        queryClient.setQueryData(["currentUser"], profile);
      }
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
    },
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: StudentProfilePayload) => {
      const res = await apiClient.put<any>("/Auth/student-profiles", payload);
      const data = res.data?.data ?? res.data;
      return data;
    },
    onSuccess: (profile) => {
      if (profile) {
        localStorage.setItem("currentUser", JSON.stringify(profile));
        queryClient.setQueryData(["currentUser"], profile);
      }
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["my-team"] });
      queryClient.invalidateQueries({ queryKey: ["myTeam"] });
    },
  });
}

/** GET /api/fpt-students/{studentCode} — tra cứu bảng FptStudents thật trong DB, cần đăng nhập. */
export function useFptStudentVerification() {
  return useMutation({
    mutationFn: async (studentCode: string) => {
      const res = await apiClient.get<any>(`/fpt-students/${studentCode}`);
      return res.data?.data ?? res.data;
    },
  });
}

