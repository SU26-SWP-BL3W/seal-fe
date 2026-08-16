import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { User, UserRejection, BaseResponse, PagedResult } from "@/models/entities";

export const DEFAULT_USERS_LIST: User[] = [
  {
    id: "usr-admin-01",
    email: "admin.system@seal.edu.vn",
    fullName: "Quản Trị Viên (System Admin)",
    isAdmin: true,
    isApproved: true,
    isFpt: true,
    isStudent: false,
    schoolName: "Đại học FPT HCM",
    createdTime: "2026-01-01T00:00:00Z",
  },
  {
    id: "usr-ec-01",
    email: "ec.coordinator@seal.edu.vn",
    fullName: "Điều Phối Viên (Event Coordinator)",
    isAdmin: false,
    isApproved: true,
    isFpt: true,
    isStudent: false,
    schoolName: "Đại học FPT HCM",
    createdTime: "2026-01-05T00:00:00Z",
  },
  {
    id: "usr-judge-01",
    email: "judge.ai@seal.edu.vn",
    fullName: "TS. Giám Khảo AI",
    isAdmin: false,
    isApproved: true,
    isFpt: false,
    isStudent: false,
    schoolName: "Đại học Bách Khoa HCM (HCMUT)",
    trackId: "trk-ai",
    trackName: "AI & Machine Learning",
    trackRole: "Judge",
    createdTime: "2026-02-10T00:00:00Z",
  },
  {
    id: "usr-mentor-01",
    email: "mentor.cybershield@seal.edu.vn",
    fullName: "ThS. Cố Vấn Chuyên Môn AI",
    isAdmin: false,
    isApproved: true,
    isFpt: true,
    isStudent: false,
    schoolName: "Đại học FPT Hà Nội",
    trackId: "trk-ai",
    trackName: "AI & Machine Learning",
    trackRole: "Mentor",
    createdTime: "2026-02-12T00:00:00Z",
  },
  {
    id: "usr-leader-01",
    email: "leader.cybershield@fpt.edu.vn",
    fullName: "Trần Minh Quân (Leader CyberShield)",
    studentCode: "SE170123",
    isAdmin: false,
    isApproved: true,
    isFpt: true,
    isStudent: true,
    schoolName: "Đại học FPT HCM",
    trackId: "trk-ai",
    trackName: "AI & Machine Learning",
    trackRole: "Leader",
    teamName: "CyberShield AI",
    teamId: "team-01",
    createdTime: "2026-03-01T00:00:00Z",
  },
  {
    id: "usr-member-02",
    email: "member.cybershield@fpt.edu.vn",
    fullName: "Nguyễn Hoàng Nam (Member CyberShield)",
    studentCode: "SE170456",
    isAdmin: false,
    isApproved: true,
    isFpt: true,
    isStudent: true,
    schoolName: "Đại học FPT HCM",
    trackId: "trk-ai",
    trackName: "AI & Machine Learning",
    trackRole: "Member",
    teamName: "CyberShield AI",
    teamId: "team-01",
    createdTime: "2026-03-02T00:00:00Z",
  },
  {
    id: "usr-invited-03",
    email: "student.invited@fpt.edu.vn",
    fullName: "Lê Quốc Bảo (SV FPT)",
    studentCode: "SE170888",
    isAdmin: false,
    isApproved: true,
    isFpt: true,
    isStudent: true,
    schoolName: "Đại học FPT HCM",
    trackId: "trk-web",
    trackName: "Web & Mobile Product",
    trackRole: "Member",
    teamName: "Web Masters",
    teamId: "team-02",
    createdTime: "2026-03-05T00:00:00Z",
  },
  {
    id: "usr-nonfpt-01",
    email: "an.tran@hcmus.edu.vn",
    fullName: "Trần Văn An (Non-FPT HCMUS)",
    studentCode: "21120001",
    isAdmin: false,
    isApproved: false,
    isFpt: false,
    isStudent: true,
    photoStudentCardUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80",
    schoolName: "Đại học Khoa học Tự nhiên (HCMUS)",
    trackId: "trk-web",
    trackName: "Web & Mobile Product",
    trackRole: "Leader",
    teamName: "HCMUS CodeBreakers",
    rejectionCount: 0,
    createdTime: "2026-04-10T00:00:00Z",
  },
  {
    id: "usr-fpt-02",
    email: "hoa.dang@fpt.edu.vn",
    fullName: "Đặng Thị Hoa (FPT HCM - Lỗi MSSV)",
    studentCode: "SE180999",
    isAdmin: false,
    isApproved: false,
    isFpt: true,
    isStudent: true,
    photoStudentCardUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    schoolName: "Đại học FPT TP.HCM",
    trackId: "trk-game",
    trackName: "Game Development",
    trackRole: "Member",
    teamName: "FPT GameCrafters",
    rejectionCount: 0,
    createdTime: "2026-04-11T00:00:00Z",
  },
  {
    id: "usr-resubmit-03",
    email: "long.le@hcmut.edu.vn",
    fullName: "Lê Hoàng Long (SV Bách Khoa HCMUT - Nộp lại)",
    studentCode: "2210888",
    isAdmin: false,
    isApproved: false,
    isFpt: false,
    isStudent: true,
    photoStudentCardUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    schoolName: "Đại học Bách Khoa (HCMUT)",
    trackId: "trk-web",
    trackName: "Web & Mobile Product",
    trackRole: "Member",
    teamName: "BK Titans",
    rejectionCount: 1,
    rejectionReason: "Ảnh chụp thẻ SV lần 1 bị lóa đèn, không nhìn rõ mã số sinh viên.",
    createdTime: "2026-04-12T00:00:00Z",
  },
  {
    id: "usr-locked-99",
    email: "student.locked@vlu.edu.vn",
    fullName: "Nguyễn Văn Khóa (SV VLU Locked 2 Gậy)",
    studentCode: "217VLU999",
    isAdmin: false,
    isApproved: false,
    isFpt: false,
    isStudent: true,
    photoStudentCardUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
    schoolName: "Đại học Văn Lang (VLU)",
    trackId: "trk-sec",
    trackName: "Cybersecurity & Cloud",
    trackRole: "Member",
    teamName: "VLU CyberDef",
    rejectionCount: 2,
    rejectionReason: "Ảnh chụp thẻ SV bị mờ nét và sai mã sinh viên 2 lần.",
    createdTime: "2026-04-12T00:00:00Z",
  },
  {
    id: "usr-approved-04",
    email: "linh.pham@uel.edu.vn",
    fullName: "Phạm Thùy Linh (SV ĐH Kinh Tế - Luật)",
    studentCode: "K214050123",
    isAdmin: false,
    isApproved: true,
    isFpt: false,
    isStudent: true,
    photoStudentCardUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    schoolName: "Đại học Kinh Tế - Luật (UEL)",
    trackId: "trk-sec",
    trackName: "Cybersecurity & Cloud",
    trackRole: "Leader",
    teamName: "UEL Securitas",
    rejectionCount: 0,
    createdTime: "2026-03-20T00:00:00Z",
  },
];

