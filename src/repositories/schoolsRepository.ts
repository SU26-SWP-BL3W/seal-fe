import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/models/apiClient";
import type { School, PagedResult } from "@/models/entities";

export const DEFAULT_SCHOOLS_LIST: School[] = [
  {
    id: "sch-01",
    schoolId: "sch-01",
    schoolName: "Đại học FPT HCM (FPTU)",
    code: "FPTU_HCM",
    address: "Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh",
  },
  {
    id: "sch-02",
    schoolId: "sch-02",
    schoolName: "Đại học Bách Khoa HCM (HCMUT)",
    code: "HCMUT",
    address: "268 Lý Thường Kiệt, Quận 10, TP. Hồ Chí Minh",
  },
  {
    id: "sch-03",
    schoolId: "sch-03",
    schoolName: "Đại học Khoa học Tự nhiên (HCMUS)",
    code: "HCMUS",
    address: "227 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh",
  },
  {
    id: "sch-04",
    schoolId: "sch-04",
    schoolName: "Đại học Công Nghệ Thông Tin (UIT)",
    code: "UIT",
    address: "Khu phố 6, P. Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh",
  },
  {
    id: "sch-05",
    schoolId: "sch-05",
    schoolName: "Đại học Văn Lang (VLU)",
    code: "VLU",
    address: "69/68 Đặng Thùy Trâm, Q. Bình Thạnh, TP. Hồ Chí Minh",
  },
  {
    id: "sch-06",
    schoolId: "sch-06",
    schoolName: "Đại học Bách Khoa Hà Nội (HUST)",
    code: "HUST",
    address: "Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội",
  },
];

/**
 * GET /api/Schools — Lấy danh sách trường học.
 * apiClient đã bóc vỏ BaseResponse trong interceptor, nên res.data ở đây CHÍNH LÀ
 * PagedResult<School> — chỉ bóc thêm 1 lớp .data để lấy mảng. Bóc 3 lớp (.data.data.data)
 * như bản cũ luôn ra undefined vì PagedResult không có field .data lồng thêm lần nữa.
 */
export function useGetSchools() {
  return useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<PagedResult<School>>("/Schools", {
          params: { PageNumber: 1, PageSize: 100 },
        });
        if (Array.isArray(res.data?.data)) {
          return res.data.data;
        }
        if (Array.isArray(res.data)) {
          return res.data as unknown as School[];
        }
      } catch (err: any) {
        console.warn("[SEAL BE-DATA MISSING] GET /api/Schools error:", err?.message);
      }
      return [];
    },
    staleTime: 1000 * 60 * 10,
  });
}

/** POST /api/Schools — Tạo trường mới (Admin) */
export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { schoolName: string; code?: string; address?: string }) => {
      try {
        const res = await apiClient.post("/Schools", data);
        return res.data;
      } catch {
        return {
          id: `sch-${Date.now()}`,
          schoolId: `sch-${Date.now()}`,
          schoolName: data.schoolName,
          code: data.code || data.schoolName.substring(0, 4).toUpperCase(),
          address: data.address || "Việt Nam",
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    },
  });
}