// ─── Current User ────────────────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const res = await apiClient.get<User>("/Users/profile");
      return res.data;
    },
    retry: false,
  });
}

// ─── User Profile ─────────────────────────────────────────────

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiClient.put<User>("/Auth/student-profiles", data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["currentUser"], data);
    },
  });
}

// ─── My Invitations (chuông thông báo) ───────────────────────
// GET /api/Users/my-invitations — gộp SẴN lời mời vào đội (TEAM) và lời mời
// vai trò sự kiện (EVENT_ROLE: Judge/Mentor/EventCoordinator) trong 1 lần
// gọi. Đây là endpoint ĐÚNG cho màn "Lời mời của tôi" — KHÔNG dùng
// /Teams/{teamId}/my-invitation (đó là API khác: BE bên đó bắt buộc biết
// trước teamId, chỉ dùng khi đã ở trong ngữ cảnh 1 đội cụ thể).

export type MyInvitationType = "TEAM" | "EVENT_ROLE";
export type MyInvitationStatus = "PendingAccept" | "Accepted" | "Declined";

export interface MyInvitationItem {
  invitationId: string;
  type: MyInvitationType;
  /** Tên đội (TEAM) hoặc tên sự kiện (EVENT_ROLE). */
  targetName: string;
  inviterName: string;
  role: string;
  /** Chỉ có với Judge/Mentor theo hạng mục; null với EC/lời mời đội. */
  trackName?: string | null;
  status: MyInvitationStatus;
  respondedAt?: string | null;
  expiresAt: string;
}

export interface MyInvitationsResponse {
  totalPending: number;
  invitations: MyInvitationItem[];
}

/** GET /api/Users/my-invitations — Lấy toàn bộ lời mời (đội + vai trò sự kiện) của user hiện tại */
export function useMyInvitations() {
  return useQuery({
    queryKey: ["my-invitations"],
    queryFn: async () => {
      // apiClient da boc vo BaseResponse trong interceptor nen res.data CHINH LA payload.
      const res = await apiClient.get<MyInvitationsResponse>("/Users/my-invitations");
      return res.data ?? { totalPending: 0, invitations: [] };
    },
  });
}

// ─── User Rejections ─────────────────────────────────────────

/** GET /api/UserRejections/user/{userId} — Lấy lịch sử từ chối hồ sơ */
export function useGetUserRejections(userId: string | undefined) {
  return useQuery({
    queryKey: ["userRejections", userId],
    queryFn: async () => {
      try {
        const res = await apiClient.get<UserRejection[]>(`/UserRejections/user/${userId}`);
        if (res.data) return res.data;
      } catch {
        // Fallback
      }
      return [];
    },
    enabled: !!userId,
  });
}

// ─── Admin / Coordinator Actions ─────────────────────────────

/** GET /api/Users — Lấy danh sách users (có thể lọc) */
export function useGetUsers(params?: {
  isApproved?: boolean;
  isRejected?: boolean;
  pageNumber?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["users", params],
    // LUÔN trả PagedResult<User> (một kiểu duy nhất) để mọi consumer đọc .data đồng nhất.
    // Trước đây nhánh thành công trả thẳng mảng, các nhánh khác trả PagedResult -> lệch kiểu,
    // màn nào đọc .data mà quên phòng thủ Array.isArray sẽ ra rỗng dù API có dữ liệu.
    queryFn: async (): Promise<PagedResult<User>> => {
      const res = await apiClient.get<BaseResponse<PagedResult<User>>>("/Users", { params });
      const payload = res.data as unknown; // sau interceptor bóc BaseResponse = PagedResult
      const emptyPage: PagedResult<User> = {
        data: [],
        currentPage: 1,
        pageSize: 50,
        totalItems: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      };
      if (payload && typeof payload === "object" && Array.isArray((payload as PagedResult<User>).data)) {
        return payload as PagedResult<User>;
      }
      if (Array.isArray(payload)) {
        const arr = payload as User[];
        return { ...emptyPage, data: arr, pageSize: arr.length, totalItems: arr.length };
      }
      return emptyPage;
    },
  });
}

/** POST /api/Users/{id}/approve — EC/Admin duyệt hồ sơ */
export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiClient.post(`/Users/${userId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/** POST /api/Users/{id}/reject — EC/Admin từ chối hồ sơ (với lý do) */
export function useRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { userId: string; reason: string }) => {
      const res = await apiClient.post(`/Users/${params.userId}/reject`, {
        reason: params.reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/** GET /api/fpt-mock/students/{studentCode} — Xác minh SV FPT (FptMockController thật). */
export function useFptStudentLookup(studentCode: string | null) {
  return useQuery({
    queryKey: ["fptStudent", studentCode],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/fpt-mock/students/${studentCode}`);
        return res.data?.data ?? res.data;
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/fpt-mock/students/" + studentCode + " error:", err?.message);
        return null;
      }
    },
    enabled: !!studentCode && studentCode.length >= 5,
    retry: false,
  });
}

export const usersRepository = {
  async findUserByEmail(email: string): Promise<User | null> {
    if (!email) return null;
    try {
      const res = await apiClient.get<PagedResult<User>>("/Users");
      const list = res.data?.data ?? [];
      const found = list.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase() || (u as any).Email?.toLowerCase() === email.toLowerCase()
      );
      if (found) return found;
    } catch (err: any) {
      console.warn("[SEAL BE-DATA MISSING] GET /api/Users error:", err?.message);
    }
    return null;
  },
  async approveUser(userId: string): Promise<any> {
    const res = await apiClient.post(`/Users/${userId}/approve`);
    return res.data;
  },
  async rejectUser(userId: string, reason: string): Promise<any> {
    const res = await apiClient.post(`/Users/${userId}/reject`, { reason });
    return res.data;
  },
};
